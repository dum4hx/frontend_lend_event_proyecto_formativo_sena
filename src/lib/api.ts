/**
 * Typed fetch wrapper for the LendEvent API.
 *
 * Every HTTP request in the app MUST go through this module so that
 * credentials, headers, error handling, and automatic token refresh
 * are applied consistently.
 *
 * No external HTTP libraries (axios, ky, got …) are used — only the
 * native `fetch` API.
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * Base URL read from the Vite environment.
 * Defined in `.env` as `VITE_API_BASE_URL`.
 */
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://api.test.local/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Standard successful response envelope returned by the API. */
export interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
  message?: string;
}

/** Standard error response envelope returned by the API. */
export interface ApiErrorResponse {
  status: "error" | "fail";
  message: string;
  code?: string;
  details?: Record<string, unknown> & { code?: string };
}

/** Union type that covers every possible API response shape. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Convenience type-guard: narrows an `ApiResponse` to the error variant. */
export function isApiError<T>(res: ApiResponse<T>): res is ApiErrorResponse {
  return res.status === "error" || res.status === "fail";
}

/**
 * Custom error class thrown when the API returns a non-2xx status.
 * Carries the parsed error body so callers can inspect `code` / `details`.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string | undefined;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Supported HTTP methods
// ---------------------------------------------------------------------------

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Options accepted by the internal `request` helper. */
interface RequestOptions<TBody = unknown> {
  /** HTTP method – defaults to `"GET"`. */
  method?: HttpMethod;
  /** JSON-serialisable request body (omitted for GET / DELETE). */
  body?: TBody;
  /** Extra query-string parameters appended to the URL. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Extra headers merged on top of the defaults. */
  headers?: HeadersInit;
  /**
   * When `true` the wrapper will NOT attempt an automatic token
   * refresh on 401.  Used internally to avoid infinite loops.
   * @default false
   */
  skipRefresh?: boolean;
  /**
   * Maximum number of automatic retries for transient failures
   * (5xx, network errors, 429).  Defaults to `0` (no retries).
   */
  maxRetries?: number;
  /**
   * Base delay in ms for exponential back-off between retries.
   * @default 1000
   */
  retryDelay?: number;
  /**
   * Control the browser credentials mode. Defaults to `include` so cookies are
   * sent for authenticated flows. Public endpoints should use `omit`.
   */
  credentialsMode?: RequestCredentials;
  /** Internal flag to ensure a single automatic retry after refresh. */
  _retry?: boolean;
}

/** Determines whether the error is transient and retryable. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

const NON_RECOVERABLE_AUTH_CODES = new Set<string>([
  "INACTIVITY_TIMEOUT",
  "SESSION_EXPIRED",
  "SESSION_REVOKED",
  "SESSION_NOT_FOUND",
  "MISSING_REFRESH_TOKEN",
]);

function extractAuthCode(payload: ApiErrorResponse | null): string | undefined {
  if (!payload) return undefined;
  if (typeof payload.code === "string") return payload.code;
  if (typeof payload.details?.code === "string") return payload.details.code;
  return undefined;
}

async function safeParseErrorResponse(res: Response): Promise<ApiErrorResponse | null> {
  try {
    const payload = (await res.clone().json()) as ApiErrorResponse;
    if (payload && typeof payload === "object") return payload;
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse `Retry-After` header and return ms to wait, or `null`.
 */
function parseRetryAfter(res: Response): number | null {
  const header = res.headers.get("Retry-After");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds * 1000;
  return null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Flag to prevent concurrent refresh calls. */
let isRefreshing = false;

/** Queue of callers waiting for a refresh to resolve. */
let refreshQueue: Array<{
  resolve: (value: boolean) => void;
  reject: (reason: unknown) => void;
}> = [];

interface RefreshResult {
  ok: boolean;
  code?: string;
}

/**
 * Attempt to refresh the access token by calling `POST /auth/refresh`.
 *
 * If a refresh is already in progress the caller is queued so only a
 * single network request is made.
 */
async function refreshAccessToken(): Promise<RefreshResult> {
  if (isRefreshing) {
    // Wait for the in-flight refresh to settle.
    return new Promise<RefreshResult>((resolve, reject) => {
      refreshQueue.push({
        resolve: (value) => resolve({ ok: value }),
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const ok = res.ok;
    let code: string | undefined;
    if (!ok) {
      const payload = await safeParseErrorResponse(res);
      code = extractAuthCode(payload);
    }

    // Flush waiting callers.
    refreshQueue.forEach((q) => q.resolve(ok));
    return { ok, code };
  } catch (err) {
    refreshQueue.forEach((q) => q.reject(err));
    return { ok: false };
  } finally {
    isRefreshing = false;
    refreshQueue = [];
  }
}

/**
 * Build a URL with optional query-string parameters.
 *
 * `undefined` values in `params` are silently skipped so callers can
 * pass optional filters without pre-cleaning the object.
 */
function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  // Strip leading slash so the path is treated as relative to the base
  // URL, preserving any prefix like /api/v1.
  const relativePath = path.startsWith("/") ? path.slice(1) : path;

  const url = new URL(relativePath, API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

/**
 * Low-level typed fetch wrapper.
 *
 * @typeParam TData - Shape of `data` inside a successful response.
 * @typeParam TBody - Shape of the JSON request body (inferred automatically).
 *
 * @throws {ApiError} When the API returns a non-2xx status.
 *
 * @example
 * ```ts
 * const { data } = await request<{ user: User }>("/auth/me");
 * ```
 */
export async function request<TData, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<ApiSuccessResponse<TData>> {
  const {
    method = "GET",
    body,
    params,
    headers,
    skipRefresh = false,
    maxRetries = 0,
    retryDelay = 1000,
    credentialsMode = "include",
    _retry = false,
  } = options;

  const url = buildUrl(path, params);

  const init: RequestInit = {
    method,
    // Send cookies for authenticated flows; allow opting-out for public calls
    credentials: credentialsMode,
    headers: {
      "Content-Type": "application/json",
      ...(headers as Record<string, string> | undefined),
    },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Wait before retrying (skip first attempt).
    if (attempt > 0) {
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch {
      // Network error – retryable.
      if (attempt < maxRetries) continue;
      throw new ApiError("Error de red. Por favor, verifica tu conexión a internet.", 0);
    }

    // -- Handle 401: attempt a silent token refresh then retry once. --------
    if (res.status === 401 && !skipRefresh && !path.includes("/auth/")) {
      const errorPayload = await safeParseErrorResponse(res);
      const errorCode = extractAuthCode(errorPayload);
      const isNonRecoverable =
        typeof errorCode === "string" && NON_RECOVERABLE_AUTH_CODES.has(errorCode);

      if (isNonRecoverable || _retry) {
        const error = new ApiError(
          errorPayload?.message ?? "Sesion finalizada. Inicia sesion nuevamente.",
          401,
          errorCode ?? "UNAUTHORIZED",
          errorPayload?.details,
        );

        const { emitSessionAuthFailure } = await import("./sessionEvents");
        emitSessionAuthFailure({
          code: (error.code ?? "UNAUTHORIZED") as
            | "INACTIVITY_TIMEOUT"
            | "SESSION_EXPIRED"
            | "SESSION_REVOKED"
            | "SESSION_NOT_FOUND"
            | "MISSING_REFRESH_TOKEN"
            | "UNAUTHORIZED"
            | "MANUAL",
          error,
        });
        throw error;
      }

      const refreshResult = await refreshAccessToken();

      if (refreshResult.ok) {
        return request<TData, TBody>(path, {
          ...options,
          skipRefresh: true,
          _retry: true,
        });
      }

      // Refresh failed — throw so the UI can redirect to /login.
      const error = new ApiError(
        "Sesion expirada. Por favor, inicia sesion nuevamente.",
        401,
        refreshResult.code ?? "UNAUTHORIZED",
      );

      const { emitSessionAuthFailure } = await import("./sessionEvents");
      emitSessionAuthFailure({
        code: (error.code ?? "UNAUTHORIZED") as
          | "INACTIVITY_TIMEOUT"
          | "SESSION_EXPIRED"
          | "SESSION_REVOKED"
          | "SESSION_NOT_FOUND"
          | "MISSING_REFRESH_TOKEN"
          | "UNAUTHORIZED"
          | "MANUAL",
        error,
      });

      throw error;
    }

    // -- Handle rate limiting: respect Retry-After when retrying. -----------
    if (res.status === 429 && attempt < maxRetries) {
      const retryAfterMs = parseRetryAfter(res) ?? retryDelay * Math.pow(2, attempt);
      await new Promise<void>((resolve) => setTimeout(resolve, retryAfterMs));
      continue;
    }

    // -- Retry on transient server errors. ----------------------------------
    if (isRetryableStatus(res.status) && attempt < maxRetries) {
      continue;
    }

    // -- Parse JSON body (always expected from this API). -------------------
    const json: ApiResponse<TData> = await res.json();

    if (!res.ok || isApiError(json)) {
      const errBody = json as ApiErrorResponse;
      lastError = new ApiError(
        errBody.message ?? `Request failed with status ${res.status}`,
        res.status,
        errBody.code,
        errBody.details,
      );
      throw lastError;
    }

    return json as ApiSuccessResponse<TData>;
  }

  // Should not reach here, but satisfy the compiler.
  throw lastError ?? new ApiError("Request failed after retries.", 0);
}

// ---------------------------------------------------------------------------
// Convenience methods (thin wrappers with better DX)
// ---------------------------------------------------------------------------

/** Perform a typed GET request. */
export function get<TData>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  return request<TData>(path, { method: "GET", params });
}

/** Perform a typed POST request. */
export function post<TData, TBody = unknown>(path: string, body?: TBody) {
  return request<TData, TBody>(path, { method: "POST", body });
}

/** Perform a typed PATCH request. */
export function patch<TData, TBody = unknown>(path: string, body?: TBody) {
  return request<TData, TBody>(path, { method: "PATCH", body });
}

/** Perform a typed PUT request. */
export function put<TData, TBody = unknown>(path: string, body?: TBody) {
  return request<TData, TBody>(path, { method: "PUT", body });
}

/** Perform a typed DELETE request. */
export function del<TData>(path: string) {
  return request<TData>(path, { method: "DELETE" });
}

/**
 * Perform a typed GET request intended for public endpoints that do not
 * require authentication. Skips the automatic refresh flow so we don't
 * surface misleading "Session expired" messages on 401.
 */
export function publicGet<TData>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  return request<TData>(path, {
    method: "GET",
    params,
    skipRefresh: true,
    credentialsMode: "omit",
  });
}
