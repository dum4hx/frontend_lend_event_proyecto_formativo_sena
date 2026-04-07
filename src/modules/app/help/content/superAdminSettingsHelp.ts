import type { HelpModuleContent } from "../types";

const superAdminSettingsHelpContent: HelpModuleContent = {
  moduleId: "super-admin-settings",
  title: {
    es: "Centro de ayuda: Configuracion del sistema",
    en: "Help center: System Settings",
  },
  description: {
    es: "Configura parametros globales de la plataforma, seguridad, notificaciones, apariencia, cuenta personal y estado de salud.",
    en: "Configure global platform parameters, security, notifications, appearance, personal account, and platform health.",
  },
  sections: [
    {
      id: "overview",
      title: { es: "Vista general", en: "Overview" },
      body: {
        es: "La pagina de configuracion del sistema esta dividida en secciones de tarjetas: General, Seguridad, Notificaciones, Apariencia, Cuenta y Salud de la plataforma.",
        en: "The system settings page is divided into card sections: General, Security, Notifications, Appearance, Account, and Platform Health.",
      },
    },
    {
      id: "account",
      title: { es: "Cuenta", en: "Account" },
      body: {
        es: "En esta seccion puedes actualizar tu informacion personal (nombre, apellidos, correo, telefono) y cambiar tu contrasena.",
        en: "In this section you can update your personal information (name, surnames, email, phone) and change your password.",
      },
      howTo: [
        {
          es: "Edita los campos de tu perfil y haz clic en 'Guardar perfil' para confirmar los cambios.",
          en: "Edit your profile fields and click 'Save Profile' to confirm changes.",
        },
        {
          es: "Para cambiar la contrasena, ingresa la contrasena actual, la nueva contrasena y confirmala. Haz clic en 'Cambiar contrasena'.",
          en: "To change the password, enter the current password, the new password and confirm it. Click 'Change Password'.",
        },
      ],
      tips: [
        {
          es: "La nueva contrasena debe tener al menos 8 caracteres.",
          en: "The new password must be at least 8 characters long.",
        },
        {
          es: "Despues de guardar el perfil, los datos se actualizan automaticamente en toda la aplicacion.",
          en: "After saving the profile, data is automatically updated across the application.",
        },
      ],
      warnings: [
        {
          es: "Si cambias tu correo electronico, asegurate de que el nuevo correo sea valido. No se envia verificacion adicional.",
          en: "If you change your email, make sure the new email is valid. No additional verification is sent.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "account-section",
      title: { es: "Seccion de Cuenta", en: "Account Section" },
      body: {
        es: "Aqui puedes modificar tu perfil personal y cambiar tu contrasena de acceso.",
        en: "Here you can modify your personal profile and change your access password.",
      },
      targetSelector: '[data-help-id="sa-account-section"]',
    },
    {
      id: "save-profile",
      title: { es: "Guardar perfil", en: "Save Profile" },
      body: {
        es: "Haz clic en este boton para guardar los cambios de tu perfil.",
        en: "Click this button to save your profile changes.",
      },
      targetSelector: '[data-help-id="sa-account-save-profile"]',
    },
    {
      id: "change-password",
      title: { es: "Cambiar contrasena", en: "Change Password" },
      body: {
        es: "Ingresa tu contrasena actual, la nueva contrasena y confirmala. Luego haz clic aqui.",
        en: "Enter your current password, the new password and confirm it. Then click here.",
      },
      targetSelector: '[data-help-id="sa-account-change-password"]',
    },
  ],
  formGuides: [
    {
      id: "edit-profile",
      title: { es: "Editar perfil", en: "Edit Profile" },
      purpose: {
        es: "Actualizar la informacion personal del super administrador.",
        en: "Update the super admin's personal information.",
      },
      mode: "edit",
      fields: [
        {
          id: "firstName",
          label: { es: "Primer nombre", en: "First Name" },
          purpose: { es: "Nombre del usuario.", en: "User first name." },
          dataType: "text",
          required: true,
          example: "Carlos",
          selector: '[data-help-id="sa-account-first-name"]',
        },
        {
          id: "firstSurname",
          label: { es: "Primer apellido", en: "First Surname" },
          purpose: { es: "Apellido del usuario.", en: "User first surname." },
          dataType: "text",
          required: true,
          example: "Garcia",
          selector: '[data-help-id="sa-account-first-surname"]',
        },
        {
          id: "email",
          label: { es: "Correo electronico", en: "Email" },
          purpose: { es: "Correo del usuario.", en: "User email." },
          dataType: "email",
          required: true,
          example: "admin@lendevent.com",
          selector: '[data-help-id="sa-account-email"]',
        },
        {
          id: "phone",
          label: { es: "Telefono", en: "Phone" },
          purpose: { es: "Numero de contacto.", en: "Contact number." },
          dataType: "phone",
          required: false,
          example: "+57 300 123 4567",
          selector: '[data-help-id="sa-account-phone"]',
        },
      ],
      actions: [
        {
          id: "save-profile",
          label: { es: "Guardar perfil", en: "Save Profile" },
          purpose: {
            es: "Valida los campos y envia los cambios al servidor.",
            en: "Validates fields and sends changes to the server.",
          },
          consequence: {
            es: "El perfil se actualiza en toda la aplicacion.",
            en: "The profile is updated across the application.",
          },
          selector: '[data-help-id="sa-account-save-profile"]',
        },
      ],
    },
    {
      id: "change-password",
      title: { es: "Cambiar contrasena", en: "Change Password" },
      purpose: {
        es: "Actualizar la contrasena de acceso del super administrador.",
        en: "Update the super admin access password.",
      },
      mode: "edit",
      fields: [
        {
          id: "currentPassword",
          label: { es: "Contrasena actual", en: "Current Password" },
          purpose: {
            es: "Contrasena actual para verificacion.",
            en: "Current password for verification.",
          },
          dataType: "password",
          required: true,
          selector: '[data-help-id="sa-account-current-password"]',
        },
        {
          id: "newPassword",
          label: { es: "Nueva contrasena", en: "New Password" },
          purpose: {
            es: "La nueva contrasena (min. 8 caracteres).",
            en: "The new password (min. 8 characters).",
          },
          dataType: "password",
          required: true,
          selector: '[data-help-id="sa-account-new-password"]',
        },
        {
          id: "confirmPassword",
          label: { es: "Confirmar contrasena", en: "Confirm Password" },
          purpose: { es: "Repetir la nueva contrasena.", en: "Repeat the new password." },
          dataType: "password",
          required: true,
          selector: '[data-help-id="sa-account-confirm-password"]',
        },
      ],
      actions: [
        {
          id: "change-password",
          label: { es: "Cambiar contrasena", en: "Change Password" },
          purpose: {
            es: "Valida las contrasenas y las envia al servidor para actualizacion.",
            en: "Validates passwords and sends them to the server for update.",
          },
          consequence: {
            es: "La contrasena de acceso se actualiza inmediatamente.",
            en: "The access password is updated immediately.",
          },
          selector: '[data-help-id="sa-account-change-password"]',
        },
      ],
    },
  ],
};

export default superAdminSettingsHelpContent;
