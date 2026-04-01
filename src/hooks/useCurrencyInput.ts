import { useState, useCallback, useEffect } from "react";

/**
 * Custom hook for handling COP currency input with real-time formatting.
 * 
 * Formats numeric input to COP format (e.g., 1234567.89 → 1.234.567,89) while
 * maintaining a raw numeric value for API submission. Supports decimal values.
 * 
 * @param initialValue - Initial numeric value (raw, unformatted)
 * @param onChangeRaw - Callback fired when raw numeric value changes
 * @returns Object with displayValue (formatted string) and handleChange (input handler)
 * 
 * @example
 * const { displayValue, handleChange } = useCurrencyInput(100000, (val) => {
 *   setFormData(prev => ({ ...prev, price: val }));
 * });
 * 
 * <input
 *   type="text"
 *   value={displayValue}
 *   onChange={handleChange}
 *   placeholder="0,00"
 * />
 */

/**
 * Format a number to COP currency string (es-CO locale).
 * E.g., 1234567.89 → "1.234.567,89"
 */
function formatCOP(num: number): string {
  if (isNaN(num) || num === 0) return "";
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return num.toString();
  }
}

/**
 * Parse a formatted or semi-formatted currency string back to a number.
 * Handles: "1.234.567,89" → 1234567.89
 * Also handles: "1,234,567.89" (US format) → converts to 1234567.89
 * Also handles: "$1.234.567,89" → removes currency symbols first
 * Also handles: "1.000.000" (no decimal) → 1000000
 */
function parseCurrencyInput(input: string): number {
  if (!input || input.trim() === "") return 0;

  // Remove currency symbols and special characters, but keep digits, dots, and commas
  const normalized = input.trim().replace(/[^\d.,]/g, "");

  if (!normalized) return 0;

  // Determine if input uses comma or dot as decimal separator
  // In es-CO, comma is decimal, dot is thousand separator
  // Find the last occurrence of each
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  let numericString = "";

  if (lastComma > lastDot) {
    // Comma appears after dot: es-CO format (1.234.567,89)
    // Comma is decimal separator
    // Remove dots (thousand separators), replace comma with dot for parseFloat
    numericString = normalized.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Dot appears after comma: either US format (1,234,567.89) or es-CO without decimals (1.000.000)
    // Check how many digits are after the last dot
    const afterLastDot = normalized.substring(lastDot + 1);
    if (afterLastDot.length <= 2) {
      // 1 or 2 digits after dot → it's a decimal separator (US format: 1,234,567.89 or 1234.89)
      // Remove commas (thousand separators)
      numericString = normalized.replace(/,/g, "");
    } else {
      // More than 2 digits after dot → it's a thousand separator (es-CO: 1.000.000)
      // This is an es-CO number without decimal part
      // Remove all dots and commas
      numericString = normalized.replace(/[.,]/g, "");
    }
  } else if (lastComma >= 0) {
    // Only commas, no dots
    // Could be US format (1,234,567) → remove commas
    numericString = normalized.replace(/,/g, "");
  } else if (lastDot >= 0) {
    // Only dots, no commas
    // Could be es-CO thousand separator (1.000.000) → remove dots
    numericString = normalized.replace(/\./g, "");
  } else {
    // No commas or dots
    numericString = normalized;
  }

  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
}

export function useCurrencyInput(
  initialValue: number | string = "",
  onChangeRaw?: (value: number) => void,
) {
  // Store the raw numeric value internally
  const [rawValue, setRawValue] = useState<number>(() => {
    const parsed = typeof initialValue === "string" ? parseFloat(initialValue) : initialValue;
    return isNaN(parsed) ? 0 : parsed;
  });

  // Display value is the formatted string for the input element
  const [displayValue, setDisplayValue] = useState<string>(() => {
    const parsed = typeof initialValue === "string" ? parseFloat(initialValue) : initialValue;
    const num = isNaN(parsed) ? 0 : parsed;
    return num === 0 ? "" : formatCOP(num);
  });

  /**
   * Sync raw value when initialValue prop changes (useful for edit flows).
   * Only update if the value has actually changed to avoid unnecessary updates.
   */
  useEffect(() => {
    const parsed = typeof initialValue === "string" ? parseFloat(initialValue) : initialValue;
    const newValue = isNaN(parsed) ? 0 : parsed;
    if (newValue !== rawValue) {
      setRawValue(newValue);
      setDisplayValue(newValue === 0 ? "" : formatCOP(newValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  /**
   * Handle input change event from text input.
   * Updates both rawValue and displayValue.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Parse the input to get raw numeric value
      const newRawValue = parseCurrencyInput(inputValue);

      // Update state
      setRawValue(newRawValue);
      setDisplayValue(inputValue.length === 0 ? "" : formatCOP(newRawValue));

      // Notify parent via callback
      if (onChangeRaw) {
        onChangeRaw(newRawValue);
      }
    },
    [onChangeRaw],
  );

  return {
    displayValue,
    handleChange,
    rawValue,
  };
}
