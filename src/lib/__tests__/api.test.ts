/**
 * Tests for the core fetch wrapper (`src/lib/api.ts`).
 *
 * Uses MSW to intercept `fetch` calls so no real HTTP traffic occurs.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server";
import { request, get, post, patch, del, ApiError, isApiError } from "../api";

const BASE = "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("request()", () => {
  it("returns a successful response with typed data", async () => {
    server.use(
      http.get(`${BASE}/test/ok`, () => HttpResponse.json({ status: "success", data: { id: 1 } })),
    );

    const res = await request<{ id: number }>("/test/ok");
    expect(res.status).toBe("success");
    expect(res.data.id).toBe(1);
  });

  it("throws ApiError on non-2xx responses", async () => {
    server.use(
      http.get(`${BASE}/test/fail`, () =>
        HttpResponse.json(
          { status: "error", message: "Not found", code: "NOT_FOUND" },
          { status: 404 },
        ),
      ),
    );

    await expect(request("/test/fail")).rejects.toThrow(ApiError);

    try {
      await request("/test/fail");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.code).toBe("NOT_FOUND");
      expect(apiErr.message).toBe("Not found");
    }
  });

  it("sends JSON body on POST", async () => {
    server.use(
      http.post(`${BASE}/test/echo`, async ({ request: req }) => {
        const body = (await req.json()) as Record<string, unknown>;
        return HttpResponse.json({ status: "success", data: body });
      }),
    );

    const res = await post<{ name: string }, { name: string }>("/test/echo", {
      name: "hello",
    });

    expect(res.data.name).toBe("hello");
  });

  it("appends query params via the params option", async () => {
    server.use(
      http.get(`${BASE}/test/params`, ({ request: req }) => {
        const url = new URL(req.url);
        return HttpResponse.json({
          status: "success",
          data: { page: url.searchParams.get("page") },
        });
      }),
    );

    const res = await get<{ page: string }>("/test/params", { page: 2 });
    expect(res.data.page).toBe("2");
  });

  it("skips undefined query params", async () => {
    server.use(
      http.get(`${BASE}/test/params`, ({ request: req }) => {
        const url = new URL(req.url);
        return HttpResponse.json({
          status: "success",
          data: { keys: Array.from(url.searchParams.keys()) },
        });
      }),
    );

    const res = await get<{ keys: string[] }>("/test/params", {
      a: "1",
      b: undefined,
    });

    expect(res.data.keys).toEqual(["a"]);
  });

  it("attempts a silent token refresh on 401", async () => {
    let callCount = 0;

    server.use(
      http.get(`${BASE}/test/protected`, () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({
          status: "success",
          data: { secret: true },
        });
      }),
      http.post(`${BASE}/auth/refresh`, () => {
        return HttpResponse.json({ status: "success", data: {} });
      }),
    );

    const res = await request<{ secret: boolean }>("/test/protected");
    expect(res.data.secret).toBe(true);
    expect(callCount).toBe(2); // first call 401, retry after refresh
  });

  it("throws when refresh also fails", async () => {
    server.use(
      http.get(`${BASE}/test/unauth`, () =>
        HttpResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 }),
      ),
      http.post(`${BASE}/auth/refresh`, () =>
        HttpResponse.json({ status: "error", message: "Refresh failed" }, { status: 401 }),
      ),
    );

    await expect(request("/test/unauth")).rejects.toThrow(ApiError);
  });
});

describe("convenience methods", () => {
  beforeEach(() => {
    server.use(
      http.get(`${BASE}/conv/get`, () =>
        HttpResponse.json({ status: "success", data: { method: "GET" } }),
      ),
      http.post(`${BASE}/conv/post`, () =>
        HttpResponse.json({ status: "success", data: { method: "POST" } }),
      ),
      http.patch(`${BASE}/conv/patch`, () =>
        HttpResponse.json({ status: "success", data: { method: "PATCH" } }),
      ),
      http.delete(`${BASE}/conv/delete`, () =>
        HttpResponse.json({ status: "success", data: { method: "DELETE" } }),
      ),
    );
  });

  it("get() works", async () => {
    const res = await get<{ method: string }>("/conv/get");
    expect(res.data.method).toBe("GET");
  });

  it("post() works", async () => {
    const res = await post<{ method: string }>("/conv/post");
    expect(res.data.method).toBe("POST");
  });

  it("patch() works", async () => {
    const res = await patch<{ method: string }>("/conv/patch");
    expect(res.data.method).toBe("PATCH");
  });

  it("del() works", async () => {
    const res = await del<{ method: string }>("/conv/delete");
    expect(res.data.method).toBe("DELETE");
  });
});

describe("isApiError()", () => {
  it("returns true for error responses", () => {
    expect(isApiError({ status: "error", message: "boom" })).toBe(true);
  });

  it("returns false for success responses", () => {
    expect(isApiError({ status: "success", data: {} })).toBe(false);
  });
});
