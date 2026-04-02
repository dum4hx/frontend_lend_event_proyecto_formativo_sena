import type { HelpModuleContent } from "../types";

const maintenanceHelpContent: HelpModuleContent = {
  moduleId: "maintenance",
  title: {
    en: "Help center: Maintenance Batches",
    es: "Centro de ayuda: Lotes de Mantenimiento",
  },
  description: {
    en: "This module lets you create and manage maintenance batches to track repairs, replacements, and costs for damaged or lost material instances.",
    es: "Este módulo permite crear y gestionar lotes de mantenimiento para rastrear reparaciones, reemplazos y costos de instancias de material dañadas o perdidas.",
  },
  sections: [
    {
      id: "introduction",
      title: { en: "Introduction", es: "Introducción" },
      body: {
        en: "Maintenance batches group material instances that need repair or replacement into manageable work units. Each batch progresses through a lifecycle: draft → in progress → completed (or cancelled).",
        es: "Los lotes de mantenimiento agrupan instancias de material que necesitan reparación o reemplazo en unidades de trabajo manejables. Cada lote avanza a través de un ciclo de vida: borrador → en progreso → completado (o cancelado).",
      },
      howTo: [
        {
          en: "Open the module from the sidebar under Maintenance.",
          es: "Abre el módulo desde el menú lateral en Mantenimiento.",
        },
        {
          en: "Filter batches by status using the tabs at the top of the list.",
          es: "Filtra lotes por estado usando las pestañas en la parte superior de la lista.",
        },
        {
          en: "Click a batch row to open its detail view.",
          es: "Haz clic en una fila de lote para abrir su vista de detalle.",
        },
      ],
      tips: [
        {
          en: "Use the status tabs to quickly find draft batches that need items added.",
          es: "Usa las pestañas de estado para encontrar rápidamente lotes en borrador que necesitan artículos.",
        },
      ],
    },
    {
      id: "lifecycle",
      title: { en: "Batch lifecycle", es: "Ciclo de vida del lote" },
      body: {
        en: "A batch starts as a draft where you can add/remove items and edit details. Once you start the batch, items move to 'in repair' status. Resolve each item as repaired or unrecoverable. When all items are resolved, the batch is completed.",
        es: "Un lote comienza como borrador donde puede agregar/eliminar artículos y editar detalles. Una vez que inicia el lote, los artículos pasan a estado 'en reparación'. Resuelva cada artículo como reparado o irrecuperable. Cuando todos los artículos están resueltos, el lote se completa.",
      },
      howTo: [
        {
          en: "Create a draft batch with the 'New Batch' button.",
          es: "Cree un lote borrador con el botón 'Nuevo Lote'.",
        },
        {
          en: "Add items to the batch from the detail view.",
          es: "Agregue artículos al lote desde la vista de detalle.",
        },
        {
          en: "Start the batch when all items are added.",
          es: "Inicie el lote cuando todos los artículos estén agregados.",
        },
        {
          en: "Resolve each item individually with a resolution and optional cost.",
          es: "Resuelva cada artículo individualmente con una resolución y costo opcional.",
        },
      ],
      bestPractices: [
        {
          en: "Record estimated costs when adding items so you can compare with actual costs after resolution.",
          es: "Registre costos estimados al agregar artículos para poder comparar con los costos reales después de la resolución.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { en: "Common errors", es: "Errores comunes" },
      body: {
        en: "A common mistake is trying to start a batch without items. Make sure at least one item is added before starting. Also, only draft batches can be edited or have items added/removed.",
        es: "Un error común es intentar iniciar un lote sin artículos. Asegúrese de que al menos un artículo esté agregado antes de iniciar. Además, solo los lotes en borrador pueden editarse o tener artículos agregados/eliminados.",
      },
      warnings: [
        {
          en: "Cancelling a batch is irreversible. All items in the batch will be marked accordingly.",
          es: "Cancelar un lote es irreversible. Todos los artículos del lote serán marcados en consecuencia.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { en: "1) Maintenance panel", es: "1) Panel de mantenimiento" },
      body: {
        en: "The header shows the page title, a button to create new batches, and a refresh control.",
        es: "El encabezado muestra el título de la página, un botón para crear nuevos lotes y un control de actualización.",
      },
      targetSelector: '[data-help-id="maintenance-title"]',
    },
    {
      id: "step-2-create",
      title: { en: "2) Create a batch", es: "2) Crear un lote" },
      body: {
        en: "Click 'New Batch' to open the creation form. Give your batch a descriptive name and optional scheduling dates.",
        es: "Haga clic en 'Nuevo Lote' para abrir el formulario de creación. Asigne un nombre descriptivo y fechas de programación opcionales.",
      },
      targetSelector: '[data-help-id="maintenance-create-btn"]',
    },
    {
      id: "step-3-stats",
      title: { en: "3) Overview stats", es: "3) Estadísticas generales" },
      body: {
        en: "The stats cards show total batches, estimated cost, and actual cost for the current filter.",
        es: "Las tarjetas de estadísticas muestran el total de lotes, costo estimado y costo real para el filtro actual.",
      },
      targetSelector: '[data-help-id="maintenance-stats"]',
    },
    {
      id: "step-4-tabs",
      title: { en: "4) Status filter tabs", es: "4) Pestañas de filtro por estado" },
      body: {
        en: "Use the tabs to filter batches by status: All, Draft, In Progress, Completed, or Cancelled.",
        es: "Usa las pestañas para filtrar lotes por estado: Todos, Borrador, En Progreso, Completado o Cancelado.",
      },
      targetSelector: '[data-help-id="maintenance-status-tabs"]',
      tip: {
        en: "Focus on 'Draft' to find batches that need items, and 'In Progress' for batches awaiting resolution.",
        es: "Enfóquese en 'Borrador' para encontrar lotes que necesitan artículos, y en 'En Progreso' para lotes pendientes de resolución.",
      },
    },
    {
      id: "step-5-list",
      title: { en: "5) Batch list", es: "5) Lista de lotes" },
      body: {
        en: "The table shows all batches matching the current filter. Click the eye icon to view details, pencil to edit, play to start, or X to cancel.",
        es: "La tabla muestra todos los lotes que coinciden con el filtro actual. Haz clic en el ícono de ojo para ver detalles, lápiz para editar, play para iniciar o X para cancelar.",
      },
      targetSelector: '[data-help-id="maintenance-batch-table"]',
    },
  ],
  formGuides: [
    {
      id: "maintenance-create-form",
      title: { en: "Form: Create batch", es: "Formulario: Crear lote" },
      purpose: {
        en: "Create a new maintenance batch for grouping items that need repair.",
        es: "Crear un nuevo lote de mantenimiento para agrupar artículos que necesitan reparación.",
      },
      mode: "create",
      selector: '[data-help-id="maintenance-batch-form-create"]',
      usageFlow: [
        { en: "Step 1: enter a batch name.", es: "Paso 1: ingrese un nombre de lote." },
        {
          en: "Step 2: add an optional description.",
          es: "Paso 2: agregue una descripción opcional.",
        },
        {
          en: "Step 3: set scheduled dates if known.",
          es: "Paso 3: establezca fechas programadas si se conocen.",
        },
        { en: "Step 4: add any notes.", es: "Paso 4: agregue notas." },
        { en: "Step 5: submit the form.", es: "Paso 5: envíe el formulario." },
      ],
      fields: [
        {
          id: "maintenance-batch-name",
          label: { en: "Batch name", es: "Nombre del lote" },
          purpose: {
            en: "Descriptive name for the maintenance batch",
            es: "Nombre descriptivo para el lote de mantenimiento",
          },
          dataType: { en: "Text (max 200 chars)", es: "Texto (máx 200 caracteres)" },
          required: true,
          selector: '[data-help-id="maintenance-batch-form-name"]',
        },
        {
          id: "maintenance-batch-description",
          label: { en: "Description", es: "Descripción" },
          purpose: {
            en: "Detailed description of the batch purpose",
            es: "Descripción detallada del propósito del lote",
          },
          dataType: { en: "Multiline text", es: "Texto multilínea" },
          selector: '[data-help-id="maintenance-batch-form-description"]',
        },
        {
          id: "maintenance-batch-start-date",
          label: { en: "Scheduled start date", es: "Fecha de inicio programada" },
          purpose: {
            en: "When maintenance work is expected to begin",
            es: "Cuándo se espera que comience el trabajo de mantenimiento",
          },
          dataType: { en: "Date", es: "Fecha" },
          selector: '[data-help-id="maintenance-batch-form-start-date"]',
        },
        {
          id: "maintenance-batch-end-date",
          label: { en: "Scheduled end date", es: "Fecha de fin programada" },
          purpose: {
            en: "When maintenance work is expected to finish",
            es: "Cuándo se espera que finalice el trabajo de mantenimiento",
          },
          dataType: { en: "Date", es: "Fecha" },
          selector: '[data-help-id="maintenance-batch-form-end-date"]',
        },
        {
          id: "maintenance-batch-notes",
          label: { en: "Notes", es: "Notas" },
          purpose: {
            en: "Additional notes or instructions",
            es: "Notas o instrucciones adicionales",
          },
          dataType: { en: "Multiline text", es: "Texto multilínea" },
          selector: '[data-help-id="maintenance-batch-form-notes"]',
        },
      ],
      actions: [
        {
          id: "maintenance-cancel",
          label: { en: "Cancel", es: "Cancelar" },
          purpose: { en: "Close without creating", es: "Cerrar sin crear" },
          consequence: { en: "No batch is created", es: "No se crea ningún lote" },
        },
        {
          id: "maintenance-submit",
          label: { en: "Create Batch", es: "Crear Lote" },
          purpose: { en: "Submit and create the batch", es: "Enviar y crear el lote" },
          consequence: {
            en: "A new draft batch is created",
            es: "Se crea un nuevo lote en borrador",
          },
        },
      ],
    },
    {
      id: "maintenance-edit-form",
      title: { en: "Form: Edit batch", es: "Formulario: Editar lote" },
      purpose: {
        en: "Update details of an existing draft batch.",
        es: "Actualizar detalles de un lote borrador existente.",
      },
      mode: "edit",
      selector: '[data-help-id="maintenance-batch-form-edit"]',
      usageFlow: [
        { en: "Step 1: modify desired fields.", es: "Paso 1: modifique los campos deseados." },
        { en: "Step 2: save changes.", es: "Paso 2: guarde los cambios." },
      ],
      fields: [
        {
          id: "maintenance-edit-name",
          label: { en: "Batch name", es: "Nombre del lote" },
          purpose: { en: "Updated batch name", es: "Nombre actualizado del lote" },
          dataType: { en: "Text", es: "Texto" },
          required: true,
          selector: '[data-help-id="maintenance-batch-form-name"]',
        },
      ],
      actions: [
        {
          id: "maintenance-edit-cancel",
          label: { en: "Cancel", es: "Cancelar" },
          purpose: { en: "Discard changes", es: "Descartar cambios" },
          consequence: { en: "No changes saved", es: "No se guardan cambios" },
        },
        {
          id: "maintenance-edit-save",
          label: { en: "Save", es: "Guardar" },
          purpose: { en: "Save the updated batch", es: "Guardar el lote actualizado" },
          consequence: {
            en: "Batch details are updated",
            es: "Los detalles del lote se actualizan",
          },
        },
      ],
    },
    {
      id: "maintenance-add-items-form",
      title: { en: "Form: Add items", es: "Formulario: Agregar artículos" },
      purpose: {
        en: "Add material instances to a draft batch for maintenance tracking.",
        es: "Agregar instancias de material a un lote borrador para seguimiento de mantenimiento.",
      },
      mode: "create",
      selector: '[data-help-id="maintenance-add-items-form"]',
      usageFlow: [
        {
          en: "Step 1: enter the material instance ID.",
          es: "Paso 1: ingrese el ID de la instancia de material.",
        },
        {
          en: "Step 2: select entry reason and source type.",
          es: "Paso 2: seleccione razón de ingreso y tipo de origen.",
        },
        {
          en: "Step 3: optionally enter estimated cost.",
          es: "Paso 3: opcionalmente ingrese costo estimado.",
        },
        { en: "Step 4: add more items or submit.", es: "Paso 4: agregue más artículos o envíe." },
      ],
      fields: [
        {
          id: "maintenance-add-instance-id",
          label: { en: "Material instance", es: "Instancia de material" },
          purpose: {
            en: "Serial number or ID of the item to add",
            es: "Número de serie o ID del artículo a agregar",
          },
          dataType: { en: "Text", es: "Texto" },
          required: true,
          selector: '[data-help-id="maintenance-add-items-instance-id"]',
        },
        {
          id: "maintenance-add-entry-reason",
          label: { en: "Entry reason", es: "Razón de ingreso" },
          purpose: {
            en: "Why the item needs maintenance",
            es: "Por qué el artículo necesita mantenimiento",
          },
          dataType: { en: "Select (damaged/lost/other)", es: "Selección (dañado/perdido/otro)" },
          required: true,
          selector: '[data-help-id="maintenance-add-items-entry-reason"]',
        },
        {
          id: "maintenance-add-source-type",
          label: { en: "Source type", es: "Tipo de origen" },
          purpose: {
            en: "How the maintenance need was identified",
            es: "Cómo se identificó la necesidad de mantenimiento",
          },
          dataType: {
            en: "Select (inspection/incident/manual)",
            es: "Selección (inspección/novedad/manual)",
          },
          required: true,
          selector: '[data-help-id="maintenance-add-items-source-type"]',
        },
        {
          id: "maintenance-add-estimated-cost",
          label: { en: "Estimated cost", es: "Costo estimado" },
          purpose: { en: "Expected repair cost", es: "Costo de reparación esperado" },
          dataType: { en: "Number", es: "Número" },
          selector: '[data-help-id="maintenance-add-items-estimated-cost"]',
        },
      ],
      actions: [
        {
          id: "maintenance-add-cancel",
          label: { en: "Cancel", es: "Cancelar" },
          purpose: { en: "Close without adding items", es: "Cerrar sin agregar artículos" },
          consequence: { en: "No items are added", es: "No se agregan artículos" },
        },
        {
          id: "maintenance-add-submit",
          label: { en: "Add Items", es: "Agregar Artículos" },
          purpose: {
            en: "Add the listed items to the batch",
            es: "Agregar los artículos listados al lote",
          },
          consequence: {
            en: "Items are added to the draft batch",
            es: "Los artículos se agregan al lote borrador",
          },
        },
      ],
    },
    {
      id: "maintenance-resolve-item-form",
      title: { en: "Form: Resolve item", es: "Formulario: Resolver artículo" },
      purpose: {
        en: "Mark a maintenance item as repaired or unrecoverable with optional cost recording.",
        es: "Marcar un artículo de mantenimiento como reparado o irrecuperable con registro opcional de costo.",
      },
      mode: "create",
      selector: '[data-help-id="maintenance-resolve-item-form"]',
      usageFlow: [
        {
          en: "Step 1: select resolution (repaired or unrecoverable).",
          es: "Paso 1: seleccione resolución (reparado o irrecuperable).",
        },
        {
          en: "Step 2: enter actual cost if applicable.",
          es: "Paso 2: ingrese costo real si aplica.",
        },
        { en: "Step 3: add repair notes.", es: "Paso 3: agregue notas de reparación." },
        { en: "Step 4: submit.", es: "Paso 4: envíe." },
      ],
      fields: [
        {
          id: "maintenance-resolve-resolution",
          label: { en: "Resolution", es: "Resolución" },
          purpose: {
            en: "Outcome of the repair attempt",
            es: "Resultado del intento de reparación",
          },
          dataType: {
            en: "Select (repaired/unrecoverable)",
            es: "Selección (reparado/irrecuperable)",
          },
          required: true,
          selector: '[data-help-id="maintenance-resolve-item-resolution"]',
        },
        {
          id: "maintenance-resolve-actual-cost",
          label: { en: "Actual cost", es: "Costo real" },
          purpose: { en: "Real cost of the repair", es: "Costo real de la reparación" },
          dataType: { en: "Number", es: "Número" },
          selector: '[data-help-id="maintenance-resolve-item-actual-cost"]',
        },
        {
          id: "maintenance-resolve-notes",
          label: { en: "Repair notes", es: "Notas de reparación" },
          purpose: {
            en: "Details about the repair work performed",
            es: "Detalles sobre el trabajo de reparación realizado",
          },
          dataType: { en: "Multiline text", es: "Texto multilínea" },
          selector: '[data-help-id="maintenance-resolve-item-repair-notes"]',
        },
      ],
      actions: [
        {
          id: "maintenance-resolve-cancel",
          label: { en: "Cancel", es: "Cancelar" },
          purpose: { en: "Close without resolving", es: "Cerrar sin resolver" },
          consequence: { en: "Item remains in repair", es: "El artículo permanece en reparación" },
        },
        {
          id: "maintenance-resolve-submit",
          label: { en: "Resolve Item", es: "Resolver Artículo" },
          purpose: {
            en: "Apply the resolution to the item",
            es: "Aplicar la resolución al artículo",
          },
          consequence: {
            en: "Item status is updated and costs recorded",
            es: "El estado del artículo se actualiza y los costos se registran",
          },
        },
      ],
    },
  ],
};

export default maintenanceHelpContent;
