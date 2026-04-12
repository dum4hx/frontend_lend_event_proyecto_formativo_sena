import { useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { useLanguage } from "../../contexts/useLanguage";

interface SessionTimeoutModalProps {
  open: boolean;
  onStayConnected: () => void;
  onLogoutNow: () => void;
}

export function SessionTimeoutModal({
  open,
  onStayConnected,
  onLogoutNow,
}: SessionTimeoutModalProps) {
  const { t } = useLanguage();
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    primaryButtonRef.current?.focus();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onStayConnected}
      title={t("session.warningTitle")}
      size="sm"
      className="w-full"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onLogoutNow}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-red-500/70 text-red-300 hover:bg-red-900/30 transition-colors"
          >
            {t("session.logoutNow")}
          </button>
          <button
            type="button"
            ref={primaryButtonRef}
            onClick={onStayConnected}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-yellow-400 text-yellow-300 hover:bg-yellow-500/10 transition-colors"
          >
            {t("session.stayConnected")}
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-300 leading-relaxed">{t("session.warningMessage")}</p>
    </Modal>
  );
}
