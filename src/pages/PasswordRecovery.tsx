import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { forgotPassword, verifyResetCode, resetPassword } from "../services/authService";
import { ApiError } from "../lib/api";
import { useAlertModal } from "../hooks/useAlertModal";
import { validateEmail, validateCode, validatePassword } from "../utils/validators";
import { useLanguage } from "../contexts/useLanguage";
import type { TranslationKey } from "../i18n/translations";
import styles from "./PasswordRecovery.module.css";

export default function PasswordRecovery() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isEs = language === "es";
  const { showSuccess, AlertModal } = useAlertModal();
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: POST /auth/forgot-password
  const handleSendCode = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(t(emailValidation.message as TranslationKey));
      return;
    }

    setError("");
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSuccess(
        isEs
          ? "Si la cuenta existe, se envio un codigo de verificacion."
          : "If the account exists, a verification code has been sent.",
      );
      setPaso(2);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : isEs
            ? "Error de red. Intenta de nuevo."
            : "Network error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: POST /auth/verify-reset-code
  const handleVerifyCode = async () => {
    const codeValidation = validateCode(codigo);
    if (!codeValidation.isValid) {
      setError(t(codeValidation.message as TranslationKey));
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await verifyResetCode({ email, code: codigo });
      setResetToken(response.data.resetToken);
      setPaso(3);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : isEs
            ? "Error de red. Intenta de nuevo."
            : "Network error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: POST /auth/reset-password
  const handleResetPassword = async () => {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(t(passwordValidation.message as TranslationKey));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isEs ? "Las contraseñas no coinciden." : "Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword({ email, resetToken, newPassword });
      showSuccess(
        isEs
          ? "Contraseña actualizada correctamente. Redirigiendo al inicio de sesion..."
          : "Password reset successfully. Redirecting to login...",
      );
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : isEs
            ? "Error de red. Intenta de nuevo."
            : "Network error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSuccess(
        isEs ? "Codigo reenviado. Revisa tu bandeja de entrada." : "Code resent. Check your inbox.",
      );
      setCodigo("");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : isEs
            ? "No se pudo reenviar el codigo."
            : "Failed to resend code.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left Section - Desktop Only */}
        <div
          className={`hidden md:flex md:w-1/2 ${styles.bgOverlay} p-12 lg:p-20 flex-col justify-center relative border-r border-zinc-800 z-0`}
        >
          <div className="z-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-12">
              <div className="bg-yellow-400 p-2 rounded-lg shadow-lg">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              {isEs ? "Recupera tu" : "Recover your"}
              <br />
              <span className="text-yellow-400">{isEs ? "acceso seguro" : "Secure Access"}</span>
            </h1>

            {/* Dynamic description */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              {paso === 1
                ? isEs
                  ? "Inicia el proceso de verificacion para restablecer tus credenciales corporativas."
                  : "Begin the verification process to reset your corporate credentials."
                : paso === 2
                  ? isEs
                    ? "Casi listo. Ingresa el codigo que acabamos de enviar a tu correo."
                    : "Almost there. Enter the code we just sent to your inbox."
                  : isEs
                    ? "Crea una contraseña segura para tu cuenta."
                    : "Create a strong, secure password for your account."}
            </p>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black relative z-10">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-yellow-400 flex items-center mb-8 transition-colors group"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {isEs ? "Atras" : "Back"}
            </button>

            {/* PASO 1 */}
            {paso === 1 && (
              <div>
                <h2 className="text-4xl font-extrabold mb-2">{isEs ? "Paso 1" : "Step 1"}</h2>
                <p className="text-gray-400 mb-10">
                  {isEs
                    ? "Ingresa tu correo para recibir un codigo de seguridad."
                    : "Enter your email to receive a security code."}
                </p>

                <div className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {isEs ? "Correo corporativo" : "Corporate Email"}
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </span>
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendCode}
                    disabled={loading}
                    className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                  >
                    {loading
                      ? isEs
                        ? "Enviando codigo..."
                        : "Sending code..."
                      : isEs
                        ? "Enviar codigo"
                        : "Send Code"}
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2 */}
            {paso === 2 && (
              <div>
                <h2 className="text-4xl font-extrabold mb-2">{isEs ? "Paso 2" : "Step 2"}</h2>
                <p className="text-gray-400 mb-10">
                  {isEs ? "Enviamos un codigo a " : "We've sent a code to "}
                  <span className="text-yellow-400 font-bold">{email}</span>
                </p>

                <div className="space-y-6">
                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <p className="text-green-400 text-sm font-medium">{success}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {isEs ? "Codigo de 6 digitos" : "6-digit code"}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      {isEs
                        ? "El codigo vence en 10 minutos. Maximo 5 intentos."
                        : "The code expires in 10 minutes. Maximum 5 attempts."}
                    </p>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </span>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                        disabled={loading}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-2xl tracking-[0.5em] focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 text-center disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    disabled={loading}
                    className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                  >
                    {loading
                      ? isEs
                        ? "Validando..."
                        : "Validating..."
                      : isEs
                        ? "Validar y continuar"
                        : "Validate and Continue"}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    {isEs ? "No recibiste el codigo? " : "Didn't receive the code? "}
                    <button
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-yellow-400 font-bold hover:underline disabled:opacity-50"
                    >
                      {isEs ? "Reenviar" : "Resend"}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {paso === 3 && (
              <div>
                <h2 className="text-4xl font-extrabold mb-2">{isEs ? "Paso 3" : "Step 3"}</h2>
                <p className="text-gray-400 mb-10">
                  {isEs
                    ? "Crea tu nueva contraseña corporativa."
                    : "Create your new corporate password."}
                </p>

                <div className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {isEs ? "Nueva contraseña" : "New Password"}
                    </label>
                    <div className="text-xs text-gray-400 mb-2">
                      {isEs
                        ? "Minimo 8 caracteres, 1 mayuscula, 1 minuscula, 1 numero y 1 caracter especial (!@#$%^&*)"
                        : "Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character (!@#$%^&*)"}
                    </div>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </span>
                      <input
                        type="password"
                        placeholder={isEs ? "Tu nueva contraseña" : "Your new password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {isEs ? "Confirmar contraseña" : "Confirm Password"}
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      <input
                        type="password"
                        placeholder={isEs ? "Repite tu contraseña" : "Repeat your password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                  >
                    {loading
                      ? isEs
                        ? "Restableciendo..."
                        : "Resetting..."
                      : isEs
                        ? "Restablecer contraseña"
                        : "Reset Password"}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    {isEs
                      ? "La contraseña debe tener al menos 8 caracteres e incluir una letra mayuscula, una minuscula, un numero y un caracter especial."
                      : "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number and a special character."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <AlertModal />
    </div>
  );
}
