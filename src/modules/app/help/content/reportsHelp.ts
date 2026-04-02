import type { HelpModuleContent } from "../types";

const reportsHelpContent: HelpModuleContent = {
  moduleId: "reports",
  title: {
    es: "Centro de ayuda: Reportes y analitica",
    en: "Help center: Reports & Analytics",
  },
  description: {
    es: "Este modulo consolida datos de clientes, solicitudes, prestamos, facturas, inventario, equipo, ubicaciones y pedidos para analisis operativo.",
    en: "This module consolidates data from customers, requests, loans, invoices, inventory, team, locations, and orders for operational analysis.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes explorar datos por modulo, detectar tendencias y exportar informacion para auditoria, seguimiento o toma de decisiones.",
        en: "Here you can explore module-level data, detect trends, and export information for audit, follow-up, or decision making.",
      },
      howTo: [
        {
          es: "Abre el modulo desde el menu lateral en Reportes.",
          en: "Open the module from the sidebar under Reports.",
        },
        {
          es: "Selecciona el modulo de negocio (pestana) que deseas analizar.",
          en: "Select the business module (tab) you want to analyze.",
        },
        {
          es: "Define el rango de fechas y aplica filtros antes de revisar la tabla o exportar datos.",
          en: "Set the date range and apply filters before reviewing the table or exporting data.",
        },
      ],
      tips: [
        {
          es: "Define primero el modulo y el rango de fechas para reducir ruido y obtener analisis mas accionable.",
          en: "Set module and date range first to reduce noise and get more actionable analysis.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes cambiar entre modulos de negocio, refrescar datos, revisar KPIs, aplicar filtros avanzados y exportar resultados en CSV.",
        en: "You can switch between business modules, refresh data, review KPIs, apply advanced filters, and export results to CSV.",
      },
      howTo: [
        {
          es: "Para cambiar modulo: usa las pestanas en la parte superior para seleccionar el dominio de negocio.",
          en: "To switch module: use the tabs at the top to select the business domain.",
        },
        {
          es: "Para exportar: haz clic en el boton de exportar CSV despues de aplicar los filtros necesarios.",
          en: "To export: click the export CSV button after applying the necessary filters.",
        },
        {
          es: "Para refrescar: usa el boton de actualizacion del encabezado para sincronizar datos recientes.",
          en: "To refresh: use the header update button to sync recent data.",
        },
      ],
      bestPractices: [
        {
          es: "Antes de exportar, valida que filtros, modulo activo y rango de fechas correspondan al analisis requerido.",
          en: "Before exporting, validate that filters, active module, and date range match the required analysis.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Selecciona modulo, revisa KPIs, aplica filtros y rango de fechas, valida tabla y finalmente exporta el corte necesario.",
        en: "Select module, review KPIs, apply filters and date range, validate the table, and finally export the needed snapshot.",
      },
      howTo: [
        {
          es: "Selecciona el modulo de negocio que corresponde al analisis requerido.",
          en: "Select the business module that corresponds to the required analysis.",
        },
        {
          es: "Revisa los KPIs del modulo activo para entender el contexto del periodo.",
          en: "Review the KPIs of the active module to understand the period context.",
        },
        {
          es: "Aplica filtros y define el rango de fechas para acotar los datos al segmento requerido.",
          en: "Apply filters and set the date range to narrow data to the required segment.",
        },
        {
          es: "Valida los resultados en la tabla y luego exporta en CSV si necesitas compartir o analizar externamente.",
          en: "Validate results in the table and then export to CSV if you need to share or analyze externally.",
        },
      ],
      warnings: [
        {
          es: "Exportar sin revisar contexto puede mezclar datos de modulos o periodos no deseados.",
          en: "Exporting without context review can mix data from unintended modules or periods.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es interpretar KPIs sin considerar el modulo activo. Cada modulo cambia metricas, columnas y logica de filtros.",
        en: "A common mistake is interpreting KPIs without considering the active module. Each module changes metrics, columns, and filter logic.",
      },
      howTo: [
        {
          es: "Siempre verifica la pestana activa antes de interpretar KPIs o exportar datos.",
          en: "Always verify the active tab before interpreting KPIs or exporting data.",
        },
        {
          es: "Si los datos no corresponden al analisis esperado, revisa modulo y rango de fechas primero.",
          en: "If data doesn't match the expected analysis, review module and date range first.",
        },
        {
          es: "Para analisis multi-modulo, exporta y combina los CSV fuera de esta herramienta.",
          en: "For multi-module analysis, export and combine CSVs outside this tool.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto y acciones", en: "1) Context and actions" },
      body: {
        es: "Este encabezado presenta el objetivo del tablero y las acciones para actualizar datos o exportar el reporte actual.",
        en: "This header presents dashboard purpose and actions to refresh data or export the current report.",
      },
      targetSelector: '[data-help-id="reports-header"]',
    },
    {
      id: "step-2-modules",
      title: { es: "2) Cambia el modulo", en: "2) Switch module" },
      body: {
        es: "Estas pestanas te permiten enfocarte en un dominio especifico como clientes, prestamos o facturas.",
        en: "These tabs let you focus on a specific domain such as customers, loans, or invoices.",
      },
      targetSelector: '[data-help-id="reports-modules"]',
    },
    {
      id: "step-3-kpis",
      title: { es: "3) Lee indicadores", en: "3) Read indicators" },
      body: {
        es: "Los KPIs se actualizan segun el modulo activo y ofrecen una vista rapida del estado operativo.",
        en: "KPIs update based on the active module and provide a quick operational snapshot.",
      },
      targetSelector: '[data-help-id="reports-kpis"]',
    },
    {
      id: "step-4-filters",
      title: { es: "4) Ajusta filtros", en: "4) Tune filters" },
      body: {
        es: "Usa filtros y rango de fechas para acotar la consulta al segmento que necesitas analizar.",
        en: "Use filters and date range to narrow the query to the segment you need to analyze.",
      },
      targetSelector: '[data-help-id="reports-filters"]',
      tip: {
        es: "Al cambiar filtros se reinicia la pagina para mantener navegacion consistente en resultados.",
        en: "When filters change, page resets to keep result navigation consistent.",
      },
    },
    {
      id: "step-5-table",
      title: { es: "5) Valida resultados", en: "5) Validate results" },
      body: {
        es: "La tabla muestra el detalle final para revision, paginacion y exportacion del corte analitico.",
        en: "The table shows final detail for review, pagination, and exporting the analytical snapshot.",
      },
      targetSelector: '[data-help-id="reports-table"]',
      warning: {
        es: "Confirma modulo y periodo antes de compartir o exportar reportes para evitar decisiones con datos incompletos.",
        en: "Confirm module and period before sharing or exporting reports to avoid decisions based on incomplete data.",
      },
    },
  ],
};

export default reportsHelpContent;
