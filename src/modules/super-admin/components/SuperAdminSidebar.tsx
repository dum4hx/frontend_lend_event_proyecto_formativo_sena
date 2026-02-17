import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Users, CreditCard, Bot, Settings, LogOut } from "lucide-react";
import { logoutUser } from "../../../services/authService";
import { useAuth } from "../../../contexts/useAuth";
import { ApiError } from "../../../lib/api";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Sales Overview",
    icon: <BarChart3 size={20} />,
    path: "/super-admin",
  },
  {
    id: "clients",
    label: "User Management",
    icon: <Users size={20} />,
    path: "/super-admin/clients",
  },
  {
    id: "plans",
    label: "Plan Configuration",
    icon: <CreditCard size={20} />,
    path: "/super-admin/plans",
  },
  {
    id: "ai-monitor",
    label: "AI Chatbot Monitor",
    icon: <Bot size={20} />,
    path: "/super-admin/ai-monitor",
  },
  {
    id: "settings",
    label: "System Settings",
    icon: <Settings size={20} />,
    path: "/super-admin/settings",
  },
];

export const SuperAdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      navigate("/login");
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : "Error logging out";
      console.error("Logout error:", error);
      alert(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user ? `${user.name.firstName} ${user.name.firstSurname}` : "Super Admin";

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[#121212] border-r border-[#333] flex flex-col p-6 overflow-y-auto z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center">
            <span className="text-black font-bold text-sm">O</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Lend Event</h1>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/super-admin"}
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
    </aside>
  );
};
