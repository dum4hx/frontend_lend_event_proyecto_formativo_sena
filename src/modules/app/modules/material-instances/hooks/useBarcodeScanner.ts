import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
  minLength?: number;
  idleResetMs?: number;
  maxScanDurationMs?: number;
}

/**
 * Captures keyboard-wedge barcode scanners that type quickly and end with Enter.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 4,
  idleResetMs = 80,
  maxScanDurationMs = 350,
}: UseBarcodeScannerOptions): void {
  const bufferRef = useRef("");
  const startedAtRef = useRef(0);
  const lastKeyAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = "";
      startedAtRef.current = 0;
      lastKeyAtRef.current = 0;
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const now = Date.now();

      if (event.key === "Enter") {
        const code = bufferRef.current.trim();
        const duration = now - startedAtRef.current;

        if (code.length >= minLength && duration <= maxScanDurationMs) {
          onScan(code);
        }

        bufferRef.current = "";
        startedAtRef.current = 0;
        lastKeyAtRef.current = 0;
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      if (!bufferRef.current || now - lastKeyAtRef.current > idleResetMs) {
        bufferRef.current = event.key;
        startedAtRef.current = now;
      } else {
        bufferRef.current += event.key;
      }

      lastKeyAtRef.current = now;
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, idleResetMs, maxScanDurationMs, minLength, onScan]);
}