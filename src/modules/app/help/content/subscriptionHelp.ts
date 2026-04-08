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
      howTo: [
        {
          es: "Abre el modulo de Suscripcion desde el menu de configuracion.",
          en: "Open the Subscription module from the settings menu.",
        },
        {
          es: "Revisa las tarjetas de metricas: plan actual, asientos y fecha de renovacion.",
          en: "Review the metrics cards: current plan, seats, and renewal date.",
        },
        {
          es: "Consulta el historial de facturacion antes de hacer cualquier cambio de plan.",
          en: "Check billing history before making any plan changes.",
        },
      ],
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
      howTo: [
        {
          es: "Para ajustar asientos: usa el control de asientos en las opciones del plan activo.",
          en: "To adjust seats: use the seat control in the active plan options.",
        },
        {
          es: "Para ver historial de facturacion: haz clic en exportar historial y guarda el CSV.",
          en: "To view billing history: click export history and save the CSV.",
        },
        {
          es: "Para cambiar de plan: usa la seccion de comparacion de planes y selecciona el nuevo.",
          en: "To change plan: use the plan comparison section and select the new one.",
        },
      ],
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
      howTo: [
        {
          es: "Revisa las tarjetas de metricas para entender el uso actual de asientos y costo.",
          en: "Review the metrics cards to understand current seat usage and cost.",
        },
        {
          es: "Ajusta el numero de asientos al uso real del equipo para evitar sobrecostos.",
          en: "Adjust the number of seats to actual team usage to avoid overcharges.",
        },
        {
          es: "Compara las opciones de plan disponibles antes de tomar la decision de cambio.",
          en: "Compare available plan options before making the change decision.",
        },
        {
          es: "Exporta el historial de facturacion y guardalo como respaldo despues de los cambios.",
          en: "Export the billing history and save it as a backup after the changes.",
        },
      ],
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
      howTo: [
        {
          es: "Antes de agregar asientos, revisa cuantos estan actualmente en uso en las metricas.",
          en: "Before adding seats, review how many are currently in use in the metrics.",
        },
        {
          es: "Consulta el historial exportado para ver si el uso ha sido consistente en periodos anteriores.",
          en: "Check the exported history to see if usage has been consistent in previous periods.",
        },
        {
          es: "Para cancelacion: confirma el impacto en automatizaciones y acceso antes de proceder.",
          en: "For cancellation: confirm the impact on automations and access before proceeding.",
        },
      ],
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
        es: "Compara planes disponibles y selecciona el mas alineado a capacidad y presupuesto. Los planes dinamicos muestran un desglose de costos estimado basado en tus asientos actuales.",
        en: "Compare available plans and select the one aligned with capacity and budget. Dynamic plans show an estimated cost breakdown based on your current seats.",
      },
      targetSelector: '[data-help-id="subscription-plans"]',
    },
    {
      id: "step-4b-cost-preview",
      title: { es: "4b) Vista previa de costos", en: "4b) Cost preview" },
      body: {
        es: "Para planes con modelo por asiento, se calcula automaticamente el costo estimado mensual usando el numero actual de asientos de tu organizacion.",
        en: "For per-seat plans, the estimated monthly cost is automatically calculated using your organization's current seat count.",
      },
      targetSelector: '[data-help-id="plan-cost-preview"]',
      tip: {
        es: "Revisa el desglose antes de hacer checkout para evitar sorpresas en la factura.",
        en: "Review the breakdown before checkout to avoid billing surprises.",
      },
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
