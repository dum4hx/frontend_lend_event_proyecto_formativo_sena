import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { acceptInvite } from "../services/authService";
import { ApiError } from "../lib/api";
import { validatePassword } from "../utils/validators";
import { useLanguage } from "../contexts/useLanguage";
import styles from "./AcceptInvite.module.css";

export default function AcceptInvite() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isEs = language === "es";
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const mapValidationMessage = (message?: string) => {
    if (!isEs || !message) return message;

    const validationMap: Record<string, string> = {
      "Password is required": "La contrasena es obligatoria",
      "Password must be at least 8 characters": "La contrasena debe tener al menos 8 caracteres",
      "Password must contain at least one uppercase letter": "La contrasena debe incluir al menos una letra mayuscula",
      "Password must contain at least one lowercase letter": "La contrasena debe incluir al menos una letra minuscula",
      "Password must contain at least one number": "La contrasena debe incluir al menos un numero",
      "Password must contain at least one special character (!@#$%^&*.)": "La contrasena debe incluir al menos un caracter especial (!@#$%^&*.)",
    };

    return validationMap[message] ?? message;
  };

  // Extract email and token from URL on mount
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (!emailParam || !tokenParam) {
      setError(
        isEs
          ? "Enlace de invitacion invalido. Solicita un nuevo enlace a tu administrador."
          : "Invalid invitation link. Please request a new link from your administrator."
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
      setError(mapValidationMessage(passwordValidation.message) || (isEs ? "Validacion fallida" : "Validation failed"));
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setError(isEs ? "Las contrasenas no coinciden" : "Passwords do not match");
      return;
    }

    if (!email || !token) {
      setError(isEs ? "Faltan parametros de invitacion" : "Missing invite parameters");
      return;
    }

    setLoading(true);

    try {
      const acceptResponse = await acceptInvite({ email, token, password });
      console.log(
        "✅ [AcceptInvite] Invitation accepted successfully",
        "| Email:",
        email,
        "| Response:",
        acceptResponse
      );
      
      console.log(
        "✅ [AcceptInvite] User role after acceptance:",
        acceptResponse.data || "No data in response"
      );
      
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        console.log("🔄 [AcceptInvite] Redirecting to login page...");
        navigate("/login");
      }, 2000);
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
  }

  return (
    <div className={styles.bgOverlay}>
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#FFD700] rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isEs ? "Activar cuenta" : "Activate Account"}
            </h1>
            <p className="text-gray-400">
              {isEs ? "Define tu contrasena para comenzar" : "Set your password to get started"}
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="text-green-400 font-semibold">
                    {isEs ? "Cuenta activada correctamente!" : "Account activated successfully!"}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {isEs ? "Redirigiendo al inicio de sesion..." : "Redirecting to sign in..."}
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
                    <span className="text-gray-500">{isEs ? "Cuenta:" : "Account:"}</span>{" "}
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
                    {isEs ? "Contrasena" : "Password"}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all"
                    placeholder={isEs ? "Minimo 8 caracteres" : "Minimum 8 characters"}
                    required
                    disabled={loading || !email || !token}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {isEs
                      ? "Debe incluir: mayuscula, minuscula, numero y caracter especial"
                      : "Must include: uppercase, lowercase, number and special character"}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    {isEs ? "Confirmar contrasena" : "Confirm Password"}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all"
                    placeholder={isEs ? "Repite tu contrasena" : "Repeat your password"}
                    required
                    disabled={loading || !email || !token}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !token}
                  className={`w-full bg-[#FFD700] text-black font-semibold py-3 px-4 rounded-lg hover:bg-[#FFC700] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles.glowButton}`}
                >
                  {loading ? (isEs ? "Activando..." : "Activating...") : (isEs ? "Activar cuenta" : "Activate Account")}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  {isEs ? "Ya tienes una cuenta? " : "Already have an account? "}
                  <a
                    href="/login"
                    className="text-[#FFD700] hover:text-[#FFC700] font-medium transition-colors"
                  >
                    {isEs ? "Inicia sesion" : "Sign in"}
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
