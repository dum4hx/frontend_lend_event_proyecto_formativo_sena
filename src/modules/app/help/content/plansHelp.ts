import type { HelpModuleContent } from "../types";

const plansCreateFormGuide = {
  id: "plans-create-form",
  title: { es: "Formulario: Crear plan", en: "Form: Create plan" },
  purpose: {
    es: "Registrar un paquete de materiales con precio diario opcional y cantidades.",
    en: "Register a material package with optional daily price and quantities.",
  },
  mode: "create" as const,
  selector: '[data-help-id="plans-form-create"]',
  fields: [
    {
      id: "field-name",
      label: { es: "Nombre", en: "Name" },
      purpose: {
        es: "Identifica comercialmente el plan.",
        en: "Commercially identifies the plan.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="plans-form-name"]',
    },
    {
      id: "field-price-per-day",
      label: { es: "Precio por dia", en: "Price per day" },
      purpose: {
        es: "Define un valor fijo o deja vacio para calcular por materiales.",
        en: "Defines fixed value or leaves blank to derive from materials.",
      },
      dataType: { es: "Moneda", en: "Currency" },
      selector: '[data-help-id="plans-form-price-per-day"]',
    },
    {
      id: "field-entries",
      label: { es: "Materiales del plan", en: "Plan materials" },
      purpose: {
        es: "Configura tipos y cantidades incluidas en el paquete.",
        en: "Configures types and quantities included in the bundle.",
      },
      dataType: { es: "Lista dinamica", en: "Dynamic list" },
      required: true,
      selector: '[data-help-id="plans-form-entries"]',
    },
  ],
  actions: [
    {
      id: "action-create-plan",
      label: { es: "Crear", en: "Create" },
      purpose: {
        es: "Guardar el nuevo plan de materiales.",
        en: "Save the new material plan.",
      },
      consequence: {
        es: "El plan queda disponible en la grilla de planes.",
        en: "Plan becomes available in plans grid.",
      },
      selector: '[data-help-id="plans-form-submit"]',
    },
    {
      id: "action-cancel-plan",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar formulario sin guardar.",
        en: "Close form without saving.",
      },
      consequence: {
        es: "Se descartan datos no guardados.",
        en: "Unsaved data is discarded.",
      },
      selector: '[data-help-id="plans-form-cancel"]',
    },
  ],
};

const plansEditFormGuide = {
  id: "plans-edit-form",
  title: { es: "Formulario: Editar plan", en: "Form: Edit plan" },
  purpose: {
    es: "Actualizar nombre, descripcion, precio o composicion de un plan existente.",
    en: "Update name, description, pricing, or composition of an existing plan.",
  },
  mode: "edit" as const,
  selector: '[data-help-id="plans-form-edit"]',
  fields: plansCreateFormGuide.fields,
  actions: [
    {
      id: "action-save-plan",
      label: { es: "Guardar", en: "Save" },
      purpose: {
        es: "Aplicar cambios del plan actual.",
        en: "Apply changes to current plan.",
      },
      consequence: {
        es: "La tarjeta del plan se actualiza con los nuevos datos.",
        en: "Plan card is updated with new data.",
      },
      selector: '[data-help-id="plans-form-submit"]',
    },
    {
      id: "action-cancel-edit-plan",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar edicion sin guardar.",
        en: "Close editing without saving.",
      },
      consequence: {
        es: "Se mantienen los datos previos del plan.",
        en: "Previous plan values remain unchanged.",
      },
      selector: '[data-help-id="plans-form-cancel"]',
    },
  ],
};

const plansHelpContent: HelpModuleContent = {
  moduleId: "plans",
  title: {
    es: "Centro de ayuda: Planes de material",
    en: "Help center: Material plans",
  },
  description: {
    es: "Este modulo permite crear y administrar paquetes o planes de materiales para alquiler, agrupando tipos y precios en una sola oferta.",
    en: "This module lets you create and manage rental plans for material bundles, grouping types and pricing into one offering.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes definir planes compuestos por varios tipos de material para facilitar cotizacion y operacion comercial.",
        en: "Here you can define plans composed of multiple material types to simplify quoting and commercial operations.",
      },
      tips: [
        {
          es: "Usa nombres claros y descripciones breves para distinguir paquetes similares.",
          en: "Use clear names and concise descriptions to distinguish similar bundles.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes buscar planes existentes, crear nuevos paquetes y revisar el detalle de sus componentes y precio diario.",
        en: "You can search existing plans, create new bundles, and inspect component and daily price details.",
      },
      bestPractices: [
        {
          es: "Mantén una estrategia de precios consistente entre el valor del bundle y la suma de materiales.",
          en: "Keep a consistent pricing strategy between bundle value and the sum of materials.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: busca si el plan ya existe, revisa tarjetas actuales, abre el detalle y luego crea un nuevo paquete si hace falta.",
        en: "Recommended flow: search whether the plan already exists, review current cards, open details, then create a new bundle if needed.",
      },
      warnings: [
        {
          es: "Crear bundles duplicados o muy parecidos complica ventas y mantenimiento del catalogo.",
          en: "Creating duplicate or near-duplicate bundles complicates sales and catalog maintenance.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: definir un plan sin revisar materiales incluidos o el criterio de precio por dia. Verifica ambos antes de publicar.",
        en: "Common mistake: defining a plan without reviewing included materials or daily-price criteria. Verify both before publishing.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto de planes", en: "1) Plan context" },
      body: {
        es: "Este encabezado resume el objetivo del modulo y su accion principal para agregar un plan.",
        en: "This header summarizes the module goal and its main action to add a plan.",
      },
      targetSelector: '[data-help-id="plans-title"]',
    },
    {
      id: "step-2-search",
      title: { es: "2) Busca planes", en: "2) Search plans" },
      body: {
        es: "Usa el buscador para verificar si un plan ya existe antes de crear uno nuevo.",
        en: "Use the search box to verify whether a plan already exists before creating a new one.",
      },
      targetSelector: '[data-help-id="plans-search"]',
      tip: {
        es: "Buscar primero evita duplicidad en bundles comerciales.",
        en: "Searching first prevents duplication in commercial bundles.",
      },
    },
    {
      id: "step-3-grid",
      title: { es: "3) Revisa la grilla", en: "3) Review the grid" },
      body: {
        es: "Aqui puedes comparar planes existentes y abrir el detalle de cada paquete.",
        en: "Here you can compare existing plans and open the detail for each bundle.",
      },
      targetSelector: '[data-help-id="plans-grid"]',
    },
    {
      id: "step-4-card",
      title: { es: "4) Evalua precio y contenido", en: "4) Evaluate price and contents" },
      body: {
        es: "Cada tarjeta resume el precio por dia y la composicion general del plan.",
        en: "Each card summarizes daily price and the general composition of the plan.",
      },
      targetSelector: '[data-help-id="plans-card"]',
      warning: {
        es: "Verifica si el precio es automatico o definido manualmente antes de cotizar.",
        en: "Check whether pricing is automatic or manually defined before quoting.",
      },
    },
  ],
  formGuides: [plansCreateFormGuide, plansEditFormGuide],
};

export default plansHelpContent;
