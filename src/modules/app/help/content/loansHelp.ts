import type { HelpModuleContent } from "../types";

const loansHelpContent: HelpModuleContent = {
  moduleId: "loans",
  title: {
    es: "Centro de ayuda: Préstamos",
    en: "Help center: Loans",
  },
  description: {
    es: "Este módulo unifica solicitudes y préstamos activos en una sola vista. Desde aquí puede crear solicitudes, aprobar, preparar materiales, iniciar préstamos, gestionar extensiones, devoluciones, reembolsos y cerrar el ciclo completo.",
    en: "This module unifies loan requests and active loans into a single view. From here you can create requests, approve, prepare materials, start loans, manage extensions, returns, refunds, and close the full lifecycle.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introducción", en: "Introduction" },
      body: {
        es: "Desde aquí el equipo puede gestionar todo el ciclo de vida de préstamos: desde la creación de solicitudes hasta la devolución y cierre financiero, todo en una sola pantalla con pestañas de filtro.",
        en: "From here the team can manage the full loan lifecycle: from request creation to return and financial closure, all in a single screen with filter tabs.",
      },
      howTo: [
        {
          es: "Abre el módulo desde el menú lateral en Comercio > Préstamos.",
          en: "Open the module from the sidebar under Commerce > Loans.",
        },
        {
          es: "Usa las pestañas Solicitud, Préstamo Activo y Completado para navegar entre las etapas del flujo.",
          en: "Use the Request, Active Loan, and Completed tabs to navigate between workflow stages.",
        },
        {
          es: "Usa el buscador y sub-filtros para localizar un registro específico por código o cliente.",
          en: "Use the search bar and sub-filters to locate a specific record by code or customer.",
        },
        {
          es: "Haz clic en 'Nuevo Pedido' para registrar una nueva solicitud con cliente, fechas e ítems.",
          en: "Click 'New Order' to register a new request with customer, dates, and items.",
        },
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
        es: "Puede crear solicitudes, aprobar o rechazar, cancelar, reactivar rechazados, preparar materiales, iniciar préstamos, extender plazos, registrar devoluciones, registrar pagos, reembolsar depósitos y completar préstamos.",
        en: "You can create requests, approve or reject, cancel, reactivate rejected ones, prepare materials, start loans, extend deadlines, register returns, record payments, refund deposits, and complete loans.",
      },
      howTo: [
        {
          es: "Para aprobar/rechazar: abra el detalle del registro y ejecute la acción correspondiente.",
          en: "To approve/reject: open the record detail and execute the corresponding action.",
        },
        {
          es: "Para cancelar: seleccione la acción Cancelar disponible en solicitudes pendientes, aprobadas, asignadas o listas.",
          en: "To cancel: select the Cancel action available on pending, approved, assigned, or ready requests.",
        },
        {
          es: "Para preparar materiales: mueva la solicitud a 'En preparación' seleccionando Preparar.",
          en: "To prepare materials: move the request to 'In preparation' by selecting Prepare.",
        },
        {
          es: "Para iniciar préstamo: confirme que la preparación está completa e inicie el préstamo.",
          en: "To start the loan: confirm preparation is complete and start the loan.",
        },
        {
          es: "Para extender: abra las acciones del préstamo activo y seleccione Extender.",
          en: "To extend: open the active loan's actions and select Extend.",
        },
        {
          es: "Para devolver: seleccione el préstamo y confirme 'Marcar como devuelto'.",
          en: "To return: select the loan and confirm 'Mark as returned'.",
        },
        {
          es: "Para reembolsar depósito: use la opción de reembolso y confirme el monto.",
          en: "To refund deposit: use the refund option and confirm the amount.",
        },
        {
          es: "Dentro del detalle del préstamo, use 'Ver factura' en el resumen financiero para abrir la factura de alquiler asociada sin salir del flujo.",
          en: "Inside loan detail, use 'View invoice' in the financial summary to open the related rental invoice without leaving the workflow.",
        },
      ],
      bestPractices: [
        {
          es: "Revise el detalle del registro antes de ejecutar acciones para verificar cantidades, paquetes y dependencias.",
          en: "Review the record detail before executing actions to verify quantities, packages, and dependencies.",
        },
        {
          es: "Antes de extender un préstamo, valide disponibilidad futura del material para no crear conflictos con reservas posteriores.",
          en: "Before extending a loan, validate future material availability to avoid conflicts with later reservations.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Solicitud → Aprobación → Preparación → Préstamo activo → Devolución → Reembolso → Cierre. Use las pestañas para navegar entre etapas.",
        en: "Request → Approval → Preparation → Active loan → Return → Refund → Closure. Use tabs to navigate between stages.",
      },
      howTo: [
        {
          es: "Filtre la pestaña 'Solicitud' con sub-filtro 'Pendiente' para ver solicitudes que requieren aprobación.",
          en: "Filter the 'Request' tab with 'Pending' sub-filter to see requests that require approval.",
        },
        {
          es: "Abra el detalle del registro correcto y verifique cliente, ítems y fechas.",
          en: "Open the correct record detail and verify customer, items, and dates.",
        },
        {
          es: "Apruebe o rechace según la información validada.",
          en: "Approve or reject based on the validated information.",
        },
        {
          es: "Siga el flujo: preparar materiales → iniciar préstamo → registrar devolución → reembolsar depósito → completar.",
          en: "Follow the flow: prepare materials → start loan → register return → refund deposit → complete.",
        },
      ],
      warnings: [
        {
          es: "Ejecutar acciones sobre el registro equivocado puede afectar inventario, cobros y trazabilidad de préstamos.",
          en: "Executing actions on the wrong record can affect inventory, billing, and loan traceability.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es operar sin filtrar por pestaña o sub-estado y actuar sobre registros en la etapa equivocada. Siempre confirme la etapa del flujo antes de ejecutar acciones.",
        en: "A common mistake is operating without filtering by tab or sub-status and acting on records in the wrong stage. Always confirm the workflow stage before executing actions.",
      },
      howTo: [
        {
          es: "Antes de ejecutar cualquier acción, abra el detalle del registro para confirmar su estado actual.",
          en: "Before executing any action, open the record detail to confirm its current status.",
        },
        {
          es: "Use las pestañas y sub-filtros para navegar al grupo correcto en lugar de buscar solo por texto.",
          en: "Use tabs and sub-filters to navigate to the correct group instead of searching by text alone.",
        },
        {
          es: "Para reactivar un registro rechazado, verifique que el motivo de rechazo fue resuelto antes de continuar.",
          en: "To reactivate a rejected record, verify the rejection reason was resolved before continuing.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el módulo", en: "1) Understand the module" },
      body: {
        es: "Este encabezado resume el alcance del módulo unificado y da acceso inmediato a la creación de nuevas solicitudes.",
        en: "This header summarizes the unified module scope and gives immediate access to creating new requests.",
      },
      targetSelector: '[data-help-id="loans-header"]',
    },
    {
      id: "step-2-create",
      title: { es: "2) Crea solicitudes", en: "2) Create requests" },
      body: {
        es: "Usa esta acción para abrir el formulario de alta y registrar una nueva solicitud según permisos disponibles.",
        en: "Use this action to open the creation form and register a new request based on available permissions.",
      },
      targetSelector: '[data-help-id="loans-create-action"]',
    },
    {
      id: "step-3-filters",
      title: { es: "3) Filtra el flujo", en: "3) Filter the workflow" },
      body: {
        es: "Aquí puede cambiar entre pestañas (Solicitud, Préstamo Activo, Completado), buscar por código o cliente y aplicar sub-filtros por estado.",
        en: "Here you can switch between tabs (Request, Active Loan, Completed), search by code or customer, and apply sub-filters by status.",
      },
      targetSelector: '[data-help-id="loans-filters"]',
      tip: {
        es: "Cambiar de pestaña reinicia el sub-filtro para mostrar todos los registros de esa etapa.",
        en: "Switching tabs resets the sub-filter to show all records for that stage.",
      },
    },
    {
      id: "step-4-table",
      title: { es: "4) Ejecuta acciones", en: "4) Execute actions" },
      body: {
        es: "La tabla muestra registros filtrados con acciones disponibles según la etapa: aprobar, rechazar, preparar, iniciar préstamo, extender, devolver, reembolsar o completar.",
        en: "The table shows filtered records with available actions per stage: approve, reject, prepare, start loan, extend, return, refund, or complete.",
      },
      targetSelector: '[data-help-id="loans-table"]',
      warning: {
        es: "Antes de cambiar el estado de un registro, valide el cliente, los ítems y la etapa actual del flujo.",
        en: "Before changing a record status, validate the customer, items, and current workflow stage.",
      },
    },
    {
      id: "step-5-loan-detail-financials",
      title: { es: "5) Revisa la factura del préstamo", en: "5) Review the loan invoice" },
      body: {
        es: "Cuando abras el detalle del préstamo, este bloque resume cobros, depósito y cargos adicionales. Desde aquí también puedes abrir la factura de alquiler relacionada para validar el cobro exacto.",
        en: "When you open loan detail, this block summarizes charges, deposit, and extra fees. From here you can also open the related rental invoice to validate the exact billing.",
      },
      targetSelector: '[data-help-id="loans-detail-financial-summary"]',
      tip: {
        es: "Usa el botón 'Ver factura' antes de cerrar el ciclo si necesitas confirmar total, saldo pendiente o líneas facturadas.",
        en: "Use the 'View invoice' button before closing the cycle if you need to confirm total, remaining balance, or billed line items.",
      },
    },
  ],
  formGuides: [
    {
      id: "loans-create-form",
      title: {
        es: "Formulario: Crear solicitud",
        en: "Form: Create request",
      },
      purpose: {
        es: "Registrar una nueva solicitud con cliente, fechas y productos/servicios asociados.",
        en: "Register a new request with customer, dates, and related products/services.",
      },
      mode: "create",
      selector: '[data-help-id="loans-form-create"]',
      usageFlow: [
        {
          es: "Paso 1: seleccione cliente y defina fechas del pedido.",
          en: "Step 1: select customer and define order dates.",
        },
        {
          es: "Paso 2: configure depósito y agregue materiales o paquete.",
          en: "Step 2: set deposit and add materials or package.",
        },
        {
          es: "Paso 3: revise validaciones y confirme crear solicitud.",
          en: "Step 3: review validations and confirm request creation.",
        },
      ],
      fields: [
        {
          id: "loans-field-customer",
          label: { es: "Cliente", en: "Customer" },
          purpose: {
            es: "Define el cliente asociado a la solicitud.",
            en: "Defines the customer linked to the request.",
          },
          dataType: { es: "Selección (select)", en: "Selection (select)" },
          required: true,
          validations: [{ es: "Obligatorio", en: "Required" }],
          example: { es: "Ana Gómez - ana@empresa.com", en: "Ana Gomez - ana@company.com" },
          selector: '[data-help-id="loans-form-customer"]',
        },
        {
          id: "loans-field-start",
          label: { es: "Fecha inicio", en: "Start date" },
          purpose: {
            es: "Indica cuándo inicia el préstamo.",
            en: "Indicates when the loan starts.",
          },
          dataType: { es: "Fecha y hora", en: "Date and time" },
          required: true,
          validations: [{ es: "Debe ser futura", en: "Must be in the future" }],
          selector: '[data-help-id="loans-form-start-date"]',
        },
        {
          id: "loans-field-end",
          label: { es: "Fecha fin", en: "End date" },
          purpose: {
            es: "Define cuándo termina el préstamo.",
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
          selector: '[data-help-id="loans-form-end-date"]',
        },
        {
          id: "loans-field-deposit",
          label: { es: "Depósito", en: "Deposit" },
          purpose: {
            es: "Define el valor del depósito para respaldar el préstamo.",
            en: "Defines deposit value to back the loan.",
          },
          dataType: { es: "Moneda (COP)", en: "Currency (COP)" },
          required: true,
          validations: [{ es: "Numérico", en: "Numeric" }],
          example: { es: "50000", en: "50000" },
          selector: '[data-help-id="loans-form-deposit-amount"]',
        },
      ],
      actions: [
        {
          id: "loans-action-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: {
            es: "Cerrar el formulario sin crear la solicitud.",
            en: "Close the form without creating the request.",
          },
          consequence: {
            es: "Se descartan cambios no guardados.",
            en: "Unsaved changes are discarded.",
          },
          selector: '[data-help-id="loans-form-cancel"]',
        },
        {
          id: "loans-action-save",
          label: { es: "Crear Solicitud", en: "Create Request" },
          purpose: {
            es: "Guardar la solicitud con los datos capturados.",
            en: "Save the request with captured data.",
          },
          consequence: {
            es: "La solicitud entra al flujo operativo y se actualiza la lista.",
            en: "The request enters the operational flow and updates the list.",
          },
          selector: '[data-help-id="loans-form-submit"]',
        },
      ],
    },
    {
      id: "loans-extend-form",
      title: { es: "Formulario: Extender préstamo", en: "Form: Extend loan" },
      purpose: {
        es: "Actualizar la fecha de fin del préstamo y registrar motivo de extensión.",
        en: "Update loan end date and record extension reason.",
      },
      mode: "edit",
      selector: '[data-help-id="loans-extend-form"]',
      usageFlow: [
        { es: "Paso 1: revise préstamo objetivo.", en: "Step 1: review target loan." },
        { es: "Paso 2: defina nueva fecha y notas.", en: "Step 2: set new date and notes." },
        { es: "Paso 3: confirme extensión.", en: "Step 3: confirm extension." },
      ],
      fields: [
        {
          id: "extend-end-date",
          label: { es: "Nueva fecha fin", en: "New end date" },
          purpose: { es: "Define la nueva fecha de devolución", en: "Defines new return date" },
          dataType: { es: "Fecha", en: "Date" },
          required: true,
          selector: '[data-help-id="loans-extend-end-date"]',
        },
        {
          id: "extend-notes",
          label: { es: "Notas", en: "Notes" },
          purpose: {
            es: "Registrar justificación operativa",
            en: "Record operational justification",
          },
          dataType: { es: "Texto multilínea", en: "Multiline text" },
          selector: '[data-help-id="loans-extend-notes"]',
        },
      ],
      actions: [
        {
          id: "extend-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Salir sin extender", en: "Exit without extending" },
          consequence: { es: "No hay cambios", en: "No changes applied" },
          selector: '[data-help-id="loans-extend-cancel"]',
        },
        {
          id: "extend-submit",
          label: { es: "Extender préstamo", en: "Extend loan" },
          purpose: { es: "Guardar nueva fecha", en: "Save new date" },
          consequence: { es: "Actualiza plazo del préstamo", en: "Updates loan deadline" },
          selector: '[data-help-id="loans-extend-submit"]',
        },
      ],
    },
    {
      id: "loans-return-form",
      title: { es: "Acción: Devolver préstamo", en: "Action: Return loan" },
      purpose: {
        es: "Confirmar devolución y cerrar ciclo operativo del préstamo.",
        en: "Confirm return and close operational loan cycle.",
      },
      mode: "edit",
      selector: '[data-help-id="loans-return-form"]',
      usageFlow: [
        { es: "Paso 1: valide préstamo seleccionado.", en: "Step 1: validate selected loan." },
        { es: "Paso 2: confirme devolución.", en: "Step 2: confirm return." },
      ],
      fields: [],
      actions: [
        {
          id: "return-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Salir sin marcar devolución", en: "Exit without marking return" },
          consequence: { es: "Préstamo mantiene estado actual", en: "Loan keeps current status" },
          selector: '[data-help-id="loans-return-cancel"]',
        },
        {
          id: "return-submit",
          label: { es: "Marcar como devuelto", en: "Mark as returned" },
          purpose: { es: "Registrar devolución", en: "Register return" },
          consequence: { es: "Actualiza estado del préstamo", en: "Updates loan status" },
          selector: '[data-help-id="loans-return-submit"]',
        },
      ],
    },
    {
      id: "loans-refund-form",
      title: { es: "Formulario: Reembolso de depósito", en: "Form: Deposit refund" },
      purpose: {
        es: "Registrar devolución del depósito asociado al préstamo.",
        en: "Record refund of loan-related deposit.",
      },
      mode: "edit",
      selector: '[data-help-id="loans-refund-form"]',
      usageFlow: [
        { es: "Paso 1: verifique monto del depósito.", en: "Step 1: verify deposit amount." },
        { es: "Paso 2: agregue notas si aplica.", en: "Step 2: add notes if needed." },
        { es: "Paso 3: confirme reembolso.", en: "Step 3: confirm refund." },
      ],
      fields: [
        {
          id: "refund-notes",
          label: { es: "Notas de reembolso", en: "Refund notes" },
          purpose: { es: "Documentar observaciones", en: "Document observations" },
          dataType: { es: "Texto multilínea", en: "Multiline text" },
          selector: '[data-help-id="loans-refund-notes"]',
        },
      ],
      actions: [
        {
          id: "refund-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Cerrar sin reembolsar", en: "Close without refund" },
          consequence: { es: "No hay cambios financieros", en: "No financial changes" },
          selector: '[data-help-id="loans-refund-cancel"]',
        },
        {
          id: "refund-submit",
          label: { es: "Confirmar reembolso", en: "Confirm refund" },
          purpose: { es: "Registrar reembolso", en: "Register refund" },
          consequence: { es: "Habilita cierre financiero", en: "Enables financial closure" },
          selector: '[data-help-id="loans-refund-submit"]',
        },
      ],
    },
  ],
};

export default loansHelpContent;
