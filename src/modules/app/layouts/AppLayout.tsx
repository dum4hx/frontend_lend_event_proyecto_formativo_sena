import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "../components";
import { ToastContainer } from "../../../components/ui/ToastContainer";
import { ToastProvider, useToast } from "../../../contexts/ToastContext";
import { AnimatedPage } from "../../../components/ui";
import { HelpPanel, HelpPanelProvider } from "../help";

function AppLayoutContent() {
  const { toasts, dismissToast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const sidebarMargin = isSidebarCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="app-shell min-h-screen bg-[#121212] text-white">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div className={`transition-all duration-300 ${sidebarMargin}`}>
        <main className="p-8 min-h-screen">
          <AnimatedPage>
            <Outlet />
          </AnimatedPage>
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <HelpPanel />
    </div>
  );
}

export default function AppLayout() {
  return (
    <ToastProvider>
      <HelpPanelProvider>
        <AppLayoutContent />
      </HelpPanelProvider>
    </ToastProvider>
  );
}
