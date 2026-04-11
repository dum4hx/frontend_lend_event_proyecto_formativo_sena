import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const teamFormGuides = createCrudFormGuides({
  baseId: "team-member",
  title: {
    create: {
      es: "Formulario: Invitar miembro",
      en: "Form: Invite member",
    },
    edit: {
      es: "Formulario: Editar miembro",
      en: "Form: Edit member",
    },
  },
  purpose: {
    create: {
      es: "Registrar y enviar invitacion a un nuevo miembro del equipo.",
      en: "Register and send an invitation to a new team member.",
    },
    edit: {
      es: "Actualizar datos de un miembro existente manteniendo control de acceso.",
      en: "Update an existing member while maintaining access control.",
    },
  },
  selector: {
    create: '[data-help-id="team-form-create"]',
    edit: '[data-help-id="team-form-edit"]',
  },
  fields: [
    {
      id: "field-first-name",
      label: { es: "Nombre", en: "First name" },
      purpose: {
        es: "Identifica al miembro en comunicaciones y reportes.",
        en: "Identifies the member across communications and reports.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      validations: [{ es: "Solo letras y espacios", en: "Letters and spaces only" }],
      selector: '[data-help-id="team-form-first-name"]',
    },
    {
      id: "field-last-name",
      label: { es: "Apellido", en: "Last name" },
      purpose: {
        es: "Completa identidad legal para auditoria y soporte.",
        en: "Completes legal identity for auditing and support.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="team-form-last-name"]',
    },
    {
      id: "field-email",
      label: { es: "Correo", en: "Email" },
      purpose: {
        es: "Canal para enviar invitacion y acceso inicial.",
        en: "Channel to send invitation and initial access.",
      },
      dataType: { es: "Email", en: "Email" },
      required: true,
      validations: [{ es: "Formato de email valido", en: "Valid email format" }],
      example: { es: "persona@empresa.com", en: "person@company.com" },
      selector: '[data-help-id="team-form-email"]',
    },
    {
      id: "field-phone",
      label: { es: "Telefono", en: "Phone" },
      purpose: {
        es: "Permite contacto operativo y notificaciones criticas.",
        en: "Allows operational contact and critical notifications.",
      },
      dataType: { es: "Numerico", en: "Numeric" },
      required: true,
      selector: '[data-help-id="team-form-phone"]',
    },
    {
      id: "field-role",
      label: { es: "Rol", en: "Role" },
      purpose: {
        es: "Define alcance de permisos dentro de la plataforma.",
        en: "Defines permission scope inside the platform.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      selector: '[data-help-id="team-form-role"]',
    },
    {
      id: "field-location",
      label: { es: "Ubicacion", en: "Location" },
      purpose: {
        es: "Asigna las sedes operativas del usuario segun su rol.",
        en: "Assigns the user's operating locations according to role.",
      },
      dataType: { es: "Seleccion dinamica", en: "Dynamic select" },
      required: true,
      validations: [
        {
          es: "Dueño: multiples ubicaciones. Otros roles: una sola ubicacion",
          en: "Owner: multiple locations. Other roles: a single location",
        },
      ],
      selector: '[data-help-id="team-form-locations"]',
    },
  ],
  actions: {
    create: [
      {
        id: "action-invite-submit",
        label: { es: "Enviar invitacion", en: "Send invitation" },
        purpose: {
          es: "Crea el usuario y dispara el correo de invitacion.",
          en: "Creates the user and triggers invitation email.",
        },
        consequence: {
          es: "El miembro queda pendiente hasta aceptar la invitacion.",
          en: "The member stays pending until the invitation is accepted.",
        },
        selector: '[data-help-id="team-form-create"] button[type="submit"]',
      },
      {
        id: "action-invite-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Salir sin enviar la invitacion.",
          en: "Exit without sending the invitation.",
        },
        consequence: {
          es: "Se descartan los datos del formulario.",
          en: "Form data is discarded.",
        },
        selector: '[data-help-id="team-form-create"] button.btn-secondary',
      },
    ],
    edit: [
      {
        id: "action-edit-submit",
        label: { es: "Guardar cambios", en: "Save changes" },
        purpose: {
          es: "Actualiza datos de perfil, rol y la ubicacion asignada del miembro.",
          en: "Updates member profile, role, and assigned location.",
        },
        consequence: {
          es: "Los cambios impactan inmediatamente la operacion del usuario.",
          en: "Changes immediately impact user operations.",
        },
        selector: '[data-help-id="team-form-edit"] button[type="submit"]',
      },
      {
        id: "action-edit-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Cerrar edicion sin guardar cambios.",
          en: "Close editing without saving changes.",
        },
        consequence: {
          es: "Se descartan ajustes no guardados.",
          en: "Unsaved changes are discarded.",
        },
        selector: '[data-help-id="team-form-edit"] button.btn-secondary',
      },
    ],
  },
});

const teamHelpContent: HelpModuleContent = {
  moduleId: "team",
  title: {
    es: "Centro de ayuda: Equipo",
    en: "Help center: Team",
  },
  description: {
    es: "Este modulo permite gestionar miembros, roles y estado de acceso para mantener una operacion segura y ordenada.",
    en: "This module lets you manage members, roles, and access status to keep operations secure and organized.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes invitar miembros, editar perfiles y controlar su acceso a la plataforma.",
        en: "Here you can invite members, edit profiles, and control platform access.",
      },
      howTo: [
        {
          es: "Abre el modulo desde Gestion > Equipo.",
          en: "Open the module from Management > Team.",
        },
        {
          es: "Usa el buscador y filtros de estado/rol para localizar el miembro que necesitas gestionar.",
          en: "Use the search box and status/role filters to locate the member you need to manage.",
        },
        {
          es: "Haz clic en 'Invitar miembro' para enviar una invitacion con el rol correcto ya seleccionado.",
          en: "Click 'Invite member' to send an invitation with the correct role already selected.",
        },
      ],
      tips: [
        {
          es: "Asigna roles con permisos minimos necesarios para reducir riesgos.",
          en: "Assign least-privilege roles to reduce risk.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Filtra por nombre, rol y estado, revisa la tabla y ejecuta acciones como invitar, editar, desactivar y reactivar.",
        en: "Filter by name, role, and status, inspect the table, and run actions like invite, edit, deactivate, and reactivate.",
      },
      howTo: [
        {
          es: "Para invitar: haz clic en 'Invitar', ingresa el email y selecciona rol. Si es Dueño puedes elegir varias sedes; en otros roles solo una.",
          en: "To invite: click 'Invite', enter the email, and select role. Owner can have multiple locations; other roles can only have one.",
        },
        {
          es: "Para editar perfil: localiza el miembro y usa el icono de edicion para actualizar rol o datos.",
          en: "To edit profile: locate the member and use the edit icon to update role or data.",
        },
        {
          es: "Para desactivar/reactivar: usa la accion de estado disponible en la fila del miembro.",
          en: "To deactivate/reactivate: use the status action available in the member row.",
        },
      ],
      bestPractices: [
        {
          es: "Revisa miembros inactivos periodicamente para mantener orden administrativo.",
          en: "Review inactive members periodically to maintain admin hygiene.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: revisa resumen, aplica filtros, valida detalle y luego ejecuta cambios de estado o perfil.",
        en: "Recommended flow: review summary, apply filters, validate details, then execute profile or status changes.",
      },
      howTo: [
        {
          es: "Revisa las metricas del encabezado para ver estado global del equipo.",
          en: "Review header metrics to see the team's overall status.",
        },
        {
          es: "Filtra por estado 'Activo' o 'Inactivo' para identificar casos que necesitan atencion.",
          en: "Filter by 'Active' or 'Inactive' status to identify cases that need attention.",
        },
        {
          es: "Abre el detalle del miembro para validar rol y accesos antes de hacer cambios.",
          en: "Open the member detail to validate role and access before making changes.",
        },
        {
          es: "Aplica el cambio de estado (desactivar/reactivar) o actualiza el perfil segun sea necesario.",
          en: "Apply the status change (deactivate/reactivate) or update the profile as needed.",
        },
      ],
      warnings: [
        {
          es: "Desactivar un miembro retira su acceso inmediatamente.",
          en: "Deactivating a member removes access immediately.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Errores frecuentes: invitar usuarios sin validar rol esperado o con asignacion de sedes incompatible con el rol. Confirma permisos y sedes antes de enviar invitacion.",
        en: "Common mistakes: inviting users without validating intended role or with role-incompatible location assignment. Confirm permissions and locations before sending invites.",
      },
      howTo: [
        {
          es: "Antes de invitar, revisa la tabla de roles disponibles y confirma el rol correcto para el nuevo miembro.",
          en: "Before inviting, review the available roles table and confirm the correct role for the new member.",
        },
        {
          es: "Si el invitado no recibio el correo, verifica que el email ingresado es correcto y reenvía la invitacion.",
          en: "If the invitee didn't receive the email, verify the address entered is correct and resend the invitation.",
        },
        {
          es: "Para cambiar el rol de un miembro existente, usa la edicion de perfil en lugar de reinvitar.",
          en: "To change an existing member's role, use the profile edit instead of re-inviting.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Entiende el contexto", en: "1) Understand context" },
      body: {
        es: "El encabezado explica el objetivo del modulo y su accion principal.",
        en: "The header explains module purpose and its primary action.",
      },
      targetSelector: '[data-help-id="team-title"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Revisa resumen", en: "2) Review summary" },
      body: {
        es: "Estas metricas muestran estado global del equipo por actividad e invitaciones.",
        en: "These metrics show team global status by activity and invitations.",
      },
      targetSelector: '[data-help-id="team-stats"]',
    },
    {
      id: "step-3-filters",
      title: { es: "3) Aplica filtros", en: "3) Apply filters" },
      body: {
        es: "Usa filtros para encontrar rapidamente miembros por rol, estado o texto.",
        en: "Use filters to quickly find members by role, status, or text.",
      },
      targetSelector: '[data-help-id="team-filters"]',
      tip: {
        es: "Filtrar antes de editar reduce errores en equipos grandes.",
        en: "Filtering before editing reduces mistakes in large teams.",
      },
    },
    {
      id: "step-4-table",
      title: { es: "4) Gestiona miembros", en: "4) Manage members" },
      body: {
        es: "Desde la tabla puedes abrir detalle, editar y cambiar estado de miembros.",
        en: "From the table you can open details, edit, and change member status.",
      },
      targetSelector: '[data-help-id="team-table"]',
      warning: {
        es: "Antes de desactivar, confirma impacto operativo con el lider del area.",
        en: "Before deactivating, confirm operational impact with the area lead.",
      },
    },
    {
      id: "step-5-pagination",
      title: { es: "5) Navega resultados", en: "5) Navigate results" },
      body: {
        es: "Si hay varios registros, usa paginacion para revisar todo el equipo.",
        en: "If there are many records, use pagination to review the full team.",
      },
      targetSelector: '[data-help-id="team-pagination"]',
    },
  ],
  formGuides: teamFormGuides,
};

export default teamHelpContent;
