import type { HelpModuleContent } from "../types";

const dashboardHelpContent: HelpModuleContent = {
  moduleId: "admin-dashboard",
  title: {
    es: "Centro de ayuda: Panel",
    en: "Help center: Dashboard",
  },
  description: {
    es: "Este panel resume el estado operativo y financiero. Usa esta guía para aprender el flujo recomendado.",
    en: "This dashboard summarizes operational and financial status. Use this guide to learn the recommended flow.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui encuentras una vista rapida de usuarios, prestamos, solicitudes y facturacion para tomar decisiones diarias.",
        en: "Here you get a quick view of users, loans, requests, and billing to support daily decisions.",
      },
      howTo: [
        { es: "Abre el dashboard desde el menu principal al iniciar sesion.", en: "Open the dashboard from the main menu when logging in." },
        { es: "Revisa las tarjetas de metricas para detectar desviaciones en prestamos, solicitudes y cobros.", en: "Review the metrics cards to detect deviations in loans, requests, and billing." },
        { es: "Usa los enlaces directos de cada seccion para navegar al modulo de detalle correspondiente.", en: "Use the direct links in each section to navigate to the corresponding detail module." },
      ],
      tips: [
        {
          es: "Revisa primero las tarjetas de metricas para detectar desviaciones.",
          en: "Review metric cards first to detect deviations quickly.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes validar solicitudes pendientes, revisar facturacion y saltar a modulos de detalle con enlaces directos.",
        en: "You can validate pending requests, review billing, and jump to detail modules using direct links.",
      },
      howTo: [
        { es: "Para ver solicitudes pendientes: haz clic en 'Ver todo' en la seccion de solicitudes.", en: "To view pending requests: click 'View all' in the requests section." },
        { es: "Para revisar facturacion: consulta la seccion de resumen de facturas en el panel inferior.", en: "To review billing: check the invoice summary section in the lower panel." },
        { es: "Para navegar a detalle: usa los enlaces o botones de cada tarjeta para ir directamente al modulo.", en: "To navigate to detail: use the links or buttons on each card to go directly to the module." },
      ],
      bestPractices: [
        {
          es: "Atiende primero solicitudes con fechas cercanas para reducir retrasos.",
          en: "Handle requests with near-term dates first to reduce delays.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de uso", en: "Usage example" },
      body: {
        es: "Flujo sugerido: revisa prestamos vencidos, abre solicitudes pendientes y finaliza verificando resumen de facturas.",
        en: "Suggested flow: review overdue loans, open pending requests, and finish by checking invoice summary.",
      },
      howTo: [
        { es: "Revisa la tarjeta de prestamos vencidos para detectar casos criticos del dia.", en: "Review the overdue loans card to detect critical cases for the day." },
        { es: "Abre la lista de solicitudes pendientes y prioriza por fecha mas cercana.", en: "Open the pending requests list and prioritize by nearest date." },
        { es: "Revisa el resumen de facturas para verificar flujo de caja del periodo actual.", en: "Review the invoice summary to verify cash flow for the current period." },
      ],
      warnings: [
        {
          es: "No cierres el dia sin validar los prestamos vencidos.",
          en: "Do not close the day without validating overdue loans.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: revisar solo volumen de solicitudes y no su fecha de entrega. Prioriza por fecha y estado.",
        en: "Common mistake: checking only request volume and not delivery date. Prioritize by date and status.",
      },
      howTo: [
        { es: "Ordena las solicitudes por fecha de inicio para visualizar las mas urgentes primero.", en: "Sort requests by start date to see the most urgent ones first." },
        { es: "Revisa el estado de cada solicitud ademas de la fecha para evitar trabajar en las ya procesadas.", en: "Check each request's status in addition to the date to avoid working on already processed ones." },
        { es: "Si la metrica de prestamos vencidos crece, abre el modulo de operaciones para gestion detallada.", en: "If the overdue loans metric grows, open the operations module for detailed management." },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el contexto", en: "1) Understand context" },
      body: {
        es: "Este encabezado resume el estado general del modulo y te orienta sobre la jornada.",
        en: "This header summarizes overall module status and orients your daily workflow.",
      },
      targetSelector: '[data-help-id="dashboard-title"]',
    },
    {
      id: "step-2-metrics",
      title: { es: "2) Analiza metricas", en: "2) Analyze metrics" },
      body: {
        es: "Empieza por estas tarjetas para detectar volumen, riesgo y rendimiento.",
        en: "Start with these cards to detect volume, risk, and performance.",
      },
      targetSelector: '[data-help-id="dashboard-stat-cards"]',
      tip: {
        es: "Si prestamos vencidos suben, prioriza gestion de cobro y devolucion.",
        en: "If overdue loans increase, prioritize collection and return management.",
      },
    },
    {
      id: "step-3-requests",
      title: { es: "3) Atiende solicitudes", en: "3) Handle requests" },
      body: {
        es: "Haz clic en Ver todo para abrir el modulo de ordenes y procesar solicitudes pendientes.",
        en: "Click View all to open the orders module and process pending requests.",
      },
      targetSelector: '[data-help-id="dashboard-pending-requests"]',
      advanceOn: { event: "click" },
      bestPractice: {
        es: "Confirma disponibilidad antes de aprobar.",
        en: "Confirm availability before approving.",
      },
    },
    {
      id: "step-4-billing",
      title: { es: "4) Cierra con facturacion", en: "4) Close with billing" },
      body: {
        es: "Termina revisando el resumen de facturas para validar flujo de caja del periodo.",
        en: "Finish by reviewing invoice summary to validate period cash flow.",
      },
      targetSelector: '[data-help-id="dashboard-invoice-summary"]',
      warning: {
        es: "Pendientes altos sostenidos pueden impactar liquidez.",
        en: "Sustained high pending invoices can impact liquidity.",
      },
    },
  ],
};

export default dashboardHelpContent;
