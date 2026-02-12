import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import PiePagina from "../components/PiePagina";
import { loginUser } from "../services/authService";
import { ApiError } from "../lib/api";
import { validateLoginForm } from "../utils/validators";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate form
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setError(validation.message || "Validación fallida");
      return;
    }

    setLoading(true);

    try {
      await loginUser({ email, password });

      // Verify authentication after login
      await checkAuth();

      // Success - navigate to dashboard
      navigate("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Error de conexión. Por favor intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Encabezado />

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Sección Izquierda - Solo en Desktop */}
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

            {/* Título */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              Centro de
              <br />
              <span className="text-yellow-400">Gestión Global</span>
            </h1>

            {/* Descripción */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              Acceda a su plataforma personalizada para gestionar eventos,
              licencias de equipo y análisis de datos en tiempo real.
            </p>

            {/* Características */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">Seguridad Empresarial</p>
                  <p className="text-sm text-gray-400">
                    Protección de datos cifrada de extremo a extremo.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">Acceso Multi-nivel</p>
                  <p className="text-sm text-gray-400">
                    Portal único para administradores y clientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Derecha - Formulario */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-extrabold mb-2">Bienvenido</h2>
            <p className="text-gray-400 mb-10">
              Ingrese sus credenciales corporativas para continuar
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
                  Correo Corporativo
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
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Contraseña
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Recordar y Olvidó contraseña */}
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
                    Recordar sesión
                  </span>
                </label>
                <Link
                  to="/recuperar-contrasena"
                  className="text-yellow-400 hover:text-yellow-300 font-bold transition"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>

              {/* Botón Iniciar Sesión */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} mt-4 shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>

            {/* Link a Planes */}
            <p className="text-center text-sm text-gray-500 mt-8">
              ¿Aún no tienes una licencia?{" "}
              <Link
                to="/paquetes"
                className="text-yellow-400 font-bold hover:underline"
              >
                Ver planes
              </Link>
            </p>
          </div>
        </div>
      </main>

      <PiePagina />
    </div>
  );
}
