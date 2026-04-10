import type { HelpModuleContent } from "../types";

const invoicesHelpContent: HelpModuleContent = {
  moduleId: "invoices",
  title: {
    es: "Centro de ayuda: Facturas",
    en: "Help center: Invoices",
  },
  description: {
    es: "Este modulo te permite monitorear facturas, registrar pagos, anular comprobantes cuando corresponde y consultar estado financiero operativo.",
    en: "This module lets you monitor invoices, record payments, void documents when needed, and review operational financial status.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui se centraliza la gestion de cobros para pedidos y servicios, con visibilidad de pendientes, pagadas y vencidas.",
        en: "This area centralizes billing management for orders and services, with visibility into pending, paid, and overdue invoices.",
      },
      howTo: [
        {
          es: "Abre el modulo desde el menu lateral en Facturacion > Facturas.",
          en: "Open the module from the sidebar under Billing > Invoices.",
        },
        {
          es: "Revisa las tarjetas de metricas para tener una vista rapida del estado de cobros.",
          en: "Review the metrics cards for a quick view of billing status.",
        },
        {
          es: "Usa los filtros de pestana y estado para navegar hacia el grupo de facturas que necesitas gestionar.",
          en: "Use the tab and status filters to navigate to the invoice group you need to manage.",
        },
      ],
      tips: [
        {
          es: "Mantener pagos y anulaciones al dia mejora la calidad de reportes de ingreso y conciliacion.",
          en: "Keeping payments and voids up to date improves revenue reporting and reconciliation quality.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes refrescar informacion, revisar metricas de facturacion, aplicar filtros por estado o tipo, buscar por cliente o numero de factura y ejecutar acciones sobre cada registro.",
        en: "You can refresh data, review billing metrics, apply status/type filters, search by customer or invoice number, and execute actions on each record.",
      },
      howTo: [
        {
          es: "Para registrar pago: localiza la factura pendiente y usa la accion de pago de la fila.",
          en: "To record a payment: locate the pending invoice and use the payment action in the row.",
        },
        {
          es: "Para anular: localiza la factura y selecciona la accion de anulacion, indicando el motivo.",
          en: "To void: locate the invoice and select the void action, indicating the reason.",
        },
        {
          es: "Para refrescar: usa el boton de actualizacion del encabezado para sincronizar datos.",
          en: "To refresh: use the header update button to sync data.",
        },
      ],
      bestPractices: [
        {
          es: "Antes de registrar un pago, verifica monto, metodo y referencia para mantener trazabilidad contable.",
          en: "Before recording a payment, verify amount, method, and reference to preserve accounting traceability.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Empieza revisando las metricas, aplica filtros para ubicar la factura correcta, consulta el detalle y luego registra pago o anulacion segun corresponda.",
        en: "Start by reviewing metrics, apply filters to locate the right invoice, open details, and then record payment or void as needed.",
      },
      howTo: [
        {
          es: "Revisa las tarjetas de resumen para identificar prioridades de cobro (vencidas o pendientes).",
          en: "Review the summary cards to identify billing priorities (overdue or pending).",
        },
        {
          es: "Filtra por la pestana correcta (pendiente, pagada, vencida) y busca por cliente o numero.",
          en: "Filter by the correct tab (pending, paid, overdue) and search by customer or number.",
        },
        {
          es: "Abre el detalle de la factura para confirmar el cliente y monto antes de ejecutar acciones.",
          en: "Open the invoice detail to confirm customer and amount before executing actions.",
        },
        {
          es: "Registra el pago o la anulacion con los datos requeridos y confirma la operacion.",
          en: "Record the payment or void with the required data and confirm the operation.",
        },
      ],
      warnings: [
        {
          es: "Aplicar un pago o una anulacion sobre la factura equivocada impacta reportes y conciliaciones.",
          en: "Applying a payment or void on the wrong invoice impacts reporting and reconciliation.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error habitual es no usar filtros por estado y operar sobre facturas ya cerradas. Filtra primero y confirma el cliente antes de ejecutar acciones.",
        en: "A common mistake is not filtering by status and acting on already closed invoices. Filter first and confirm the customer before executing actions.",
      },
      howTo: [
        {
          es: "Usa siempre la pestana y el filtro de estado para evitar trabajar sobre facturas cerradas.",
          en: "Always use the tab and status filter to avoid working on closed invoices.",
        },
        {
          es: "Verifica el nombre del cliente y el numero de factura antes de registrar cualquier pago.",
          en: "Verify the customer name and invoice number before recording any payment.",
        },
        {
          es: "Si una factura no aparece en la lista, cambia de pestana o ajusta el filtro de estado.",
          en: "If an invoice doesn't appear in the list, switch tabs or adjust the status filter.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el panel", en: "1) Understand the panel" },
      body: {
        es: "Este encabezado explica el objetivo del modulo y ofrece el acceso rapido para refrescar datos.",
        en: "This header explains the module goal and offers quick access to refresh data.",
      },
      targetSelector: '[data-help-id="invoices-header"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Revisa metricas", en: "2) Review metrics" },
      body: {
        es: "Estas tarjetas resumen el volumen y monto de facturas pendientes, pagadas y vencidas.",
        en: "These cards summarize count and amount for pending, paid, and overdue invoices.",
      },
      targetSelector: '[data-help-id="invoices-stats"]',
    },
    {
      id: "step-3-filters",
      title: { es: "3) Filtra y busca", en: "3) Filter and search" },
      body: {
        es: "Aqui puedes segmentar por pestana, estado, tipo y busqueda para localizar rapidamente la factura objetivo.",
        en: "Here you can segment by tab, status, type, and search to quickly locate the target invoice.",
      },
      targetSelector: '[data-help-id="invoices-filters"]',
      tip: {
        es: "Usar la pestana de vencidas ayuda a priorizar cobros de mayor impacto.",
        en: "Using the overdue tab helps prioritize high-impact collections.",
      },
    },
    {
      id: "step-4-table",
      title: { es: "4) Ejecuta acciones", en: "4) Execute actions" },
      body: {
        es: "Desde la tabla accedes al detalle y a acciones de pago o anulacion por factura.",
        en: "From the table you can open details and payment or void actions per invoice.",
      },
      targetSelector: '[data-help-id="invoices-table"]',
      warning: {
        es: "Confirma identificador y cliente antes de registrar pagos o anular comprobantes.",
        en: "Confirm invoice ID and customer before recording payments or voiding documents.",
      },
    },
  ],
  formGuides: [
    {
      id: "invoice-payment-form",
      title: { es: "Formulario: Registrar pago", en: "Form: Record payment" },
      purpose: {
        es: "Registrar un abono o pago sobre una factura pendiente.",
        en: "Record a payment against a pending invoice.",
      },
      mode: "edit",
      selector: '[data-help-id="invoice-payment-form"]',
      usageFlow: [
        { es: "Paso 1: verifica saldo pendiente.", en: "Step 1: verify remaining balance." },
        {
          es: "Paso 2: ingresa monto, metodo y referencia.",
          en: "Step 2: enter amount, method, and reference.",
        },
        { es: "Paso 3: confirma registro de pago.", en: "Step 3: confirm payment record." },
      ],
      fields: [
        {
          id: "invoice-payment-amount",
          label: { es: "Monto", en: "Amount" },
          purpose: { es: "Define el valor a registrar", en: "Defines payment amount to register" },
          dataType: { es: "Numerico", en: "Numeric" },
          required: true,
          validations: [
            { es: "Mayor a 0", en: "Greater than 0" },
            { es: "No exceder saldo pendiente", en: "Cannot exceed remaining balance" },
          ],
          selector: '[data-help-id="invoice-payment-amount"]',
        },
        {
          id: "invoice-payment-method",
          label: { es: "Metodo de pago", en: "Payment method" },
          purpose: {
            es: "Selecciona el medio usado para el pago.",
            en: "Select payment channel used.",
          },
          dataType: { es: "Seleccion", en: "Selection" },
          required: true,
          selector: '[data-help-id="invoice-payment-method"]',
        },
      ],
      actions: [
        {
          id: "invoice-payment-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Cerrar sin registrar", en: "Close without recording" },
          consequence: { es: "No hay cambios en la factura", en: "No changes are applied" },
          selector: '[data-help-id="invoice-payment-cancel"]',
        },
        {
          id: "invoice-payment-submit",
          label: { es: "Registrar Pago", en: "Record Payment" },
          purpose: { es: "Guardar pago en la factura", en: "Save payment on invoice" },
          consequence: { es: "Actualiza saldo y estado", en: "Updates balance and status" },
          selector: '[data-help-id="invoice-payment-submit"]',
        },
      ],
    },
    {
      id: "invoice-void-form",
      title: { es: "Formulario: Anular factura", en: "Form: Void invoice" },
      purpose: {
        es: "Anular una factura con motivo trazable.",
        en: "Void an invoice with auditable reason.",
      },
      mode: "edit",
      selector: '[data-help-id="invoice-void-form"]',
      usageFlow: [
        { es: "Paso 1: revisa detalles de factura.", en: "Step 1: review invoice details." },
        { es: "Paso 2: registra motivo de anulacion.", en: "Step 2: enter void reason." },
        { es: "Paso 3: confirma anulacion.", en: "Step 3: confirm void action." },
      ],
      fields: [
        {
          id: "invoice-void-reason",
          label: { es: "Razon de anulacion", en: "Void reason" },
          purpose: { es: "Documentar por que se anula", en: "Document why invoice is voided" },
          dataType: { es: "Texto multilinea", en: "Multiline text" },
          required: true,
          selector: '[data-help-id="invoice-void-reason"]',
        },
      ],
      actions: [
        {
          id: "invoice-void-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Salir sin anular", en: "Exit without voiding" },
          consequence: { es: "Factura conserva estado actual", en: "Invoice keeps current status" },
          selector: '[data-help-id="invoice-void-cancel"]',
        },
        {
          id: "invoice-void-submit",
          label: { es: "Anular Factura", en: "Void Invoice" },
          purpose: { es: "Ejecutar anulacion", en: "Execute void" },
          consequence: { es: "Accion irreversible", en: "Irreversible action" },
          selector: '[data-help-id="invoice-void-submit"]',
        },
      ],
    },
  ],
};

export default invoicesHelpContent;
