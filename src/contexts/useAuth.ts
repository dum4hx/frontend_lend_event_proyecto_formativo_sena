import { useContext } from "react";
import { AuthContext } from "./AuthContext";

/**
 * Access the authentication context.
 *
 * @throws if used outside `<AuthProvider>`.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
