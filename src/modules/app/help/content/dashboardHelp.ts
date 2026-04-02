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
