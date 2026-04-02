import type { HelpModuleContent } from "../types";

const subscriptionHelpContent: HelpModuleContent = {
  moduleId: "subscription",
  title: {
    es: "Centro de ayuda: Suscripcion",
    en: "Help center: Subscription",
  },
  description: {
    es: "Este modulo permite gestionar plan, asientos, facturacion y cambios criticos de suscripcion.",
    en: "This module lets you manage plan, seats, billing, and critical subscription changes.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui controlas el estado de tu plan y su impacto economico y operativo.",
        en: "Here you control plan status and its financial and operational impact.",
      },
      tips: [
        {
          es: "Revisa el historial antes de cambiar plan para entender tendencia de costos.",
          en: "Review billing history before changing plans to understand cost trends.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes exportar historial, abrir portal de facturacion, ajustar asientos, cambiar plan y cancelar suscripcion.",
        en: "You can export history, open billing portal, adjust seats, change plan, and cancel subscription.",
      },
      bestPractices: [
        {
          es: "Ajusta asientos segun uso real para optimizar costo mensual.",
          en: "Adjust seats according to real usage to optimize monthly cost.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: revisa metricas, ajusta asientos, compara planes y finalmente valida historial exportado.",
        en: "Recommended flow: review metrics, adjust seats, compare plans, then validate exported billing history.",
      },
      warnings: [
        {
          es: "Cambios de plan y cancelacion pueden afectar acceso a funciones premium.",
          en: "Plan changes and cancellation may affect premium feature access.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: aumentar asientos sin evaluar demanda real. Usa historial y uso actual como referencia.",
        en: "Common mistake: increasing seats without evaluating real demand. Use history and current usage as reference.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto de suscripcion", en: "1) Subscription context" },
      body: {
        es: "Este encabezado resume el objetivo del modulo y permite exportar historial.",
        en: "This header summarizes module goals and allows billing-history export.",
      },
      targetSelector: '[data-help-id="subscription-title"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Revisa metricas", en: "2) Review metrics" },
      body: {
        es: "Aqui ves plan actual, asientos disponibles y gasto acumulado.",
        en: "Here you see current plan, available seats, and accumulated spend.",
      },
      targetSelector: '[data-help-id="subscription-stats"]',
    },
    {
      id: "step-3-actions",
      title: { es: "3) Gestion operativa", en: "3) Operational management" },
      body: {
        es: "Desde este bloque puedes abrir portal de facturacion y actualizar asientos.",
        en: "From this block you can open billing portal and update seat count.",
      },
      targetSelector: '[data-help-id="subscription-actions"]',
      tip: {
        es: "Actualiza asientos en ventanas de baja actividad para reducir friccion operativa.",
        en: "Update seats during low-activity windows to reduce operational friction.",
      },
    },
    {
      id: "step-4-plans",
      title: { es: "4) Evalua planes", en: "4) Evaluate plans" },
      body: {
        es: "Compara planes disponibles y selecciona el mas alineado a capacidad y presupuesto.",
        en: "Compare available plans and select the one aligned with capacity and budget.",
      },
      targetSelector: '[data-help-id="subscription-plans"]',
    },
    {
      id: "step-5-danger",
      title: { es: "5) Zona de riesgo", en: "5) Danger zone" },
      body: {
        es: "La cancelacion debe ser una decision controlada y comunicada previamente.",
        en: "Cancellation should be a controlled and previously communicated decision.",
      },
      targetSelector: '[data-help-id="subscription-danger"]',
      warning: {
        es: "Confirma impacto contractual y operativo antes de cancelar.",
        en: "Confirm contractual and operational impact before cancelling.",
      },
    },
    {
      id: "step-6-history",
      title: { es: "6) Historial de facturacion", en: "6) Billing history" },
      body: {
        es: "Usa el historial para auditoria de cobros y seguimiento financiero.",
        en: "Use billing history for charge audits and financial follow-up.",
      },
      targetSelector: '[data-help-id="subscription-history"]',
    },
  ],
};

export default subscriptionHelpContent;
