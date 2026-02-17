import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
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
        "Invalid invitation link. Please request a new link from your administrator."
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
      setError(passwordValidation.message || "Validation failed");
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!email || !token) {
      setError("Missing invite parameters");
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
              Activate Account
            </h1>
            <p className="text-gray-400">
              Set your password to get started
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="text-green-400 font-semibold">
                    Account activated successfully!
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Redirecting to sign in...
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
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all"
                    placeholder="Minimum 8 characters"
                    required
                    disabled={loading || !email || !token}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Must include: uppercase, lowercase, number and special character
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all"
                    placeholder="Repeat your password"
                    required
                    disabled={loading || !email || !token}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !token}
                  className={`w-full bg-[#FFD700] text-black font-semibold py-3 px-4 rounded-lg hover:bg-[#FFC700] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles.glowButton}`}
                >
                  {loading ? "Activating..." : "Activate Account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-[#FFD700] hover:text-[#FFC700] font-medium transition-colors"
                  >
                    Sign in
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
