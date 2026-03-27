import React, { useEffect, useMemo, useState } from "react";
import { Printer, X } from "lucide-react";
import JsBarcode from "jsbarcode";
import type { MaterialInstance } from "../../../../../types/api";
import { MaterialBarcode } from "./MaterialBarcode";

type PrintPreset = "zebra-4x6" | "thermal-58" | "thermal-80";

interface PrintPresetDefinition {
  label: string;
  description: string;
  pageWidthMm: number;
  pageHeightMm?: number;
  previewWidthPx: number;
  barcodeHeight: number;
  barcodeWidth: number;
  compactLayout: boolean;
}

const PRINT_PRESET_STORAGE_KEY = "materialInstances.barcodePrintPreset";

const PRINT_PRESETS: Record<PrintPreset, PrintPresetDefinition> = {
  "zebra-4x6": {
    label: "Zebra 4x6",
    description: "100 x 150 mm label",
    pageWidthMm: 100,
    pageHeightMm: 150,
    previewWidthPx: 360,
    barcodeHeight: 92,
    barcodeWidth: 2,
    compactLayout: false,
  },
  "thermal-58": {
    label: "Thermal 58 mm",
    description: "58 mm continuous roll",
    pageWidthMm: 58,
    previewWidthPx: 240,
    barcodeHeight: 64,
    barcodeWidth: 1.4,
    compactLayout: true,
  },
  "thermal-80": {
    label: "Thermal 80 mm",
    description: "80 mm continuous roll",
    pageWidthMm: 80,
    previewWidthPx: 300,
    barcodeHeight: 72,
    barcodeWidth: 1.7,
    compactLayout: true,
  },
};

interface BarcodePrintModalProps {
  isOpen: boolean;
  instances: MaterialInstance[];
  onClose: () => void;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  instances,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PrintPreset>("zebra-4x6");
  const [copiesPerLabel, setCopiesPerLabel] = useState(1);

  useEffect(() => {
    const storedPreset = localStorage.getItem(PRINT_PRESET_STORAGE_KEY);
    if (!storedPreset) {
      return;
    }

    if (storedPreset in PRINT_PRESETS) {
      setSelectedPreset(storedPreset as PrintPreset);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PRINT_PRESET_STORAGE_KEY, selectedPreset);
  }, [selectedPreset]);

  const printableInstances = useMemo(
    () =>
      instances.filter((instance) => {
        const code = instance.barcode?.trim() || instance.serialNumber.trim();
        return Boolean(code);
      }),
    [instances],
  );

  const labelItems = useMemo(
    () =>
      printableInstances.flatMap((instance) =>
        Array.from({ length: copiesPerLabel }, (_, copyIndex) => ({
          instance,
          copyIndex: copyIndex + 1,
          totalCopies: copiesPerLabel,
        })),
      ),
    [copiesPerLabel, printableInstances],
  );

  const preset = PRINT_PRESETS[selectedPreset];

  const escapeHtml = (value: string): string =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const buildPrintMarkup = (): string => {
    const renderBarcodeSvg = (value: string): string => {
      const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svgNode, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: preset.barcodeWidth,
        height: preset.barcodeHeight,
        lineColor: "#111111",
        background: "#ffffff",
      });
      return svgNode.outerHTML;
    };

    return labelItems
      .map(({ instance, copyIndex, totalCopies }) => {
        const resolvedCode = (instance.barcode?.trim() || instance.serialNumber.trim()).toUpperCase();
        const materialName = instance.modelId?.name || "Unknown material";
        const locationName = instance.locationId?.name || "Unknown";

        return `
          <article class="barcode-card">
            <h3 class="barcode-title ${preset.compactLayout ? "compact" : ""}">${escapeHtml(
              preset.compactLayout ? instance.serialNumber : materialName,
            )}</h3>
            <p class="barcode-meta ${preset.compactLayout ? "compact" : ""}">
              Serial: ${escapeHtml(instance.serialNumber)} | Location: ${escapeHtml(locationName)}
            </p>
            <div class="barcode-wrap ${preset.compactLayout ? "compact" : ""}">
              ${renderBarcodeSvg(resolvedCode)}
            </div>
            <p class="code ${preset.compactLayout ? "compact" : ""}">${escapeHtml(resolvedCode)}</p>
            ${
              totalCopies > 1
                ? `<p class="copy-mark">Copy ${copyIndex} / ${totalCopies}</p>`
                : ""
            }
          </article>
        `;
      })
      .join("");
  };

  const handlePrint = () => {
    if (labelItems.length === 0) {
      return;
    }

    const popup = window.open("about:blank", "_blank", "width=1100,height=800");
    if (!popup) {
      return;
    }

    const pageSizeRule = preset.pageHeightMm
      ? `size: ${preset.pageWidthMm}mm ${preset.pageHeightMm}mm;`
      : `size: ${preset.pageWidthMm}mm auto;`;

    const markup = buildPrintMarkup();

    popup.document.open();
    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Print Material Barcodes</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              font-family: Inter, Arial, sans-serif;
              color: #111;
              background: #fff;
            }
            .barcode-grid {
              display: block;
            }
            .barcode-card {
              width: ${preset.pageWidthMm}mm;
              min-height: ${preset.pageHeightMm ? `${preset.pageHeightMm}mm` : "auto"};
              padding: ${preset.compactLayout ? "2.5mm" : "5mm"};
              border: 0;
              border-radius: 0;
              break-after: page;
              page-break-after: always;
              display: flex;
              flex-direction: column;
              justify-content: ${preset.compactLayout ? "flex-start" : "center"};
            }
            .barcode-title {
              font-size: 13px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .barcode-title.compact {
              font-size: 10px;
              margin-bottom: 2px;
              font-weight: 600;
            }
            .barcode-meta {
              font-size: 11px;
              color: #555;
              margin-bottom: 10px;
            }
            .barcode-meta.compact {
              display: none;
            }
            .barcode-wrap {
              padding: ${preset.compactLayout ? "1mm 0.5mm" : "3mm 2mm"};
              border: 1px solid #d4d4d4;
              border-radius: 2mm;
              background: #fff;
            }
            .barcode-wrap.compact {
              flex: 1;
            }
            .barcode-card svg {
              width: 100%;
              height: auto;
            }
            .barcode-card .code {
              font-family: monospace;
              font-size: 11px;
              margin-top: 8px;
              word-break: break-all;
            }
            .barcode-card .code.compact {
              font-size: 9px;
              margin-top: 3px;
              text-align: center;
            }
            .copy-mark {
              margin-top: 2px;
              font-size: 9px;
              color: #666;
              text-align: right;
            }
            @page {
              margin: 0;
              ${pageSizeRule}
            }
          </style>
        </head>
        <body>
          <div class="barcode-grid">${markup}</div>
        </body>
      </html>
    `);

    popup.document.close();

    setTimeout(() => {
      popup.focus();
      popup.print();
    }, 120);

    popup.addEventListener("afterprint", () => {
      popup.close();
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-[#333] bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#333] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Print Material Barcodes</h2>
            <p className="mt-1 text-sm text-gray-400">
              Review the current filtered labels and send them to print.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#1d1d1d] hover:text-white"
            aria-label="Close barcode print modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-[#333] px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PRINT_PRESETS) as Array<[PrintPreset, PrintPresetDefinition]>).map(
                ([presetKey, presetOption]) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => setSelectedPreset(presetKey)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      selectedPreset === presetKey
                        ? "border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700]"
                        : "border-[#333] bg-[#171717] text-gray-300 hover:bg-[#202020] hover:text-white"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{presetOption.label}</span>
                    <span className="block text-xs text-gray-400">{presetOption.description}</span>
                  </button>
                ),
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-300" htmlFor="barcode-copies-input">
                Copies per label
              </label>
              <input
                id="barcode-copies-input"
                type="number"
                min={1}
                max={20}
                value={copiesPerLabel}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(parsed)) {
                    setCopiesPerLabel(1);
                    return;
                  }
                  setCopiesPerLabel(Math.max(1, Math.min(20, parsed)));
                }}
                className="w-20 rounded-lg border border-[#333] bg-[#171717] px-3 py-2 text-sm text-white outline-none focus:border-[#FFD700]/45"
              />
              <button
                type="button"
                onClick={handlePrint}
                disabled={labelItems.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-[#FFD700]/35 bg-[#FFD700]/8 px-4 py-2 text-sm font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/14 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer size={16} />
                Print {labelItems.length} Labels
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {labelItems.length === 0 ? (
            <div className="rounded-xl border border-[#333] bg-[#171717] px-4 py-10 text-center text-gray-400">
              No printable barcodes available for the current filter.
            </div>
          ) : (
            <div className="barcode-grid space-y-4">
              {labelItems.map(({ instance, copyIndex, totalCopies }) => {
                const resolvedCode = instance.barcode?.trim() || instance.serialNumber.trim();

                return (
                  <article
                    key={`${instance._id}-${copyIndex}`}
                    className={`barcode-card rounded-xl border border-[#333] bg-[#171717] p-4 ${preset.compactLayout ? "compact" : ""}`}
                    style={{ width: `${preset.previewWidthPx}px`, maxWidth: "100%" }}
                  >
                    <h3 className={`barcode-title text-sm font-bold text-white ${preset.compactLayout ? "compact" : ""}`}>
                      {preset.compactLayout
                        ? instance.serialNumber
                        : instance.modelId?.name || "Unknown material"}
                    </h3>
                    <p className={`barcode-meta text-xs text-gray-400 ${preset.compactLayout ? "compact" : ""}`}>
                      Serial: {instance.serialNumber} | Location: {instance.locationId?.name || "Unknown"}
                    </p>
                    <div className={`barcode-wrap rounded-lg border border-[#333] bg-white p-3 ${preset.compactLayout ? "compact" : ""}`}>
                      <MaterialBarcode
                        value={resolvedCode}
                        fallbackValue={instance.serialNumber}
                        height={preset.barcodeHeight}
                        width={preset.barcodeWidth}
                        showCodeLabel={false}
                      />
                    </div>
                    <p className={`code mt-3 text-xs font-mono text-gray-300 ${preset.compactLayout ? "compact" : ""}`}>
                      {resolvedCode}
                    </p>
                    {totalCopies > 1 && (
                      <p className="copy-mark">Copy {copyIndex} / {totalCopies}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};