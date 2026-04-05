import type { HelpModuleContent } from "../types";

const loginHelpContent: HelpModuleContent = {
  moduleId: "login",
  title: {
    en: "Help center: Sign in & Two-Factor Authentication",
    es: "Centro de ayuda: Inicio de sesion y autenticacion de dos factores",
  },
  description: {
    en: "This section explains how to sign in to LendEvent and complete the mandatory two-factor authentication (2FA) step that protects your account.",
    es: "Esta seccion explica como iniciar sesion en LendEvent y completar el paso obligatorio de autenticacion de dos factores (2FA) que protege tu cuenta.",
  },
  sections: [
    {
      id: "login-credentials",
      title: { en: "Entering your credentials", es: "Ingreso de credenciales" },
      body: {
        en: "Enter the email address and password associated with your LendEvent account. Fields are validated before submission; an inline error message will appear if either field is empty or malformed.",
        es: "Ingresa el correo electronico y la contrasena asociados a tu cuenta de LendEvent. Los campos se validan antes del envio; aparecera un mensaje de error en linea si algun campo esta vacio o mal formado.",
      },
      howTo: [
        { en: "Type your email address in the Email field.", es: "Escribe tu correo electronico en el campo Email." },
        { en: "Type your password in the Password field. Use the eye icon to toggle visibility.", es: "Escribe tu contrasena en el campo Contrasena. Usa el icono de ojo para alternar la visibilidad." },
        { en: "Click 'Sign In' — if credentials are valid you will be redirected to the OTP verification screen.", es: "Haz clic en 'Iniciar sesion' — si las credenciales son validas, seras redirigido a la pantalla de verificacion OTP." },
      ],
      tips: [
        { en: "Passwords are case-sensitive. Make sure Caps Lock is off.", es: "Las contrasenas distinguen mayusculas y minusculas. Asegurate de que Bloq Mayus este desactivado." },
      ],
    },
    {
      id: "otp-verification",
      title: { en: "Two-factor authentication (OTP)", es: "Autenticacion de dos factores (OTP)" },
      body: {
        en: "After successful credential entry a 6-digit one-time code is sent to your registered email address. This code expires in 5 minutes. You have up to 5 attempts before the code is locked.",
        es: "Tras ingresar las credenciales correctamente, se envia un codigo de 6 digitos de un solo uso a tu correo registrado. Este codigo caduca en 5 minutos. Tienes hasta 5 intentos antes de que el codigo se bloquee.",
      },
      howTo: [
        { en: "Open your email inbox and locate the message from LendEvent.", es: "Abre tu bandeja de entrada y localiza el mensaje de LendEvent." },
        { en: "Type each digit into the corresponding input box, or paste all 6 digits at once.", es: "Escribe cada digito en el campo correspondiente, o pega los 6 digitos de una vez." },
        { en: "Click 'Verify' to submit the code.", es: "Haz clic en 'Verificar' para enviar el codigo." },
      ],
      tips: [
        { en: "The code auto-advances the cursor between digit boxes as you type.", es: "El cursor avanza automaticamente entre los campos mientras escribes." },
        { en: "If the code expires, click 'Resend code' to request a fresh one.", es: "Si el codigo caduca, haz clic en 'Reenviar codigo' para solicitar uno nuevo." },
      ],
      warnings: [
        { en: "After 5 failed attempts the session is locked. Use 'Resend code' or go back and sign in again.", es: "Tras 5 intentos fallidos la sesion se bloquea. Usa 'Reenviar codigo' o vuelve e inicia sesion de nuevo." },
      ],
    },
    {
      id: "backup-codes",
      title: { en: "Using backup codes", es: "Uso de codigos de respaldo" },
      body: {
        en: "If you cannot access your email to receive the OTP, click 'Use a backup code' to authenticate with one of the single-use recovery codes issued on your first login.",
        es: "Si no puedes acceder a tu correo para recibir el OTP, haz clic en 'Usar un codigo de respaldo' para autenticarte con uno de los codigos de recuperacion de un solo uso emitidos en tu primer inicio de sesion.",
      },
      howTo: [
        { en: "Click 'Use a backup code' below the OTP form.", es: "Haz clic en 'Usar un codigo de respaldo' debajo del formulario OTP." },
        { en: "Enter one of your saved backup codes exactly as it appears.", es: "Ingresa uno de tus codigos de respaldo guardados exactamente como aparece." },
        { en: "Click 'Verify backup code' to complete sign-in.", es: "Haz clic en 'Verificar codigo de respaldo' para completar el inicio de sesion." },
      ],
      warnings: [
        { en: "Each backup code can only be used once. Keep them stored safely.", es: "Cada codigo de respaldo solo puede usarse una vez. Guardalos en un lugar seguro." },
      ],
    },
    {
      id: "first-login-backup-codes",
      title: { en: "Saving backup codes (first login only)", es: "Guardar codigos de respaldo (solo primer inicio de sesion)" },
      body: {
        en: "On your very first successful 2FA login a modal displays 10 single-use backup codes. You must save them before closing the modal — they will not be shown again.",
        es: "En tu primer inicio de sesion exitoso con 2FA, un modal muestra 10 codigos de respaldo de un solo uso. Debes guardarlos antes de cerrar el modal — no se mostraran de nuevo.",
      },
      howTo: [
        { en: "Click 'Copy all codes' to copy them to your clipboard.", es: "Haz clic en 'Copiar todos los codigos' para copiarlos al portapapeles." },
        { en: "Or click 'Download .txt' to save them as a text file.", es: "O haz clic en 'Descargar .txt' para guardarlos como archivo de texto." },
        { en: "Check the acknowledgement checkbox and click 'I have saved my codes' to continue.", es: "Marca la casilla de confirmacion y haz clic en 'He guardado mis codigos' para continuar." },
      ],
      warnings: [
        { en: "Do not share your backup codes. Treat them like passwords.", es: "No compartas tus codigos de respaldo. Tratalos como contrasenas." },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-email",
      title: { en: "Enter your email", es: "Ingresa tu correo electronico" },
      body: { en: "Type the email address registered to your LendEvent account.", es: "Escribe el correo electronico registrado en tu cuenta de LendEvent." },
      targetSelector: "[data-help-id='login-email-input']",
    },
    {
      id: "step-password",
      title: { en: "Enter your password", es: "Ingresa tu contrasena" },
      body: { en: "Enter your account password. Toggle the eye icon to check what you typed.", es: "Ingresa la contrasena de tu cuenta. Usa el icono de ojo para verificar lo que escribiste." },
      targetSelector: "[data-help-id='login-password-input']",
    },
    {
      id: "step-submit",
      title: { en: "Submit credentials", es: "Enviar credenciales" },
      body: { en: "Click Sign In. On success you will be taken to the OTP verification screen.", es: "Haz clic en Iniciar sesion. Si es exitoso, seras llevado a la pantalla de verificacion OTP." },
      targetSelector: "[data-help-id='login-submit-button']",
    },
    {
      id: "step-otp-inputs",
      title: { en: "Enter the 6-digit OTP", es: "Ingresa el OTP de 6 digitos" },
      body: { en: "Type or paste the one-time code sent to your email into the 6 digit boxes.", es: "Escribe o pega el codigo de un solo uso enviado a tu correo en los 6 campos." },
      targetSelector: "[data-help-id='otp-digit-inputs']",
    },
    {
      id: "step-otp-submit",
      title: { en: "Verify the code", es: "Verificar el codigo" },
      body: { en: "Click Verify to authenticate. If correct you will be redirected to your dashboard.", es: "Haz clic en Verificar para autenticarte. Si es correcto seras redirigido a tu panel." },
      targetSelector: "[data-help-id='otp-submit-button']",
    },
    {
      id: "step-resend",
      title: { en: "Resend the code", es: "Reenviar el codigo" },
      body: { en: "If the code expired or was not delivered, click Resend code to get a new one.", es: "Si el codigo caduco o no llego, haz clic en Reenviar codigo para obtener uno nuevo." },
      targetSelector: "[data-help-id='otp-resend-button']",
    },
    {
      id: "step-backup-code",
      title: { en: "Use a backup code instead", es: "Usar un codigo de respaldo en su lugar" },
      body: { en: "If you cannot receive the OTP by email, click this link to switch to backup code entry.", es: "Si no puedes recibir el OTP por correo, haz clic en este enlace para cambiar al ingreso de codigo de respaldo." },
      targetSelector: "[data-help-id='otp-use-backup-code-button']",
    },
  ],
  formGuides: [
    {
      id: "login-credentials-form",
      title: { en: "Sign-in form", es: "Formulario de inicio de sesion" },
      purpose: {
        en: "Enter your email and password to start the authentication process.",
        es: "Ingresa tu correo y contrasena para iniciar el proceso de autenticacion.",
      },
      mode: "create" as const,
      selector: "[data-help-id='login-submit-button']",
      fields: [
        {
          id: "login-email-input",
          label: { en: "Email", es: "Correo electronico" },
          selector: "[data-help-id='login-email-input']",
          purpose: { en: "The email address associated with your LendEvent account.", es: "El correo electronico asociado a tu cuenta de LendEvent." },
          required: true,
          dataType: { en: "Email", es: "Correo electronico" },
          example: "user@example.com",
        },
        {
          id: "login-password-input",
          label: { en: "Password", es: "Contrasena" },
          selector: "[data-help-id='login-password-input']",
          purpose: { en: "Your account password. Case-sensitive.", es: "La contrasena de tu cuenta. Distingue mayusculas y minusculas." },
          required: true,
          dataType: { en: "Password", es: "Contrasena" },
          example: "••••••••",
        },
      ],
      actions: [
        {
          id: "login-submit",
          label: { en: "Sign In", es: "Iniciar sesion" },
          purpose: { en: "Validates credentials and redirects to OTP verification.", es: "Valida las credenciales y redirige a la verificacion OTP." },
          consequence: { en: "You will be taken to the OTP verification step.", es: "Seras redirigido al paso de verificacion OTP." },
          selector: "[data-help-id='login-submit-button']",
        },
      ],
    },
    {
      id: "otp-verification-form",
      title: { en: "OTP verification form", es: "Formulario de verificacion OTP" },
      purpose: {
        en: "Enter the 6-digit code sent to your email to complete sign-in.",
        es: "Ingresa el codigo de 6 digitos enviado a tu correo para completar el inicio de sesion.",
      },
      mode: "create" as const,
      selector: "[data-help-id='otp-verification-form']",
      fields: [
        {
          id: "otp-digit-inputs",
          label: { en: "6-digit OTP code", es: "Codigo OTP de 6 digitos" },
          selector: "[data-help-id='otp-digit-inputs']",
          purpose: { en: "The one-time code emailed to you after credential verification.", es: "El codigo de un solo uso enviado por correo tras la verificacion de credenciales." },
          required: true,
          dataType: { en: "Number (6 digits)", es: "Numero (6 digitos)" },
          example: "123456",
        },
      ],
      actions: [
        {
          id: "otp-submit",
          label: { en: "Verify", es: "Verificar" },
          purpose: { en: "Submits the OTP and completes authentication.", es: "Envia el OTP y completa la autenticacion." },
          consequence: { en: "You will be signed in and redirected to your dashboard.", es: "Iniciaras sesion y seras redirigido a tu panel." },
          selector: "[data-help-id='otp-submit-button']",
        },
        {
          id: "otp-resend",
          label: { en: "Resend code", es: "Reenviar codigo" },
          purpose: { en: "Requests a new OTP and resets the 5-minute timer.", es: "Solicita un nuevo OTP y restablece el temporizador de 5 minutos." },
          consequence: { en: "A new code is sent to your email and the timer resets.", es: "Se envia un nuevo codigo a tu correo y el temporizador se reinicia." },
          selector: "[data-help-id='otp-resend-button']",
        },
      ],
    },
  ],
};

export default loginHelpContent;
