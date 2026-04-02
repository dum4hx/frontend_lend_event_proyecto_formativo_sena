import type { HelpModuleContent } from "../types";

const ordersHelpContent: HelpModuleContent = {
  moduleId: "orders",
  title: {
    es: "Centro de ayuda: Pedidos",
    en: "Help center: Orders",
  },
  description: {
    es: "Este modulo concentra la creacion, aprobacion, preparacion, seguimiento y cierre del ciclo de vida de pedidos y prestamos.",
    en: "This module centralizes creation, approval, preparation, tracking, and closure of the order and loan lifecycle.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Desde aqui el equipo puede registrar solicitudes, revisar su estado operativo y ejecutar acciones segun permisos y etapa del flujo.",
        en: "From here the team can register requests, review their operational status, and execute actions based on permissions and workflow stage.",
      },
      howTo: [
        { es: "Abre el modulo desde el menu lateral en Operaciones > Pedidos.", en: "Open the module from the sidebar in Operations > Orders." },
        { es: "Usa el filtro de estado para ver pedidos segun la etapa del flujo que necesitas gestionar.", en: "Use the status filter to view orders by the workflow stage you need to manage." },
        { es: "Haz clic en 'Nuevo Pedido' para registrar una nueva solicitud con cliente, fechas e items.", en: "Click 'New Order' to register a new request with customer, dates, and items." },
      ],
      tips: [
        {
          es: "Antes de crear un pedido, confirma disponibilidad de inventario, cliente y fechas para evitar rechazos posteriores.",
          en: "Before creating an order, confirm inventory availability, customer, and dates to avoid later rejections.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes crear pedidos, aprobar o rechazar solicitudes, reactivar rechazados, preparar materiales, iniciar prestamos, cerrar devoluciones y registrar pagos de deposito.",
        en: "You can create orders, approve or reject requests, reactivate rejected ones, prepare materials, start loans, close returns, and record deposit payments.",
      },
      howTo: [
        { es: "Para aprobar/rechazar: abre el detalle del pedido, valida informacion y ejecuta la accion correspondiente.", en: "To approve/reject: open the order detail, validate information, and execute the corresponding action." },
        { es: "Para preparar materiales: mueve el pedido a estado 'En preparacion' seleccionando la accion Preparar.", en: "To prepare materials: move the order to 'In preparation' status by selecting the Prepare action." },
        { es: "Para iniciar prestamo: confirma que la preparacion esta completa y ejecuta la accion de inicio de prestamo.", en: "To start the loan: confirm preparation is complete and execute the start loan action." },
        { es: "Para registrar deposito: usa la accion de pago disponible segun el estado actual del pedido.", en: "To register deposit: use the payment action available based on the current order status." },
      ],
      bestPractices: [
        {
          es: "Usa el detalle del pedido antes de aprobar para verificar cantidades, paquetes y dependencias operativas.",
          en: "Use the order detail before approving to verify quantities, packages, and operational dependencies.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Filtra por estado, revisa el pedido correcto, valida detalle, aprueba o rechaza, y cuando aplique prepara materiales e inicia el prestamo.",
        en: "Filter by status, review the correct order, validate details, approve or reject it, and when applicable prepare materials and start the loan.",
      },
      howTo: [
        { es: "Filtra la lista por estado 'Pendiente' para ver pedidos que requieren aprobacion.", en: "Filter the list by 'Pending' status to see orders that require approval." },
        { es: "Abre el detalle del pedido correcto y verifica cliente, items y fechas.", en: "Open the correct order detail and verify customer, items, and dates." },
        { es: "Aprueba o rechaza segun la informacion validada.", en: "Approve or reject based on the validated information." },
        { es: "Sigue el flujo: prepara materiales > inicia prestamo > registra devolucion > confirma deposito.", en: "Follow the flow: prepare materials > start loan > register return > confirm deposit." },
      ],
      warnings: [
        {
          es: "Registrar acciones sobre el pedido equivocado puede afectar inventario, cobros y trazabilidad de prestamos.",
          en: "Recording actions on the wrong order can affect inventory, billing, and loan traceability.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error comun es trabajar solo con el texto buscado sin revisar el estado real del pedido. Confirma siempre la etapa del flujo antes de aprobar, reactivar o marcar pagos.",
        en: "A common mistake is working only from search text without reviewing the real order status. Always confirm the workflow stage before approving, reactivating, or marking payments.",
      },
      howTo: [
        { es: "Antes de ejecutar cualquier accion, abre el detalle del pedido para confirmar su estado actual.", en: "Before executing any action, open the order detail to confirm its current status." },
        { es: "Usa el filtro de estado para navegar al grupo correcto en lugar de buscar solo por texto.", en: "Use the status filter to navigate to the correct group instead of searching by text alone." },
        { es: "Para reactivar un pedido rechazado, verifica que el motivo de rechazo fue resuelto antes de continuar.", en: "To reactivate a rejected order, verify the rejection reason was resolved before continuing." },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el modulo", en: "1) Understand the module" },
      body: {
        es: "Este encabezado resume el alcance del modulo y da acceso inmediato a la creacion de nuevos pedidos.",
        en: "This header summarizes the module scope and gives immediate access to creating new orders.",
      },
      targetSelector: '[data-help-id="orders-header"]',
    },
    {
      id: "step-2-create",
      title: { es: "2) Crea pedidos", en: "2) Create orders" },
      body: {
        es: "Usa esta accion para abrir el formulario de alta y registrar una nueva solicitud segun permisos disponibles.",
        en: "Use this action to open the creation form and register a new request based on available permissions.",
      },
      targetSelector: '[data-help-id="orders-create-action"]',
    },
    {
      id: "step-3-filters",
      title: { es: "3) Filtra el flujo", en: "3) Filter the workflow" },
      body: {
        es: "Aqui puedes buscar por identificador o cliente y reducir la lista por estado operativo para enfocarte en la cola correcta.",
        en: "Here you can search by identifier or customer and reduce the list by operational status to focus on the right queue.",
      },
      targetSelector: '[data-help-id="orders-filters"]',
      tip: {
        es: "Cambiar el estado reinicia la pagina actual para evitar quedar en un bloque sin resultados validos.",
        en: "Changing status resets the current page to avoid staying on a block with no valid results.",
      },
    },
    {
      id: "step-4-table",
      title: { es: "4) Ejecuta acciones", en: "4) Execute actions" },
      body: {
        es: "La tabla concentra el seguimiento del pedido y las acciones disponibles en cada etapa, como aprobar, rechazar, preparar o cerrar prestamos.",
        en: "The table concentrates order tracking and the actions available at each stage, such as approve, reject, prepare, or close loans.",
      },
      targetSelector: '[data-help-id="orders-table"]',
      warning: {
        es: "Antes de cambiar el estado de un pedido, valida el cliente, los items y la etapa actual del flujo.",
        en: "Before changing an order status, validate the customer, items, and current workflow stage.",
      },
    },
  ],
  formGuides: [
    {
      id: "orders-create-form",
      title: {
        es: "Formulario: Crear pedido",
        en: "Form: Create order",
      },
      purpose: {
        es: "Registrar una nueva solicitud con cliente, fechas y productos/servicios asociados.",
        en: "Register a new request with customer, dates, and related products/services.",
      },
      mode: "create",
      selector: '[data-help-id="orders-form-create"]',
      usageFlow: [
        {
          es: "Paso 1: selecciona cliente y define fechas del pedido.",
          en: "Step 1: select customer and define order dates.",
        },
        {
          es: "Paso 2: configura deposito y agrega materiales o plan.",
          en: "Step 2: set deposit and add materials or plan.",
        },
        {
          es: "Paso 3: revisa validaciones y confirma crear pedido.",
          en: "Step 3: review validations and confirm order creation.",
        },
      ],
      fields: [
        {
          id: "orders-field-customer",
          label: { es: "Cliente", en: "Customer" },
          purpose: {
            es: "Define el cliente asociado a la solicitud.",
            en: "Defines the customer linked to the request.",
          },
          dataType: { es: "Seleccion (select)", en: "Selection (select)" },
          required: true,
          validations: [
            { es: "Obligatorio", en: "Required" },
          ],
          example: { es: "Ana Gomez - ana@empresa.com", en: "Ana Gomez - ana@company.com" },
          selector: '[data-help-id="orders-form-customer"]',
        },
        {
          id: "orders-field-start",
          label: { es: "Fecha inicio", en: "Start date" },
          purpose: {
            es: "Indica cuando inicia el prestamo.",
            en: "Indicates when the loan starts.",
          },
          dataType: { es: "Fecha y hora", en: "Date and time" },
          required: true,
          validations: [
            {
              es: "Debe ser futura",
              en: "Must be in the future",
            },
          ],
          selector: '[data-help-id="orders-form-start-date"]',
        },
        {
          id: "orders-field-end",
          label: { es: "Fecha fin", en: "End date" },
          purpose: {
            es: "Define cuando termina el prestamo.",
            en: "Defines when the loan ends.",
          },
          dataType: { es: "Fecha y hora", en: "Date and time" },
          required: true,
          validations: [
            {
              es: "Debe ser mayor o igual a fecha inicio",
              en: "Must be after or equal to start date",
            },
          ],
          selector: '[data-help-id="orders-form-end-date"]',
        },
        {
          id: "orders-field-deposit",
          label: { es: "Deposito", en: "Deposit" },
          purpose: {
            es: "Define el valor del deposito para respaldar el prestamo.",
            en: "Defines deposit value to back the loan.",
          },
          dataType: { es: "Moneda (COP)", en: "Currency (COP)" },
          required: true,
          validations: [
            { es: "Numerico", en: "Numeric" },
          ],
          example: { es: "50000", en: "50000" },
          selector: '[data-help-id="orders-form-deposit-amount"]',
        },
      ],
      actions: [
        {
          id: "orders-action-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: {
            es: "Cerrar el formulario sin crear el pedido.",
            en: "Close the form without creating the order.",
          },
          consequence: {
            es: "Se descartan cambios no guardados.",
            en: "Unsaved changes are discarded.",
          },
          selector: '[data-help-id="orders-form-cancel"]',
        },
        {
          id: "orders-action-save",
          label: { es: "Crear Pedido", en: "Create Order" },
          purpose: {
            es: "Guardar la solicitud con los datos capturados.",
            en: "Save the request with captured data.",
          },
          consequence: {
            es: "El pedido entra al flujo operativo y se actualiza la lista.",
            en: "The order enters the operational flow and updates the list.",
          },
          selector: '[data-help-id="orders-form-submit"]',
        },
      ],
    },
  ],
};

export default ordersHelpContent;