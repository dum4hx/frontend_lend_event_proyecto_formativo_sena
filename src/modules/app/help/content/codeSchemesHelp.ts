import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const codeSchemesHelp: HelpModuleContent = {
  moduleId: "code-schemes",
  title: { en: "Code Schemes", es: "Esquemas de código" },
  description: {
    en: "Define naming patterns used to auto-generate human-readable codes for loans and loan requests.",
    es: "Define patrones de nomenclatura para generar automáticamente códigos legibles para préstamos y solicitudes de préstamo.",
  },

  sections: [
    {
      id: "introduction",
      title: { en: "What are Code Schemes?", es: "¿Qué son los esquemas de código?" },
      body: {
        en: "Code schemes define patterns (e.g. LO-{YYYY}-{SEQ:4}) that automatically generate human-readable identifiers whenever a new loan or loan request is created. Each entity type (Loan or Loan Request) can have multiple schemes, but exactly one must be marked as the default.",
        es: "Los esquemas de código definen patrones (ej. LO-{YYYY}-{SEQ:4}) que generan automáticamente identificadores legibles cada vez que se crea un nuevo préstamo o solicitud de préstamo. Cada tipo de entidad (Préstamo o Solicitud) puede tener varios esquemas, pero exactamente uno debe estar marcado como predeterminado.",
      },
      tips: [
        {
          en: "Use the tab bar to switch between Loan and Loan Request schemes.",
          es: "Usa las pestañas para alternar entre esquemas de Préstamo y Solicitud de préstamo.",
        },
      ],
    },
    {
      id: "pattern-tokens",
      title: { en: "Pattern Tokens", es: "Tokens de patrón" },
      body: {
        en: "Patterns are composed of literal text and tokens enclosed in curly braces. Available tokens: {YYYY} (4-digit year), {YY} (2-digit year), {MM} (month), {DD} (day), {SEQ:N} (zero-padded sequence), {LOCATION_CODE} (location code). Every pattern must contain exactly one {SEQ} or {SEQ:N} token.",
        es: "Los patrones se componen de texto literal y tokens entre llaves. Tokens disponibles: {YYYY} (año 4 dígitos), {YY} (año 2 dígitos), {MM} (mes), {DD} (día), {SEQ:N} (secuencia con ceros), {LOCATION_CODE} (código de ubicación). Todo patrón debe contener exactamente un token {SEQ} o {SEQ:N}.",
      },
      tips: [
        {
          en: "Click the token buttons in the Pattern Builder to insert tokens at the cursor position.",
          es: "Haz clic en los botones de token del Constructor de patrón para insertar tokens en la posición del cursor.",
        },
      ],
      warnings: [
        {
          en: "Patterns missing a {SEQ} token will be rejected by the server.",
          es: "Los patrones sin un token {SEQ} serán rechazados por el servidor.",
        },
      ],
    },
    {
      id: "default-and-active",
      title: { en: "Default & Active Status", es: "Estado predeterminado y activo" },
      body: {
        en: "Each entity type must have one default scheme which is used for auto-generation. You can toggle a scheme's active state from the table or the edit form. Inactive schemes cannot be set as default. The default scheme cannot be deleted.",
        es: "Cada tipo de entidad debe tener un esquema predeterminado que se usa para la generación automática. Puedes activar o desactivar un esquema desde la tabla o el formulario de edición. Los esquemas inactivos no pueden ser predeterminados. El esquema predeterminado no se puede eliminar.",
      },
    },
    {
      id: "common-errors",
      title: { en: "Common Errors", es: "Errores comunes" },
      body: {
        en: "The most frequent errors include: duplicate scheme names for the same entity type (409), invalid pattern syntax (400), and attempting to delete the default scheme (400).",
        es: "Los errores más frecuentes incluyen: nombres de esquema duplicados para el mismo tipo de entidad (409), sintaxis de patrón inválida (400), e intentar eliminar el esquema predeterminado (400).",
      },
    },
  ],

  walkthrough: [
    {
      id: "step-header",
      title: { en: "Page Header", es: "Encabezado de página" },
      body: {
        en: "The header shows the page title and contains the Refresh and New Scheme buttons.",
        es: "El encabezado muestra el título de la página y contiene los botones Actualizar y Nuevo esquema.",
      },
      targetSelector: '[data-help-id="code-schemes-header"]',
    },
    {
      id: "step-tabs",
      title: { en: "Entity Type Tabs", es: "Pestañas de tipo de entidad" },
      body: {
        en: "Switch between Loan and Loan Request to view and manage schemes for each entity type.",
        es: "Alterna entre Préstamo y Solicitud de préstamo para ver y gestionar esquemas de cada tipo de entidad.",
      },
      targetSelector: '[data-help-id="code-schemes-tabs"]',
    },
    {
      id: "step-search",
      title: { en: "Search", es: "Búsqueda" },
      body: {
        en: "Filter schemes by name or pattern using the search bar.",
        es: "Filtra esquemas por nombre o patrón usando la barra de búsqueda.",
      },
      targetSelector: '[data-help-id="code-schemes-search"]',
    },
    {
      id: "step-table",
      title: { en: "Schemes Table", es: "Tabla de esquemas" },
      body: {
        en: "Lists all schemes for the selected entity type. Each row shows name, pattern, active toggle, default badge, and action buttons (edit, delete).",
        es: "Lista todos los esquemas del tipo de entidad seleccionado. Cada fila muestra nombre, patrón, interruptor activo, insignia predeterminado y botones de acción (editar, eliminar).",
      },
      targetSelector: '[data-help-id="code-schemes-table"]',
    },
    {
      id: "step-create",
      title: { en: "Create Form", es: "Formulario de creación" },
      body: {
        en: "Opens a modal to configure a new code scheme with entity type, name, pattern (using the visual Pattern Builder), and active/default toggles.",
        es: "Abre un modal para configurar un nuevo esquema de código con tipo de entidad, nombre, patrón (usando el Constructor de patrón visual) y los interruptores activo/predeterminado.",
      },
      targetSelector: '[data-help-id="code-scheme-form-create"]',
    },
    {
      id: "step-edit",
      title: { en: "Edit Form", es: "Formulario de edición" },
      body: {
        en: "Opens a modal pre-filled with the scheme data. The entity type is read-only. Update name, pattern, or active status.",
        es: "Abre un modal precargado con los datos del esquema. El tipo de entidad es de solo lectura. Actualiza nombre, patrón o estado activo.",
      },
      targetSelector: '[data-help-id="code-scheme-form-edit"]',
    },
  ],

  formGuides: createCrudFormGuides({
    baseId: "code-scheme",
    title: {
      create: { en: "Create Code Scheme", es: "Crear esquema de código" },
      edit: { en: "Edit Code Scheme", es: "Editar esquema de código" },
    },
    purpose: {
      create: {
        en: "Define a new code pattern for automatic code generation.",
        es: "Define un nuevo patrón de código para generación automática.",
      },
      edit: {
        en: "Modify an existing code scheme's name, pattern, or active status.",
        es: "Modifica el nombre, patrón o estado activo de un esquema existente.",
      },
    },
    selector: {
      create: '[data-help-id="code-scheme-form-create"]',
      edit: '[data-help-id="code-scheme-form-edit"]',
    },
    fields: [
      {
        id: "entityType",
        label: { en: "Entity Type", es: "Tipo de entidad" },
        purpose: {
          en: "Determines whether this scheme applies to Loans or Loan Requests.",
          es: "Determina si este esquema aplica a Préstamos o Solicitudes de préstamo.",
        },
        dataType: { en: "Selection (Loan / Loan Request)", es: "Selección (Préstamo / Solicitud)" },
        required: true,
        selector: '[data-help-id="code-scheme-form-entityType"]',
        example: { en: "Loan", es: "Préstamo" },
      },
      {
        id: "name",
        label: { en: "Scheme Name", es: "Nombre del esquema" },
        purpose: {
          en: "A descriptive label to identify this scheme.",
          es: "Una etiqueta descriptiva para identificar este esquema.",
        },
        dataType: { en: "Text (1-100 characters)", es: "Texto (1-100 caracteres)" },
        required: true,
        selector: '[data-help-id="code-scheme-form-name"]',
        example: { en: "Standard Loan Code", es: "Código estándar de préstamo" },
      },
      {
        id: "pattern",
        label: { en: "Pattern", es: "Patrón" },
        purpose: {
          en: "The template string with tokens used to generate codes. Must contain a {SEQ} token.",
          es: "La cadena con tokens usada para generar códigos. Debe contener un token {SEQ}.",
        },
        dataType: {
          en: "Pattern string (1-50 characters)",
          es: "Cadena de patrón (1-50 caracteres)",
        },
        required: true,
        selector: '[data-help-id="code-scheme-pattern-input"]',
        example: { en: "LO-{YYYY}-{SEQ:4}", es: "LO-{YYYY}-{SEQ:4}" },
      },
      {
        id: "isActive",
        label: { en: "Active", es: "Activo" },
        purpose: {
          en: "Whether the scheme is active. Inactive schemes cannot be set as default.",
          es: "Si el esquema está activo. Los esquemas inactivos no pueden ser predeterminados.",
        },
        dataType: { en: "Toggle (boolean)", es: "Interruptor (booleano)" },
        required: false,
        selector: '[data-help-id="code-scheme-form-isActive"]',
      },
      {
        id: "isDefault",
        label: { en: "Default", es: "Predeterminado" },
        purpose: {
          en: "Mark this scheme as the default for its entity type. Only available on creation.",
          es: "Marca este esquema como predeterminado para su tipo de entidad. Solo disponible al crear.",
        },
        dataType: { en: "Toggle (boolean)", es: "Interruptor (booleano)" },
        required: false,
        selector: '[data-help-id="code-scheme-form-isDefault"]',
      },
    ],
    actions: {
      create: [
        {
          id: "submit-create",
          label: { en: "Create", es: "Crear" },
          purpose: { en: "Save the new code scheme.", es: "Guardar el nuevo esquema de código." },
          consequence: {
            en: "Creates the scheme and closes the modal.",
            es: "Crea el esquema y cierra el modal.",
          },
          selector: '[data-help-id="code-scheme-form-submit"]',
        },
        {
          id: "cancel-create",
          label: { en: "Cancel", es: "Cancelar" },
          purpose: { en: "Discard and close modal.", es: "Descartar y cerrar el modal." },
          consequence: {
            en: "No scheme is created.",
            es: "No se crea ningún esquema.",
          },
        },
      ],
      edit: [
        {
          id: "submit-edit",
          label: { en: "Save", es: "Guardar" },
          purpose: { en: "Persist changes to the scheme.", es: "Guardar los cambios del esquema." },
          consequence: {
            en: "Updates the scheme and closes the modal.",
            es: "Actualiza el esquema y cierra el modal.",
          },
          selector: '[data-help-id="code-scheme-form-submit"]',
        },
        {
          id: "cancel-edit",
          label: { en: "Cancel", es: "Cancelar" },
          purpose: { en: "Discard and close modal.", es: "Descartar y cerrar el modal." },
          consequence: {
            en: "Changes are not saved.",
            es: "Los cambios no se guardan.",
          },
        },
      ],
    },
  }),
};

export default codeSchemesHelp;
