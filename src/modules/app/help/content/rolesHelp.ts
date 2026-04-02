import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const rolesFormGuides = createCrudFormGuides({
  baseId: "roles",
  title: {
    create: {
      es: "Formulario: Crear rol",
      en: "Form: Create role",
    },
    edit: {
      es: "Formulario: Editar rol",
      en: "Form: Edit role",
    },
  },
  purpose: {
    create: {
      es: "Definir un nuevo rol y su matriz de permisos.",
      en: "Define a new role and its permission matrix.",
    },
    edit: {
      es: "Actualizar nombre, descripcion y permisos de un rol existente.",
      en: "Update name, description, and permissions of an existing role.",
    },
  },
  selector: {
    create: '[data-help-id="roles-form-create"]',
    edit: '[data-help-id="roles-form-edit"]',
  },
  fields: [
    {
      id: "field-name",
      label: { es: "Nombre del rol", en: "Role name" },
      purpose: {
        es: "Identifica el rol en asignaciones y reportes.",
        en: "Identifies the role in assignments and reports.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="roles-form-name"]',
    },
    {
      id: "field-description",
      label: { es: "Descripcion", en: "Description" },
      purpose: {
        es: "Explica alcance y objetivo del rol para el equipo.",
        en: "Explains scope and purpose of the role to the team.",
      },
      dataType: { es: "Texto multilinea", en: "Multiline text" },
      selector: '[data-help-id="roles-form-description"]',
    },
    {
      id: "field-permissions-search",
      label: { es: "Filtro de permisos", en: "Permissions filter" },
      purpose: {
        es: "Reduce ruido para seleccionar permisos mas rapido.",
        en: "Reduces noise to select permissions faster.",
      },
      dataType: { es: "Busqueda", en: "Search" },
      selector: '[data-help-id="roles-form-permissions-search"]',
    },
    {
      id: "field-permissions",
      label: { es: "Permisos", en: "Permissions" },
      purpose: {
        es: "Define capacidades operativas del rol.",
        en: "Defines operational capabilities for the role.",
      },
      dataType: { es: "Seleccion multiple", en: "Multi-select" },
      required: true,
      validations: [
        { es: "Debe incluir al menos un permiso", en: "Must include at least one permission" },
      ],
      selector: '[data-help-id="roles-form-permissions"]',
    },
  ],
  actions: {
    create: [
      {
        id: "action-create-role",
        label: { es: "Crear rol", en: "Create role" },
        purpose: {
          es: "Guarda un nuevo rol para asignarlo a usuarios.",
          en: "Saves a new role to assign to users.",
        },
        consequence: {
          es: "El rol aparece disponible en formularios de usuarios.",
          en: "The role becomes available in user forms.",
        },
        selector: '[data-help-id="roles-form-submit"]',
      },
      {
        id: "action-create-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Salir sin guardar el rol.",
          en: "Exit without saving the role.",
        },
        consequence: {
          es: "Se descartan cambios no guardados.",
          en: "Unsaved changes are discarded.",
        },
        selector: '[data-help-id="roles-form-cancel"]',
      },
    ],
    edit: [
      {
        id: "action-edit-role",
        label: { es: "Guardar cambios", en: "Save changes" },
        purpose: {
          es: "Aplica modificaciones al rol existente.",
          en: "Applies changes to the existing role.",
        },
        consequence: {
          es: "Usuarios con ese rol heredan permisos actualizados.",
          en: "Users with this role inherit updated permissions.",
        },
        selector: '[data-help-id="roles-form-submit"]',
      },
      {
        id: "action-edit-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Cerrar edicion sin confirmar cambios.",
          en: "Close editing without confirming changes.",
        },
        consequence: {
          es: "Permanece configuracion previa del rol.",
          en: "Role previous configuration remains.",
        },
        selector: '[data-help-id="roles-form-cancel"]',
      },
    ],
  },
});

const rolesHelpContent: HelpModuleContent = {
  moduleId: "roles",
  title: {
    es: "Centro de ayuda: Roles",
    en: "Help center: Roles",
  },
  description: {
    es: "Este modulo permite definir roles y controlar permisos para una administracion segura y escalable.",
    en: "This module lets you define roles and control permissions for secure and scalable administration.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes crear, editar y eliminar roles personalizados, y revisar cobertura de permisos frente al catalogo disponible.",
        en: "Here you can create, edit, and delete custom roles, and review permission coverage against the available catalog.",
      },
      tips: [
        {
          es: "Mantener pocos roles bien definidos facilita auditoria y soporte.",
          en: "Keeping fewer well-defined roles makes auditing and support easier.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes buscar roles, ordenar por nombre/tipo/permisos, ajustar paginacion y ver permisos por rol.",
        en: "You can search roles, sort by name/type/permissions, adjust pagination, and preview role permissions.",
      },
      bestPractices: [
        {
          es: "Usa roles de sistema como referencia y crea roles custom solo cuando sea necesario.",
          en: "Use system roles as baseline and create custom roles only when needed.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: revisa metricas, filtra y ordena, valida permisos del rol y luego aplica edicion o creacion.",
        en: "Recommended flow: review metrics, filter and sort, validate role permissions, then apply edit or creation.",
      },
      warnings: [
        {
          es: "Eliminar un rol puede afectar acceso de usuarios asignados.",
          en: "Deleting a role can affect access for assigned users.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: crear roles muy similares. Prefiere consolidar para reducir complejidad operativa.",
        en: "Common mistake: creating highly similar roles. Prefer consolidation to reduce operational complexity.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el modulo", en: "1) Understand the module" },
      body: {
        es: "El encabezado resume el objetivo de gobernanza de roles y ofrece acceso rapido a crear un nuevo rol.",
        en: "The header summarizes role governance goals and gives quick access to create a new role.",
      },
      targetSelector: '[data-help-id="roles-title"]',
    },
    {
      id: "step-2-metrics",
      title: { es: "2) Analiza metricas", en: "2) Analyze metrics" },
      body: {
        es: "Estas tarjetas muestran salud del modelo de permisos y cobertura actual.",
        en: "These cards show permission model health and current coverage.",
      },
      targetSelector: '[data-help-id="roles-stats"]',
      tip: {
        es: "Cobertura baja puede indicar permisos no utilizados o roles incompletos.",
        en: "Low coverage can indicate unused permissions or incomplete roles.",
      },
    },
    {
      id: "step-3-filters",
      title: { es: "3) Busca y ordena", en: "3) Search and sort" },
      body: {
        es: "Usa buscador, orden y tamano de pagina para enfocarte en roles relevantes.",
        en: "Use search, sorting, and page size to focus on relevant roles.",
      },
      targetSelector: '[data-help-id="roles-filters"]',
    },
    {
      id: "step-4-table",
      title: { es: "4) Ejecuta acciones", en: "4) Execute actions" },
      body: {
        es: "Desde la lista puedes ver permisos, editar o eliminar roles segun restricciones.",
        en: "From the list you can preview permissions, edit, or delete roles depending on restrictions.",
      },
      targetSelector: '[data-help-id="roles-table"]',
      warning: {
        es: "Valida impacto antes de eliminar un rol en uso.",
        en: "Validate impact before deleting a role in use.",
      },
    },
    {
      id: "step-5-pagination",
      title: { es: "5) Recorre resultados", en: "5) Navigate results" },
      body: {
        es: "La paginacion te ayuda a revisar todos los roles cuando el catalogo crece.",
        en: "Pagination helps you review all roles as the catalog grows.",
      },
      targetSelector: '[data-help-id="roles-pagination"]',
    },
  ],
  formGuides: rolesFormGuides,
};

export default rolesHelpContent;
