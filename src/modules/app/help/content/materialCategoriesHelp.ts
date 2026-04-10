import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const materialCategoriesFormGuides = createCrudFormGuides({
  baseId: "material-categories",
  title: {
    create: {
      es: "Formulario: Crear categoria",
      en: "Form: Create category",
    },
    edit: {
      es: "Formulario: Editar categoria",
      en: "Form: Edit category",
    },
  },
  purpose: {
    create: {
      es: "Crear una categoria base para organizar tipos de material.",
      en: "Create a base category to organize material types.",
    },
    edit: {
      es: "Actualizar metadatos y atributos de una categoria existente.",
      en: "Update metadata and attributes of an existing category.",
    },
  },
  selector: {
    create: '[data-help-id="material-categories-form-create"]',
    edit: '[data-help-id="material-categories-form-edit"]',
  },
  fields: [
    {
      id: "field-name",
      label: { es: "Nombre de categoria", en: "Category name" },
      purpose: {
        es: "Nombre oficial para clasificar materiales.",
        en: "Official name used to classify materials.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="material-categories-form-name"]',
    },
    {
      id: "field-description",
      label: { es: "Descripcion", en: "Description" },
      purpose: {
        es: "Describe alcance de la categoria para el equipo.",
        en: "Describes category scope for the team.",
      },
      dataType: { es: "Texto multilinea", en: "Multiline text" },
      required: true,
      selector: '[data-help-id="material-categories-form-description"]',
    },
    {
      id: "field-attributes",
      label: { es: "Atributos", en: "Attributes" },
      purpose: {
        es: "Define campos tecnicos heredados por tipos de material.",
        en: "Defines technical fields inherited by material types.",
      },
      dataType: { es: "Seleccion multiple", en: "Multi-select" },
      selector: '[data-help-id="material-categories-form-attributes"]',
    },
  ],
  actions: {
    create: [
      {
        id: "action-create-category",
        label: { es: "Crear categoria", en: "Create category" },
        purpose: {
          es: "Guarda la nueva categoria en el catalogo.",
          en: "Saves the new category in the catalog.",
        },
        consequence: {
          es: "La categoria queda disponible para nuevos tipos.",
          en: "Category becomes available for new types.",
        },
        selector: '[data-help-id="material-categories-form-submit"]',
      },
      {
        id: "action-create-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Cerrar formulario sin guardar.",
          en: "Close form without saving.",
        },
        consequence: {
          es: "Se descartan datos pendientes.",
          en: "Pending data is discarded.",
        },
        selector: '[data-help-id="material-categories-form-cancel"]',
      },
    ],
    edit: [
      {
        id: "action-edit-category",
        label: { es: "Actualizar categoria", en: "Update category" },
        purpose: {
          es: "Aplica cambios de nombre, descripcion o atributos.",
          en: "Applies changes to name, description, or attributes.",
        },
        consequence: {
          es: "Tipos vinculados veran reglas actualizadas.",
          en: "Linked types will use updated rules.",
        },
        selector: '[data-help-id="material-categories-form-submit"]',
      },
      {
        id: "action-edit-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Salir sin aplicar cambios.",
          en: "Exit without applying changes.",
        },
        consequence: {
          es: "Se mantiene configuracion actual.",
          en: "Current configuration remains.",
        },
        selector: '[data-help-id="material-categories-form-cancel"]',
      },
    ],
  },
});

const materialCategoriesHelpContent: HelpModuleContent = {
  moduleId: "material-categories",
  title: {
    es: "Centro de ayuda: Categorias de materiales",
    en: "Help center: Material categories",
  },
  description: {
    es: "Este modulo organiza el catalogo base de categorias para estructurar materiales e importaciones.",
    en: "This module organizes the base category catalog used to structure materials and imports.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes buscar, crear, importar y administrar categorias del catalogo de materiales.",
        en: "Here you can search, create, import, and manage material catalog categories.",
      },
      howTo: [
        {
          es: "Abre el modulo desde el menu lateral en Materiales > Categorias.",
          en: "Open the module from the sidebar under Materials > Categories.",
        },
        {
          es: "Usa la barra de busqueda para localizar una categoria existente antes de crear una nueva.",
          en: "Use the search bar to locate an existing category before creating a new one.",
        },
        {
          es: "Haz clic en un registro para ver detalles, editar atributos o eliminar la categoria.",
          en: "Click a record to view details, edit attributes, or delete the category.",
        },
      ],
      tips: [
        {
          es: "Mantener nombres consistentes mejora la calidad de catalogacion aguas abajo.",
          en: "Keeping names consistent improves downstream catalog quality.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes filtrar por texto, exportar/importar categorias, crear nuevas y administrar cada registro del listado.",
        en: "You can filter by text, export/import categories, create new ones, and manage each list entry.",
      },
      howTo: [
        {
          es: "Para crear: haz clic en 'Nueva categoria', ingresa nombre, descripcion y atributos, y guarda.",
          en: "To create: click 'New category', enter name, description, and attributes, then save.",
        },
        {
          es: "Para exportar: haz clic en el boton Exportar para descargar el listado en CSV.",
          en: "To export: click the Export button to download the list as CSV.",
        },
        {
          es: "Para importar: descarga la plantilla, completa los campos y carga el archivo.",
          en: "To import: download the template, fill in the fields, and upload the file.",
        },
        {
          es: "Para eliminar: selecciona la categoria, abre acciones y confirma la eliminacion.",
          en: "To delete: select the category, open actions, and confirm deletion.",
        },
      ],
      bestPractices: [
        {
          es: "Antes de importar en lote, valida duplicados y convenciones de nombres.",
          en: "Before batch import, validate duplicates and naming conventions.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: busca categoria existente, revisa estadisticas, importa o crea nuevas y luego valida el listado final.",
        en: "Recommended flow: search for an existing category, review stats, import or create new ones, then validate the final list.",
      },
      howTo: [
        {
          es: "Escribe parte del nombre en el buscador para verificar duplicados.",
          en: "Type part of the name in the search box to check for duplicates.",
        },
        {
          es: "Revisa las tarjetas de estadisticas para ver el total y los visibles con filtro activo.",
          en: "Review the stats cards to see total and visible counts with active filter.",
        },
        {
          es: "Si no existe, usa 'Nueva categoria' para crear con nombre y atributos correctos.",
          en: "If none exists, use 'New category' to create with the correct name and attributes.",
        },
        {
          es: "Verifica el listado final para confirmar que la nueva categoria aparece correctamente.",
          en: "Verify the final list to confirm the new category appears correctly.",
        },
      ],
      warnings: [
        {
          es: "Eliminar categorias puede impactar procesos relacionados si ya estan siendo usadas.",
          en: "Deleting categories may impact related processes if they are already in use.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: crear categorias duplicadas con nombres similares. Usa el buscador antes de agregar nuevas.",
        en: "Common mistake: creating duplicate categories with similar names. Use search before adding new ones.",
      },
      howTo: [
        {
          es: "Antes de crear, busca el nombre exacto o variantes en el campo de busqueda.",
          en: "Before creating, search for the exact name or variations in the search field.",
        },
        {
          es: "Si el resultado muestra una categoria similar, edita la existente en lugar de crear una nueva.",
          en: "If the result shows a similar category, edit the existing one instead of creating a new one.",
        },
        {
          es: "Usa nombres claros y estandarizados para reducir confusion futura.",
          en: "Use clear, standardized names to reduce future confusion.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del catalogo", en: "1) Catalog context" },
      body: {
        es: "Este encabezado resume la finalidad del catalogo de categorias.",
        en: "This header summarizes the purpose of the categories catalog.",
      },
      targetSelector: '[data-help-id="material-categories-title"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Busca e incorpora", en: "2) Search and add" },
      body: {
        es: "Desde esta barra puedes buscar, importar datos y crear nuevas categorias.",
        en: "From this bar you can search, import data, and create new categories.",
      },
      targetSelector: '[data-help-id="material-categories-actions"]',
      tip: {
        es: "Busca primero para evitar duplicados antes de crear o importar.",
        en: "Search first to avoid duplicates before creating or importing.",
      },
    },
    {
      id: "step-3-stats",
      title: { es: "3) Revisa metricas", en: "3) Review metrics" },
      body: {
        es: "Estas tarjetas muestran el tamano total del catalogo y los resultados filtrados.",
        en: "These cards show total catalog size and filtered results.",
      },
      targetSelector: '[data-help-id="material-categories-stats"]',
    },
    {
      id: "step-4-list",
      title: { es: "4) Administra el listado", en: "4) Manage the list" },
      body: {
        es: "Aqui puedes revisar registros, abrir detalle, editar o eliminar categorias.",
        en: "Here you can review records, open details, edit, or delete categories.",
      },
      targetSelector: '[data-help-id="material-categories-list"]',
      warning: {
        es: "Confirma dependencias antes de eliminar categorias existentes.",
        en: "Confirm dependencies before deleting existing categories.",
      },
    },
    {
      id: "step-5-pagination",
      title: { es: "5) Recorre resultados", en: "5) Navigate results" },
      body: {
        es: "Usa paginacion para revisar todo el catalogo cuando el volumen crece.",
        en: "Use pagination to review the entire catalog as volume grows.",
      },
      targetSelector: '[data-help-id="material-categories-pagination"]',
    },
  ],
  formGuides: materialCategoriesFormGuides,
};

export default materialCategoriesHelpContent;
