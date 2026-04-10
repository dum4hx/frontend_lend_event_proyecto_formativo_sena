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
      howTo: [
        {
          es: "Abre el modulo desde Gestion > Roles.",
          en: "Open the module from Management > Roles.",
        },
        {
          es: "Revisa las tarjetas de metricas para entender cobertura y salud del modelo de permisos.",
          en: "Review the metrics cards to understand permission model health and coverage.",
        },
        {
          es: "Haz clic en 'Nuevo rol' para abrir el formulario y definir nombre y permisos del rol.",
          en: "Click 'New role' to open the form and define the role name and permissions.",
        },
      ],
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
      howTo: [
        {
          es: "Para ver permisos: haz clic en el icono de vista de un rol para ver su cobertura detallada.",
          en: "To view permissions: click the view icon on a role to see its detailed coverage.",
        },
        {
          es: "Para editar: localiza el rol custom y usa la accion de edicion para actualizar nombre o permisos.",
          en: "To edit: locate the custom role and use the edit action to update name or permissions.",
        },
        {
          es: "Para eliminar: confirma que el rol no tiene usuarios asignados antes de proceder.",
          en: "To delete: confirm the role has no assigned users before proceeding.",
        },
      ],
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
      howTo: [
        {
          es: "Revisa las tarjetas de metricas para detectar cobertura baja o roles sin permisos.",
          en: "Review the metrics cards to detect low coverage or roles without permissions.",
        },
        {
          es: "Filtra por tipo (sistema/custom) para enfocar la revision donde apliques cambios.",
          en: "Filter by type (system/custom) to focus review where you apply changes.",
        },
        {
          es: "Abre el detalle de permisos del rol antes de editar para entender su alcance actual.",
          en: "Open the role permissions detail before editing to understand its current scope.",
        },
        {
          es: "Aplica la edicion o crea un nuevo rol con los permisos necesarios.",
          en: "Apply the edit or create a new role with the required permissions.",
        },
      ],
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
      howTo: [
        {
          es: "Busca por nombre antes de crear para verificar que no exista un rol equivalente.",
          en: "Search by name before creating to verify an equivalent role doesn't already exist.",
        },
        {
          es: "Compara permisos entre roles similares antes de consolidar; usa la vista de permisos para hacerlo.",
          en: "Compare permissions between similar roles before consolidating; use the permissions view to do so.",
        },
        {
          es: "Si identificas duplicados, asigna los usuarios al rol que continuara y elimina el redundante.",
          en: "If you identify duplicates, reassign users to the surviving role and delete the redundant one.",
        },
      ],
    },
    {
      id: "permission-dependencies",
      title: { es: "Dependencias de permisos", en: "Permission dependencies" },
      body: {
        es: "Algunos permisos requieren otros para funcionar correctamente. El formulario de rol muestra estas dependencias y te avisa cuando faltan permisos requeridos.",
        en: "Some permissions require others to work correctly. The role form shows these dependencies and warns you when required permissions are missing.",
      },
      howTo: [
        {
          es: "Al seleccionar un permiso, busca el indicador de dependencias (icono de eslabón) junto al nombre.",
          en: "When selecting a permission, look for the dependency indicator (link icon) next to the name.",
        },
        {
          es: "Haz clic en el indicador para expandir la lista de permisos requeridos.",
          en: "Click the indicator to expand the list of required permissions.",
        },
        {
          es: "Los permisos satisfechos se muestran en verde; los faltantes en ámbar con opción para agregarlos.",
          en: "Satisfied permissions appear in green; missing ones in amber with an option to add them.",
        },
        {
          es: "Usa el botón '+ Agregar requeridos' para añadir automáticamente los permisos faltantes.",
          en: "Use the '+ Add required' button to automatically add missing permissions.",
        },
      ],
      tips: [
        {
          es: "Si ves un borde ámbar alrededor de un permiso, significa que tiene dependencias no satisfechas.",
          en: "If you see an amber border around a permission, it means it has unsatisfied dependencies.",
        },
      ],
      warnings: [
        {
          es: "Asignar un permiso sin sus dependencias puede causar errores funcionales para el usuario con ese rol.",
          en: "Assigning a permission without its dependencies can cause functional errors for users with that role.",
        },
      ],
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
    {
      id: "step-6-dependencies",
      title: { es: "6) Revisa dependencias de permisos", en: "6) Review permission dependencies" },
      body: {
        es: "Al crear o editar un rol, cada permiso muestra sus dependencias con un indicador de eslabón. Expándelo para ver qué permisos adicionales se requieren y si ya están incluidos en el rol.",
        en: "When creating or editing a role, each permission shows its dependencies with a link indicator. Expand it to see which additional permissions are required and whether they are already included in the role.",
      },
      targetSelector: '[data-help-id="roles-form-permissions"]',
      tip: {
        es: "Los permisos con dependencias faltantes muestran un borde ámbar. Usa '+ Agregar requeridos' para resolverlo rápidamente.",
        en: "Permissions with missing dependencies show an amber border. Use '+ Add required' to resolve it quickly.",
      },
    },
  ],
  formGuides: rolesFormGuides,
};

export default rolesHelpContent;
