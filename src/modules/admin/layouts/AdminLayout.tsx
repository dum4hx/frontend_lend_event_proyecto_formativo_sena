import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";
import { ToastContainer } from "../../../components/ui/ToastContainer";
import { ToastProvider, useToast } from "../../../contexts/ToastContext";

function AdminLayoutContent() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Sidebar />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Contenido */}
      <main className="ml-64 p-8 min-h-screen">
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
