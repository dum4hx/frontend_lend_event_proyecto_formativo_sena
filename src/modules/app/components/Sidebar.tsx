import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  UserCircle,
  CreditCard,
  Package,
  Layers,
  FolderTree,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  MapPin,
  TrendingDown,
  AlertCircle,
  ShoppingCart,
  FileText,
  Tag,
  BookOpen,
  BarChart3,
  ArrowLeftRight,
  DollarSign,
  ClipboardList,
  Wallet,
  ClipboardCheck,
  Eye,
  Wrench,
  Hash,
} from "lucide-react";
import { ApiError } from "../../../lib/api";
import { useLogout } from "../../../hooks/useLogout";
import { useAuth } from "../../../contexts/useAuth";
import { useLanguage } from "../../../contexts/useLanguage";
import { usePermissions } from "../../../contexts/usePermissions";
import { useAlertModal } from "../../../hooks/useAlertModal";
import { getNavItemsByPrefix, groupNavItemsBySection } from "../../../config/modulePermissions";
import { getNavItemLabel, getNavSectionLabel } from "../../../i18n/translations";

const iconMap: Record<string, React.ReactNode> = {
  // Overview
  dashboard: <LayoutDashboard size={20} />,
  // Organization
  events: <Calendar size={20} />,
  customers: <UserCircle size={20} />,
  team: <Users size={20} />,
  roles: <ShieldCheck size={20} />,
  subscription: <CreditCard size={20} />,
  settings: <Settings size={20} />,
  // Materials
  "material-categories": <FolderTree size={20} />,
  "material-types": <Package size={20} />,
  "material-instances": <Layers size={20} />,
  "catalog-overview": <Eye size={20} />,
  attributes: <Tag size={20} />,
  plans: <BookOpen size={20} />,
  "transfer-requests": <ArrowLeftRight size={20} />,
  // Warehouse
  operations: <ClipboardList size={20} />,
  inventory: <Package size={20} />,
  locations: <MapPin size={20} />,
  inspections: <ClipboardCheck size={20} />,
  incidents: <ClipboardList size={20} />,
  maintenance: <Wrench size={20} />,
  "stock-movements": <TrendingDown size={20} />,
  alerts: <AlertCircle size={20} />,
  // Commerce
  orders: <ShoppingCart size={20} />,
  contracts: <FileText size={20} />,
  rentals: <Package size={20} />,
  invoices: <FileText size={20} />,
  reports: <BarChart3 size={20} />,
  pricing: <DollarSign size={20} />,
  "payment-methods": <Wallet size={20} />,
  "code-schemes": <Hash size={20} />,
  // Super admin
  "sa-plans": <BookOpen size={20} />,
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { logout } = useLogout();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hasAnyPermission } = usePermissions();
  const { showError, AlertModal } = useAlertModal();
  const navigate = useNavigate();

  const sections = useMemo(() => {
    const visible = getNavItemsByPrefix("/app").filter(
      (item) => item.requiredPermissions.length === 0 || hasAnyPermission(item.requiredPermissions),
    );
    return groupNavItemsBySection(visible);
  }, [hasAnyPermission]);

  useEffect(() => {
    setCollapsedSections((prev) => {
      const next = { ...prev };
      let changed = false;
      const sectionNames = sections
        .map((entry) => entry.section)
        .filter((name): name is string => Boolean(name));

      for (const name of sectionNames) {
        if (!(name in next)) {
          next[name] = false;
          changed = true;
        }
      }

      for (const key of Object.keys(next)) {
        if (!sectionNames.includes(key)) {
          delete next[key];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [sections]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : t("common.loggingOut");
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
      className={`sidebar-scroll fixed left-0 top-0 ${sidebarWidthClass} h-screen bg-[#0e0e0e] border-r border-zinc-800/60 flex flex-col overflow-y-auto z-50 transition-all duration-300`}
    >
      {/* Logo */}
      <div
        className={`flex items-center border-b border-zinc-800/60 ${isCollapsed ? "justify-center px-4 py-4" : "justify-between px-4 py-4"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/lendevent-logo.png" alt="LendEvent" className="h-8 w-auto flex-shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-2xl text-white font-bold tracking-tight italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-[#FFD700] hover:bg-zinc-800 transition-colors flex-shrink-0"
          aria-label={isCollapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {sections.map(({ section, items }) => {
          const sectionKey = section ?? "";
          const translatedSection = getNavSectionLabel(section, t);
          const isSectionCollapsed =
            !isCollapsed && sectionKey ? collapsedSections[sectionKey] : false;

          return (
            <div key={sectionKey}>
              {section && !isCollapsed && (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSections((prev) => ({
                      ...prev,
                      [sectionKey]: !prev[sectionKey],
                    }))
                  }
                  className="w-full flex items-center justify-between mt-5 mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-expanded={!isSectionCollapsed}
                >
                  <span>{translatedSection}</span>
                  {isSectionCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                </button>
              )}

              {(!isSectionCollapsed || isCollapsed) &&
                items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === "/app"}
                    title={isCollapsed ? getNavItemLabel(item.id, item.label, t) : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${itemPaddingClass} ${
                        isActive
                          ? "bg-[#FFD700] text-black"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`
                    }
                  >
                    <span className="flex-shrink-0">
                      {iconMap[item.id] ?? <LayoutDashboard size={18} />}
                    </span>
                    {!isCollapsed && (
                      <span className="truncate">{getNavItemLabel(item.id, item.label, t)}</span>
                    )}
                  </NavLink>
                ))}
            </div>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-zinc-800/60 px-3 py-3">
        <button
          type="button"
          onClick={() => navigate("/app/settings?tab=account")}
          title={isCollapsed ? displayName : undefined}
          className={`w-full flex items-center rounded-lg transition-colors hover:bg-zinc-800/60 group ${
            isCollapsed ? "justify-center px-2 py-2 mb-2" : "gap-3 px-2 py-2 mb-1"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 group-hover:ring-2 group-hover:ring-yellow-400/50 transition-all">
            <span className="text-black font-bold text-xs">
              {user?.name.firstName.charAt(0).toUpperCase()}
              {user?.name.firstSurname.charAt(0).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden text-left">
              <p className="text-white text-sm font-medium truncate leading-tight group-hover:text-yellow-400 transition-colors">
                {displayName}
              </p>
              <p className="text-zinc-500 text-xs truncate">{user?.email}</p>
            </div>
          )}
        </button>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={isCollapsed ? t("common.logout") : undefined}
          className={`w-full flex items-center rounded-lg text-sm transition-all disabled:opacity-50 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 ${
            isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          }`}
        >
          <LogOut size={16} />
          {!isCollapsed && (
            <span>{isLoggingOut ? t("common.loggingOut") : t("common.logout")}</span>
          )}
        </button>
      </div>
      <AlertModal />
    </aside>
  );
};
