import { Outlet, Navigate } from "react-router-dom";
import { SuperAdminSidebar } from "../components";
import { useAuth } from "../../../contexts/useAuth";

export default function SuperAdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "super_admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SuperAdminSidebar />
      <main className="ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
