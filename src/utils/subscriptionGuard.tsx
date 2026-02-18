import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { LoadingSpinner } from "../components/ui";
import { getPaymentStatus } from "../services/authService";
import { ApiError } from "../lib/api";

interface RequireActiveSubscriptionProps {
  children: React.ReactNode;
  /** Optional redirect when subscription is inactive. Defaults to `/packages`. */
  redirectTo?: string;
}

/**
 * Guard component that ensures the user is authenticated and the organization
 * has an active subscription before granting access to protected views.
 *
 * Notes:
 * - Only owners can query `/auth/payment-status`. For non-owners, we allow
 *   rendering and rely on backend authorization for specific actions.
 */
export function RequireActiveSubscription({ children, redirectTo = "/packages" }: RequireActiveSubscriptionProps) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function check() {
      // Still determining auth state
      if (isLoading) return;

      // Must be logged in to access protected modules
      if (!isLoggedIn) {
        navigate("/login", { replace: true });
        setChecking(false);
        return;
      }

      // Owners: enforce active subscription via API
      if (user?.role === "owner") {
        try {
          const res = await getPaymentStatus();
          if (!res.data.isActive) {
            navigate(redirectTo, {
              replace: true,
              state: { reason: "subscription_required" },
            });
            setAllowed(false);
          } else {
            setAllowed(true);
          }
        } catch (err) {
          // Non-owner access to endpoint returns 403 — allow view, rely on backend
          if (err instanceof ApiError && err.statusCode === 403) {
            setAllowed(true);
          } else {
            // Any other error — be safe and redirect to plans
            navigate(redirectTo, { replace: true });
            setAllowed(false);
          }
        } finally {
          setChecking(false);
        }
        return;
      }

      // Non-owners: allow view (backend will enforce per-endpoint)
      setAllowed(true);
      setChecking(false);
    }

    void check();
  }, [isLoading, isLoggedIn, user, navigate, redirectTo]);

  if (checking) {
    return <LoadingSpinner fullScreen message="Verifying subscription…" />;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
