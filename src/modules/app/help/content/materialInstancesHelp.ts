import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const materialInstancesFormGuides = createCrudFormGuides({
  baseId: "material-instances",
  title: {
    create: {
      es: "Formulario: Crear instancia",
      en: "Form: Create instance",
    },
    edit: {
      es: "Formulario: Editar instancia",
      en: "Form: Edit instance",
    },
  },
  purpose: {
    create: {
      es: "Registrar una unidad fisica de inventario y su ubicacion inicial.",
      en: "Register a physical inventory unit and its initial location.",
    },
    edit: {
      es: "Actualizar metadatos operativos de una unidad existente.",
      en: "Update operational metadata of an existing unit.",
    },
  },
  selector: {
    create: '[data-help-id="material-instances-form-create"]',
    edit: '[data-help-id="material-instances-form-edit"]',
  },
  fields: [
    {
      id: "field-model",
      label: { es: "Tipo de material", en: "Material type" },
      purpose: {
        es: "Asocia la unidad a un tipo definido en catalogo.",
        en: "Associates the unit with a catalog-defined type.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      selector: '[data-help-id="material-instances-form-model"]',
    },
    {
      id: "field-serial",
      label: { es: "Serial", en: "Serial" },
      purpose: {
        es: "Identificador unico interno para trazabilidad.",
        en: "Unique internal identifier for traceability.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="material-instances-form-serial"]',
    },
    {
      id: "field-barcode",
      label: { es: "Codigo de barras", en: "Barcode" },
      purpose: {
        es: "Facilita flujos con scanner en bodega.",
        en: "Enables scanner-based warehouse workflows.",
      },
      dataType: { es: "Texto/Numerico", en: "Text/Numeric" },
      selector: '[data-help-id="material-instances-form-barcode"]',
    },
    {
      id: "field-location",
      label: { es: "Ubicacion", en: "Location" },
      purpose: {
        es: "Define donde queda almacenada la unidad.",
        en: "Defines where the unit is stored.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      selector: '[data-help-id="material-instances-form-location"]',
    },
  ],
  actions: {
    create: [
      {
        id: "action-create-instance",
        label: { es: "Crear instancia", en: "Create instance" },
        purpose: {
          es: "Guarda la unidad fisica nueva.",
          en: "Saves the new physical unit.",
        },
        consequence: {
          es: "La instancia queda disponible para operaciones.",
          en: "Instance becomes available for operations.",
        },
        selector: '[data-help-id="material-instances-form-submit"]',
      },
      {
        id: "action-create-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Cerrar formulario sin guardar la instancia.",
          en: "Close form without saving the instance.",
        },
        consequence: {
          es: "Se descartan los cambios.",
          en: "Changes are discarded.",
        },
        selector: '[data-help-id="material-instances-form-cancel"]',
      },
    ],
    edit: [
      {
        id: "action-edit-instance",
        label: { es: "Actualizar instancia", en: "Update instance" },
        purpose: {
          es: "Aplica cambios a la instancia seleccionada.",
          en: "Applies changes to the selected instance.",
        },
        consequence: {
          es: "Inventario refleja datos actualizados.",
          en: "Inventory reflects updated data.",
        },
        selector: '[data-help-id="material-instances-form-submit"]',
      },
      {
        id: "action-edit-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Salir sin guardar.",
          en: "Exit without saving.",
        },
        consequence: {
          es: "Se mantiene estado previo.",
          en: "Previous state is preserved.",
        },
        selector: '[data-help-id="material-instances-form-cancel"]',
      },
    ],
  },
});

const materialInstancesHelpContent: HelpModuleContent = {
  moduleId: "material-instances",
  title: {
    es: "Centro de ayuda: Instancias de material",
    en: "Help center: Material instances",
  },
  description: {
    es: "Este modulo administra el inventario fisico real: unidades individuales, estados, codigos de barras y trazabilidad operativa.",
    en: "This module manages real physical inventory: individual units, statuses, barcodes, and operational traceability.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui gestionas cada unidad fisica del inventario, incluyendo busqueda, impresion de codigos y actualizacion de estado.",
        en: "Here you manage each physical inventory unit, including search, barcode printing, and status updates.",
      },
      tips: [
        {
          es: "Usa codigos de barras y seriales consistentes para acelerar operaciones de bodega.",
          en: "Use consistent barcodes and serials to speed up warehouse operations.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes buscar instancias, imprimir codigos, importar registros, usar el scanner y cambiar estados rapidamente.",
        en: "You can search instances, print barcodes, import records, use the scanner, and update statuses quickly.",
      },
      bestPractices: [
        {
          es: "Registra ubicacion y estado con disciplina para mantener inventario confiable.",
          en: "Record location and status consistently to keep inventory trustworthy.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: busca o escanea una unidad, revisa metricas, actualiza estado y valida el listado final.",
        en: "Recommended flow: search or scan a unit, review metrics, update status, and validate the final list.",
      },
      warnings: [
        {
          es: "Cambiar estado incorrectamente puede afectar disponibilidad y trazabilidad de prestamos.",
          en: "Incorrect status changes can affect availability and loan traceability.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: registrar una unidad sin dependencias previas como ubicacion o tipo. Valida prerequisitos antes de crear.",
        en: "Common mistake: registering a unit without prerequisites such as location or type. Validate prerequisites before creating.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del inventario", en: "1) Inventory context" },
      body: {
        es: "Este encabezado introduce el catalogo de unidades fisicas.",
        en: "This header introduces the physical-unit catalog.",
      },
      targetSelector: '[data-help-id="material-instances-title"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Busca y opera", en: "2) Search and operate" },
      body: {
        es: "Desde esta barra puedes buscar, imprimir codigos, importar datos y crear nuevas instancias.",
        en: "From this bar you can search, print barcodes, import data, and create new instances.",
      },
      targetSelector: '[data-help-id="material-instances-actions"]',
    },
    {
      id: "step-3-scanner",
      title: { es: "3) Flujo con scanner", en: "3) Scanner workflow" },
      body: {
        es: "Este bloque permite localizar unidades por codigo y ejecutar cambios rapidos de estado.",
        en: "This block lets you locate units by code and execute quick status changes.",
      },
      targetSelector: '[data-help-id="material-instances-scanner"]',
      tip: {
        es: "Ideal para procesos de prestamo, devolucion y mantenimiento en campo.",
        en: "Ideal for loan, return, and maintenance workflows in the field.",
      },
    },
    {
      id: "step-4-stats",
      title: { es: "4) Revisa metricas", en: "4) Review metrics" },
      body: {
        es: "Estas tarjetas muestran disponibilidad general y unidades que requieren atencion.",
        en: "These cards show general availability and units requiring attention.",
      },
      targetSelector: '[data-help-id="material-instances-stats"]',
    },
    {
      id: "step-5-list",
      title: { es: "5) Administra el listado", en: "5) Manage the list" },
      body: {
        es: "Aqui puedes seleccionar, imprimir, revisar detalle y eliminar instancias del inventario.",
        en: "Here you can select, print, inspect details, and delete inventory instances.",
      },
      targetSelector: '[data-help-id="material-instances-list"]',
      warning: {
        es: "Antes de eliminar, verifica si la unidad sigue asociada a operaciones activas.",
        en: "Before deleting, verify whether the unit is still tied to active operations.",
      },
    },
    {
      id: "step-6-pagination",
      title: { es: "6) Recorre resultados", en: "6) Navigate results" },
      body: {
        es: "Usa paginacion para revisar el inventario por bloques cuando crece el volumen.",
        en: "Use pagination to review inventory in blocks as volume grows.",
      },
      targetSelector: '[data-help-id="material-instances-pagination"]',
    },
  ],
  formGuides: materialInstancesFormGuides,
};

export default materialInstancesHelpContent;
