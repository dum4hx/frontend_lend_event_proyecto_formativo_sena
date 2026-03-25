import { useLocation } from "react-router-dom";
import { useLanguage } from "../../../contexts/useLanguage";

export const PageHeader: React.FC = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const isEs = language === "es";

  // Map routes to page titles
  const getTitleFromRoute = (pathname: string): string => {
    const routeMap: Record<string, string> = {
      "/app": isEs ? "Panel" : "Dashboard",
      "/app/dashboard": isEs ? "Panel" : "Dashboard",
      "/app/events": isEs ? "Eventos" : "Events",
      "/app/customers": isEs ? "Clientes" : "Customers",
      "/app/team": isEs ? "Equipo" : "Team",
      "/app/roles": isEs ? "Gestión de Roles" : "Role Management",
      "/app/subscription": isEs ? "Suscripción" : "Subscription",
      "/app/ia-settings": isEs ? "Configuración IA" : "IA Settings",
      "/app/settings": isEs ? "Configuración" : "Settings",
      "/app/material-categories": isEs ? "Categorías de Material" : "Material Categories",
      "/app/material-types": isEs ? "Tipos de Material" : "Material Types",
      "/app/material-instances": isEs ? "Materiales" : "Materials",
      "/app/attributes": isEs ? "Atributos" : "Attributes",
      "/app/plans": isEs ? "Planes" : "Plans",
      "/app/inventory": isEs ? "Inventario" : "Inventory",
      "/app/locations": isEs ? "Ubicaciones" : "Locations",
      "/app/stock-movements": isEs ? "Movimientos de Stock" : "Stock Movements",
      "/app/alerts": isEs ? "Alertas" : "Alerts",
      "/app/orders": isEs ? "Órdenes" : "Orders",
      "/app/contracts": isEs ? "Contratos" : "Contracts",
      "/app/rentals": isEs ? "Alquileres" : "Rentals",
      "/app/invoices": isEs ? "Facturas" : "Invoices",
      "/app/reports": isEs ? "Reportes" : "Reports",
    };

    return routeMap[pathname] || (isEs ? "Panel" : "Dashboard");
  };

  const pageTitle = getTitleFromRoute(location.pathname);

  return (
    <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 px-8 py-5">
      <div className="flex items-center gap-3">
        <div className="h-6 w-px bg-zinc-700/50" />
        <h1 className="text-xl font-semibold text-zinc-100">{pageTitle}</h1>
      </div>
    </div>
  );
};
