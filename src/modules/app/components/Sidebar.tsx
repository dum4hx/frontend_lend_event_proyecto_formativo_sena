import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShieldCheck,
  Settings,
  Bot,
  LogOut,
  UserCircle,
  CreditCard,
  Package,
  Layers,
  FolderTree,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  TrendingDown,
  AlertCircle,
  ShoppingCart,
  FileText,
  Tag,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { ApiError } from "../../../lib/api";
import { useLogout } from "../../../hooks/useLogout";
import { useAuth } from "../../../contexts/useAuth";
import { usePermissions } from "../../../contexts/usePermissions";
import { useAlertModal } from "../../../hooks/useAlertModal";
import { getNavItemsByPrefix, groupNavItemsBySection } from "../../../config/modulePermissions";

const iconMap: Record<string, React.ReactNode> = {
  // Overview
  dashboard: <LayoutDashboard size={20} />,
  // Organization
  events: <Calendar size={20} />,
  customers: <UserCircle size={20} />,
  team: <Users size={20} />,
  roles: <ShieldCheck size={20} />,
  subscription: <CreditCard size={20} />,
  "ia-settings": <Bot size={20} />,
  settings: <Settings size={20} />,
  // Materials
  "material-categories": <FolderTree size={20} />,
  "material-types": <Package size={20} />,
  "material-instances": <Layers size={20} />,
  attributes: <Tag size={20} />,
  plans: <BookOpen size={20} />,
  // Warehouse
  inventory: <Package size={20} />,
  locations: <MapPin size={20} />,
  "stock-movements": <TrendingDown size={20} />,
  alerts: <AlertCircle size={20} />,
  // Commerce
  orders: <ShoppingCart size={20} />,
  contracts: <FileText size={20} />,
  rentals: <Package size={20} />,
  invoices: <FileText size={20} />,
  reports: <BarChart3 size={20} />,
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useLogout();
  const { user } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const { showError, AlertModal } = useAlertModal();

  const sections = useMemo(() => {
    const visible = getNavItemsByPrefix("/app").filter(
      (item) => item.requiredPermissions.length === 0 || hasAnyPermission(item.requiredPermissions),
    );
    return groupNavItemsBySection(visible);
  }, [hasAnyPermission]);

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

  const displayName = user ? `${user.name.firstName} ${user.name.firstSurname}` : "User";

  const sidebarWidthClass = isCollapsed ? "w-20" : "w-64";
  const itemPaddingClass = isCollapsed ? "px-2 py-3 justify-center" : "px-4 py-3";

  return (
    <aside
      className={`sidebar-scroll fixed left-0 top-0 ${sidebarWidthClass} h-screen bg-[#121212] border-r border-[#333] flex flex-col p-4 overflow-y-auto z-50 transition-all duration-300`}
    >
      {/* Logo */}
      <div className="mb-6">
        <div
          className={`flex items-center gap-2 ${isCollapsed ? "justify-end" : "justify-between"}`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center">
                <span className="text-black font-bold text-sm">L</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Lend Event</h1>
                <p className="text-xs text-gray-500">Management</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#FFD700] hover:bg-[#1a1a1a] transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {sections.map(({ section, items }) => (
          <div key={section}>
            {section && !isCollapsed && (
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-4 mb-1 px-4">
                {section}
              </p>
            )}
            {items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/app"}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 rounded-lg transition-all text-sm ${itemPaddingClass} ${
                    isActive
                      ? "bg-[#FFD700] text-black font-semibold"
                      : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#FFD700]"
                  }`
                }
              >
                {iconMap[item.id] ?? <LayoutDashboard size={20} />}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-[#333] pt-4 mt-4">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-2"} mb-4`}>
          <div className="w-9 h-9 rounded-full bg-[#FFD700] flex items-center justify-center">
            <span className="text-black font-bold text-sm">
              {user?.name.firstName.charAt(0).toUpperCase()}
              {user?.name.firstSurname.charAt(0).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{displayName}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={isCollapsed ? "Logout" : undefined}
          className={`w-full flex items-center rounded-lg transition-all disabled:opacity-50 text-gray-400 hover:text-red-400 ${
            isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
          }`}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>}
        </button>
      </div>
      <AlertModal />
    </aside>
  );
};
