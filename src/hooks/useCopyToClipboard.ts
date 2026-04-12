import { useToast } from "./useToast";

interface UseCopyToClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook para copiar texto al portapapeles
 * Muestra un toast de éxito o error
 */
export function useCopyToClipboard(options?: UseCopyToClipboardOptions) {
  const { showToast } = useToast();

  const copy = async (text: string) => {
    try {
      // Usar la API moderna de portapapeles si está disponible
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      showToast("success", options?.successMessage || "Copiado al portapapeles");
      return true;
    } catch {
      showToast("error", options?.errorMessage || "No se pudo copiar");
      return false;
    }
  };

  return { copy };
}
