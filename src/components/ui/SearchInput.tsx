/**
 * SearchInput — Standardised search field with icon, debounce, and clear button.
 *
 * The `value` emitted via `onChange` is already debounced (configurable).
 */

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export interface SearchInputProps {
  /** Current external value (controlled). */
  value: string;
  /** Called with the debounced value. */
  onChange: (value: string) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Debounce delay in ms. Defaults to 300. */
  debounceMs?: number;
  /** Extra class names on the container. */
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  debounceMs = 300,
  className = "",
}: SearchInputProps) {
  const [internal, setInternal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from outside when parent resets.
  useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleChange = (next: string) => {
    setInternal(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(next), debounceMs);
  };

  const handleClear = () => {
    setInternal("");
    onChange("");
  };

  return (
    <div className={`relative group ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
      <input
        type="text"
        className="w-full input pl-10 pr-9 text-xs font-mono"
        placeholder={placeholder}
        value={internal}
        onChange={(e) => handleChange(e.target.value)}
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
