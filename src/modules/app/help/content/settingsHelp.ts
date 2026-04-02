import type { HelpModuleContent } from "../types";

const settingsHelpContent: HelpModuleContent = {
  moduleId: "settings",
  title: {
    es: "Centro de ayuda: Configuracion",
    en: "Help center: Settings",
  },
  description: {
    es: "Este modulo centraliza configuraciones de cuenta, organizacion, seguridad, notificaciones y apariencia.",
    en: "This module centralizes account, organization, security, notification, and appearance settings.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes administrar informacion de la organizacion, preferencias del sistema y parametros operativos por categoria.",
        en: "Here you can manage organization information, system preferences, and operational parameters by category.",
      },
      tips: [
        {
          es: "Haz cambios por modulo y guarda de forma incremental para reducir errores.",
          en: "Apply changes module by module and save incrementally to reduce mistakes.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes cambiar entre categorias, editar datos, restablecer cambios del modulo activo y guardar solo cuando la validacion sea correcta.",
        en: "You can switch categories, edit data, reset active-module changes, and save only when validation is correct.",
      },
      bestPractices: [
        {
          es: "Respeta permisos por categoria para evitar cambios no autorizados.",
          en: "Respect per-category permissions to avoid unauthorized changes.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: revisa resumen, entra a la categoria correcta, aplica ajustes, valida errores y guarda.",
        en: "Recommended flow: review summary, enter the right category, apply changes, validate errors, and save.",
      },
      warnings: [
        {
          es: "Cambiar de modulo con cambios sin guardar puede descartar trabajo si confirmas el cambio.",
          en: "Switching modules with unsaved changes can discard work if you confirm the switch.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: editar campos de cuenta sin revisar validaciones. Corrige errores antes de guardar.",
        en: "Common mistake: editing account fields without checking validations. Fix errors before saving.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el contexto", en: "1) Understand context" },
      body: {
        es: "Este encabezado resume el objetivo del centro de configuracion.",
        en: "This header summarizes the goal of the settings center.",
      },
      targetSelector: '[data-help-id="settings-title"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Revisa resumen", en: "2) Review summary" },
      body: {
        es: "Estas tarjetas muestran cuantas secciones tienes disponibles y el rol actual con el que operas.",
        en: "These cards show how many sections are available and the current role you are operating with.",
      },
      targetSelector: '[data-help-id="settings-stats"]',
    },
    {
      id: "step-3-modules",
      title: { es: "3) Elige categoria", en: "3) Choose category" },
      body: {
        es: "Selecciona el modulo de configuracion que deseas administrar desde esta grilla.",
        en: "Select the settings category you want to manage from this grid.",
      },
      targetSelector: '[data-help-id="settings-modules"]',
      tip: {
        es: "Si no tienes acceso a una categoria, su tarjeta aparecera limitada.",
        en: "If you do not have access to a category, its card will appear restricted.",
      },
    },
    {
      id: "step-4-panel",
      title: { es: "4) Edita el modulo activo", en: "4) Edit active module" },
      body: {
        es: "Aqui se muestra el formulario o panel del modulo actualmente seleccionado.",
        en: "This is where the form or panel for the currently selected module is displayed.",
      },
      targetSelector: '[data-help-id="settings-panel"]',
    },
    {
      id: "step-5-actions",
      title: { es: "5) Guarda o restablece", en: "5) Save or reset" },
      body: {
        es: "Usa estas acciones para revertir cambios del modulo actual o guardar la configuracion validada.",
        en: "Use these actions to revert active-module changes or save validated configuration.",
      },
      targetSelector: '[data-help-id="settings-actions"]',
      warning: {
        es: "No guardes hasta confirmar que el estado indica cambios validos y sin errores.",
        en: "Do not save until the status indicates valid changes without errors.",
      },
    },
  ],
};

export default settingsHelpContent;
