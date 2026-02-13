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
  status: "error";
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/** Union type that covers every possible API response shape. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Convenience type-guard: narrows an `ApiResponse` to the error variant. */
export function isApiError<T>(res: ApiResponse<T>): res is ApiErrorResponse {
  return res.status === "error";
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
}

/** Determines whether the error is transient and retryable. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
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

/**
 * Attempt to refresh the access token by calling `POST /auth/refresh`.
 *
 * If a refresh is already in progress the caller is queued so only a
 * single network request is made.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) {
    // Wait for the in-flight refresh to settle.
    return new Promise<boolean>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
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

    // Flush waiting callers.
    refreshQueue.forEach((q) => q.resolve(ok));
    return ok;
  } catch (err) {
    refreshQueue.forEach((q) => q.reject(err));
    return false;
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
  } = options;

  const url = buildUrl(path, params);

  const init: RequestInit = {
    method,
    credentials: "include", // Always send HttpOnly cookies.
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
      throw new ApiError("Network connection failed. Please check your internet.", 0);
    }

    // -- Handle 401: attempt a silent token refresh then retry once. --------
    if (res.status === 401 && !skipRefresh && !path.includes("/auth/")) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        return request<TData, TBody>(path, { ...options, skipRefresh: true });
      }

      // Refresh failed — throw so the UI can redirect to /login.
      throw new ApiError("Session expired. Please log in again.", 401, "UNAUTHORIZED");
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

/** Perform a typed DELETE request. */
export function del<TData>(path: string) {
  return request<TData>(path, { method: "DELETE" });
}
