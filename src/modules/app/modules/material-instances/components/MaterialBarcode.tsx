import React, { useEffect, useMemo, useRef } from "react";
import JsBarcode from "jsbarcode";

interface MaterialBarcodeProps {
  value?: string;
  fallbackValue?: string;
  height?: number;
  width?: number;
  compact?: boolean;
  showCodeLabel?: boolean;
  className?: string;
}

export const MaterialBarcode: React.FC<MaterialBarcodeProps> = ({
  value,
  fallbackValue,
  height = 44,
  width = 1.2,
  compact = false,
  showCodeLabel = true,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const resolvedValue = useMemo(() => {
    const directValue = value?.trim();
    if (directValue) {
      return directValue;
    }

    return fallbackValue?.trim() ?? "";
  }, [fallbackValue, value]);

  useEffect(() => {
    if (!svgRef.current || !resolvedValue) {
      return;
    }

    JsBarcode(svgRef.current, resolvedValue, {
      format: "CODE128",
      displayValue: false,
      margin: 0,
      width,
      height,
      background: "transparent",
      lineColor: "#111111",
    });
  }, [height, resolvedValue, width]);

  if (!resolvedValue) {
    return <span className="text-xs text-gray-500">No barcode available</span>;
  }

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <div
        className={`inline-flex max-w-full overflow-hidden rounded-md border border-[#d6d6d6] bg-white px-2 py-1 ${
          compact ? "" : "shadow-sm"
        }`}
      >
        <svg ref={svgRef} aria-label={`Barcode ${resolvedValue}`} className="max-w-full" />
      </div>
      {showCodeLabel && <p className="text-[11px] font-mono text-gray-500">{resolvedValue}</p>}
    </div>
  );
};