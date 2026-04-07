import { useRef } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";

/** A token that can be inserted into the pattern. */
interface PatternToken {
  /** The raw token string, e.g. "{YYYY}" */
  value: string;
  /** Translation key suffix used to look up label via t() */
  labelKey: string;
  /** Sample output for the preview */
  sample: string;
}

const TOKENS: PatternToken[] = [
  { value: "{SEQ:4}", labelKey: "SEQ", sample: "0001" },
  { value: "{YYYY}", labelKey: "YEAR", sample: "2026" },
  { value: "{YY}", labelKey: "YEAR", sample: "26" },
  { value: "{MM}", labelKey: "MONTH", sample: "04" },
  { value: "{DD}", labelKey: "DAY", sample: "06" },
  { value: "{LOCATION_CODE}", labelKey: "PREFIX", sample: "ABC" },
];

const SEPARATORS = ["-", "/", "."];

interface PatternBuilderProps {
  /** Current raw pattern value. */
  value: string;
  /** Callback when pattern changes. */
  onChange: (pattern: string) => void;
}

/**
 * Visual token builder for code scheme patterns.
 * Users click token buttons to append to the pattern string.
 * A live preview shows what the generated code would look like.
 */
export default function PatternBuilder({ value, onChange }: PatternBuilderProps) {
  const { t, language } = useLanguage();
  const isEs = language === "es";
  const inputRef = useRef<HTMLInputElement>(null);

  /** Insert a token at the cursor position, or append if no cursor. */
  const insertToken = (token: string) => {
    const input = inputRef.current;
    if (input && typeof input.selectionStart === "number") {
      const start = input.selectionStart;
      const end = input.selectionEnd ?? start;
      const next = value.slice(0, start) + token + value.slice(end);
      onChange(next);
      // Restore cursor after the inserted token
      requestAnimationFrame(() => {
        const pos = start + token.length;
        input.setSelectionRange(pos, pos);
        input.focus();
      });
    } else {
      onChange(value + token);
    }
  };

  /** Build a preview string by replacing tokens with sample values. */
  const preview = (() => {
    let result = value;
    for (const tk of TOKENS) {
      result = result.replaceAll(tk.value, tk.sample);
    }
    // Handle {SEQ} without padding
    result = result.replace(/\{SEQ(?::\d+)?\}/gi, "1");
    return result;
  })();

  return (
    <div className="space-y-3">
      {/* Token buttons */}
      <div data-help-id="code-scheme-pattern-tokens">
        <p className="text-xs text-gray-500 mb-2">{t("settings.codeSchemes.patternBuilderHint")}</p>
        <div className="flex flex-wrap gap-1.5">
          {TOKENS.map((tk) => (
            <button
              key={tk.value}
              type="button"
              onClick={() => insertToken(tk.value)}
              className="px-2.5 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-[#FFD700] hover:bg-[#252525] hover:border-[#FFD700]/40 transition-all font-mono"
              title={tk.sample}
            >
              {tk.value}
            </button>
          ))}
          {SEPARATORS.map((sep) => (
            <button
              key={sep}
              type="button"
              onClick={() => insertToken(sep)}
              className="px-2.5 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-gray-400 hover:bg-[#252525] hover:border-[#444] transition-all font-mono"
              title={isEs ? "Separador" : "Separator"}
            >
              {sep}
            </button>
          ))}
        </div>
      </div>

      {/* Raw pattern input */}
      <div className="relative" data-help-id="code-scheme-pattern-input">
        <input
          ref={inputRef}
          type="text"
          maxLength={50}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#FFD700] transition-all placeholder-gray-600 pr-8"
          placeholder={isEs ? "ej. LO-{YYYY}-{SEQ:4}" : "e.g. LO-{YYYY}-{SEQ:4}"}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Live preview */}
      {value && (
        <div
          className="flex items-center gap-2 bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2"
          data-help-id="code-scheme-pattern-preview"
        >
          <span className="text-xs text-gray-500 uppercase tracking-wider shrink-0">
            {t("settings.codeSchemes.patternPreview")}:
          </span>
          <span className="text-sm text-[#FFD700] font-mono font-semibold truncate">{preview}</span>
        </div>
      )}
    </div>
  );
}
