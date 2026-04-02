import type { HelpModuleContent } from "../types";

const iaSettingsHelpContent: HelpModuleContent = {
  moduleId: "ia-settings",
  title: {
    es: "Centro de ayuda: Configuracion de IA",
    en: "Help center: AI Settings",
  },
  description: {
    es: "Este modulo permite activar o desactivar capacidades de IA segun estrategia operativa y riesgo.",
    en: "This module allows enabling or disabling AI capabilities based on operational strategy and risk.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui gestionas funciones inteligentes como respuestas automaticas, programacion y recomendaciones.",
        en: "Here you manage intelligent features such as auto responses, scheduling, and recommendations.",
      },
      tips: [
        {
          es: "Habilita funciones de forma gradual para medir impacto en procesos reales.",
          en: "Enable features gradually to measure impact on real workflows.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes revisar estado de funciones de IA y ajustar activacion mediante interruptores por capacidad.",
        en: "You can review AI feature status and adjust activation using per-capability toggles.",
      },
      bestPractices: [
        {
          es: "Documenta cambios de configuracion para facilitar auditoria y soporte.",
          en: "Document configuration changes to ease auditing and support.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: revisa metricas globales, inspecciona cada funcion y aplica ajustes de forma controlada.",
        en: "Recommended flow: review global metrics, inspect each feature, and apply controlled adjustments.",
      },
      warnings: [
        {
          es: "Desactivar funciones puede afectar automatizaciones ya adoptadas por el equipo.",
          en: "Disabling features may impact automations already adopted by the team.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: cambiar multiples toggles sin evaluar resultado. Aplica un cambio por vez y valida.",
        en: "Common mistake: changing multiple toggles without evaluating results. Apply one change at a time and validate.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del modulo", en: "1) Module context" },
      body: {
        es: "Este encabezado explica el objetivo de la configuracion de IA.",
        en: "This header explains the goal of AI configuration.",
      },
      targetSelector: '[data-help-id="ia-settings-title"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Estado global", en: "2) Global status" },
      body: {
        es: "Estas tarjetas muestran cuantas funciones estan activas y desactivadas.",
        en: "These cards show how many features are enabled and disabled.",
      },
      targetSelector: '[data-help-id="ia-settings-stats"]',
    },
    {
      id: "step-3-features",
      title: { es: "3) Ajusta capacidades", en: "3) Adjust capabilities" },
      body: {
        es: "Desde esta lista puedes revisar descripcion funcional y activar/desactivar cada capacidad.",
        en: "From this list you can review feature descriptions and enable/disable each capability.",
      },
      targetSelector: '[data-help-id="ia-settings-features"]',
      tip: {
        es: "Prioriza funciones con mayor impacto en productividad antes de activar todas.",
        en: "Prioritize high-productivity-impact features before enabling everything.",
      },
    },
    {
      id: "step-4-switches",
      title: { es: "4) Confirma cambios", en: "4) Confirm changes" },
      body: {
        es: "Valida con el equipo cada cambio para mantener coherencia operativa.",
        en: "Validate each change with the team to keep operational consistency.",
      },
      targetSelector: '[data-help-id="ia-settings-switch"]',
      warning: {
        es: "Evita cambios abruptos en horarios de alta demanda.",
        en: "Avoid abrupt changes during high-demand periods.",
      },
    },
  ],
};

export default iaSettingsHelpContent;
