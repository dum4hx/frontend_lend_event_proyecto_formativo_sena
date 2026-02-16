import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";
import Encabezado from "../components/Encabezado";
import PiePagina from "../components/PiePagina";
import { acceptInvite } from "../services/authService";
import { ApiError } from "../lib/api";
import { validatePassword } from "../utils/validators";
import styles from "./AcceptInvite.module.css";

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract email and token from URL on mount
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (!emailParam || !tokenParam) {
      setError(
        "Enlace de invitación inválido. Por favor solicita un nuevo enlace a tu administrador."
      );
      return;
    }

    setEmail(emailParam);
    setToken(tokenParam);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || "Validación fallida");
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!email || !token) {
      setError("Faltan parámetros de invitación");
      return;
    }

    setLoading(true);

    try {
      await acceptInvite({ email, token, password });
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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
    <div className={styles.bgOverlay}>
      <Encabezado />
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#FFD700] rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Activar Cuenta
            </h1>
            <p className="text-gray-400">
              Configura tu contraseña para comenzar
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="text-green-400 font-semibold">
                    ¡Cuenta activada exitosamente!
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Redirigiendo al inicio de sesión...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {email && (
                <div className="bg-[#222] border border-[#333] rounded-lg p-4 mb-6">
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500">Cuenta:</span>{" "}
                    <span className="text-white font-medium">{email}</span>
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all"
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading || !email || !token}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Debe incluir: mayúscula, minúscula, número y carácter
                    especial
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Confirmar Contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all"
                    placeholder="Repite tu contraseña"
                    required
                    disabled={loading || !email || !token}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !token}
                  className={`w-full bg-[#FFD700] text-black font-semibold py-3 px-4 rounded-lg hover:bg-[#FFC700] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles.glowButton}`}
                >
                  {loading ? "Activando..." : "Activar Cuenta"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  ¿Ya tienes una cuenta?{" "}
                  <a
                    href="/login"
                    className="text-[#FFD700] hover:text-[#FFC700] font-medium transition-colors"
                  >
                    Iniciar sesión
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <PiePagina />
    </div>
  );
}
