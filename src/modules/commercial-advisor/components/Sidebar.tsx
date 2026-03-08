import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  TrendingUp,
  Package,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { ApiError } from "../../../lib/api";
import { useLogout } from "../../../hooks/useLogout";
import { usePermissions } from "../../../contexts/usePermissions";
import { getNavItemsByPrefix } from "../../../config/modulePermissions";

const iconMap: Record<string, React.ReactNode> = {
  "ca-dashboard": <LayoutDashboard size={20} />,
  "ca-customers": <Users size={20} />,
  orders: <ShoppingCart size={20} />,
  contracts: <FileText size={20} />,
  rentals: <Package size={20} />,
  invoices: <TrendingUp size={20} />,
  reports: <BarChart3 size={20} />,
  "ca-settings": <Settings size={20} />,
};

export const Sidebar: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useLogout();
  const { hasAnyPermission } = usePermissions();

  const visibleItems = useMemo(
    () =>
      getNavItemsByPrefix("/commercial-advisor").filter(
        (item) =>
          item.requiredPermissions.length === 0 || hasAnyPermission(item.requiredPermissions),
      ),
    [hasAnyPermission],
  );

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : "Error logging out";
      console.error("Logout error:", error);
      alert(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[#121212] border-r border-[#333] flex flex-col p-6 overflow-y-auto">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#FFD700]">Lend Commerce</h1>
        <p className="text-xs text-gray-500 mt-1">Commercial Advisor</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/commercial-advisor"}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all ${
                isActive
                  ? "bg-[#FFD700] text-black font-semibold"
                  : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#FFD700]"
              }`
            }
          >
            {iconMap[item.id]}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 rounded-[8px] transition-all disabled:opacity-50"
      >
        <LogOut size={20} />
        <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
      </button>
    </aside>
  );
};
