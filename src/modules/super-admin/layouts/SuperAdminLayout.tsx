import { Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import { SuperAdminSidebar } from "../components";
import { useAuth } from "../../../contexts/useAuth";
import { useLanguage } from "../../../contexts/useLanguage";

export default function SuperAdminLayout() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4" />
          <p className="text-gray-400">{t("common.loadingEllipsis")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell min-h-screen bg-black text-white">
      <SuperAdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main
        className={`p-8 min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
