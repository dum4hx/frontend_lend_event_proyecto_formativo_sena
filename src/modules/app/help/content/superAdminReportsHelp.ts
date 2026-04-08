import type { HelpModuleContent } from "../types";

const superAdminReportsHelpContent: HelpModuleContent = {
  moduleId: "super-admin-reports",
  title: {
    en: "Help Center: Platform Reports",
    es: "Centro de ayuda: Reportes de Plataforma",
  },
  description: {
    en: "Explore platform-wide KPIs, subscription analytics, and organization usage metrics. Export data to XLSX.",
    es: "Explora KPIs de plataforma, analíticas de suscripciones y métricas de uso de organizaciones. Exporta datos a XLSX.",
  },
  sections: [
    {
      id: "overview",
      title: { en: "Overview", es: "Vista general" },
      body: {
        en: "The reports page provides three tabs — Platform KPIs, Subscriptions, and Usage — each showing summary stat cards and a data table. Filter by date range and, for Subscriptions and Usage, by plan and organization status.",
        es: "La página de reportes ofrece tres pestañas — KPIs de Plataforma, Suscripciones y Uso — cada una con tarjetas de resumen y una tabla de datos. Filtra por rango de fechas y, para Suscripciones y Uso, por plan y estado de organización.",
      },
    },
    {
      id: "platform-kpis",
      title: { en: "Platform KPIs", es: "KPIs de Plataforma" },
      body: {
        en: "View monthly breakdowns of new organizations, new users, total loans, and total invoices. KPI cards show current totals, active users, and Monthly Recurring Revenue (MRR) with period-over-period trends.",
        es: "Visualiza desgloses mensuales de nuevas organizaciones, nuevos usuarios, préstamos totales y facturas totales. Las tarjetas KPI muestran totales actuales, usuarios activos e Ingreso Mensual Recurrente (MRR) con tendencias periodo a periodo.",
      },
      tips: [
        {
          en: "Use date filters to focus on specific months or quarters.",
          es: "Usa los filtros de fecha para enfocarte en meses o trimestres específicos.",
        },
      ],
    },
    {
      id: "subscriptions",
      title: { en: "Subscriptions", es: "Suscripciones" },
      body: {
        en: "Browse paginated subscription data per organization: plan, seat count, catalog items, billing period, and creation date. Summary cards show total subscriptions, upgrades, churn rate, and payment success percentage.",
        es: "Navega datos paginados de suscripciones por organización: plan, cantidad de puestos, ítems de catálogo, periodo de facturación y fecha de creación. Las tarjetas resumen muestran total de suscripciones, mejoras, tasa de cancelación y porcentaje de éxito de pagos.",
      },
    },
    {
      id: "usage",
      title: { en: "Usage", es: "Uso" },
      body: {
        en: "View detailed per-organization usage: user counts, loans, invoices, customers, and material instances. KPI cards display platform-wide totals for organizations, users, loans, and invoices.",
        es: "Visualiza uso detallado por organización: cantidad de usuarios, préstamos, facturas, clientes e instancias de materiales. Las tarjetas KPI muestran totales a nivel de plataforma para organizaciones, usuarios, préstamos y facturas.",
      },
    },
    {
      id: "export",
      title: { en: "Exporting Data", es: "Exportar Datos" },
      body: {
        en: "Click the Export XLSX button to download the current tab's data as an Excel file. For paginated tabs (Subscriptions, Usage) all pages are fetched automatically.",
        es: "Haz clic en el botón Exportar XLSX para descargar los datos de la pestaña actual como archivo Excel. Para pestañas paginadas (Suscripciones, Uso) se obtienen todas las páginas automáticamente.",
      },
    },
  ],
  walkthrough: [
    {
      id: "header",
      title: { en: "Page Header", es: "Encabezado de Página" },
      body: {
        en: "The header shows the page title and the Export button.",
        es: "El encabezado muestra el título de la página y el botón de Exportar.",
      },
      targetSelector: '[data-help-id="admin-reports-header"]',
    },
    {
      id: "tabs",
      title: { en: "Report Tabs", es: "Pestañas de Reportes" },
      body: {
        en: "Switch between Platform KPIs, Subscriptions, and Usage tabs to view different data sets.",
        es: "Cambia entre las pestañas KPIs de Plataforma, Suscripciones y Uso para ver diferentes conjuntos de datos.",
      },
      targetSelector: '[data-help-id="admin-reports-tabs"]',
    },
    {
      id: "filters",
      title: { en: "Filters", es: "Filtros" },
      body: {
        en: "Use date range and category filters to narrow the data. Plan and status filters appear for Subscriptions and Usage tabs.",
        es: "Usa los filtros de rango de fechas y categoría para refinar los datos. Los filtros de plan y estado aparecen en las pestañas Suscripciones y Uso.",
      },
      targetSelector: '[data-help-id="admin-reports-filters"]',
    },
    {
      id: "kpis",
      title: { en: "KPI Cards", es: "Tarjetas KPI" },
      body: {
        en: "Summary stat cards show key metrics with trend indicators when period comparison data is available.",
        es: "Las tarjetas de resumen muestran métricas clave con indicadores de tendencia cuando hay datos de comparación de periodos.",
      },
      targetSelector: '[data-help-id="admin-reports-kpis"]',
    },
    {
      id: "table",
      title: { en: "Data Table", es: "Tabla de Datos" },
      body: {
        en: "The data table displays detailed rows. Use pagination controls at the bottom to navigate through pages.",
        es: "La tabla de datos muestra filas detalladas. Usa los controles de paginación en la parte inferior para navegar entre páginas.",
      },
      targetSelector: '[data-help-id="admin-reports-table"]',
    },
    {
      id: "export-button",
      title: { en: "Export", es: "Exportar" },
      body: {
        en: "Click to export all data for the current tab as an XLSX file.",
        es: "Haz clic para exportar todos los datos de la pestaña actual como archivo XLSX.",
      },
      targetSelector: '[data-help-id="admin-reports-export"]',
    },
  ],
};

export default superAdminReportsHelpContent;
