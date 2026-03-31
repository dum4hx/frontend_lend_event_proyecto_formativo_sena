/**
 * SearchableSelect — Dropdown that doubles as a search field.
 *
 * Options are filtered as the user types with a configurable debounce.
 * Fully keyboard-navigable (arrow keys, Enter, Escape).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
  /** Unique value stored/submitted. */
  value: string;
  /** Human-readable label rendered in the dropdown. */
  label: string;
}

export interface SearchableSelectProps {
  /** Available options. */
  options: SelectOption[];
  /** Currently selected value (controlled). */
  value: string;
  /** Called when the user selects an option. */
  onChange: (value: string) => void;
  /** Placeholder when nothing is selected. */
  placeholder?: string;
  /** Debounce delay for filtering (ms). */
  debounceMs?: number;
  /** Label rendered above the field. */
  label?: string;
  /** Disable interaction. */
  disabled?: boolean;
  /** Validation error message. */
  error?: string;
  /** Extra class names on the root wrapper. */
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  debounceMs = 300,
  label,
  disabled = false,
  error,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce the search query.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return options;
    const q = debouncedQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, debouncedQuery]);

  // Derive safe highlight index during render (avoids effect-based setState).
  const safeHighlightIdx = highlightIdx >= filtered.length ? -1 : highlightIdx;

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const open = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
    setDebouncedQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const select = useCallback(
    (v: string) => {
      onChange(v);
      setIsOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (safeHighlightIdx >= 0 && filtered[safeHighlightIdx]) {
          select(filtered[safeHighlightIdx].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Scroll highlighted into view.
  useEffect(() => {
    if (safeHighlightIdx < 0 || !listRef.current) return;
    const el = listRef.current.children[safeHighlightIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [safeHighlightIdx]);

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {label && <label className="form-label">{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full input flex items-center justify-between text-left ${error ? "input-error" : ""}`}
      >
        <span className={selectedLabel ? "text-white" : "text-gray-500"}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl overflow-hidden">
            {/* Search field */}
            <div className="flex items-center px-3 border-b border-[#333]">
              <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent border-none outline-none text-xs text-white py-2.5 pl-2"
                placeholder="Type to search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="text-gray-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Options list */}
            <ul
              ref={listRef}
              className="max-h-52 overflow-y-auto custom-scrollbar"
              role="listbox"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-xs text-gray-500 text-center">No results found</li>
              ) : (
                filtered.map((opt, idx) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    className={`px-4 py-2.5 text-xs cursor-pointer transition-colors ${
                      idx === safeHighlightIdx
                        ? "bg-[#FFD700]/10 text-[#FFD700]"
                        : opt.value === value
                          ? "text-[#FFD700]"
                          : "text-gray-300 hover:bg-white/5"
                    }`}
                    onClick={() => select(opt.value)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                  >
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
