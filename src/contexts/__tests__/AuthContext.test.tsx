import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../useAuth";
import { queryClient } from "../../lib/queryClient";

const BASE = "http://localhost:3000/api/v1";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

afterEach(() => {
  queryClient.clear();
});

function AuthProbe() {
  const { loading, isAuthenticated } = useAuth();

  return (
    <div>
      <span data-testid="loading">{loading ? "loading" : "ready"}</span>
      <span data-testid="auth">{isAuthenticated ? "auth" : "guest"}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  it("refreshes once and recovers session when /auth/me returns 401", async () => {
    let meCalls = 0;

    server.use(
      http.get(`${BASE}/auth/me`, () => {
        meCalls += 1;
        if (meCalls === 1) {
          return HttpResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
        }

        return HttpResponse.json({
          status: "success",
          data: {
            user: {
              _id: "u1",
              email: "owner@test.com",
              roleName: "Owner",
              roleId: "r1",
              status: "active",
              name: { firstName: "Owner", firstSurname: "User" },
            },
            permissions: ["analytics:read"],
          },
        });
      }),
      http.post(`${BASE}/auth/refresh`, () => {
        return HttpResponse.json({ status: "success", data: {} });
      }),
    );

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <AuthProvider>
          <Routes>
            <Route path="/app" element={<AuthProbe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      expect(screen.getByTestId("auth")).toHaveTextContent("auth");
    });

    expect(meCalls).toBeGreaterThanOrEqual(2);
  });

  it("marks session as unauthenticated when refresh fails", async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () => {
        return HttpResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
      }),
      http.post(`${BASE}/auth/refresh`, () => {
        return HttpResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
      }),
    );

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <AuthProvider>
          <Routes>
            <Route path="/app" element={<AuthProbe />} />
            <Route path="/login" element={<div>login-screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("guest");
    });
  });

  it("redirects authenticated users away from auth public routes using role fallback", async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () => {
        return HttpResponse.json({
          status: "success",
          data: {
            user: {
              _id: "u1",
              email: "super@test.com",
              roleName: "Super Admin",
              roleId: "r1",
              status: "active",
              name: { firstName: "Super", firstSurname: "Admin" },
            },
            permissions: [],
          },
        });
      }),
    );

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>login-screen</div>} />
            <Route path="/super-admin" element={<div>super-admin-home</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("super-admin-home")).toBeInTheDocument();
    });
  });
});
