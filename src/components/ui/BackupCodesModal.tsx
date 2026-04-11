import { useState } from "react";
import { useLanguage } from "../../contexts/useLanguage";

interface BackupCodesModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** The 10 single-use backup codes returned by the API on first 2FA login. */
  codes: string[];
  /** Called when the user acknowledges that they have saved their codes. */
  onClose: () => void;
}

/**
 * Modal that displays the 10 single-use backup codes generated on a user's
 * first 2FA login. Provides clipboard copy and text-file download actions.
 * The user must acknowledge before closing.
 */
export function BackupCodesModal({ isOpen, codes, onClose }: BackupCodesModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codesText = codes
    .map((code, idx) => `${(idx + 1).toString().padStart(2, "0")}. ${code}`)
    .join("\n");

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(codesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select the textarea containing the codes
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        `LendEvent — Backup Codes\n` +
          `Generated: ${new Date().toISOString()}\n\n` +
          `Keep these codes in a safe place. Each code can only be used once.\n\n` +
          codesText +
          `\n`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lendevent-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-codes-title"
      data-help-id="backup-codes-modal"
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-full overflow-y-auto">
        {/* Warning icon */}
        <div className="flex items-center justify-center w-14 h-14 bg-yellow-400/10 border border-yellow-400/30 rounded-full mx-auto mb-5">
          <svg
            className="w-7 h-7 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 id="backup-codes-title" className="text-xl font-extrabold text-white text-center mb-2">
          {t("publicSite.login.backupCodes.modalTitle")}
        </h2>

        <p className="text-gray-400 text-sm text-center mb-3 leading-relaxed">
          {t("publicSite.login.backupCodes.description")}
        </p>

        <p className="text-yellow-400 text-xs text-center font-semibold mb-5">
          {t("publicSite.login.backupCodes.warning")}
        </p>

        {/* Codes grid */}
        <div
          className="grid grid-cols-2 gap-2 bg-zinc-950 border border-zinc-700 rounded-xl p-4 mb-5"
          data-help-id="backup-codes-list"
        >
          {codes.map((code, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 font-mono text-sm text-white bg-zinc-800/60 rounded-lg px-3 py-2"
            >
              <span className="text-gray-500 text-xs w-5 text-right shrink-0">{idx + 1}.</span>
              <span className="tracking-wider">{code}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={handleCopyAll}
            className="w-full py-3 rounded-xl border border-zinc-600 text-white font-semibold hover:bg-zinc-800 transition flex items-center justify-center gap-2"
            data-help-id="backup-codes-copy"
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-green-400">{t("publicSite.login.backupCodes.copied")}</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"
                  />
                </svg>
                {t("publicSite.login.backupCodes.copyAll")}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3 rounded-xl border border-zinc-600 text-white font-semibold hover:bg-zinc-800 transition flex items-center justify-center gap-2"
            data-help-id="backup-codes-download"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {t("publicSite.login.backupCodes.download")}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-yellow-400 text-black font-extrabold hover:bg-yellow-300 transition"
          data-help-id="backup-codes-acknowledge"
        >
          {t("publicSite.login.backupCodes.acknowledge")}
        </button>
      </div>
    </div>
  );
}
