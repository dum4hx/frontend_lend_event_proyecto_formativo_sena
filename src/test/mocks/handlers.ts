/**
 * Default MSW request handlers used across tests.
 *
 * Each handler returns a minimal but realistic API response so the tests
 * can verify that the fetch wrapper and service functions behave correctly.
 */

import { http, HttpResponse } from "msw";

const BASE = "http://localhost:3000/api/v1";

export const handlers = [
  // ---- Auth ---------------------------------------------------------------

  /** POST /auth/login — successful login. */
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;

    if (body.email === "fail@test.com") {
      return HttpResponse.json(
        { status: "error", message: "Invalid credentials", code: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      status: "success",
      data: {
        user: {
          _id: "u1",
          email: body.email,
          role: "owner",
          status: "active",
          name: { firstName: "Test", firstSurname: "User" },
        },
      },
    });
  }),

  /** POST /auth/refresh — always succeeds by default. */
  http.post(`${BASE}/auth/refresh`, () => {
    return HttpResponse.json({ status: "success", data: {} });
  }),

  /** GET /auth/me — current user. */
  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      status: "success",
      data: {
        user: {
          _id: "u1",
          email: "test@example.com",
          role: "owner",
          status: "active",
          name: { firstName: "Test", firstSurname: "User" },
        },
      },
    });
  }),

  /** POST /auth/logout — always succeeds. */
  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ status: "success", data: {} });
  }),

  // ---- Users --------------------------------------------------------------

  /** GET /users — returns a tiny list. */
  http.get(`${BASE}/users`, () => {
    return HttpResponse.json({
      status: "success",
      data: {
        users: [
          {
            _id: "u1",
            email: "alice@example.com",
            role: "owner",
            status: "active",
            name: { firstName: "Alice", firstSurname: "Smith" },
          },
        ],
        pagination: { currentPage: 1, totalPages: 1, total: 1, limit: 25 },
      },
    });
  }),

  // ---- Organization -------------------------------------------------------

  /** GET /organization — current org. */
  http.get(`${BASE}/organization`, () => {
    return HttpResponse.json({
      status: "success",
      data: {
        organization: {
          _id: "org1",
          name: "Test Org",
          email: "org@test.com",
          plan: "pro",
        },
      },
    });
  }),
];
