import type { HelpModuleContent } from "../types";

const attributesCreateFormGuide = {
  id: "attributes-create-form",
  title: { es: "Formulario: Crear atributo", en: "Form: Create attribute" },
  purpose: {
    es: "Definir un atributo nuevo para clasificar materiales.",
    en: "Define a new attribute to classify materials.",
  },
  mode: "create" as const,
  selector: '[data-help-id="attributes-form-create"]',
  fields: [
    {
      id: "field-name",
      label: { es: "Nombre", en: "Name" },
      purpose: {
        es: "Identifica el atributo de forma unica.",
        en: "Uniquely identifies the attribute.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="attributes-form-name"]',
    },
    {
      id: "field-unit",
      label: { es: "Unidad", en: "Unit" },
      purpose: {
        es: "Define como se interpreta el valor del atributo.",
        en: "Defines how attribute values are interpreted.",
      },
      dataType: { es: "Texto", en: "Text" },
      selector: '[data-help-id="attributes-form-unit"]',
    },
    {
      id: "field-allowed-values",
      label: { es: "Valores permitidos", en: "Allowed values" },
      purpose: {
        es: "Restringe opciones validas para capturas consistentes.",
        en: "Restricts valid options for consistent data entry.",
      },
      dataType: { es: "Lista", en: "List" },
      selector: '[data-help-id="attributes-form-allowed-values"]',
    },
  ],
  actions: [
    {
      id: "action-create-attribute",
      label: { es: "Crear", en: "Create" },
      purpose: {
        es: "Guardar el nuevo atributo.",
        en: "Save the new attribute.",
      },
      consequence: {
        es: "El atributo queda disponible para tipos de material.",
        en: "Attribute becomes available for material types.",
      },
      selector: '[data-help-id="attributes-form-submit"]',
    },
    {
      id: "action-cancel-create",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar formulario sin guardar.",
        en: "Close form without saving.",
      },
      consequence: {
        es: "Se descartan cambios no guardados.",
        en: "Unsaved changes are discarded.",
      },
      selector: '[data-help-id="attributes-form-cancel"]',
    },
  ],
};

const attributesEditFormGuide = {
  id: "attributes-edit-form",
  title: { es: "Formulario: Editar atributo", en: "Form: Edit attribute" },
  purpose: {
    es: "Actualizar nombre, unidad o valores permitidos de un atributo.",
    en: "Update name, unit or allowed values of an attribute.",
  },
  mode: "edit" as const,
  selector: '[data-help-id="attributes-form-edit"]',
  fields: attributesCreateFormGuide.fields,
  actions: [
    {
      id: "action-save-edit-attribute",
      label: { es: "Guardar", en: "Save" },
      purpose: {
        es: "Aplicar cambios del atributo existente.",
        en: "Apply changes to existing attribute.",
      },
      consequence: {
        es: "Los cambios se reflejan en la configuracion.",
        en: "Changes are reflected in configuration.",
      },
      selector: '[data-help-id="attributes-form-submit"]',
    },
    {
      id: "action-cancel-edit-attribute",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Salir de la edicion sin guardar.",
        en: "Exit editing without saving.",
      },
      consequence: {
        es: "Se mantienen los valores previos.",
        en: "Previous values are preserved.",
      },
      selector: '[data-help-id="attributes-form-cancel"]',
    },
  ],
};

const attributesHelpContent: HelpModuleContent = {
  moduleId: "attributes",
  title: {
    es: "Centro de ayuda: Atributos",
    en: "Help center: Attributes",
  },
  description: {
    es: "Este modulo permite definir atributos reutilizables para enriquecer el catalogo de materiales con metricas y unidades consistentes.",
    en: "This module lets you define reusable attributes to enrich the material catalog with consistent metrics and units.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui administras atributos que luego pueden ser usados por tipos de material para describir medidas, cantidades o propiedades.",
        en: "Here you manage attributes that can later be used by material types to describe measurements, quantities, or properties.",
      },
      tips: [
        {
          es: "Usa nombres y unidades consistentes para evitar ambiguedad en el catalogo.",
          en: "Use consistent names and units to avoid ambiguity in the catalog.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes buscar atributos, crear nuevos, editar existentes y eliminar los que ya no sean necesarios.",
        en: "You can search attributes, create new ones, edit existing ones, and delete those no longer needed.",
      },
      bestPractices: [
        {
          es: "Antes de eliminar un atributo, valida si tipos de material activos aun lo utilizan.",
          en: "Before deleting an attribute, validate whether active material types still use it.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: busca un atributo existente, revisa unidad y valores permitidos, luego crea o ajusta segun necesidad.",
        en: "Recommended flow: search for an existing attribute, review its unit and allowed values, then create or adjust as needed.",
      },
      warnings: [
        {
          es: "Cambiar unidades o valores permitidos puede afectar consistencia en tipos ya configurados.",
          en: "Changing units or allowed values can affect consistency in already configured types.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: crear atributos duplicados con distinta unidad. Normaliza primero el modelo de datos.",
        en: "Common mistake: creating duplicate attributes with different units. Normalize the data model first.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el modulo", en: "1) Understand the module" },
      body: {
        es: "Este encabezado describe el objetivo de los atributos reutilizables.",
        en: "This header describes the purpose of reusable attributes.",
      },
      targetSelector: '[data-help-id="attributes-title"]',
    },
    {
      id: "step-2-search",
      title: { es: "2) Busca atributos", en: "2) Search attributes" },
      body: {
        es: "Usa el buscador para encontrar rapidamente atributos por nombre o unidad.",
        en: "Use the search box to quickly find attributes by name or unit.",
      },
      targetSelector: '[data-help-id="attributes-search"]',
      tip: {
        es: "Buscar antes de crear reduce duplicados innecesarios.",
        en: "Searching before creating reduces unnecessary duplicates.",
      },
    },
    {
      id: "step-3-list",
      title: { es: "3) Revisa el listado", en: "3) Review the list" },
      body: {
        es: "Aqui puedes inspeccionar atributos, sus unidades y valores permitidos, y ejecutar acciones de edicion o eliminacion.",
        en: "Here you can inspect attributes, their units and allowed values, and execute edit or delete actions.",
      },
      targetSelector: '[data-help-id="attributes-list"]',
      warning: {
        es: "Eliminaciones pueden fallar si el atributo esta en uso por tipos de material.",
        en: "Deletions can fail if the attribute is in use by material types.",
      },
    },
    {
      id: "step-4-empty",
      title: { es: "4) Estado vacio", en: "4) Empty state" },
      body: {
        es: "Cuando no hay coincidencias o no existen atributos, este bloque te ayuda a identificarlo rapido.",
        en: "When there are no matches or no attributes exist, this block helps you identify it quickly.",
      },
      targetSelector: '[data-help-id="attributes-empty"]',
    },
  ],
  formGuides: [attributesCreateFormGuide, attributesEditFormGuide],
};

export default attributesHelpContent;
