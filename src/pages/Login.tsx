import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { loginUser } from "../services/authService";
import { ApiError } from "../lib/api";
import { validateLoginForm, validateEmail } from "../utils/validators";
import { useLanguage } from "../contexts/useLanguage";
import styles from "./Login.module.css";

export default function Login() {
  const { language } = useLanguage();
  const isEs = language === "es";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const setErrorFor = (field: string, message?: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const inputClass = (hasError: boolean, withIcon?: boolean) =>
    `w-full bg-zinc-900 rounded-xl py-4 ${withIcon ? "pl-12" : "px-4"} pr-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"}`;

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Normalize inputs
    const normalisedEmail = email.trim().toLowerCase();
    const normalisedPassword = password.trim();

    // Frontend validation
    const validation = validateLoginForm({ email: normalisedEmail, password: normalisedPassword });
    if (!validation.isValid) {
      setError(validation.message || (isEs ? "Validacion fallida" : "Validation failed"));
      return;
    }

    // Prevent submit if field errors exist
    if (Object.keys(fieldErrors).length > 0) {
      setError(isEs ? "Corrige los campos marcados" : "Please fix the highlighted fields");
      return;
    }

    setLoading(true);

    try {
      await loginUser({ email: normalisedEmail, password: normalisedPassword });
      navigate("/auth/verify-otp", {
        state: { email: normalisedEmail, password: normalisedPassword },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError(isEs ? "Credenciales invalidas" : "Invalid credentials");
        return;
      }
      const message =
        err instanceof ApiError
          ? err.message
          : isEs
            ? "Error de conexion. Intenta de nuevo."
            : "Connection error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-2xl text-white font-bold tracking-tight italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              {isEs ? "Gestion global" : "Global Management"}
              <br />
              <span className="text-yellow-400">
                {isEs ? "Centro de control" : "Command Center"}
              </span>
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              {isEs
                ? "Accede a tu plataforma personalizada para gestionar eventos, licencias de equipo y analitica en tiempo real."
                : "Access your personalized platform to manage events, team licenses, and real-time analytics."}
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">
                    {isEs ? "Seguridad empresarial" : "Business Security"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {isEs
                      ? "Proteccion de datos cifrada de extremo a extremo."
                      : "End-to-end encrypted data protection."}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">
                    {isEs ? "Acceso multinivel" : "Multi-level Access"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {isEs
                      ? "Portal unico para administradores y clientes."
                      : "Single portal for administrators and customers."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-extrabold mb-2">
              {isEs ? "Bienvenido de nuevo" : "Welcome back"}
            </h2>
            <p className="text-gray-400 mb-10">
              {isEs
                ? "Inicia sesion para acceder a tu panel y gestionar tus operaciones"
                : "Sign in to access your dashboard and manage your operations"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {isEs ? "Correo corporativo" : "Corporate Email"}
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    maxLength={254}
                    data-help-id="login-email-input"
                    onChange={(e) => {
                      const v = e.target.value.trim(); // disallow leading/trailing spaces
                      const lower = v.toLowerCase(); // normalize
                      setEmail(lower);
                      const res = validateEmail(lower);
                      setErrorFor("email", res.isValid ? undefined : res.message);
                    }}
                    onBlur={() => {
                      const res = validateEmail(email);
                      setErrorFor("email", res.isValid ? undefined : res.message);
                    }}
                    disabled={loading}
                    className={inputClass(!!fieldErrors.email, true)}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {isEs ? "Contrasena" : "Password"}
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      maxLength={128}
                      data-help-id="login-password-input"
                      onChange={(e) => {
                        const v = e.target.value.replace(/^\s+|\s+$/g, ""); // trim both ends
                        setPassword(v);
                        if (!v) {
                          setErrorFor(
                            "password",
                            isEs ? "La contrasena es obligatoria" : "Password is required",
                          );
                        } else {
                          setErrorFor("password", undefined);
                        }
                      }}
                      disabled={loading}
                      className={inputClass(!!fieldErrors.password, true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 mr-3 my-auto text-gray-400 hover:text-white"
                      aria-label={
                        showPassword
                          ? isEs
                            ? "Ocultar contrasena"
                            : "Hide password"
                          : isEs
                            ? "Mostrar contrasena"
                            : "Show password"
                      }
                    >
                      {showPassword ? (
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-10-7-10-7a18.154 18.154 0 014.854-5.559M21 12s-1.5 3.5-4.5 5.5M3 3l18 18"
                          />
                        </svg>
                      ) : (
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
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </div>
              </div>

              {/* Remember and Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 accent-yellow-400 bg-zinc-800 border-zinc-700 rounded disabled:opacity-50"
                  />
                  <span className="text-gray-400 hover:text-white transition">
                    {isEs ? "Recordarme" : "Remember me"}
                  </span>
                </label>
                <Link
                  to="/password-recovery"
                  className="text-yellow-400 hover:text-yellow-300 font-bold transition"
                >
                  {isEs ? "Olvidaste tu contrasena?" : "Forgot your password?"}
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading || Object.keys(fieldErrors).length > 0}
                data-help-id="login-submit-button"
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} mt-4 shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
              >
                {loading
                  ? isEs
                    ? "Iniciando sesion..."
                    : "Signing in..."
                  : isEs
                    ? "Ingresar"
                    : "Sign In"}
              </button>
            </form>

            {/* Link to Plans */}
            <p className="text-center text-sm text-gray-500 mt-8">
              {isEs ? "No tienes licencia?" : "Don't have a license?"}{" "}
              <Link to="/packages" className="text-yellow-400 font-bold hover:underline">
                {isEs ? "Ver planes" : "View plans"}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
