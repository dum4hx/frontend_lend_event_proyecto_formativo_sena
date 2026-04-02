import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const materialTypesFormGuides = createCrudFormGuides({
  baseId: "material-types",
  title: {
    create: {
      es: "Formulario: Crear tipo de material",
      en: "Form: Create material type",
    },
    edit: {
      es: "Formulario: Editar tipo de material",
      en: "Form: Edit material type",
    },
  },
  purpose: {
    create: {
      es: "Registrar un tipo de material con categoria, precio y especificaciones.",
      en: "Register a material type with category, price, and specifications.",
    },
    edit: {
      es: "Actualizar configuracion de un tipo existente sin perder trazabilidad.",
      en: "Update configuration of an existing type without losing traceability.",
    },
  },
  selector: {
    create: '[data-help-id="material-types-form-create"]',
    edit: '[data-help-id="material-types-form-edit"]',
  },
  fields: [
    {
      id: "field-categories",
      label: { es: "Categorias", en: "Categories" },
      purpose: {
        es: "Relaciona el tipo con grupos de catalogo y atributos requeridos.",
        en: "Links the type to catalog groups and required attributes.",
      },
      dataType: { es: "Seleccion multiple", en: "Multi-select" },
      required: true,
      selector: '[data-help-id="material-types-form-categories"]',
    },
    {
      id: "field-name",
      label: { es: "Nombre", en: "Name" },
      purpose: {
        es: "Nombre comercial del tipo de material.",
        en: "Commercial name of the material type.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="material-types-form-name"]',
    },
    {
      id: "field-price",
      label: { es: "Precio diario", en: "Daily price" },
      purpose: {
        es: "Define tarifa base para cotizacion y facturacion.",
        en: "Defines base rate for quoting and billing.",
      },
      dataType: { es: "Moneda", en: "Currency" },
      required: true,
      selector: '[data-help-id="material-types-form-price-per-day"]',
    },
    {
      id: "field-description",
      label: { es: "Descripcion", en: "Description" },
      purpose: {
        es: "Agrega contexto tecnico y de uso del tipo.",
        en: "Adds technical and usage context for the type.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="material-types-form-description"]',
    },
  ],
  actions: {
    create: [
      {
        id: "action-create-type",
        label: { es: "Guardar", en: "Save" },
        purpose: {
          es: "Crea el nuevo tipo de material.",
          en: "Creates the new material type.",
        },
        consequence: {
          es: "Queda disponible para crear instancias y cotizar.",
          en: "Becomes available to create instances and quote.",
        },
        selector: '[data-help-id="material-types-form-submit"]',
      },
      {
        id: "action-create-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Cierra sin guardar cambios.",
          en: "Closes without saving changes.",
        },
        consequence: {
          es: "Se descartan datos no guardados.",
          en: "Unsaved data is discarded.",
        },
        selector: '[data-help-id="material-types-form-cancel"]',
      },
    ],
    edit: [
      {
        id: "action-edit-type",
        label: { es: "Actualizar", en: "Update" },
        purpose: {
          es: "Guarda ajustes del tipo existente.",
          en: "Saves updates to the existing type.",
        },
        consequence: {
          es: "Catalogo y reglas usan la nueva configuracion.",
          en: "Catalog and rules use the new configuration.",
        },
        selector: '[data-help-id="material-types-form-submit"]',
      },
      {
        id: "action-edit-cancel",
        label: { es: "Descartar", en: "Discard" },
        purpose: {
          es: "Salir sin aplicar cambios.",
          en: "Exit without applying changes.",
        },
        consequence: {
          es: "Se conserva configuracion actual.",
          en: "Current configuration is preserved.",
        },
        selector: '[data-help-id="material-types-form-cancel"]',
      },
    ],
  },
});

const materialTypesHelpContent: HelpModuleContent = {
  moduleId: "material-types",
  title: {
    es: "Centro de ayuda: Tipos de material",
    en: "Help center: Material types",
  },
  description: {
    es: "Este modulo gestiona los tipos de material que luego alimentan el catalogo operativo y de alquiler.",
    en: "This module manages material types that later feed the operational and rental catalog.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes buscar, filtrar por categoria, importar, crear y mantener tipos de material.",
        en: "Here you can search, filter by category, import, create, and maintain material types.",
      },
      tips: [
        {
          es: "Relaciona siempre cada tipo con una categoria correcta para facilitar reportes y busquedas.",
          en: "Always relate each type to the correct category to improve reporting and searchability.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes buscar por nombre, filtrar por categoria, importar datos y administrar cada tipo desde el listado.",
        en: "You can search by name, filter by category, import data, and manage each type from the list.",
      },
      bestPractices: [
        {
          es: "Antes de importar, valida que las categorias referenciadas existan en el sistema.",
          en: "Before importing, validate that referenced categories exist in the system.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: busca un tipo, aplica filtros por categoria, revisa metricas y luego crea o edita registros.",
        en: "Recommended flow: search for a type, apply category filters, review metrics, then create or edit records.",
      },
      warnings: [
        {
          es: "Eliminar tipos de material puede afectar flujos ligados a catalogo e inventario.",
          en: "Deleting material types can affect catalog and inventory-related flows.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: importar tipos con categoryId invalido o no existente. Verifica categorias antes del proceso.",
        en: "Common mistake: importing types with invalid or missing categoryId. Verify categories before the process.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del catalogo", en: "1) Catalog context" },
      body: {
        es: "Este encabezado explica el objetivo del catalogo de tipos de material.",
        en: "This header explains the goal of the material types catalog.",
      },
      targetSelector: '[data-help-id="material-types-title"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Busca y crea", en: "2) Search and create" },
      body: {
        es: "Desde esta barra puedes buscar, importar y crear nuevos tipos de material.",
        en: "From this bar you can search, import, and create new material types.",
      },
      targetSelector: '[data-help-id="material-types-actions"]',
    },
    {
      id: "step-3-filters",
      title: { es: "3) Filtra por categoria", en: "3) Filter by category" },
      body: {
        es: "Usa estas pills para enfocar el listado por categoria y analizar volumen por grupo.",
        en: "Use these pills to focus the list by category and analyze volume by group.",
      },
      targetSelector: '[data-help-id="material-types-category-filters"]',
      tip: {
        es: "Combinar texto y categoria reduce ruido cuando el catalogo crece.",
        en: "Combining text and category reduces noise as the catalog grows.",
      },
    },
    {
      id: "step-4-stats",
      title: { es: "4) Revisa metricas", en: "4) Review metrics" },
      body: {
        es: "Estas tarjetas muestran volumen total y resultados visibles despues del filtrado.",
        en: "These cards show total volume and visible results after filtering.",
      },
      targetSelector: '[data-help-id="material-types-stats"]',
    },
    {
      id: "step-5-list",
      title: { es: "5) Gestiona registros", en: "5) Manage records" },
      body: {
        es: "Aqui puedes abrir detalle, editar o eliminar tipos de material existentes.",
        en: "Here you can open details, edit, or delete existing material types.",
      },
      targetSelector: '[data-help-id="material-types-list"]',
      warning: {
        es: "Confirma dependencias antes de eliminar un tipo ya utilizado.",
        en: "Confirm dependencies before deleting a type already in use.",
      },
    },
    {
      id: "step-6-pagination",
      title: { es: "6) Recorre resultados", en: "6) Navigate results" },
      body: {
        es: "La paginacion te ayuda a revisar todo el catalogo de tipos por bloques.",
        en: "Pagination helps you review the full types catalog in blocks.",
      },
      targetSelector: '[data-help-id="material-types-pagination"]',
    },
  ],
  formGuides: materialTypesFormGuides,
};

export default materialTypesHelpContent;
