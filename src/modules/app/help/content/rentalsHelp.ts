import type { HelpModuleContent } from "../types";

const rentalsHelpContent: HelpModuleContent = {
  moduleId: "rentals",
  title: {
    es: "Centro de ayuda: Prestamos",
    en: "Help center: Rentals",
  },
  description: {
    es: "Este modulo permite dar seguimiento a prestamos activos, revisar su detalle operativo y gestionar extensiones, devoluciones y reembolsos de deposito.",
    en: "This module lets you track active loans, review their operational detail, and manage extensions, returns, and deposit refunds.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui se controla el tramo activo del ciclo del prestamo, desde su seguimiento hasta la devolucion y los ajustes financieros asociados.",
        en: "Here you control the active part of the loan lifecycle, from monitoring to return and related financial adjustments.",
      },
      howTo: [
        {
          es: "Abre el modulo desde el menu lateral en Prestamos.",
          en: "Open the module from the sidebar under Rentals.",
        },
        {
          es: "Filtra por estado para ver prestamos activos, vencidos o retornados segun tu tarea.",
          en: "Filter by status to see active, overdue, or returned loans based on your task.",
        },
        {
          es: "Localiza el prestamo correcto usando el buscador o los filtros de cliente.",
          en: "Locate the correct loan using the search bar or customer filters.",
        },
        {
          es: "Usa las acciones del registro para extender, devolver o reembolsar deposito.",
          en: "Use the record actions to extend, return, or refund the deposit.",
        },
      ],
      tips: [
        {
          es: "Revisar el detalle del prestamo antes de devolver o reembolsar evita cierres prematuros o devoluciones financieras incorrectas.",
          en: "Reviewing loan detail before returning or refunding avoids premature closure or incorrect financial returns.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes buscar prestamos por cliente o identificador, filtrar por estado, revisar detalle, extender fechas, registrar devoluciones y reembolsar depositos.",
        en: "You can search loans by customer or identifier, filter by status, review details, extend dates, register returns, and refund deposits.",
      },
      howTo: [
        {
          es: "Para extender un prestamo: abre el menu de acciones del registro y selecciona Extender.",
          en: "To extend a loan: open the record's action menu and select Extend.",
        },
        {
          es: "Para registrar devolucion: selecciona el prestamo y confirma 'Marcar como devuelto'.",
          en: "To register a return: select the loan and confirm 'Mark as returned'.",
        },
        {
          es: "Para reembolsar deposito: abre acciones y usa la opcion de reembolso, confirma el monto.",
          en: "To refund deposit: open actions and use the refund option, confirm the amount.",
        },
      ],
      bestPractices: [
        {
          es: "Antes de extender un prestamo, valida disponibilidad futura del material para no crear conflictos con reservas posteriores.",
          en: "Before extending a loan, validate future material availability to avoid conflicts with later reservations.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Filtra por estado, abre el detalle del prestamo correcto y luego ejecuta la accion requerida: extender, devolver o reembolsar deposito.",
        en: "Filter by status, open the correct loan detail, and then execute the required action: extend, return, or refund deposit.",
      },
      howTo: [
        {
          es: "Filtra la lista por el estado correcto (activo, vencido, etc.) para reducir el ruido.",
          en: "Filter the list by the correct status (active, overdue, etc.) to reduce noise.",
        },
        {
          es: "Localiza el prestamo del cliente especifico usando el buscador.",
          en: "Locate the specific customer's loan using the search bar.",
        },
        {
          es: "Abre el detalle del prestamo para revisar fechas, estado y montos.",
          en: "Open the loan detail to review dates, status, and amounts.",
        },
        {
          es: "Ejecuta la accion correspondiente: extender fecha, confirmar devolucion o reembolsar deposito.",
          en: "Execute the corresponding action: extend date, confirm return, or refund deposit.",
        },
      ],
      warnings: [
        {
          es: "Devolver o reembolsar el prestamo equivocado impacta inventario, caja y trazabilidad operativa.",
          en: "Returning or refunding the wrong loan impacts inventory, cash flow, and operational traceability.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es trabajar sin filtrar por estado y operar sobre registros ya cerrados. Usa el filtro para centrarte en prestamos activos, vencidos o retornados segun la tarea.",
        en: "A common mistake is working without filtering by status and acting on already closed records. Use the filter to focus on active, overdue, or returned loans depending on the task.",
      },
      howTo: [
        {
          es: "Aplica el filtro 'Activo' o 'Vencido' antes de buscar registros para operar.",
          en: "Apply the 'Active' or 'Overdue' filter before searching records to work on.",
        },
        {
          es: "Verifica el estado del prestamo en la columna correspondiente antes de ejecutar cualquier accion.",
          en: "Check the loan status in the relevant column before executing any action.",
        },
        {
          es: "Si el prestamo esta cerrado, consulta el historial de prestamos en lugar de este modulo.",
          en: "If the loan is closed, consult the loans history instead of this module.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del modulo", en: "1) Module context" },
      body: {
        es: "Este encabezado resume el objetivo del modulo y ubica al usuario en la fase de seguimiento y cierre de prestamos.",
        en: "This header summarizes the module goal and places the user in the loan monitoring and closure phase.",
      },
      targetSelector: '[data-help-id="rentals-header"]',
    },
    {
      id: "step-2-filters",
      title: { es: "2) Filtra la cartera", en: "2) Filter the portfolio" },
      body: {
        es: "Usa estos filtros para encontrar rapidamente el prestamo correcto por cliente, identificador o estado operativo.",
        en: "Use these filters to quickly find the right loan by customer, identifier, or operational status.",
      },
      targetSelector: '[data-help-id="rentals-filters"]',
      tip: {
        es: "Filtrar por vencidos o activos acelera la gestion diaria cuando el volumen de prestamos es alto.",
        en: "Filtering by overdue or active speeds up daily management when loan volume is high.",
      },
    },
    {
      id: "step-3-table",
      title: { es: "3) Gestiona acciones", en: "3) Manage actions" },
      body: {
        es: "Desde la tabla puedes revisar detalle y ejecutar acciones disponibles como extender plazo, registrar devolucion o reembolsar deposito.",
        en: "From the table you can review details and execute available actions such as extending the term, registering a return, or refunding a deposit.",
      },
      targetSelector: '[data-help-id="rentals-table"]',
      warning: {
        es: "Antes de confirmar una devolucion o reembolso, verifica el cliente, el estado del prestamo y la informacion financiera asociada.",
        en: "Before confirming a return or refund, verify the customer, loan status, and associated financial information.",
      },
    },
  ],
  formGuides: [
    {
      id: "rentals-extend-form",
      title: { es: "Formulario: Extender prestamo", en: "Form: Extend loan" },
      purpose: {
        es: "Actualizar la fecha de fin del prestamo y registrar motivo de extension.",
        en: "Update loan end date and record extension reason.",
      },
      mode: "edit",
      selector: '[data-help-id="rentals-extend-form"]',
      usageFlow: [
        { es: "Paso 1: revisa prestamo objetivo.", en: "Step 1: review target loan." },
        { es: "Paso 2: define nueva fecha y notas.", en: "Step 2: set new date and notes." },
        { es: "Paso 3: confirma extension.", en: "Step 3: confirm extension." },
      ],
      fields: [
        {
          id: "extend-end-date",
          label: { es: "Nueva fecha fin", en: "New end date" },
          purpose: { es: "Define la nueva fecha de devolucion", en: "Defines new return date" },
          dataType: { es: "Fecha", en: "Date" },
          required: true,
          selector: '[data-help-id="rentals-extend-end-date"]',
        },
        {
          id: "extend-notes",
          label: { es: "Notas", en: "Notes" },
          purpose: {
            es: "Registrar justificacion operativa",
            en: "Record operational justification",
          },
          dataType: { es: "Texto multilinea", en: "Multiline text" },
          selector: '[data-help-id="rentals-extend-notes"]',
        },
      ],
      actions: [
        {
          id: "extend-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Salir sin extender", en: "Exit without extending" },
          consequence: { es: "No hay cambios", en: "No changes applied" },
          selector: '[data-help-id="rentals-extend-cancel"]',
        },
        {
          id: "extend-submit",
          label: { es: "Extender prestamo", en: "Extend loan" },
          purpose: { es: "Guardar nueva fecha", en: "Save new date" },
          consequence: { es: "Actualiza plazo del prestamo", en: "Updates loan deadline" },
          selector: '[data-help-id="rentals-extend-submit"]',
        },
      ],
    },
    {
      id: "rentals-return-form",
      title: { es: "Accion: Devolver prestamo", en: "Action: Return loan" },
      purpose: {
        es: "Confirmar devolucion y cerrar ciclo operativo del prestamo.",
        en: "Confirm return and close operational loan cycle.",
      },
      mode: "edit",
      selector: '[data-help-id="rentals-return-form"]',
      usageFlow: [
        { es: "Paso 1: valida prestamo seleccionado.", en: "Step 1: validate selected loan." },
        { es: "Paso 2: confirma devolucion.", en: "Step 2: confirm return." },
      ],
      fields: [],
      actions: [
        {
          id: "return-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Salir sin marcar devolucion", en: "Exit without marking return" },
          consequence: { es: "Prestamo mantiene estado actual", en: "Loan keeps current status" },
          selector: '[data-help-id="rentals-return-cancel"]',
        },
        {
          id: "return-submit",
          label: { es: "Marcar como devuelto", en: "Mark as returned" },
          purpose: { es: "Registrar devolucion", en: "Register return" },
          consequence: { es: "Actualiza estado del prestamo", en: "Updates loan status" },
          selector: '[data-help-id="rentals-return-submit"]',
        },
      ],
    },
    {
      id: "rentals-refund-form",
      title: { es: "Formulario: Reembolso de deposito", en: "Form: Deposit refund" },
      purpose: {
        es: "Registrar devolucion del deposito asociado al prestamo.",
        en: "Record refund of loan-related deposit.",
      },
      mode: "edit",
      selector: '[data-help-id="rentals-refund-form"]',
      usageFlow: [
        { es: "Paso 1: verifica monto del deposito.", en: "Step 1: verify deposit amount." },
        { es: "Paso 2: agrega notas si aplica.", en: "Step 2: add notes if needed." },
        { es: "Paso 3: confirma reembolso.", en: "Step 3: confirm refund." },
      ],
      fields: [
        {
          id: "refund-notes",
          label: { es: "Notas de reembolso", en: "Refund notes" },
          purpose: { es: "Documentar observaciones", en: "Document observations" },
          dataType: { es: "Texto multilinea", en: "Multiline text" },
          selector: '[data-help-id="rentals-refund-notes"]',
        },
      ],
      actions: [
        {
          id: "refund-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Cerrar sin reembolsar", en: "Close without refund" },
          consequence: { es: "No hay cambios financieros", en: "No financial changes" },
          selector: '[data-help-id="rentals-refund-cancel"]',
        },
        {
          id: "refund-submit",
          label: { es: "Confirmar reembolso", en: "Confirm refund" },
          purpose: { es: "Registrar reembolso", en: "Register refund" },
          consequence: { es: "Habilita cierre financiero", en: "Enables financial closure" },
          selector: '[data-help-id="rentals-refund-submit"]',
        },
      ],
    },
  ],
};

export default rentalsHelpContent;
