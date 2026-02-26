import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Bot,
  LogOut,
  UserCircle,
  CreditCard,
  Package,
  Layers,
  FolderTree,
} from "lucide-react";
import { ApiError } from "../../../lib/api";
import { useLogout } from "../../../hooks/useLogout";
import { useAuth } from "../../../contexts/useAuth";
import { useAlertModal } from "../../../hooks/useAlertModal";

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
    path: "/admin",
  },
  {
    id: "events",
    label: "My Events",
    icon: <Calendar size={20} />,
    path: "/admin/events",
  },
  {
    id: "customers",
    label: "Customers",
    icon: <UserCircle size={20} />,
    path: "/admin/customers",
  },
  { id: "team", label: "Team", icon: <Users size={20} />, path: "/admin/team" },
  {
    id: "material-categories",
    label: "Material Categories",
    icon: <FolderTree size={20} />,
    path: "/admin/material-categories",
  },
  {
    id: "material-types",
    label: "Material Types",
    icon: <Package size={20} />,
    path: "/admin/material-types",
  },
  {
    id: "material-instances",
    label: "Material Instances",
    icon: <Layers size={20} />,
    path: "/admin/material-instances",
  },
  {
    id: "ia-settings",
    label: "IA Settings",
    icon: <Bot size={20} />,
    path: "/admin/ia-settings",
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: <CreditCard size={20} />,
    path: "/admin/subscription",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={20} />,
    path: "/admin/settings",
  },
];

export const Sidebar: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useLogout();
  const { user } = useAuth();
  const { showError, AlertModal } = useAlertModal();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : "Error logging out";
      console.error("Logout error:", error);
      showError(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user
    ? `${user.name.firstName} ${user.name.firstSurname}`
    : "Admin User";

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[#121212] border-r border-[#333] flex flex-col p-6 overflow-y-auto z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center">
            <span className="text-black font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Lend Event</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
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

      {/* User Info & Logout */}
      <div className="border-t border-[#333] pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#FFD700] flex items-center justify-center">
            <span className="text-black font-bold text-sm">
              {user?.name.firstName.charAt(0).toUpperCase()}
              {user?.name.firstSurname.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{displayName}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 rounded-lg transition-all disabled:opacity-50"
        >
          <LogOut size={20} />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
      <AlertModal />
    </aside>
  );
};
