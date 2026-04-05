import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { verifyLoginOtp, verifyBackupCode, resendLoginOtp } from "../services/authService";
import { ApiError } from "../lib/api";
import {
  getDashboardUrlByPermissions,
  requiresActiveSubscriptionByPermissions,
} from "../utils/roleRouting";
import { getPaymentStatus } from "../services/authService";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { BackupCodesModal } from "../components/ui";
import styles from "./Login.module.css";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;

interface OtpLocationState {
  email?: string;
  password?: string;
}

interface OtpError {
  message: string;
  attemptsLeft?: number;
  code?: string;
}

export default function LoginOtp() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  const state = location.state as OtpLocationState | null;
  const email = state?.email ?? "";
  const password = state?.password ?? "";

  // Redirect to login if we arrived without the required state
  useEffect(() => {
    if (!email || !password) {
      navigate("/login", { replace: true });
    }
  }, [email, password, navigate]);

  // ── OTP digit state ──────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Backup-code mode ─────────────────────────────────────────────────────
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCodeValue, setBackupCodeValue] = useState("");

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<OtpError | null>(null);
  const [resendMessage, setResendMessage] = useState("");
  const [showNoSubModal, setShowNoSubModal] = useState(false);

  // ── Countdown timer ──────────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);

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

  // ── Backup codes modal ───────────────────────────────────────────────────
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [pendingDashboardUrl, setPendingDashboardUrl] = useState("");
  const [pendingGreetingName, setPendingGreetingName] = useState("");

  // ── Focus first OTP digit on mount ───────────────────────────────────────
  useEffect(() => {
    if (!useBackupCode) {
      inputRefs.current[0]?.focus();
    }
  }, [useBackupCode]);

  // ── OTP digit handlers ───────────────────────────────────────────────────
  const handleDigitChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError(null);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
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
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    setError(null);
  }, []);

  const code = digits.join("");
  const isCodeComplete = code.length === OTP_LENGTH && /^\d{6}$/.test(code);

  // ── Error message resolver ───────────────────────────────────────────────
  const resolveErrorMessage = (err: unknown): OtpError => {
    if (err instanceof ApiError) {
      const details = err.details as Record<string, unknown> | undefined;
      const errorCode = details?.code as string | undefined;
      const attemptsLeft =
        typeof details?.attemptsLeft === "number" ? details.attemptsLeft : undefined;

      switch (errorCode) {
        case "OTP_INVALID":
          return {
            message: t("publicSite.login.otp.error.OTP_INVALID", {
              attemptsLeft: attemptsLeft ?? 0,
            }),
            attemptsLeft,
            code: errorCode,
          };
        case "OTP_EXPIRED":
          return { message: t("publicSite.login.otp.error.OTP_EXPIRED"), code: errorCode };
        case "OTP_MAX_ATTEMPTS":
          return {
            message: t("publicSite.login.otp.error.OTP_MAX_ATTEMPTS"),
            attemptsLeft: 0,
            code: errorCode,
          };
        case "OTP_NOT_FOUND":
          return { message: t("publicSite.login.otp.error.OTP_NOT_FOUND"), code: errorCode };
        default:
          return {
            message: err.message || t("publicSite.login.otp.error.generic"),
            code: errorCode,
          };
      }
    }
    return { message: t("publicSite.login.otp.error.generic") };
  };

  // ── Post-auth navigation helper ──────────────────────────────────────────
  const navigateAfterAuth = async (
    permissions: string[],
    greetingName: string,
    newBackupCodes?: string[],
  ) => {
    let dashboardUrl = "/login";

    if (requiresActiveSubscriptionByPermissions(permissions)) {
      try {
        const status = await getPaymentStatus();
        if (!status.data.isActive) {
          setShowNoSubModal(true);
          return;
        }
      } catch {
        // proceed normally on failure
      }
    }

    dashboardUrl = getDashboardUrlByPermissions(permissions);

    if (newBackupCodes && newBackupCodes.length > 0) {
      setBackupCodes(newBackupCodes);
      setPendingDashboardUrl(dashboardUrl);
      setPendingGreetingName(greetingName);
      return; // navigation deferred until user closes backup codes modal
    }

    navigate(dashboardUrl, {
      state: { showGreeting: true, greetingName },
    });
  };

  // ── OTP submit ───────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeComplete || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await verifyLoginOtp({ email, code });
      const { user, permissions, backupCodes: newCodes } = response.data;
      await checkAuth();
      const greetingName = `${user.name.firstName} ${user.name.firstSurname}`.trim();
      await navigateAfterAuth(permissions, greetingName, newCodes);
    } catch (err: unknown) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Backup code submit ───────────────────────────────────────────────────
  const handleBackupCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCodeValue.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await verifyBackupCode({ email, backupCode: backupCodeValue.trim() });
      const { user, permissions } = response.data;
      await checkAuth();
      const greetingName = `${user.name.firstName} ${user.name.firstSurname}`.trim();
      await navigateAfterAuth(permissions, greetingName);
    } catch {
      setError({
        message: t("publicSite.login.otp.error.BACKUP_INVALID"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setError(null);
    setResendMessage("");

    try {
      await resendLoginOtp({ email, password });
      setDigits(Array(OTP_LENGTH).fill(""));
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      setResendMessage(t("publicSite.login.otp.resendSuccess"));
      setTimeout(() => setResendMessage(""), 4000);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  // ── Backup codes modal close ─────────────────────────────────────────────
  const handleBackupCodesClose = () => {
    setBackupCodes([]);
    navigate(pendingDashboardUrl, {
      state: { showGreeting: true, greetingName: pendingGreetingName },
    });
  };

  // ── Derived UI values ────────────────────────────────────────────────────
  const attemptsUsed = error?.attemptsLeft != null ? MAX_ATTEMPTS - error.attemptsLeft : 0;
  const isMaxAttemptsReached = error?.code === "OTP_MAX_ATTEMPTS" || error?.attemptsLeft === 0;
  const isExpired = secondsLeft <= 0 || error?.code === "OTP_EXPIRED";

  const digitClass = (hasValue: boolean, isErr: boolean) =>
    `w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-zinc-900 text-white outline-none transition-all ${
      isErr
        ? "border-red-500 focus:border-red-400"
        : hasValue
          ? "border-yellow-400 focus:border-yellow-300"
          : "border-zinc-700 focus:border-yellow-400"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Backup codes modal — shown after first 2FA login */}
      <BackupCodesModal
        isOpen={backupCodes.length > 0}
        codes={backupCodes}
        onClose={handleBackupCodesClose}
      />

      {/* No-subscription modal */}
      {showNoSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center w-14 h-14 bg-yellow-400/10 border border-yellow-400/30 rounded-full mx-auto mb-5">
              <svg
                className="w-7 h-7 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white text-center mb-3">
              Subscription Required
            </h2>
            <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
              Your account does not have an active subscription. Please purchase a plan to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowNoSubModal(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-gray-300 font-semibold hover:bg-zinc-800 hover:text-white transition"
              >
                Close
              </button>
              <button
                onClick={() => navigate("/packages")}
                className="flex-1 py-3 rounded-xl bg-yellow-400 text-black font-extrabold hover:bg-yellow-300 transition"
              >
                Buy Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      <Header />

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left section — desktop only */}
        <div
          className={`hidden md:flex md:w-1/2 ${styles.bgOverlay} p-12 lg:p-20 flex-col justify-center relative border-r border-zinc-800 z-0`}
        >
          <div className="z-20">
            <div className="flex items-center space-x-2 mb-12">
              <div className="bg-yellow-400 p-2 rounded-lg shadow-lg">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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

            <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              {t("publicSite.login.otp.title")}
              <br />
              <span className="text-yellow-400">2FA Security</span>
            </h1>

            <p className="text-gray-300 text-lg max-w-md leading-relaxed">
              {t("publicSite.login.otp.subtitle")}
            </p>
          </div>
        </div>

        {/* Right section — form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black">
          <div className="w-full max-w-md" data-help-id="otp-verification-form">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 md:hidden">
              <div className="bg-yellow-400 p-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-xl text-white font-bold italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Shield icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl mx-auto mb-6">
              <svg
                className="w-8 h-8 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-2 text-center">
              {t("publicSite.login.otp.title")}
            </h2>

            {!useBackupCode && (
              <p className="text-gray-400 text-sm text-center mb-8">
                {t("publicSite.login.otp.subtitle")}
                {email && (
                  <span className="block text-yellow-400 font-medium mt-1 truncate">{email}</span>
                )}
              </p>
            )}

            {/* ── OTP form ──────────────────────────────────────────── */}
            {!useBackupCode ? (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {/* Error banner */}
                {error && (
                  <div
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p className="text-red-400 text-sm font-medium">{error.message}</p>
                  </div>
                )}

                {/* Resend success */}
                {resendMessage && (
                  <div
                    className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
                    role="status"
                    aria-live="polite"
                  >
                    <p className="text-green-400 text-sm font-medium">{resendMessage}</p>
                  </div>
                )}

                {/* Attempts progress bar */}
                {(error?.attemptsLeft != null || isMaxAttemptsReached) && (
                  <div
                    className="space-y-1"
                    data-help-id="otp-attempts-indicator"
                    aria-label={t("publicSite.login.otp.attemptsBar", { used: attemptsUsed })}
                  >
                    <p className="text-xs text-gray-400 text-right">
                      {t("publicSite.login.otp.attemptsBar", { used: attemptsUsed })}
                    </p>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          attemptsUsed >= MAX_ATTEMPTS
                            ? "bg-red-500"
                            : attemptsUsed >= 3
                              ? "bg-orange-500"
                              : "bg-yellow-400"
                        }`}
                        style={{ width: `${(attemptsUsed / MAX_ATTEMPTS) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 6-digit inputs */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">
                    {t("publicSite.login.otp.inputLabel")}
                  </label>
                  <div
                    className="flex justify-center gap-2 sm:gap-3"
                    data-help-id="otp-digit-inputs"
                    onPaste={handlePaste}
                  >
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        disabled={isLoading || isMaxAttemptsReached}
                        aria-label={t("publicSite.login.otp.digitAriaLabel", { n: idx + 1 })}
                        data-help-id={`otp-digit-${idx}`}
                        className={digitClass(!!digit, !!error && !isResending)}
                        autoComplete={idx === 0 ? "one-time-code" : "off"}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                {!isExpired ? (
                  <p className="text-xs text-gray-500 text-center" aria-live="polite">
                    {t("publicSite.login.otp.timerLabel", { time: formatTime(secondsLeft) })}
                  </p>
                ) : (
                  <p className="text-xs text-orange-400 text-center" aria-live="assertive">
                    {t("publicSite.login.otp.timerExpired")}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isCodeComplete || isLoading || isMaxAttemptsReached}
                  className={`w-full py-4 rounded-xl font-extrabold text-black transition ${styles.glowButton} ${
                    !isCodeComplete || isLoading || isMaxAttemptsReached
                      ? "bg-zinc-700 text-gray-500 cursor-not-allowed shadow-none"
                      : "bg-yellow-400 hover:bg-yellow-300"
                  }`}
                  data-help-id="otp-submit-button"
                >
                  {isLoading
                    ? t("publicSite.login.otp.verifying")
                    : t("publicSite.login.otp.submitButton")}
                </button>

                {/* Resend */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || isLoading}
                    className="text-sm text-gray-400 hover:text-yellow-400 transition disabled:opacity-50"
                    data-help-id="otp-resend-button"
                  >
                    {isResending
                      ? t("publicSite.login.otp.resending")
                      : t("publicSite.login.otp.resendButton")}
                  </button>
                </div>

                {/* Switch to backup code */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(true);
                      setError(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-300 transition"
                    data-help-id="otp-use-backup-code-button"
                  >
                    {t("publicSite.login.otp.useBackupCode")}
                  </button>
                </div>
              </form>
            ) : (
              /* ── Backup code form ─────────────────────────────────── */
              <form onSubmit={handleBackupCodeSubmit} className="space-y-6">
                <p className="text-gray-400 text-sm text-center mb-2">
                  {email && (
                    <span className="block text-yellow-400 font-medium mb-2 truncate">{email}</span>
                  )}
                </p>

                {/* Error banner */}
                {error && (
                  <div
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p className="text-red-400 text-sm font-medium">{error.message}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {t("publicSite.login.otp.backupCodeLabel")}
                  </label>
                  <input
                    type="text"
                    value={backupCodeValue}
                    onChange={(e) => {
                      setBackupCodeValue(e.target.value);
                      setError(null);
                    }}
                    placeholder={t("publicSite.login.otp.backupCodePlaceholder")}
                    disabled={isLoading}
                    data-help-id="otp-backup-code-input"
                    className="w-full bg-zinc-900 rounded-xl py-4 px-4 text-white outline-none transition border border-zinc-800 focus:border-yellow-400 disabled:opacity-50"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!backupCodeValue.trim() || isLoading}
                  className={`w-full py-4 rounded-xl font-extrabold text-black transition ${styles.glowButton} ${
                    !backupCodeValue.trim() || isLoading
                      ? "bg-zinc-700 text-gray-500 cursor-not-allowed shadow-none"
                      : "bg-yellow-400 hover:bg-yellow-300"
                  }`}
                  data-help-id="otp-backup-code-submit"
                >
                  {isLoading
                    ? t("publicSite.login.otp.verifying")
                    : t("publicSite.login.otp.backupCodeSubmit")}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(false);
                      setError(null);
                      setBackupCodeValue("");
                    }}
                    className="text-sm text-gray-400 hover:text-yellow-400 transition"
                  >
                    {t("publicSite.login.otp.backToOtp")}
                  </button>
                </div>
              </form>
            )}

            {/* Back to login */}
            <p className="text-center text-sm text-gray-500 mt-8">
              <Link
                to="/login"
                className="text-gray-400 hover:text-yellow-400 transition"
                data-help-id="otp-back-to-login"
              >
                {t("publicSite.login.otp.backToLogin")}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
