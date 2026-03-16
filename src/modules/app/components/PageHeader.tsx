import { useLocation } from "react-router-dom";

export const PageHeader: React.FC = () => {
  const location = useLocation();

  // Map routes to page titles
  const getTitleFromRoute = (pathname: string): string => {
    const routeMap: Record<string, string> = {
      "/app": "Dashboard",
      "/app/dashboard": "Dashboard",
      "/app/events": "Events",
      "/app/customers": "Customers",
      "/app/team": "Team",
      "/app/roles": "Role Management",
      "/app/subscription": "Subscription",
      "/app/ia-settings": "IA Settings",
      "/app/settings": "Settings",
      "/app/material-categories": "Material Categories",
      "/app/material-types": "Material Types",
      "/app/material-instances": "Materials",
      "/app/attributes": "Attributes",
      "/app/plans": "Plans",
      "/app/inventory": "Inventory",
      "/app/locations": "Locations",
      "/app/stock-movements": "Stock Movements",
      "/app/alerts": "Alerts",
      "/app/orders": "Orders",
      "/app/contracts": "Contracts",
      "/app/rentals": "Rentals",
      "/app/invoices": "Invoices",
      "/app/reports": "Reports",
    };

    return routeMap[pathname] || "Dashboard";
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
