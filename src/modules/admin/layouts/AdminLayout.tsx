import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../components";
import { useAuth } from "../../../contexts/useAuth";
import { getPaymentStatus } from "../../../services/authService";
import { ApiError } from "../../../lib/api";

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkPaymentStatus() {
      // Only check payment status for owners
      if (user?.role !== "owner") {
        setHasAccess(true);
        setIsCheckingPayment(false);
        return;
      }

      try {
        const response = await getPaymentStatus();

        if (!response.data.isActive) {
          alert(
            "Your organization does not have an active subscription. " +
              "Please upgrade your plan to access the admin panel.",
          );
          navigate("/");
          return;
        }

        setHasAccess(true);
      } catch (error: unknown) {
        if (error instanceof ApiError && error.statusCode === 403) {
          // Non-owner users get 403 - allow access anyway
          setHasAccess(true);
        } else {
          console.error("Failed to check payment status:", error);
          alert("Unable to verify subscription status. Please try again later.");
          navigate("/");
        }
      } finally {
        setIsCheckingPayment(false);
      }
    }

    void checkPaymentStatus();
  }, [user, navigate]);

  if (isCheckingPayment) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying subscription...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      {/* Contenido */}
      <main className="ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
