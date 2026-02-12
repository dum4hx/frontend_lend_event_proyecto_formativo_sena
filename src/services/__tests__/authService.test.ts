/**
 * Tests for `authService` — verifies that the service functions call the
 * correct API endpoints and return properly typed data.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "../authService";
import { ApiError } from "../../lib/api";

const BASE = "https://api.test.local/api/v1";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("loginUser()", () => {
  it("returns user data on success", async () => {
    const res = await loginUser({ email: "test@test.com", password: "pass" });
    expect(res.status).toBe("success");
    expect(res.data.user.email).toBe("test@test.com");
  });

  it("throws ApiError on invalid credentials", async () => {
    await expect(loginUser({ email: "fail@test.com", password: "wrong" })).rejects.toThrow(
      ApiError,
    );

    try {
      await loginUser({ email: "fail@test.com", password: "wrong" });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(401);
    }
  });
});

describe("registerUser()", () => {
  it("registers a new user", async () => {
    server.use(
      http.post(`${BASE}/auth/register`, async ({ request }) => {
        const body = (await request.json()) as Record<string, Record<string, unknown>>;
        return HttpResponse.json({
          status: "success",
          data: {
            organization: {
              id: "org1",
              name: body.organization.name,
              email: body.organization.email,
            },
            user: {
              id: "new-user",
              email: body.owner.email,
              role: "owner",
            },
          },
        });
      }),
    );

    const res = await registerUser({
      organization: {
        name: "NewOrg",
        email: "org@test.com",
      },
      owner: {
        email: "new@test.com",
        password: "Str0ng!Pass",
        phone: "+1234567890",
        name: { firstName: "New", firstSurname: "User" },
      },
    });

    expect(res.data.user.email).toBe("new@test.com");
  });
});

describe("getCurrentUser()", () => {
  it("returns the current authenticated user", async () => {
    const res = await getCurrentUser();
    expect(res.data.user.email).toBe("test@example.com");
  });
});

describe("logoutUser()", () => {
  it("completes without throwing", async () => {
    await expect(logoutUser()).resolves.toBeDefined();
  });
});
