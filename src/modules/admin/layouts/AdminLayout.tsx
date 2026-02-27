import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "../components";
import { ToastContainer } from "../../../components/ui/ToastContainer";
import { ToastProvider, useToast } from "../../../contexts/ToastContext";

function AdminLayoutContent() {
  const { toasts, dismissToast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Contenido */}
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

export default function AdminLayout() {
  return (
    <ToastProvider>
      <AdminLayoutContent />
    </ToastProvider>
  );
}
