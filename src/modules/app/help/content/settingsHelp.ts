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
      howTo: [
        {
          es: "Abre Configuracion desde el menu lateral.",
          en: "Open Settings from the sidebar menu.",
        },
        {
          es: "Revisa las categorias disponibles y verifica el rol activo con el que operas.",
          en: "Review available categories and verify the active role you are operating with.",
        },
        {
          es: "Selecciona la categoria que deseas configurar desde la grilla principal.",
          en: "Select the category you want to configure from the main grid.",
        },
      ],
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
      howTo: [
        {
          es: "Selecciona una categoria de la grilla para abrir su panel de edicion.",
          en: "Select a category from the grid to open its editing panel.",
        },
        {
          es: "Edita los campos deseados en el panel activo y observa el estado de validacion.",
          en: "Edit the desired fields in the active panel and observe the validation status.",
        },
        {
          es: "Usa 'Restablecer' si cometiste un error y deseas revertir los cambios no guardados.",
          en: "Use 'Reset' if you made a mistake and want to revert unsaved changes.",
        },
        {
          es: "Guarda solo cuando el indicador muestre que todos los campos son validos.",
          en: "Save only when the indicator shows all fields are valid.",
        },
      ],
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
      howTo: [
        {
          es: "Revisa las tarjetas de resumen para identificar cuantas secciones tienes disponibles.",
          en: "Review summary cards to identify how many sections are available to you.",
        },
        {
          es: "Selecciona la categoria correcta segun el tipo de cambio que deseas hacer.",
          en: "Select the correct category based on the type of change you want to make.",
        },
        {
          es: "Aplica los ajustes en el panel activo y corrige cualquier error de validacion antes de continuar.",
          en: "Apply adjustments in the active panel and fix any validation errors before continuing.",
        },
        {
          es: "Guarda los cambios cuando el indicador muestre que todo es correcto.",
          en: "Save changes when the indicator shows everything is correct.",
        },
      ],
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
      howTo: [
        {
          es: "Antes de guardar, revisa si hay mensajes de error debajo de cada campo editado.",
          en: "Before saving, check if there are error messages below each edited field.",
        },
        {
          es: "Corrige todos los errores de validacion antes de intentar guardar la configuracion.",
          en: "Fix all validation errors before attempting to save the configuration.",
        },
        {
          es: "Si cambias de categoria con cambios pendientes, confirma o descarta para evitar perdida de trabajo.",
          en: "If you switch categories with pending changes, confirm or discard to avoid losing work.",
        },
      ],
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
      id: "step-late-fee-mode",
      title: { es: "Modo de cobro por mora", en: "Late fee charge mode" },
      body: {
        es: "Selecciona si la mora se cobra como monto fijo diario o como porcentaje del subtotal del alquiler.",
        en: "Select whether late fees are charged as a fixed daily amount or as a percentage of the rental subtotal.",
      },
      targetSelector: '[data-help-id="org-late-fee-mode"]',
    },
    {
      id: "step-late-fee-value",
      title: { es: "Valor del recargo", en: "Late fee value" },
      body: {
        es: "Ingresa el valor del recargo. En modo fijo es un monto en centavos por dia; en modo porcentaje es un decimal (ej: 0.05 = 5%).",
        en: "Enter the fee value. In fixed mode it is an amount in cents per day; in percentage mode it is a decimal (e.g., 0.05 = 5%).",
      },
      targetSelector: '[data-help-id="org-late-fee-value"]',
    },
    {
      id: "step-late-fee-due-days",
      title: { es: "Dias de vencimiento de factura por mora", en: "Late fee invoice due days" },
      body: {
        es: "Cantidad de dias tras generar la factura de mora para establecer su fecha de vencimiento.",
        en: "Number of days after generating the late fee invoice to set its due date.",
      },
      targetSelector: '[data-help-id="org-late-fee-due-days"]',
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
