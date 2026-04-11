import type { HelpModuleContent } from "../types";

const incidentsHelpContent: HelpModuleContent = {
  moduleId: "incidents",
  title: {
    es: "Centro de ayuda: Novedades",
    en: "Help center: Incidents",
  },
  description: {
    es: "Este módulo permite gestionar reportes de daños, pérdidas y otros eventos ocurridos en préstamos, tránsito, almacenamiento, mantenimiento u otros contextos operativos.",
    en: "This module lets you manage damage reports, losses, and other events across loan operations, transit, storage, maintenance, and other operational contexts.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introducción", en: "Introduction" },
      body: {
        es: "Las novedades registran cualquier evento relevante en distintos contextos operativos: préstamos, tránsito, almacenamiento, mantenimiento y otros. Cada novedad tiene un contexto, tipo, severidad y puede incluir instancias de material afectadas e impacto financiero estimado.",
        en: "Incidents record any relevant event across different operational contexts: loans, transit, storage, maintenance, and others. Each incident has a context, type, severity, and may include affected material instances and estimated financial impact.",
      },
      howTo: [
        {
          es: "Abre el módulo desde el menú lateral en Novedades.",
          en: "Open the module from the sidebar under Incidents.",
        },
        {
          es: "Filtra por contexto, estado, tipo o severidad para encontrar novedades específicas.",
          en: "Filter by context, status, type, or severity to find specific incidents.",
        },
        {
          es: "Haz clic en una fila para ver el detalle completo de la novedad.",
          en: "Click a row to view the full incident detail.",
        },
      ],
      tips: [
        {
          es: "Usa la barra de búsqueda para localizar novedades por código de préstamo, ubicación o descripción.",
          en: "Use the search bar to locate incidents by loan code, location, or description.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes crear novedades en cualquier contexto operativo, reconocerlas, resolverlas o descartarlas. Cada novedad tiene tipo, severidad y estado que determinan su prioridad operativa.",
        en: "You can create incidents in any operational context, acknowledge them, resolve them, or dismiss them. Each incident has a type, severity, and status that determine its operational priority.",
      },
      howTo: [
        {
          es: "Para crear: usa el botón 'Reportar', selecciona el contexto y completa el formulario.",
          en: "To create: use the 'Report' button, select the context, and fill the form.",
        },
        {
          es: "Para reconocer: abre el detalle y selecciona 'Reconocer'.",
          en: "To acknowledge: open the detail and select 'Acknowledge'.",
        },
        {
          es: "Para resolver: abre el detalle, ingresa la resolución y confirma.",
          en: "To resolve: open the detail, enter the resolution, and confirm.",
        },
      ],
      bestPractices: [
        {
          es: "Documenta el impacto financiero estimado al crear la novedad para facilitar la gestión posterior.",
          en: "Document the estimated financial impact when creating the incident to facilitate later management.",
        },
        {
          es: "Selecciona el contexto correcto (préstamo, tránsito, almacenamiento, mantenimiento u otro) para mejorar la trazabilidad.",
          en: "Select the correct context (loan, transit, storage, maintenance, or other) to improve traceability.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es no asociar las instancias de material afectadas al crear la novedad, lo que dificulta la trazabilidad posterior. Otro error es no seleccionar el contexto adecuado.",
        en: "A common mistake is not associating affected material instances when creating the incident, which makes later traceability difficult. Another mistake is not selecting the appropriate context.",
      },
      warnings: [
        {
          es: "Descartar una novedad sin resolución documentada puede ocultar problemas recurrentes.",
          en: "Dismissing an incident without documented resolution may hide recurring problems.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Panel de novedades", en: "1) Incidents panel" },
      body: {
        es: "El encabezado muestra contadores de novedades abiertas y totales, junto con el botón para reportar nuevas novedades.",
        en: "The header shows counters for open and total incidents, along with the button to report new incidents.",
      },
      targetSelector: '[data-help-id="incidents-header"]',
    },
    {
      id: "step-2-create",
      title: { es: "2) Reportar novedad", en: "2) Report incident" },
      body: {
        es: "Haz clic en 'Reportar' para abrir el formulario de creación de novedades. Selecciona el contexto adecuado.",
        en: "Click 'Report' to open the incident creation form. Select the appropriate context.",
      },
      targetSelector: '[data-help-id="incidents-create-btn"]',
    },
    {
      id: "step-3-filters",
      title: { es: "3) Filtra novedades", en: "3) Filter incidents" },
      body: {
        es: "Usa los filtros de contexto, estado, tipo y severidad para enfocar la lista en las novedades relevantes.",
        en: "Use context, status, type, and severity filters to focus the list on relevant incidents.",
      },
      targetSelector: '[data-help-id="incidents-filters"]',
      tip: {
        es: "Combina filtros de contexto y severidad para priorizar las novedades más urgentes en un área operativa.",
        en: "Combine context and severity filters to prioritize the most urgent incidents in an operational area.",
      },
    },
    {
      id: "step-4-table",
      title: { es: "4) Tabla de novedades", en: "4) Incidents table" },
      body: {
        es: "La tabla muestra contexto, tipo, estado, severidad, origen, descripción y fecha de cada novedad. Haz clic en una fila para ver el detalle completo.",
        en: "The table shows context, type, status, severity, source, description, and date for each incident. Click a row to view full details.",
      },
      targetSelector: '[data-help-id="incidents-table"]',
    },
  ],
  formGuides: [
    {
      id: "incidents-create-form",
      title: { es: "Formulario: Reportar novedad", en: "Form: Report incident" },
      purpose: {
        es: "Crear un nuevo reporte de novedad en cualquier contexto operativo.",
        en: "Create a new incident report in any operational context.",
      },
      mode: "create",
      selector: '[data-help-id="incidents-create-form"]',
      usageFlow: [
        {
          es: "Paso 1: selecciona el contexto (préstamo, tránsito, almacenamiento, mantenimiento u otro).",
          en: "Step 1: select the context (loan, transit, storage, maintenance, or other).",
        },
        {
          es: "Paso 2: si el contexto es 'préstamo', selecciona el préstamo asociado.",
          en: "Step 2: if context is 'loan', select the associated loan.",
        },
        {
          es: "Paso 3: opcionalmente ingresa la ubicación.",
          en: "Step 3: optionally enter the location.",
        },
        { es: "Paso 4: elige tipo y severidad.", en: "Step 4: choose type and severity." },
        {
          es: "Paso 5: describe la novedad (opcional).",
          en: "Step 5: describe the incident (optional).",
        },
        {
          es: "Paso 6: agrega instancias de material afectadas (opcional).",
          en: "Step 6: add affected material instances (optional).",
        },
        {
          es: "Paso 7: ingresa monto estimado si aplica.",
          en: "Step 7: enter estimated amount if applicable.",
        },
        { es: "Paso 8: confirma el reporte.", en: "Step 8: confirm the report." },
      ],
      fields: [
        {
          id: "incidents-context",
          label: { es: "Contexto", en: "Context" },
          purpose: {
            es: "Define en qué área operativa ocurrió la novedad (préstamo, tránsito, almacenamiento, mantenimiento u otro)",
            en: "Defines in which operational area the incident occurred (loan, transit, storage, maintenance, or other)",
          },
          dataType: { es: "Selector", en: "Select dropdown" },
          required: true,
          selector: '[data-help-id="incidents-context"]',
        },
        {
          id: "incidents-loan",
          label: { es: "Préstamo", en: "Loan" },
          purpose: {
            es: "Préstamo al que se asocia la novedad (solo visible cuando el contexto es 'préstamo')",
            en: "Loan linked to the incident (only visible when context is 'loan')",
          },
          dataType: { es: "Selección con búsqueda", en: "Searchable select" },
          required: false,
          selector: '[data-help-id="incidents-loan-select"]',
        },
        {
          id: "incidents-location",
          label: { es: "Ubicación", en: "Location" },
          purpose: {
            es: "Ubicación donde ocurrió la novedad",
            en: "Location where the incident occurred",
          },
          dataType: { es: "Texto", en: "Text" },
          required: false,
          selector: '[data-help-id="incidents-location"]',
        },
        {
          id: "incidents-type-severity",
          label: { es: "Tipo y severidad", en: "Type and severity" },
          purpose: {
            es: "Clasificar la novedad por tipo de evento y nivel de severidad",
            en: "Classify the incident by event type and severity level",
          },
          dataType: { es: "Selectores", en: "Select dropdowns" },
          required: true,
          selector: '[data-help-id="incidents-type-severity"]',
        },
        {
          id: "incidents-description",
          label: { es: "Descripción", en: "Description" },
          purpose: {
            es: "Detalle escrito de la novedad (opcional)",
            en: "Written detail of the incident (optional)",
          },
          dataType: { es: "Texto multilínea", en: "Multiline text" },
          required: false,
          selector: '[data-help-id="incidents-description"]',
        },
        {
          id: "incidents-financial",
          label: { es: "Monto estimado", en: "Estimated amount" },
          purpose: {
            es: "Impacto financiero estimado en COP",
            en: "Estimated financial impact in COP",
          },
          dataType: { es: "Número", en: "Number" },
          selector: '[data-help-id="incidents-financial-impact"]',
        },
      ],
      actions: [
        {
          id: "incidents-cancel",
          label: { es: "Cancelar", en: "Cancel" },
          purpose: { es: "Cerrar sin reportar", en: "Close without reporting" },
          consequence: { es: "No se crea ninguna novedad", en: "No incident is created" },
        },
        {
          id: "incidents-submit",
          label: { es: "Reportar", en: "Report" },
          purpose: { es: "Confirmar y crear la novedad", en: "Confirm and create the incident" },
          consequence: {
            es: "Se registra la novedad y se notifica al equipo",
            en: "The incident is recorded and the team is notified",
          },
          selector: '[data-help-id="incidents-form-actions"]',
        },
      ],
    },
  ],
};

export default incidentsHelpContent;
