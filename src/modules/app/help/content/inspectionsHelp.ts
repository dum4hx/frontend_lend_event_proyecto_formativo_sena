import type { HelpModuleContent } from "../types";

const inspectionsCreateFormGuide = {
  id: "inspections-create-form",
  title: { es: "Formulario: Registrar inspeccion", en: "Form: Register inspection" },
  purpose: {
    es: "Registrar el estado de cada material devuelto y documentar novedades.",
    en: "Record each returned material condition and document findings.",
  },
  mode: "create" as const,
  selector: '[data-help-id="inspections-form-create"]',
  fields: [
    {
      id: "field-items",
      label: { es: "Items inspeccionados", en: "Inspected items" },
      purpose: {
        es: "Define condicion por material y evidencia de daños cuando aplique.",
        en: "Sets per-item condition and damage evidence when applicable.",
      },
      dataType: { es: "Lista de items", en: "Item list" },
      required: true,
      selector: '[data-help-id="inspections-form-items"]',
    },
    {
      id: "field-overall-notes",
      label: { es: "Notas generales", en: "Overall notes" },
      purpose: {
        es: "Resume observaciones generales de la devolucion.",
        en: "Summarizes return-wide observations.",
      },
      dataType: { es: "Texto largo", en: "Long text" },
      selector: '[data-help-id="inspections-form-overall-notes"]',
    },
    {
      id: "field-due-date",
      label: { es: "Fecha de vencimiento", en: "Due date" },
      purpose: {
        es: "Programa el vencimiento de cobro cuando existan daños o perdidas.",
        en: "Schedules charge due date when there are damages or losses.",
      },
      dataType: { es: "Fecha y hora", en: "Date and time" },
      selector: '[data-help-id="inspections-form-due-date"]',
    },
  ],
  actions: [
    {
      id: "action-inspection-cancel",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar la inspeccion sin guardar cambios.",
        en: "Close inspection without saving changes.",
      },
      consequence: {
        es: "Se descartan ajustes no guardados.",
        en: "Unsaved changes are discarded.",
      },
      selector: '[data-help-id="inspections-form-cancel"]',
    },
    {
      id: "action-inspection-submit",
      label: { es: "Completar inspeccion", en: "Complete inspection" },
      purpose: {
        es: "Guardar la inspeccion y actualizar el flujo operativo.",
        en: "Save inspection and update operational workflow.",
      },
      consequence: {
        es: "El prestamo pasa al siguiente estado segun resultados.",
        en: "Loan moves to the next state based on results.",
      },
      selector: '[data-help-id="inspections-form-submit"]',
    },
  ],
};

const inspectionsHelpContent: HelpModuleContent = {
  moduleId: "inspections",
  title: {
    es: "Centro de ayuda: Inspecciones",
    en: "Help center: Inspections",
  },
  description: {
    es: "Este modulo centraliza la recepcion de devoluciones, el registro del estado del material y la consulta del historial de inspecciones completadas.",
    en: "This module centralizes return intake, material condition recording, and completed inspection history review.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui el operador valida el estado del material al regreso del prestamo y detecta daños o novedades antes de cerrar el proceso.",
        en: "Here the operator validates material condition at loan return and detects damage or findings before closing the process.",
      },
      howTo: [
        {
          es: "Abre el modulo desde Operaciones > Inspecciones.",
          en: "Open the module from Operations > Inspections.",
        },
        {
          es: "Ve a la pestana 'Pendientes' para ver devoluciones que requieren inspeccion.",
          en: "Go to the 'Pending' tab to see returns that need inspection.",
        },
        {
          es: "Localiza el prestamo usando el buscador por cliente o identificador.",
          en: "Locate the loan using the search bar by customer or identifier.",
        },
        {
          es: "Abre el formulario de inspeccion y registra el estado de cada item.",
          en: "Open the inspection form and record each item's condition.",
        },
      ],
      tips: [
        {
          es: "Registrar la inspeccion apenas llega el material evita diferencias entre el estado real y el historico.",
          en: "Recording the inspection as soon as the material arrives avoids mismatches between the real and historical condition.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes alternar entre devoluciones pendientes e historial, buscar por prestamo o cliente, refrescar datos y abrir el formulario de inspeccion o el detalle historico.",
        en: "You can switch between pending returns and history, search by loan or customer, refresh data, and open the inspection form or historical detail.",
      },
      howTo: [
        {
          es: "Para registrar nueva inspeccion: ve a 'Pendientes', localiza el prestamo y haz clic en Inspeccionar.",
          en: "To register a new inspection: go to 'Pending', locate the loan, and click Inspect.",
        },
        {
          es: "Para consultar historial: cambia a la pestana 'Historial' y busca la inspeccion por ID o cliente.",
          en: "To review history: switch to the 'History' tab and search the inspection by ID or customer.",
        },
        {
          es: "Para refrescar: haz clic en el boton de actualizacion para sincronizar con el servidor.",
          en: "To refresh: click the update button to sync with the server.",
        },
      ],
      bestPractices: [
        {
          es: "Antes de guardar una inspeccion, confirma el prestamo correcto y documenta daños con suficiente detalle para facturacion posterior.",
          en: "Before saving an inspection, confirm the correct loan and document damage with enough detail for later billing.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Revisa la carga pendiente, filtra el prestamo que acaba de llegar, completa la inspeccion y luego valida el registro en el historial.",
        en: "Review the pending queue, filter the loan that just arrived, complete the inspection, and then validate the record in history.",
      },
      howTo: [
        {
          es: "Abre la pestana Pendientes y revisa el contador de tareas.",
          en: "Open the Pending tab and review the task counter.",
        },
        {
          es: "Busca el prestamo del cliente que acaba de llegar.",
          en: "Search for the loan of the customer who just arrived.",
        },
        {
          es: "Abre el formulario, registra condicion de cada item y agrega notas si hay daños.",
          en: "Open the form, register each item's condition, and add notes if there is damage.",
        },
        {
          es: "Guarda la inspeccion y verifica que aparece en el historial con estado correcto.",
          en: "Save the inspection and verify it appears in history with the correct status.",
        },
      ],
      warnings: [
        {
          es: "Si inspeccionas el prestamo equivocado, puedes generar observaciones o cobros sobre un retorno distinto.",
          en: "If you inspect the wrong loan, you can generate notes or charges for the wrong return.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es buscar solo por el identificador de inspeccion cuando el registro aun no existe. Para devoluciones nuevas, usa la pestaña de pendientes y filtra por prestamo o cliente.",
        en: "A common mistake is searching only by inspection ID when the record does not exist yet. For new returns, use the pending tab and filter by loan or customer.",
      },
      howTo: [
        {
          es: "Para devoluciones nuevas, ve a la pestana Pendientes antes de buscar por ID.",
          en: "For new returns, go to the Pending tab before searching by ID.",
        },
        {
          es: "Busca por nombre de cliente o numero de prestamo para localizar la devolucion.",
          en: "Search by customer name or loan number to locate the return.",
        },
        {
          es: "Una vez iniciada la inspeccion, el registro aparecera en el historial con su ID asignado.",
          en: "Once the inspection is initiated, the record will appear in history with its assigned ID.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el panel", en: "1) Understand the panel" },
      body: {
        es: "Este encabezado resume el objetivo del modulo y muestra cuantas devoluciones siguen pendientes de revision.",
        en: "This header summarizes the module goal and shows how many returns are still pending review.",
      },
      targetSelector: '[data-help-id="inspections-title"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Revisa la carga pendiente", en: "2) Review pending workload" },
      body: {
        es: "Este bloque destaca la cantidad de tareas activas y el acceso rapido para refrescar la informacion desde el servidor.",
        en: "This block highlights the number of active tasks and the quick access to refresh server data.",
      },
      targetSelector: '[data-help-id="inspections-stats"]',
    },
    {
      id: "step-3-tabs",
      title: { es: "3) Cambia de vista", en: "3) Switch views" },
      body: {
        es: "Usa estas pestañas para pasar de devoluciones pendientes al historial de inspecciones ya registradas.",
        en: "Use these tabs to switch from pending returns to the history of already recorded inspections.",
      },
      targetSelector: '[data-help-id="inspections-tabs"]',
      tip: {
        es: "Empieza en pendientes para registrar nuevas devoluciones y luego revisa historial para auditoria o seguimiento.",
        en: "Start in pending to register new returns, then review history for audit or follow-up.",
      },
    },
    {
      id: "step-4-search",
      title: { es: "4) Filtra rapidamente", en: "4) Filter quickly" },
      body: {
        es: "El buscador funciona en ambas vistas y permite localizar prestamos, inspecciones o clientes sin recorrer toda la lista.",
        en: "The search box works in both views and lets you find loans, inspections, or customers without scanning the full list.",
      },
      targetSelector: '[data-help-id="inspections-search"]',
    },
    {
      id: "step-5-results",
      title: { es: "5) Ejecuta o consulta", en: "5) Execute or review" },
      body: {
        es: "En esta zona abres el formulario de inspeccion para devoluciones pendientes o el detalle para revisiones ya completadas.",
        en: "In this area you open the inspection form for pending returns or the detail view for completed reviews.",
      },
      targetSelector: '[data-help-id="inspections-content"]',
      warning: {
        es: "Verifica siempre el identificador del prestamo antes de registrar daños o cerrar una revision.",
        en: "Always verify the loan identifier before recording damage or closing a review.",
      },
    },
  ],
  formGuides: [inspectionsCreateFormGuide],
};

export default inspectionsHelpContent;
