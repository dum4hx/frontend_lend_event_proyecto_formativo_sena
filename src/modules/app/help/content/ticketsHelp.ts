import type { HelpModuleContent } from "../types";

const ticketsHelpContent: HelpModuleContent = {
  moduleId: "tickets",
  title: {
    en: "Help center: Tickets",
    es: "Centro de ayuda: Solicitudes",
  },
  description: {
    en: "This module lets you create and manage user tickets — transfer requests, incident reports, maintenance requests, inspection requests, and general tickets.",
    es: "Este módulo permite crear y gestionar solicitudes de usuario — solicitudes de transferencia, reportes de incidentes, solicitudes de mantenimiento, solicitudes de inspección y solicitudes generales.",
  },
  sections: [
    {
      id: "introduction",
      title: { en: "Introduction", es: "Introducción" },
      body: {
        en: "Tickets are formal requests that flow through a review and approval workflow. Any team member can create a ticket, and authorized reviewers can review, approve, or reject them. Each ticket has a type that determines the payload data required.",
        es: "Las solicitudes son peticiones formales que pasan por un flujo de revisión y aprobación. Cualquier miembro del equipo puede crear una solicitud, y los revisores autorizados pueden revisarlas, aprobarlas o rechazarlas. Cada solicitud tiene un tipo que determina los datos de carga requeridos.",
      },
      howTo: [
        {
          en: "Open the module from the sidebar under Tickets.",
          es: "Abre el módulo desde el menú lateral en Solicitudes.",
        },
        {
          en: "Filter tickets by status or type using the dropdown filters.",
          es: "Filtra solicitudes por estado o tipo usando los filtros desplegables.",
        },
        {
          en: "Click a ticket row to open its detail view.",
          es: "Haz clic en una fila de solicitud para abrir su vista de detalle.",
        },
      ],
      tips: [
        {
          en: "Use the search bar to find tickets by title or ID.",
          es: "Usa la barra de búsqueda para encontrar solicitudes por título o ID.",
        },
        {
          en: "The header stats show how many tickets are pending review.",
          es: "Las estadísticas del encabezado muestran cuántas solicitudes están pendientes de revisión.",
        },
      ],
    },
    {
      id: "lifecycle",
      title: { en: "Ticket lifecycle", es: "Ciclo de vida de la solicitud" },
      body: {
        en: "A ticket starts as 'pending' after creation. A reviewer moves it to 'in_review'. From there it can be approved or rejected. The creator can cancel a ticket while it is pending or in review. Approved tickets may be marked as completed by the system.",
        es: "Una solicitud comienza como 'pendiente' después de su creación. Un revisor la mueve a 'en revisión'. Desde ahí puede ser aprobada o rechazada. El creador puede cancelar una solicitud mientras está pendiente o en revisión. Las solicitudes aprobadas pueden ser marcadas como completadas por el sistema.",
      },
      howTo: [
        {
          en: "Create a ticket with the 'Create Ticket' button.",
          es: "Crea una solicitud con el botón 'Crear Solicitud'.",
        },
        {
          en: "A reviewer opens the detail and clicks 'Review' to start reviewing.",
          es: "Un revisor abre el detalle y hace clic en 'Revisar' para iniciar la revisión.",
        },
        {
          en: "After review, approve or reject with the corresponding buttons.",
          es: "Después de revisar, aprueba o rechaza con los botones correspondientes.",
        },
      ],
      bestPractices: [
        {
          en: "Provide a clear title and description so reviewers understand the request quickly.",
          es: "Proporciona un título y descripción claros para que los revisores entiendan la solicitud rápidamente.",
        },
        {
          en: "When rejecting, always include a detailed resolution note explaining the reason.",
          es: "Al rechazar, siempre incluye una nota de resolución detallada explicando el motivo.",
        },
      ],
    },
    {
      id: "ticket-types",
      title: { en: "Ticket types", es: "Tipos de solicitud" },
      body: {
        en: "There are five ticket types: Transfer Request (move materials between locations), Incident Report (report damage or loss), Maintenance Request (request repairs), Inspection Request (request an inspection for a loan), and Generic (any other request).",
        es: "Hay cinco tipos de solicitud: Solicitud de Transferencia (mover materiales entre ubicaciones), Reporte de Incidente (reportar daños o pérdidas), Solicitud de Mantenimiento (solicitar reparaciones), Solicitud de Inspección (solicitar inspección para un préstamo) y Genérica (cualquier otra solicitud).",
      },
      tips: [
        {
          en: "Choose the correct ticket type — each type requires different payload fields.",
          es: "Elige el tipo de solicitud correcto — cada tipo requiere campos de carga diferentes.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { en: "Common errors", es: "Errores comunes" },
      body: {
        en: "Common mistakes include forgetting to select a ticket type, leaving required fields empty, or trying to approve a ticket that hasn't been moved to 'in review' first.",
        es: "Los errores comunes incluyen olvidar seleccionar un tipo de solicitud, dejar campos requeridos vacíos o intentar aprobar una solicitud que no ha sido movida a 'en revisión' primero.",
      },
      warnings: [
        {
          en: "Rejecting a ticket is irreversible — the ticket cannot be reopened after rejection.",
          es: "Rechazar una solicitud es irreversible — la solicitud no puede reabrirse después del rechazo.",
        },
        {
          en: "Cancellation is only possible while the ticket is pending or in review.",
          es: "La cancelación solo es posible mientras la solicitud está pendiente o en revisión.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { en: "1) Tickets panel", es: "1) Panel de solicitudes" },
      body: {
        en: "The header displays the page title, a create button, and summary stats showing the pending and total ticket counts.",
        es: "El encabezado muestra el título de la página, un botón de creación y estadísticas resumen con el conteo de solicitudes pendientes y totales.",
      },
      targetSelector: '[data-help-id="tickets-header"]',
    },
    {
      id: "step-2-create",
      title: { en: "2) Create a ticket", es: "2) Crear una solicitud" },
      body: {
        en: "Click 'Create Ticket' to open the form. Select a type, fill in the required fields, and submit.",
        es: "Haz clic en 'Crear Solicitud' para abrir el formulario. Selecciona un tipo, completa los campos requeridos y envía.",
      },
      targetSelector: '[data-help-id="tickets-create-btn"]',
    },
    {
      id: "step-3-filters",
      title: { en: "3) Filters", es: "3) Filtros" },
      body: {
        en: "Use the status and type dropdowns to narrow down the ticket list. The search bar filters by title.",
        es: "Usa los desplegables de estado y tipo para filtrar la lista de solicitudes. La barra de búsqueda filtra por título.",
      },
      targetSelector: '[data-help-id="tickets-filters"]',
    },
    {
      id: "step-4-table",
      title: { en: "4) Ticket list", es: "4) Lista de solicitudes" },
      body: {
        en: "The table shows all tickets with their title, type, status, creator, and creation date. Click a row for full details.",
        es: "La tabla muestra todas las solicitudes con su título, tipo, estado, creador y fecha de creación. Haz clic en una fila para ver los detalles completos.",
      },
      targetSelector: '[data-help-id="tickets-table"]',
    },
    {
      id: "step-5-create-form",
      title: { en: "5) Create form", es: "5) Formulario de creación" },
      body: {
        en: "The create form adapts its fields based on the selected ticket type. Fill all required fields — the submit button remains disabled until validation passes.",
        es: "El formulario de creación adapta sus campos según el tipo de solicitud seleccionado. Completa todos los campos requeridos — el botón de envío permanece deshabilitado hasta que la validación pase.",
      },
      targetSelector: '[data-help-id="tickets-create-form"]',
    },
  ],
  formGuides: [
    {
      id: "tickets-create",
      title: { en: "Create ticket form", es: "Formulario de creación de solicitud" },
      purpose: {
        en: "Fill in the ticket details. The form fields change based on the selected ticket type.",
        es: "Completa los detalles de la solicitud. Los campos del formulario cambian según el tipo de solicitud seleccionado.",
      },
      mode: "create",
      selector: '[data-help-id="tickets-create-form"]',
      fields: [
        {
          id: "type",
          label: { en: "Ticket type", es: "Tipo de solicitud" },
          purpose: {
            en: "Select the type of request.",
            es: "Selecciona el tipo de solicitud.",
          },
          selector: '[data-help-id="tickets-type-select"]',
          required: true,
          dataType: { en: "Dropdown select", es: "Selección desplegable" },
          example: { en: "transfer_request", es: "transfer_request" },
        },
        {
          id: "title",
          label: { en: "Title", es: "Título" },
          purpose: {
            en: "A clear summary of the request (5–200 characters).",
            es: "Un resumen claro de la solicitud (5–200 caracteres).",
          },
          selector: '[data-help-id="tickets-title-input"]',
          required: true,
          dataType: { en: "Text", es: "Texto" },
          example: { en: "Transfer chairs to warehouse B", es: "Transferir sillas al almacén B" },
        },
        {
          id: "description",
          label: { en: "Description", es: "Descripción" },
          purpose: {
            en: "Optional detailed explanation (up to 2000 characters).",
            es: "Explicación detallada opcional (hasta 2000 caracteres).",
          },
          selector: '[data-help-id="tickets-description-input"]',
          required: false,
          dataType: { en: "Text", es: "Texto" },
          example: {
            en: "We need to move 20 folding chairs for the event on Friday.",
            es: "Necesitamos mover 20 sillas plegables para el evento del viernes.",
          },
        },
        {
          id: "location",
          label: { en: "Location", es: "Ubicación" },
          purpose: {
            en: "The origin location ID for this ticket.",
            es: "El ID de la ubicación de origen para esta solicitud.",
          },
          selector: '[data-help-id="tickets-location-input"]',
          required: true,
          dataType: { en: "ID (text)", es: "ID (texto)" },
          example: { en: "loc_abc123", es: "loc_abc123" },
        },
      ],
      actions: [
        {
          id: "submit",
          label: { en: "Save", es: "Guardar" },
          purpose: {
            en: "Submit the new ticket.",
            es: "Enviar la nueva solicitud.",
          },
          consequence: {
            en: "Creates the ticket as pending and notifies reviewers.",
            es: "Crea la solicitud como pendiente y notifica a los revisores.",
          },
        },
        {
          id: "cancel",
          label: { en: "Cancel", es: "Cancelar" },
          purpose: {
            en: "Close the form without saving.",
            es: "Cerrar el formulario sin guardar.",
          },
          consequence: {
            en: "No ticket is created.",
            es: "No se crea ninguna solicitud.",
          },
        },
      ],
    },
    {
      id: "tickets-approve",
      title: { en: "Approve ticket", es: "Aprobar solicitud" },
      purpose: {
        en: "Confirm ticket approval with an optional resolution note.",
        es: "Confirmar la aprobación de la solicitud con una nota de resolución opcional.",
      },
      mode: "edit",
      fields: [
        {
          id: "resolutionNote",
          label: { en: "Resolution note", es: "Nota de resolución" },
          purpose: {
            en: "Optional note explaining the approval decision.",
            es: "Nota opcional explicando la decisión de aprobación.",
          },
          selector: '[data-help-id="tickets-approve-note"]',
          required: false,
          dataType: { en: "Text", es: "Texto" },
          example: {
            en: "Approved — equipment available at target location.",
            es: "Aprobado — equipo disponible en la ubicación destino.",
          },
        },
      ],
      actions: [
        {
          id: "approve",
          label: { en: "Approve", es: "Aprobar" },
          purpose: {
            en: "Confirm the approval.",
            es: "Confirmar la aprobación.",
          },
          consequence: {
            en: "Ticket status changes to approved.",
            es: "El estado de la solicitud cambia a aprobado.",
          },
        },
      ],
    },
    {
      id: "tickets-reject",
      title: { en: "Reject ticket", es: "Rechazar solicitud" },
      purpose: {
        en: "Reject the ticket with a required reason.",
        es: "Rechazar la solicitud con un motivo requerido.",
      },
      mode: "edit",
      fields: [
        {
          id: "resolutionNote",
          label: { en: "Resolution note", es: "Nota de resolución" },
          purpose: {
            en: "Required explanation for rejection (10–2000 characters).",
            es: "Explicación requerida para el rechazo (10–2000 caracteres).",
          },
          selector: '[data-help-id="tickets-reject-note"]',
          required: true,
          dataType: { en: "Text", es: "Texto" },
          example: {
            en: "Rejected — insufficient inventory at source location.",
            es: "Rechazado — inventario insuficiente en la ubicación de origen.",
          },
        },
      ],
      actions: [
        {
          id: "reject",
          label: { en: "Reject", es: "Rechazar" },
          purpose: {
            en: "Confirm the rejection.",
            es: "Confirmar el rechazo.",
          },
          consequence: {
            en: "Ticket status changes to rejected. This action is irreversible.",
            es: "El estado de la solicitud cambia a rechazado. Esta acción es irreversible.",
          },
        },
      ],
    },
  ],
};

export default ticketsHelpContent;
