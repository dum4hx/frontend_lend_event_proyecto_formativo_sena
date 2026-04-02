import type { HelpModuleContent } from "../types";

const operationsHelpContent: HelpModuleContent = {
  moduleId: "operations",
  title: {
    es: "Centro de ayuda: Operaciones",
    en: "Help center: Operations",
  },
  description: {
    es: "Este panel concentra la operacion diaria por ubicacion: inspecciones, finanzas vencidas, inventario critico, transferencias, vencimientos y danos.",
    en: "This dashboard centralizes daily location operations: inspections, overdue financials, critical inventory, transfers, deadlines, and damages.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui supervisas el estado operativo en tiempo real para priorizar acciones del equipo de bodega.",
        en: "Here you monitor real-time operational status to prioritize warehouse team actions.",
      },
      tips: [
        {
          es: "Seleccionar primero la ubicacion correcta evita decisiones sobre datos de otra sede.",
          en: "Selecting the right location first avoids decisions based on another site data.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes refrescar informacion por ubicacion, revisar KPIs, cambiar entre tabs operativos y atender tareas o alertas especificas.",
        en: "You can refresh location data, review KPIs, switch across operational tabs, and address specific tasks or alerts.",
      },
      bestPractices: [
        {
          es: "Empieza por Overview para una vista global y luego profundiza en el tab con mayor criticidad.",
          en: "Start with Overview for global visibility, then drill into the highest-priority tab.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Valida ubicacion, revisa KPI, identifica alertas por tab y ejecuta seguimiento en inspecciones, finanzas o inventario segun prioridad.",
        en: "Validate location, review KPIs, identify alerts by tab, and follow up in inspections, financials, or inventory by priority.",
      },
      warnings: [
        {
          es: "Trabajar con una ubicacion incorrecta puede desviar recursos y tiempos de respuesta.",
          en: "Working with the wrong location can misallocate resources and response time.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es quedarse solo en KPI sin revisar paneles de detalle. Usa las pestanas para confirmar causas y acciones concretas.",
        en: "A common mistake is staying only on KPI cards without checking detail panels. Use tabs to confirm causes and concrete actions.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Encabezado operativo", en: "1) Operational header" },
      body: {
        es: "Este bloque define el contexto de operaciones y centraliza la seleccion de ubicacion y refresco.",
        en: "This block defines operations context and centralizes location selection and refresh.",
      },
      targetSelector: '[data-help-id="operations-header"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Ubicacion y actualizar", en: "2) Location and refresh" },
      body: {
        es: "Aqui eliges la ubicacion de trabajo y fuerzas sincronizacion de datos operativos.",
        en: "Here you choose the working location and trigger operational data synchronization.",
      },
      targetSelector: '[data-help-id="operations-actions"]',
    },
    {
      id: "step-3-kpis",
      title: { es: "3) Lectura de KPI", en: "3) KPI reading" },
      body: {
        es: "Los indicadores entregan una vista rapida de carga operativa para priorizar acciones.",
        en: "Indicators provide a quick view of operational load to prioritize actions.",
      },
      targetSelector: '[data-help-id="operations-kpis"]',
    },
    {
      id: "step-4-tabs",
      title: { es: "4) Navegacion por tabs", en: "4) Tab navigation" },
      body: {
        es: "Usa estas pestanas para entrar al area especifica: inspecciones, finanzas, inventario, transferencias, vencimientos o danos.",
        en: "Use these tabs to enter specific areas: inspections, financials, inventory, transfers, deadlines, or damages.",
      },
      targetSelector: '[data-help-id="operations-tabs"]',
    },
    {
      id: "step-5-panels",
      title: { es: "5) Panel de detalle", en: "5) Detail panel" },
      body: {
        es: "En este bloque ejecutas el analisis detallado y seguimiento de cada flujo operativo.",
        en: "In this block you perform detailed analysis and follow-up for each operational flow.",
      },
      targetSelector: '[data-help-id="operations-panels"]',
      warning: {
        es: "Verifica siempre tab activo y ubicacion antes de escalar incidentes o tomar decisiones.",
        en: "Always verify active tab and location before escalating incidents or making decisions.",
      },
    },
  ],
};

export default operationsHelpContent;