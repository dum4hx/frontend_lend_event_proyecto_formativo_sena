import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { verifyEmail } from "../services/authService";
import { ApiError } from "../lib/api";
import { useAuth } from "../contexts/useAuth";
import { getDashboardUrlByPermissions } from "../utils/roleRouting";
import { validateCode } from "../utils/validators";
import styles from "./SignUp.module.css";

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 5 * 60; // 5 minutes

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  // Email passed via navigation state from SignUp
  const email = (location.state as { email?: string })?.email ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect to sign-up if no email in state
  useEffect(() => {
    if (!email) {
      navigate("/sign-up", { replace: true });
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Focus first empty input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = useCallback((index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        // Move back on backspace when current input is empty
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    // Focus the input after the last pasted digit
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }, []);

  const code = digits.join("");

  const handleVerify = async () => {
    const validation = validateCode(code);
    if (!validation.isValid) {
      setError(validation.message || "Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await verifyEmail({ email, code });

      // Cookies are now set — sync auth state
      const { permissions } = await checkAuth();
      const dashboardUrl = getDashboardUrlByPermissions(permissions);
      navigate(dashboardUrl, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = code.length === OTP_LENGTH && /^\d{6}$/.test(code);
  const isExpired = secondsLeft <= 0;

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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              Verify your
              <br />
              <span className="text-yellow-400">Email Address</span>
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              We sent a 6-digit verification code to your email. Enter it below to activate your
              account.
            </p>

            {/* Feature card */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">Almost There</p>
                  <p className="text-sm text-gray-400">One quick step to activate your account.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black relative z-10">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate("/sign-up")}
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
              Back to Sign Up
            </button>

            <h2 className="text-4xl font-extrabold mb-2">Email Verification</h2>
            <p className="text-gray-400 mb-2">
              We've sent a code to <span className="text-yellow-400 font-bold">{email}</span>
            </p>
            <p className="text-xs text-gray-500 mb-8">
              The code expires in 5 minutes. If not verified in time, your registration will be
              removed and you'll need to sign up again.
            </p>

            <div className="space-y-6">
              {/* Timer */}
              <div className="flex items-center justify-center">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${
                    isExpired
                      ? "border-red-500/30 bg-red-500/10"
                      : secondsLeft <= 60
                        ? "border-yellow-500/30 bg-yellow-500/10"
                        : "border-zinc-700 bg-zinc-900"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      isExpired
                        ? "text-red-400"
                        : secondsLeft <= 60
                          ? "text-yellow-400"
                          : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span
                    className={`text-sm font-mono font-bold ${
                      isExpired
                        ? "text-red-400"
                        : secondsLeft <= 60
                          ? "text-yellow-400"
                          : "text-gray-300"
                    }`}
                  >
                    {isExpired ? "Code expired" : formatTime(secondsLeft)}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Expired message */}
              {isExpired && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">
                    Your verification code has expired. Please go back and register again.
                  </p>
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Verification Code
                </label>
                <div className="flex justify-center gap-3" onPaste={handlePaste}>
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading || isExpired}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-zinc-900 text-white outline-none transition duration-200 disabled:opacity-50 ${
                        digit
                          ? "border-yellow-400 ring-1 ring-yellow-400"
                          : "border-zinc-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      }`}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={loading || !isCodeComplete || isExpired}
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              {/* Help text */}
              <p className="text-center text-gray-500 text-sm">
                Didn't receive the code? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => navigate("/sign-up")}
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                >
                  register again
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
