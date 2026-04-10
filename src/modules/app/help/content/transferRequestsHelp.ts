import type { HelpModuleContent } from "../types";

const transferRequestFormGuides = [
  {
    id: "transfer-request-create-form",
    title: { es: "Formulario: Nueva solicitud", en: "Form: New request" },
    purpose: {
      es: "Crear solicitud entre ubicaciones con materiales y cantidades.",
      en: "Create a request between locations with material items and quantities.",
    },
    mode: "create" as const,
    selector: '[data-help-id="transfer-requests-form-create-request"]',
    fields: [
      {
        id: "field-from-location",
        label: { es: "Origen", en: "From location" },
        purpose: {
          es: "Indica la ubicacion que despacha material.",
          en: "Indicates the location dispatching materials.",
        },
        dataType: { es: "Seleccion", en: "Select" },
        required: true,
        selector: '[data-help-id="transfer-requests-form-from-location"]',
      },
      {
        id: "field-to-location",
        label: { es: "Destino", en: "To location" },
        purpose: {
          es: "Indica la ubicacion receptora de la solicitud.",
          en: "Indicates the destination location for the request.",
        },
        dataType: { es: "Seleccion", en: "Select" },
        required: true,
        selector: '[data-help-id="transfer-requests-form-to-location"]',
      },
      {
        id: "field-items",
        label: { es: "Articulos", en: "Items" },
        purpose: {
          es: "Define materiales y cantidades requeridas.",
          en: "Defines required materials and quantities.",
        },
        dataType: { es: "Lista dinamica", en: "Dynamic list" },
        required: true,
        selector: '[data-help-id="transfer-requests-form-items"]',
      },
      {
        id: "field-notes",
        label: { es: "Notas", en: "Notes" },
        purpose: {
          es: "Aporta contexto operativo para aprobacion y despacho.",
          en: "Adds operational context for approval and dispatch.",
        },
        dataType: { es: "Texto", en: "Text" },
        selector: '[data-help-id="transfer-requests-form-notes"]',
      },
    ],
    actions: [
      {
        id: "action-create-request",
        label: { es: "Crear solicitud", en: "Create request" },
        purpose: {
          es: "Guarda solicitud para su revision y aprobacion.",
          en: "Saves request for review and approval.",
        },
        consequence: {
          es: "La solicitud entra al flujo de estado pendiente.",
          en: "The request enters pending workflow state.",
        },
        selector: '[data-help-id="transfer-requests-form-submit"]',
      },
    ],
  },
  {
    id: "transfer-request-initiate-shipment-form",
    title: { es: "Formulario: Iniciar envio", en: "Form: Initiate shipment" },
    purpose: {
      es: "Seleccionar instancias reales y confirmar salida de inventario.",
      en: "Select real instances and confirm inventory outbound movement.",
    },
    mode: "edit" as const,
    selector: '[data-help-id="transfer-requests-form-initiate-shipment"]',
    fields: [
      {
        id: "field-shipment-items",
        label: { es: "Instancias a enviar", en: "Instances to ship" },
        purpose: {
          es: "Selecciona unidades fisicas exactas para el traslado.",
          en: "Selects exact physical units for shipment.",
        },
        dataType: { es: "Seleccion multiple", en: "Multi-select" },
        required: true,
        selector: '[data-help-id="transfer-requests-form-shipment-items"]',
      },
      {
        id: "field-sender-notes",
        label: { es: "Notas del remitente", en: "Sender notes" },
        purpose: {
          es: "Documenta estado o instrucciones de despacho.",
          en: "Documents condition or dispatch instructions.",
        },
        dataType: { es: "Texto", en: "Text" },
        selector: '[data-help-id="transfer-requests-form-sender-notes"]',
      },
    ],
    actions: [
      {
        id: "action-preview-shipment",
        label: { es: "Vista previa", en: "Preview" },
        purpose: {
          es: "Verificar resumen antes de confirmar envio.",
          en: "Validate summary before confirming shipment.",
        },
        consequence: {
          es: "Permite detectar inconsistencias antes del movimiento.",
          en: "Lets you catch inconsistencies before movement.",
        },
        selector: '[data-help-id="transfer-requests-form-shipment-preview"]',
      },
      {
        id: "action-submit-shipment",
        label: { es: "Confirmar y enviar", en: "Confirm and send" },
        purpose: {
          es: "Genera transferencia en estado en transito.",
          en: "Creates transfer in in-transit status.",
        },
        consequence: {
          es: "Inventario queda pendiente de recepcion en destino.",
          en: "Inventory remains pending receipt at destination.",
        },
        selector: '[data-help-id="transfer-requests-form-shipment-submit"]',
      },
    ],
  },
  {
    id: "transfer-request-receive-form",
    title: { es: "Formulario: Confirmar recepcion", en: "Form: Confirm receipt" },
    purpose: {
      es: "Registrar condiciones recibidas y cerrar la transferencia.",
      en: "Record received conditions and close the transfer.",
    },
    mode: "edit" as const,
    selector: '[data-help-id="transfer-requests-form-receive-shipment"]',
    fields: [
      {
        id: "field-receive-items",
        label: { es: "Condicion por articulo", en: "Condition per item" },
        purpose: {
          es: "Registra estado real al momento de recepcion.",
          en: "Records real condition at receipt time.",
        },
        dataType: { es: "Seleccion", en: "Select" },
        selector: '[data-help-id="transfer-requests-form-receive-items"]',
      },
      {
        id: "field-receiver-notes",
        label: { es: "Notas del receptor", en: "Receiver notes" },
        purpose: {
          es: "Documenta observaciones relevantes de recepcion.",
          en: "Documents relevant receipt observations.",
        },
        dataType: { es: "Texto", en: "Text" },
        selector: '[data-help-id="transfer-requests-form-receiver-notes"]',
      },
    ],
    actions: [
      {
        id: "action-receive-submit",
        label: { es: "Marcar como recibido", en: "Mark as received" },
        purpose: {
          es: "Cierra el flujo logistico y actualiza inventario destino.",
          en: "Closes logistics workflow and updates destination inventory.",
        },
        consequence: {
          es: "La transferencia pasa a estado recibido.",
          en: "Transfer moves to received status.",
        },
        selector: '[data-help-id="transfer-requests-form-receive-submit"]',
      },
    ],
  },
];

const transferRequestsHelpContent: HelpModuleContent = {
  moduleId: "transfer-requests",
  title: {
    es: "Centro de ayuda: Transferencias",
    en: "Help center: Transfers",
  },
  description: {
    es: "Este modulo permite solicitar, aprobar y ejecutar transferencias de materiales entre ubicaciones.",
    en: "This module lets you request, approve, and execute material transfers between locations.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui gestionas dos flujos conectados: solicitudes de transferencia y envios fisicos entre sedes o ubicaciones.",
        en: "Here you manage two connected flows: transfer requests and physical shipments between sites or locations.",
      },
      howTo: [
        {
          es: "Abre el modulo desde Operaciones > Transferencias.",
          en: "Open the module from Operations > Transfers.",
        },
        {
          es: "Usa la pestana 'Solicitudes' para crear o gestionar pedidos de traslado.",
          en: "Use the 'Requests' tab to create or manage transfer requests.",
        },
        {
          es: "Cambia a la pestana 'Envios' para ver transferencias en transito y registrar recepciones.",
          en: "Switch to the 'Shipments' tab to view in-transit transfers and register receipts.",
        },
      ],
      tips: [
        {
          es: "Usa solicitudes para formalizar necesidad y envios para ejecutar el movimiento aprobado.",
          en: "Use requests to formalize the need and shipments to execute the approved movement.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes crear solicitudes, filtrarlas por estado, aprobar o rechazar, iniciar envios y recibir transferencias en transito.",
        en: "You can create requests, filter them by status, approve or reject them, initiate shipments, and receive in-transit transfers.",
      },
      howTo: [
        {
          es: "Para crear solicitud: haz clic en 'Nueva solicitud', selecciona origen, destino, items y agrega notas.",
          en: "To create a request: click 'New request', select origin, destination, items, and add notes.",
        },
        {
          es: "Para aprobar/rechazar: localiza la solicitud en la tabla y usa las acciones disponibles segun permisos.",
          en: "To approve/reject: locate the request in the table and use available actions per your permissions.",
        },
        {
          es: "Para iniciar envio: una vez aprobada la solicitud, selecciona instancias fisicas y confirma despacho.",
          en: "To initiate shipment: once the request is approved, select physical instances and confirm dispatch.",
        },
        {
          es: "Para recibir: en la pestana Envios, localiza la transferencia en transito y registra la recepcion.",
          en: "To receive: on the Shipments tab, locate the in-transit transfer and register receipt.",
        },
      ],
      bestPractices: [
        {
          es: "Mantén notas claras en solicitudes y envios para trazabilidad operativa.",
          en: "Keep notes clear in requests and shipments for operational traceability.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: crea solicitud, revisa estado, aprueba, inicia envio y finalmente registra recepcion.",
        en: "Recommended flow: create request, review status, approve, initiate shipment, and finally register receipt.",
      },
      howTo: [
        {
          es: "Crea la solicitud con origen, destino e items requeridos.",
          en: "Create the request with origin, destination, and required items.",
        },
        {
          es: "Cambia el filtro a 'Pendiente' para encontrar la solicitud y aprobarla.",
          en: "Change the filter to 'Pending' to find the request and approve it.",
        },
        {
          es: "Despues de aprobar, inicia el envio seleccionando las instancias fisicas.",
          en: "After approving, initiate the shipment by selecting physical instances.",
        },
        {
          es: "Cambia a la pestana Envios y registra la recepcion cuando el material llega al destino.",
          en: "Switch to the Shipments tab and register receipt when the material arrives at destination.",
        },
      ],
      warnings: [
        {
          es: "Omitir aprobacion o recepcion puede dejar inventario desalineado entre ubicaciones.",
          en: "Skipping approval or receipt can leave inventory misaligned between locations.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: revisar solo solicitudes y no la pestana de envios. Ambos flujos deben controlarse juntos.",
        en: "Common mistake: reviewing only requests and not the shipments tab. Both flows should be monitored together.",
      },
      howTo: [
        {
          es: "Revisa siempre ambas pestanas: Solicitudes y Envios para tener vision completa del proceso.",
          en: "Always check both tabs: Requests and Shipments for a complete view of the process.",
        },
        {
          es: "Verifica el estado de la solicitud antes de intentar aprobar o iniciar envio.",
          en: "Verify the request status before trying to approve or initiate a shipment.",
        },
        {
          es: "Si el inventario destino no se actualiza, confirma que la recepcion fue registrada en la pestana Envios.",
          en: "If destination inventory does not update, confirm receipt was registered in the Shipments tab.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el contexto", en: "1) Understand context" },
      body: {
        es: "Este encabezado presenta el objetivo del modulo y su accion principal para crear solicitudes.",
        en: "This header presents the module goal and its primary action to create requests.",
      },
      targetSelector: '[data-help-id="transfer-requests-title"]',
    },
    {
      id: "step-2-tabs",
      title: { es: "2) Cambia de flujo", en: "2) Switch flow" },
      body: {
        es: "Estas pestanas separan solicitudes y envios, pero forman parte del mismo proceso logistico.",
        en: "These tabs separate requests and shipments, but they are part of the same logistics process.",
      },
      targetSelector: '[data-help-id="transfer-requests-tabs"]',
    },
    {
      id: "step-3-request-filters",
      title: { es: "3) Filtra solicitudes", en: "3) Filter requests" },
      body: {
        es: "Usa estos filtros para enfocar revision de solicitudes por estado y cumplimiento.",
        en: "Use these filters to focus request review by status and fulfillment state.",
      },
      targetSelector: '[data-help-id="transfer-requests-request-filters"]',
    },
    {
      id: "step-4-request-table",
      title: { es: "4) Gestiona solicitudes", en: "4) Manage requests" },
      body: {
        es: "Desde esta tabla puedes aprobar, rechazar o iniciar envio segun estado y permisos.",
        en: "From this table you can approve, reject, or initiate shipment depending on status and permissions.",
      },
      targetSelector: '[data-help-id="transfer-requests-request-table"]',
      warning: {
        es: "Toda aprobacion debe revisarse antes de mover inventario fisico.",
        en: "Every approval should be reviewed before moving physical inventory.",
      },
    },
    {
      id: "step-5-shipment-filters",
      title: { es: "5) Filtra envios", en: "5) Filter shipments" },
      body: {
        es: "En la pestana de envios, este bloque permite seguir transferencias por estado.",
        en: "On the shipments tab, this block lets you track transfers by status.",
      },
      targetSelector: '[data-help-id="transfer-requests-shipment-filters"]',
    },
    {
      id: "step-6-shipment-table",
      title: { es: "6) Recibe transferencias", en: "6) Receive transfers" },
      body: {
        es: "Esta tabla muestra envios en curso y permite registrar recepcion cuando corresponde.",
        en: "This table shows ongoing shipments and lets you register receipt when appropriate.",
      },
      targetSelector: '[data-help-id="transfer-requests-shipment-table"]',
    },
  ],
  formGuides: transferRequestFormGuides,
};

export default transferRequestsHelpContent;
