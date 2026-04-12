import type { HelpModuleDefinition } from "./types";

const HELP_MODULE_DEFINITIONS: HelpModuleDefinition[] = [
  {
    moduleId: "login",
    routePrefixes: ["/login", "/auth/verify-otp"],
  },
  {
    moduleId: "operations",
    routePrefixes: ["/app/operations"],
  },
  {
    moduleId: "payment-methods",
    routePrefixes: ["/app/payment-methods"],
  },
  {
    moduleId: "pricing",
    routePrefixes: ["/app/pricing"],
  },
  {
    moduleId: "invoices",
    routePrefixes: ["/app/invoices"],
  },
  {
    moduleId: "inspections",
    routePrefixes: ["/app/inspections"],
  },
  {
    moduleId: "incidents",
    routePrefixes: ["/app/incidents"],
  },
  {
    moduleId: "maintenance",
    routePrefixes: ["/app/maintenance"],
  },
  {
    moduleId: "locations",
    routePrefixes: ["/app/locations"],
  },
  {
    moduleId: "transfer-requests",
    routePrefixes: ["/app/transfer-requests"],
  },
  {
    moduleId: "plans",
    routePrefixes: ["/app/plans"],
  },
  {
    moduleId: "attributes",
    routePrefixes: ["/app/attributes"],
  },
  {
    moduleId: "material-instances",
    routePrefixes: ["/app/material-instances"],
  },
  {
    moduleId: "material-types",
    routePrefixes: ["/app/material-types"],
  },
  {
    moduleId: "material-categories",
    routePrefixes: ["/app/material-categories"],
  },
  {
    moduleId: "subscription",
    routePrefixes: ["/app/subscription"],
  },
  {
    moduleId: "roles",
    routePrefixes: ["/app/roles"],
  },
  {
    moduleId: "team",
    routePrefixes: ["/app/team"],
  },
  {
    moduleId: "customers",
    routePrefixes: ["/app/customers"],
  },
  {
    moduleId: "tickets",
    routePrefixes: ["/app/tickets"],
  },
  {
    moduleId: "admin-dashboard",
    routePrefixes: ["/app"],
  },
  {
    moduleId: "reports",
    routePrefixes: ["/app/reports"],
  },
  {
    moduleId: "code-schemes",
    routePrefixes: ["/app/settings/code-schemes"],
  },
  {
    moduleId: "settings",
    routePrefixes: ["/app/settings"],
  },
  {
    moduleId: "super-admin-reports",
    routePrefixes: ["/super-admin/reports"],
  },
  {
    moduleId: "super-admin-settings",
    routePrefixes: ["/super-admin/settings"],
  },
];

export function resolveHelpModuleId(pathname: string): string | null {
  const ordered = [...HELP_MODULE_DEFINITIONS].sort(
    (first, second) => second.routePrefixes[0].length - first.routePrefixes[0].length,
  );

  for (const definition of ordered) {
    const hasMatch = definition.routePrefixes.some((routePrefix) =>
      pathname.startsWith(routePrefix),
    );
    if (hasMatch) {
      return definition.moduleId;
    }
  }

  return null;
}
