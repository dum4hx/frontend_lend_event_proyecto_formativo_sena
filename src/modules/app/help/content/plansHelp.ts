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

const plansDeleteConfirmGuide = {
  id: "plans-delete-confirm",
  title: { es: "Confirmación: Eliminar plan", en: "Confirm: Delete plan" },
  purpose: {
    es: "Confirmar la eliminación permanente de un plan del catálogo.",
    en: "Confirm the permanent deletion of a plan from the catalog.",
  },
  mode: "delete" as const,
  selector: '[data-help-id="plans-delete-confirm"]',
  fields: [],
  actions: [
    {
      id: "action-confirm-delete",
      label: { es: "Eliminar", en: "Delete" },
      purpose: {
        es: "Confirma y elimina permanentemente el plan.",
        en: "Confirms and permanently deletes the plan.",
      },
      consequence: {
        es: "El plan se elimina del catálogo y ya no estará disponible.",
        en: "The plan is removed from the catalog and will no longer be available.",
      },
      selector: '[data-help-id="plans-delete-confirm-submit"]',
    },
    {
      id: "action-cancel-delete",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cancelar la eliminación y volver a la grilla.",
        en: "Cancel deletion and return to the grid.",
      },
      consequence: {
        es: "El plan no se elimina y todo permanece sin cambios.",
        en: "The plan is not deleted and everything remains unchanged.",
      },
      selector: '[data-help-id="plans-delete-confirm-cancel"]',
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
      howTo: [
        {
          es: "Abre el modulo de Planes desde el menu de materiales o comercial.",
          en: "Open the Plans module from the materials or commercial menu.",
        },
        {
          es: "Busca si ya existe un plan similar antes de crear uno nuevo.",
          en: "Search for an existing similar plan before creating a new one.",
        },
        {
          es: "Usa el boton 'Nuevo Plan' para iniciar el formulario de creacion de paquete.",
          en: "Use the 'New Plan' button to start the package creation form.",
        },
      ],
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
      howTo: [
        {
          es: "Para buscar: ingresa el nombre o parte del nombre en el campo de busqueda del listado.",
          en: "To search: enter the name or part of the name in the listing search field.",
        },
        {
          es: "Para ver detalle: haz clic en la tarjeta del plan para expandir materiales y precio incluidos.",
          en: "To view detail: click the plan card to expand included materials and price.",
        },
        {
          es: "Para crear: haz clic en 'Nuevo Plan', completa nombre, materiales y precio diario, luego guarda.",
          en: "To create: click 'New Plan', fill in name, materials, and daily price, then save.",
        },
      ],
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
      howTo: [
        {
          es: "Busca el plan por nombre para verificar si ya hay uno similar en el catalogo.",
          en: "Search the plan by name to check if there's already a similar one in the catalog.",
        },
        {
          es: "Revisa las tarjetas existentes para evaluar el contenido y precio de planes actuales.",
          en: "Review existing cards to evaluate the content and price of current plans.",
        },
        {
          es: "Abre el detalle del plan mas similar y compara antes de decidir crear uno nuevo.",
          en: "Open the detail of the most similar plan and compare before deciding to create a new one.",
        },
        {
          es: "Si no existe ninguno adecuado, usa 'Nuevo Plan' con nombre unico y materiales correctos.",
          en: "If none are suitable, use 'New Plan' with a unique name and correct materials.",
        },
      ],
      warnings: [
        {
          es: "Crear bundles duplicados o muy parecidos complica ventas y mantenimiento del catalogo.",
          en: "Creating duplicate or near-duplicate bundles complicates sales and catalog maintenance.",
        },
      ],
    },
    {
      id: "delete",
      title: { es: "Eliminar un plan", en: "Delete a plan" },
      body: {
        es: "Puedes eliminar un plan que ya no se necesita. La acción es irreversible y requiere confirmación.",
        en: "You can delete a plan that is no longer needed. The action is irreversible and requires confirmation.",
      },
      howTo: [
        {
          es: "Localiza el plan en la grilla y haz clic en el icono de eliminar (papelera).",
          en: "Locate the plan in the grid and click the delete icon (trash can).",
        },
        {
          es: "Confirma la eliminación en el diálogo de confirmación.",
          en: "Confirm the deletion in the confirmation dialog.",
        },
      ],
      warnings: [
        {
          es: "Los planes eliminados no se pueden recuperar. Verifica que el plan no está asociado a pedidos activos.",
          en: "Deleted plans cannot be recovered. Verify the plan is not linked to active orders.",
        },
      ],
    },
    {
      id: "activate-deactivate",
      title: { es: "Activar / desactivar planes", en: "Activate / deactivate plans" },
      body: {
        es: "Cada plan puede activarse o desactivarse. Un plan inactivo sigue existiendo en el catálogo pero no se puede usar en nuevos pedidos.",
        en: "Each plan can be activated or deactivated. An inactive plan still exists in the catalog but cannot be used in new orders.",
      },
      howTo: [
        {
          es: "Haz clic en el icono de estado (toggle) en la tarjeta o en el detalle del plan.",
          en: "Click the status icon (toggle) on the plan card or detail view.",
        },
        {
          es: "El estado se actualiza inmediatamente sin necesidad de confirmación adicional.",
          en: "The status updates immediately without requiring additional confirmation.",
        },
      ],
      tips: [
        {
          es: "Desactiva temporalmente un plan en lugar de eliminarlo si planeas reutilizarlo.",
          en: "Temporarily deactivate a plan instead of deleting it if you plan to reuse it.",
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
      howTo: [
        {
          es: "Antes de guardar, revisa la lista de materiales incluidos y confirma que sean correctos.",
          en: "Before saving, review the list of included materials and confirm they are correct.",
        },
        {
          es: "Verifica el precio diario y asegurate de que refleje la estrategia comercial definida.",
          en: "Verify the daily price and make sure it reflects the defined commercial strategy.",
        },
        {
          es: "Usa la busqueda para confirmar que no existe un plan duplicado antes de finalizar.",
          en: "Use the search to confirm no duplicate plan exists before finalizing.",
        },
      ],
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
    {
      id: "step-5-toggle-active",
      title: { es: "5) Activa o desactiva un plan", en: "5) Activate or deactivate a plan" },
      body: {
        es: "Usa el icono de toggle en la tarjeta para cambiar el estado activo/inactivo del plan.",
        en: "Use the toggle icon on the card to switch the plan's active/inactive status.",
      },
      targetSelector: '[data-help-id="plans-toggle-active"]',
      tip: {
        es: "Desactivar un plan lo oculta de nuevos pedidos sin eliminarlo del catálogo.",
        en: "Deactivating a plan hides it from new orders without removing it from the catalog.",
      },
    },
    {
      id: "step-6-delete",
      title: { es: "6) Elimina un plan", en: "6) Delete a plan" },
      body: {
        es: "Haz clic en el icono de papelera para eliminar un plan. Se pedirá confirmación antes de proceder.",
        en: "Click the trash icon to delete a plan. Confirmation will be requested before proceeding.",
      },
      targetSelector: '[data-help-id="plans-delete"]',
      warning: {
        es: "La eliminación es permanente. Prefiere desactivar si podrías necesitar el plan más adelante.",
        en: "Deletion is permanent. Prefer deactivating if you might need the plan later.",
      },
    },
  ],
  formGuides: [plansCreateFormGuide, plansEditFormGuide, plansDeleteConfirmGuide],
};

export default plansHelpContent;
