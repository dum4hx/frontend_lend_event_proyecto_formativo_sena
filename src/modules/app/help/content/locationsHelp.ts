import type { HelpModuleContent } from "../types";

const locationCreateFormGuide = {
  id: "locations-create-form",
  title: { es: "Formulario: Crear ubicacion", en: "Form: Create location" },
  purpose: {
    es: "Registrar una ubicacion operativa con direccion y capacidades por tipo de material.",
    en: "Register an operational location with address and capacities per material type.",
  },
  mode: "create" as const,
  selector: '[data-help-id="locations-form-create"]',
  fields: [
    {
      id: "field-name",
      label: { es: "Nombre", en: "Name" },
      purpose: {
        es: "Identifica la ubicacion en tablas, reportes y transferencias.",
        en: "Identifies the location in tables, reports, and transfers.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="locations-form-name"]',
    },
    {
      id: "field-department",
      label: { es: "Departamento", en: "Department" },
      purpose: {
        es: "Determina contexto geografico y lista de ciudades disponibles.",
        en: "Determines geographic context and available city list.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      selector: '[data-help-id="locations-form-department"]',
    },
    {
      id: "field-city",
      label: { es: "Ciudad", en: "City" },
      purpose: {
        es: "Ubica la sede para operacion y cobertura logistica.",
        en: "Places the site for operations and logistics coverage.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      selector: '[data-help-id="locations-form-city"]',
    },
    {
      id: "field-street-type",
      label: { es: "Tipo de calle", en: "Street type" },
      purpose: {
        es: "Inicia la direccion estructurada de la ubicacion.",
        en: "Starts the structured location address.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      selector: '[data-help-id="locations-form-street-type"]',
    },
    {
      id: "field-bulk-capacity",
      label: { es: "Capacidad masiva", en: "Bulk capacity" },
      purpose: {
        es: "Aplica una cantidad estandar a multiples materiales.",
        en: "Applies a standard quantity to multiple materials.",
      },
      dataType: { es: "Herramienta", en: "Utility" },
      selector: '[data-help-id="locations-form-bulk-capacity"]',
    },
  ],
  actions: [
    {
      id: "action-create-location",
      label: { es: "Crear ubicacion", en: "Create location" },
      purpose: {
        es: "Guarda la nueva ubicacion con su capacidad configurada.",
        en: "Saves the new location with configured capacity.",
      },
      consequence: {
        es: "La ubicacion queda disponible para inventario y transferencias.",
        en: "Location becomes available for inventory and transfers.",
      },
      selector: '[data-help-id="locations-form-submit"]',
    },
    {
      id: "action-cancel-location",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar formulario sin guardar la ubicacion.",
        en: "Close form without saving location.",
      },
      consequence: {
        es: "Se descarta configuracion no guardada.",
        en: "Unsaved configuration is discarded.",
      },
      selector: '[data-help-id="locations-form-cancel"]',
    },
  ],
};

const locationEditFormGuide = {
  id: "locations-edit-form",
  title: { es: "Formulario: Editar ubicacion", en: "Form: Edit location" },
  purpose: {
    es: "Actualizar direccion, estado y capacidades de una ubicacion existente.",
    en: "Update address, status, and capacities of an existing location.",
  },
  mode: "edit" as const,
  selector: '[data-help-id="locations-form-edit"]',
  fields: locationCreateFormGuide.fields,
  actions: [
    {
      id: "action-edit-location-save",
      label: { es: "Guardar cambios", en: "Save changes" },
      purpose: {
        es: "Persistir ajustes de la ubicacion.",
        en: "Persist location updates.",
      },
      consequence: {
        es: "La ubicacion actualiza su configuracion operativa.",
        en: "Location updates its operational configuration.",
      },
      selector: '[data-help-id="locations-form-submit"]',
    },
    {
      id: "action-edit-location-cancel",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar edicion sin guardar cambios.",
        en: "Close editing without saving changes.",
      },
      consequence: {
        es: "Se mantiene configuracion previa de la ubicacion.",
        en: "Previous location configuration remains.",
      },
      selector: '[data-help-id="locations-form-cancel"]',
    },
  ],
};

const locationsHelpContent: HelpModuleContent = {
  moduleId: "locations",
  title: {
    es: "Centro de ayuda: Ubicaciones",
    en: "Help center: Locations",
  },
  description: {
    es: "Este modulo permite administrar ubicaciones fisicas del almacen, su capacidad y operaciones de importacion o exportacion.",
    en: "This module lets you manage physical warehouse locations, their capacity, and import/export operations.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui controlas zonas y ubicaciones de almacen para organizar inventario y capacidad operativa.",
        en: "Here you control warehouse zones and locations to organize inventory and operational capacity.",
      },
      tips: [
        {
          es: "Mantener nombres y direcciones consistentes facilita trazabilidad y operacion diaria.",
          en: "Keeping names and addresses consistent improves traceability and daily operations.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes exportar, importar, crear, editar y eliminar ubicaciones, ademas de revisar su capacidad y utilizacion.",
        en: "You can export, import, create, edit, and delete locations, while reviewing capacity and utilization.",
      },
      bestPractices: [
        {
          es: "Valida capacidad y tipos de material asociados antes de importar ubicaciones en lote.",
          en: "Validate capacity and related material types before batch importing locations.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: revisa metricas, aplica filtros, valida tabla y luego crea o importa nuevas ubicaciones.",
        en: "Recommended flow: review metrics, apply filters, validate the table, then create or import new locations.",
      },
      warnings: [
        {
          es: "Eliminar una ubicacion puede afectar inventario o configuraciones relacionadas.",
          en: "Deleting a location can affect inventory or related configurations.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: importar archivos con formato incorrecto o sin capacidades alineadas a tipos de material. Revisa plantilla antes de cargar.",
        en: "Common mistake: importing files with invalid format or capacities not aligned to material types. Review the template before uploading.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del modulo", en: "1) Module context" },
      body: {
        es: "Este encabezado resume el objetivo del modulo y centraliza acciones como exportar, importar y crear ubicaciones.",
        en: "This header summarizes the module goal and centralizes actions such as export, import, and location creation.",
      },
      targetSelector: '[data-help-id="locations-title"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Revisa metricas", en: "2) Review metrics" },
      body: {
        es: "Estas tarjetas muestran volumen, capacidad y utilizacion general del almacen.",
        en: "These cards show volume, capacity, and overall warehouse utilization.",
      },
      targetSelector: '[data-help-id="locations-stats"]',
    },
    {
      id: "step-3-filters",
      title: { es: "3) Aplica filtros", en: "3) Apply filters" },
      body: {
        es: "Usa estos filtros para enfocar ubicaciones por texto o estado operativo.",
        en: "Use these filters to focus locations by text or operational status.",
      },
      targetSelector: '[data-help-id="locations-filters"]',
      tip: {
        es: "Filtrar antes de editar reduce errores cuando hay muchas ubicaciones.",
        en: "Filtering before editing reduces mistakes when many locations exist.",
      },
    },
    {
      id: "step-4-table",
      title: { es: "4) Gestiona ubicaciones", en: "4) Manage locations" },
      body: {
        es: "Desde esta tabla puedes revisar detalle, editar o eliminar registros.",
        en: "From this table you can inspect details, edit, or delete records.",
      },
      targetSelector: '[data-help-id="locations-table"]',
      warning: {
        es: "Antes de eliminar, confirma que la ubicacion no tenga dependencias activas.",
        en: "Before deleting, confirm the location has no active dependencies.",
      },
    },
    {
      id: "step-5-pagination",
      title: { es: "5) Recorre paginas", en: "5) Navigate pages" },
      body: {
        es: "La paginacion ayuda a revisar el inventario de ubicaciones por bloques.",
        en: "Pagination helps review the location inventory in blocks.",
      },
      targetSelector: '[data-help-id="locations-pagination"]',
    },
    {
      id: "step-6-import",
      title: { es: "6) Importa datos", en: "6) Import data" },
      body: {
        es: "Usa la importacion para poblar ubicaciones desde CSV o Excel siguiendo la plantilla valida.",
        en: "Use import to populate locations from CSV or Excel following a valid template.",
      },
      targetSelector: '[data-help-id="locations-import-modal"]',
    },
  ],
  formGuides: [locationCreateFormGuide, locationEditFormGuide],
};

export default locationsHelpContent;
