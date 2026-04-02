import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const pricingCrudGuides = createCrudFormGuides({
  baseId: "pricing-config",
  title: {
    create: { es: "Formulario: Nueva configuracion", en: "Form: New configuration" },
    edit: { es: "Formulario: Editar configuracion", en: "Form: Edit configuration" },
  },
  purpose: {
    create: {
      es: "Definir una estrategia de precios para alcance organizacional, material o paquete.",
      en: "Define a pricing strategy for organization, material, or package scope.",
    },
    edit: {
      es: "Ajustar estrategia y parametros de una configuracion existente.",
      en: "Adjust strategy and parameters of an existing configuration.",
    },
  },
  selector: {
    create: '[data-help-id="pricing-form-create"]',
    edit: '[data-help-id="pricing-form-edit"]',
  },
  fields: [
    {
      id: "pricing-field-scope",
      label: { es: "Alcance", en: "Scope" },
      purpose: {
        es: "Define sobre que entidad aplica la estrategia de precio.",
        en: "Defines which entity the price strategy applies to.",
      },
      dataType: { es: "Seleccion (select)", en: "Selection (select)" },
      required: true,
      selector: '[data-help-id="pricing-form-scope"]',
    },
    {
      id: "pricing-field-reference",
      label: { es: "Referencia", en: "Reference" },
      purpose: {
        es: "Selecciona el tipo de material o paquete cuando el alcance no es organizacional.",
        en: "Select material type or package when scope is not organizational.",
      },
      dataType: { es: "Seleccion con busqueda", en: "Searchable selection" },
      selector: '[data-help-id="pricing-form-reference"]',
    },
    {
      id: "pricing-field-strategy",
      label: { es: "Estrategia", en: "Strategy" },
      purpose: {
        es: "Selecciona la logica de calculo (por dia, semanal/mensual o fija).",
        en: "Select calculation logic (per-day, weekly/monthly, or fixed).",
      },
      dataType: { es: "Seleccion (select)", en: "Selection (select)" },
      required: true,
      selector: '[data-help-id="pricing-form-strategy"]',
    },
  ],
  actions: {
    create: [
      {
        id: "pricing-create-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: { es: "Cerrar sin guardar", en: "Close without saving" },
        consequence: {
          es: "Se descartan cambios del formulario.",
          en: "Form changes are discarded.",
        },
        selector: '[data-help-id="pricing-form-cancel"]',
      },
      {
        id: "pricing-create-save",
        label: { es: "Crear Config", en: "Create Config" },
        purpose: { es: "Guardar nueva configuracion", en: "Save new configuration" },
        consequence: {
          es: "La regla queda disponible en la tabla de configuraciones.",
          en: "The rule becomes available in the configurations table.",
        },
        selector: '[data-help-id="pricing-form-submit"]',
      },
    ],
    edit: [
      {
        id: "pricing-edit-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: { es: "Salir de edicion", en: "Exit edit mode" },
        consequence: {
          es: "Mantiene la configuracion actual.",
          en: "Keeps current configuration unchanged.",
        },
        selector: '[data-help-id="pricing-form-cancel"]',
      },
      {
        id: "pricing-edit-save",
        label: { es: "Guardar Cambios", en: "Save Changes" },
        purpose: { es: "Actualizar configuracion", en: "Update configuration" },
        consequence: {
          es: "La nueva estrategia impacta calculos posteriores.",
          en: "New strategy impacts subsequent calculations.",
        },
        selector: '[data-help-id="pricing-form-submit"]',
      },
    ],
  },
});

const pricingPreviewGuide = {
  id: "pricing-preview-form",
  title: { es: "Formulario: Simulador de precio", en: "Form: Price preview" },
  purpose: {
    es: "Simular el precio total para validar estrategias antes de operar.",
    en: "Simulate total pricing to validate strategies before operations.",
  },
  mode: "both" as const,
  selector: '[data-help-id="pricing-preview-form"]',
  usageFlow: [
    { es: "Paso 1: selecciona tipo de item y referencia.", en: "Step 1: select item type and reference." },
    { es: "Paso 2: define cantidad y duracion.", en: "Step 2: set quantity and duration." },
    { es: "Paso 3: calcula y revisa resultado.", en: "Step 3: calculate and review result." },
  ],
  fields: [
    {
      id: "preview-item-type",
      label: { es: "Tipo de item", en: "Item type" },
      purpose: { es: "Define si calculas material o paquete.", en: "Defines whether calculating material or package." },
      dataType: { es: "Seleccion", en: "Selection" },
      required: true,
      selector: '[data-help-id="pricing-preview-item-type"]',
    },
    {
      id: "preview-reference",
      label: { es: "Referencia", en: "Reference" },
      purpose: { es: "Selecciona el item especifico para la simulacion.", en: "Select specific item for simulation." },
      dataType: { es: "Seleccion con busqueda", en: "Searchable selection" },
      required: true,
      selector: '[data-help-id="pricing-preview-reference"]',
    },
  ],
  actions: [
    {
      id: "preview-close",
      label: { es: "Cerrar", en: "Close" },
      purpose: { es: "Salir del simulador", en: "Exit simulator" },
      consequence: { es: "No modifica configuraciones", en: "Does not modify configurations" },
      selector: '[data-help-id="pricing-preview-cancel"]',
    },
    {
      id: "preview-calculate",
      label: { es: "Calcular", en: "Calculate" },
      purpose: { es: "Ejecutar simulacion", en: "Run simulation" },
      consequence: { es: "Muestra total estimado y estrategia efectiva", en: "Shows estimated total and effective strategy" },
      selector: '[data-help-id="pricing-preview-submit"]',
    },
  ],
};

const pricingHelpContent: HelpModuleContent = {
  moduleId: "pricing",
  title: {
    es: "Centro de ayuda: Configuraciones de precios",
    en: "Help center: Pricing configurations",
  },
  description: {
    es: "Este modulo permite definir estrategias de precios por organizacion, tipo de material o paquete, ademas de simular calculos antes de aplicar cambios.",
    en: "This module lets you define pricing strategies by organization, material type, or package, and simulate calculations before applying changes.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui administras reglas de precios que impactan cotizaciones y operaciones de alquiler en todo el sistema.",
        en: "Here you manage pricing rules that impact quotes and rental operations across the system.",
      },
      tips: [
        {
          es: "Mantener estrategias consistentes por alcance evita discrepancias entre precio esperado y precio calculado.",
          en: "Keeping consistent strategies by scope avoids discrepancies between expected and calculated prices.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes crear, editar y eliminar configuraciones, filtrar por alcance o estrategia, y usar la vista previa para validar montos antes de guardar.",
        en: "You can create, edit, and delete configurations, filter by scope or strategy, and use preview to validate amounts before saving.",
      },
      bestPractices: [
        {
          es: "Usa Price Preview antes de publicar cambios en estrategias semanales o mensuales para verificar umbrales y montos efectivos.",
          en: "Use Price Preview before publishing weekly or monthly strategies to verify thresholds and effective amounts.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Filtra configuraciones existentes, valida impacto con la simulacion, ajusta parametros y luego crea o actualiza la estrategia correspondiente.",
        en: "Filter existing configurations, validate impact with simulation, adjust parameters, then create or update the corresponding strategy.",
      },
      warnings: [
        {
          es: "Editar una configuracion global puede afectar precios de multiples productos al mismo tiempo.",
          en: "Editing a global configuration can affect prices of multiple products at once.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error comun es guardar estrategias sin revisar referencia o alcance. Confirma siempre scope, strategyType y item objetivo antes de crear o actualizar.",
        en: "A common mistake is saving strategies without reviewing reference or scope. Always confirm scope, strategyType, and target item before creating or updating.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del modulo", en: "1) Module context" },
      body: {
        es: "Este encabezado describe el objetivo de configuracion de precios para materiales y paquetes.",
        en: "This header describes the pricing configuration goal for materials and packages.",
      },
      targetSelector: '[data-help-id="pricing-header"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Acciones principales", en: "2) Main actions" },
      body: {
        es: "Desde aqui puedes abrir la simulacion de precio o crear una nueva configuracion.",
        en: "From here you can open price simulation or create a new configuration.",
      },
      targetSelector: '[data-help-id="pricing-actions"]',
      tip: {
        es: "Simular antes de guardar reduce ajustes posteriores en pedidos activos.",
        en: "Simulating before saving reduces later adjustments on active orders.",
      },
    },
    {
      id: "step-3-filters",
      title: { es: "3) Filtra configuraciones", en: "3) Filter configurations" },
      body: {
        es: "Estos filtros permiten ubicar reglas por texto, alcance y tipo de estrategia.",
        en: "These filters let you locate rules by text, scope, and strategy type.",
      },
      targetSelector: '[data-help-id="pricing-filters"]',
    },
    {
      id: "step-4-table",
      title: { es: "4) Administra reglas", en: "4) Manage rules" },
      body: {
        es: "La tabla centraliza configuraciones actuales y acciones de edicion o eliminacion.",
        en: "The table centralizes current configurations and edit/delete actions.",
      },
      targetSelector: '[data-help-id="pricing-table"]',
      warning: {
        es: "Antes de eliminar una regla, confirma que no sea necesaria para cotizaciones vigentes.",
        en: "Before deleting a rule, confirm it is not needed for active quotations.",
      },
    },
  ],
  formGuides: [...pricingCrudGuides, pricingPreviewGuide],
};

export default pricingHelpContent;