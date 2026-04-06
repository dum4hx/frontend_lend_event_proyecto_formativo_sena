import commonEn from "./locales/en/common.json";
import navEn from "./locales/en/nav.json";
import publicSiteEn from "./locales/en/publicSite.json";
import settingsEn from "./locales/en/settings.json";
import superAdminEn from "./locales/en/superAdmin.json";
import systemSettingsEn from "./locales/en/systemSettings.json";
import catalogOverviewEn from "./locales/en/catalogOverview.json";
import inspectionsEn from "./locales/en/inspections.json";
import pricingEn from "./locales/en/pricing.json";

import commonEs from "./locales/es/common.json";
import navEs from "./locales/es/nav.json";
import publicSiteEs from "./locales/es/publicSite.json";
import settingsEs from "./locales/es/settings.json";
import superAdminEs from "./locales/es/superAdmin.json";
import systemSettingsEs from "./locales/es/systemSettings.json";
import catalogOverviewEs from "./locales/es/catalogOverview.json";
import inspectionsEs from "./locales/es/inspections.json";
import pricingEs from "./locales/es/pricing.json";

export type SupportedLanguage = "en" | "es";

/**
 * Merge multiple translation modules into a single object
 */
function mergeTranslations(...modules: Record<string, string>[]): Record<string, string> {
  return modules.reduce((acc, module) => ({ ...acc, ...module }), {});
}

export const EN_TRANSLATIONS = mergeTranslations(
  commonEn,
  navEn,
  publicSiteEn,
  settingsEn,
  superAdminEn,
  systemSettingsEn,
  catalogOverviewEn,
  inspectionsEn,
  pricingEn,
);

export const ES_TRANSLATIONS: Record<keyof typeof EN_TRANSLATIONS, string> = mergeTranslations(
  commonEs,
  navEs,
  publicSiteEs,
  settingsEs,
  superAdminEs,
  systemSettingsEs,
  catalogOverviewEs,
  inspectionsEs,
  pricingEs,
);

export type TranslationKey = keyof typeof EN_TRANSLATIONS;
export type TranslationParams = Record<string, number | string>;
export type TranslateFunction = (key: TranslationKey, params?: TranslationParams) => string;

export const TRANSLATIONS: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en: EN_TRANSLATIONS,
  es: ES_TRANSLATIONS,
};

export const LANGUAGE_TO_LOCALE: Record<SupportedLanguage, string> = {
  en: "en-US",
  es: "es-CO",
};

const NAV_ITEM_KEYS: Partial<Record<string, TranslationKey>> = {
  dashboard: "nav.item.dashboard",
  customers: "nav.item.customers",
  team: "nav.item.team",
  roles: "nav.item.roles",
  subscription: "nav.item.subscription",
  settings: "nav.item.settings",
  "material-categories": "nav.item.material-categories",
  "material-types": "nav.item.material-types",
  "material-instances": "nav.item.material-instances",
  "catalog-overview": "nav.item.catalog-overview",
  attributes: "nav.item.attributes",
  plans: "nav.item.plans",
  "transfer-requests": "nav.item.transfer-requests",
  operations: "nav.item.operations",
  locations: "nav.item.locations",
  inspections: "nav.item.inspections",
  incidents: "nav.item.incidents",
  maintenance: "nav.item.maintenance",
  "stock-movements": "nav.item.stock-movements",
  alerts: "nav.item.alerts",
  orders: "nav.item.orders",
  contracts: "nav.item.contracts",
  rentals: "nav.item.rentals",
  invoices: "nav.item.invoices",
  reports: "nav.item.reports",
  pricing: "nav.item.pricing",
  "payment-methods": "nav.item.payment-methods",
  overview: "nav.item.overview",
  clients: "nav.item.clients",
  organizations: "nav.item.organizations",
  "sa-plans": "nav.item.sa-plans",
  "sa-settings": "nav.item.sa-settings",
};

const NAV_SECTION_KEYS: Partial<Record<string, TranslationKey>> = {
  Overview: "nav.section.overview",
  Organization: "nav.section.organization",
  Materials: "nav.section.materials",
  Warehouse: "nav.section.warehouse",
  Commerce: "nav.section.commerce",
  Management: "nav.section.management",
  Monitoring: "nav.section.monitoring",
  Configuration: "nav.section.configuration",
};

export function translate(
  language: SupportedLanguage,
  key: TranslationKey,
  params?: TranslationParams,
) {
  const template = TRANSLATIONS[language][key] ?? EN_TRANSLATIONS[key];
  if (!params) return template;

  return Object.entries(params).reduce((acc, [name, value]) => {
    return acc.replaceAll(`{${name}}`, String(value));
  }, template);
}

export function getNavItemLabel(itemId: string, fallback: string, t: TranslateFunction): string {
  const key = NAV_ITEM_KEYS[itemId];
  return key ? t(key) : fallback;
}

export function getNavSectionLabel(section: string | undefined, t: TranslateFunction): string {
  if (!section) return "";
  const key = NAV_SECTION_KEYS[section];
  return key ? t(key) : section;
}
