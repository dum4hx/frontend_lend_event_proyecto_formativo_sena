import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { loginUser, refreshToken } from "../services/authService";
import { ApiError } from "../lib/api";
import { validateLoginForm } from "../utils/validators";
import { useAuth } from "../contexts/useAuth";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Validate form
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setError(validation.message || "Validation failed");
      return;
    }

    setLoading(true);

    try {
      await loginUser({ email, password });

      // Verify authentication after login
      const loggedUser = await checkAuth();

      // Navigate based on the user's role
      navigate(loggedUser?.role === "super_admin" ? "/super-admin" : "/admin");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Connection error. Please try again.";

      // Try refreshing access token on 401, in case the session expired but the cookie is still valid.
      if (err instanceof ApiError && err.statusCode === 401) {
        try {
          await refreshToken();
          const refreshedUser = await checkAuth();
          navigate(refreshedUser?.role === "super_admin" ? "/super-admin" : "/admin");
          return;
        } catch {
          // fall through to setError below
        }
      }

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
              Global Management
              <br />
              <span className="text-yellow-400">Command Center</span>
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              Access your personalized platform to manage events, team licenses, and real-time analytics.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">Business Security</p>
                  <p className="text-sm text-gray-400">
                    End-to-end encrypted data protection.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">Multi-level Access</p>
                  <p className="text-sm text-gray-400">
                    Single portal for administrators and customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-extrabold mb-2">Welcome</h2>
            <p className="text-gray-400 mb-10">
              Enter your corporate credentials to continue
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
                  Corporate Email
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
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Password
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
                  <span className="text-gray-400 hover:text-white transition">Remember me</span>
                </label>
                <Link
                  to="/password-recovery"
                  className="text-yellow-400 hover:text-yellow-300 font-bold transition"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} mt-4 shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Link to Plans */}
            <p className="text-center text-sm text-gray-500 mt-8">
              Don't have a license?{" "}
              <Link to="/packages" className="text-yellow-400 font-bold hover:underline">
                View plans
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
