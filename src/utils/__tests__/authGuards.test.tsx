import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "../../contexts/LanguageContext";
import { AuthContext, type AuthContextValue } from "../../contexts/AuthContext";
import { PublicOnlyRoute, RequireAuthenticatedRoute } from "../authGuards";

function createAuthValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: null,
    loading: false,
    isAuthenticated: false,
    isLoggedIn: false,
    isLoading: false,
    permissions: [],
    lastValidatedAt: null,
    checkAuth: async () => ({ user: null, permissions: [] }),
    ensureSession: async () => false,
    isSessionStale: () => true,
    clearSession: () => {
      // no-op for tests
    },
    ...overrides,
  };
}

function renderWithAuth(value: AuthContextValue, initialEntry: string) {
  return render(
    <LanguageProvider>
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/super-admin" element={<div>super-admin-view</div>} />
            <Route
              path="/app"
              element={
                <RequireAuthenticatedRoute>
                  <div>private-view</div>
                </RequireAuthenticatedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <div>login-view</div>
                </PublicOnlyRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageProvider>,
  );
}

describe("authGuards", () => {
  it("redirects unauthenticated users from private routes to /login", async () => {
    const value = createAuthValue({
      loading: false,
      isLoading: false,
      isAuthenticated: false,
      isLoggedIn: false,
    });

    renderWithAuth(value, "/app");

    await waitFor(() => {
      expect(screen.getByText("login-view")).toBeInTheDocument();
    });
  });

  it("redirects authenticated users away from /login", async () => {
    const value = createAuthValue({
      loading: false,
      isLoading: false,
      isAuthenticated: true,
      isLoggedIn: true,
      user: {
        _id: "u1",
        email: "test@example.com",
        name: { firstName: "Test", firstSurname: "User" },
        roleName: "Super Admin",
        roleId: "r1",
        status: "active",
      },
      isSessionStale: () => false,
      permissions: [],
    });

    renderWithAuth(value, "/login");

    await waitFor(() => {
      expect(screen.getByText("super-admin-view")).toBeInTheDocument();
    });
  });

  it("revalidates stale private sessions before rendering", async () => {
    const ensureSession = vi.fn(async () => true);

    const value = createAuthValue({
      loading: false,
      isLoading: false,
      isAuthenticated: true,
      isLoggedIn: true,
      user: {
        _id: "u1",
        email: "test@example.com",
        name: { firstName: "Test", firstSurname: "User" },
        roleName: "Admin",
        roleId: "r1",
        status: "active",
      },
      ensureSession,
      isSessionStale: () => true,
    });

    renderWithAuth(value, "/app");

    await waitFor(() => {
      expect(ensureSession).toHaveBeenCalledTimes(1);
      expect(screen.getByText("private-view")).toBeInTheDocument();
    });
  });
});
