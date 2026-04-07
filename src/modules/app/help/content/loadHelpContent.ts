import type { HelpModuleContent } from "../types";

type HelpLoader = () => Promise<{ default: HelpModuleContent }>;

const HELP_LOADERS: Record<string, HelpLoader> = {
  "admin-dashboard": () => import("./dashboardHelp"),
  attributes: () => import("./attributesHelp"),
  customers: () => import("./customersHelp"),
  incidents: () => import("./incidentsHelp"),
  invoices: () => import("./invoicesHelp"),
  inspections: () => import("./inspectionsHelp"),
  locations: () => import("./locationsHelp"),
  login: () => import("./loginHelp"),
  maintenance: () => import("./maintenanceHelp"),
  "material-categories": () => import("./materialCategoriesHelp"),
  "material-instances": () => import("./materialInstancesHelp"),
  "material-types": () => import("./materialTypesHelp"),
  operations: () => import("./operationsHelp"),
  orders: () => import("./ordersHelp"),
  "payment-methods": () => import("./paymentMethodsHelp"),
  plans: () => import("./plansHelp"),
  pricing: () => import("./pricingHelp"),
  rentals: () => import("./rentalsHelp"),
  reports: () => import("./reportsHelp"),
  roles: () => import("./rolesHelp"),
  settings: () => import("./settingsHelp"),
  subscription: () => import("./subscriptionHelp"),
  "super-admin-settings": () => import("./superAdminSettingsHelp"),
  team: () => import("./teamHelp"),
  "transfer-requests": () => import("./transferRequestsHelp"),
};

export async function loadHelpContent(moduleId: string): Promise<HelpModuleContent | null> {
  const loader = HELP_LOADERS[moduleId];
  if (!loader) {
    return null;
  }

  const module = await loader();
  return module.default;
}
