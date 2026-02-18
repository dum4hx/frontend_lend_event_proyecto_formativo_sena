import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginUser, refreshToken } from "../services/authService";
import { useAuth } from "../contexts/useAuth";
import { ApiError } from "../lib/api";
import { validateLoginForm } from "../utils/validators";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after authentication succeeds (user is already set in context). */
  onAuthenticated: () => void;
  /** When provided, used as the `returnTo` query param on the /sign-up redirect. */
  registerReturnTo?: string;
}

export default function LoginModal({
  open,
  onClose,
  onAuthenticated,
  registerReturnTo,
}: LoginModalProps) {
  const { checkAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Focus the email field when the modal opens
  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setError("");
      // Slight delay so the slide-down animation starts before focus
      const id = setTimeout(() => emailRef.current?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setError(validation.message ?? "Validation failed");
      return;
    }

    setLoading(true);

    try {
      await loginUser({ email, password });
      await checkAuth();
      onAuthenticated();
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Connection error. Please try again.";

      if (err instanceof ApiError && err.statusCode === 401) {
        try {
          await refreshToken();
          await checkAuth();
          onAuthenticated();
          return;
        } catch {
          // fall through
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop — blurs the page behind the modal */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal panel — slides in from the top */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-20 px-4 animate-[slideDown_300ms_ease-out]">
        <div
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 relative"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-extrabold mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm mb-6">
            Log in to continue with your subscription
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition disabled:opacity-50"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => {
                onClose();
                const params = new URLSearchParams();
                if (registerReturnTo) params.set("returnTo", registerReturnTo);
                navigate(`/sign-up${params.size > 0 ? `?${params.toString()}` : ""}`);
              }}
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
