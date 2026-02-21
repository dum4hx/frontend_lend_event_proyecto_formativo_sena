import React, { useState } from "react";
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

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    path: "/commercial-advisor",
  },
  {
    id: "customers",
    label: "Customers",
    icon: <Users size={20} />,
    path: "/commercial-advisor/customers",
  },
  {
    id: "orders",
    label: "Orders",
    icon: <ShoppingCart size={20} />,
    path: "/commercial-advisor/orders",
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: <FileText size={20} />,
    path: "/commercial-advisor/contracts",
  },
  {
    id: "rentals",
    label: "Rentals",
    icon: <Package size={20} />,
    path: "/commercial-advisor/rentals",
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: <TrendingUp size={20} />,
    path: "/commercial-advisor/invoices",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3 size={20} />,
    path: "/commercial-advisor/reports",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={20} />,
    path: "/commercial-advisor/settings",
  },
];

export const Sidebar: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useLogout();

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
        {navItems.map((item) => (
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
            {item.icon}
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
