interface ToggleRowProps {
  /** Display label for the toggle. */
  label: string;
  /** Whether the toggle is checked. */
  checked: boolean;
  /** Called when the toggle value changes. */
  onChange: (value: boolean) => void;
  /** When true, the toggle is visible but not interactive. */
  disabled?: boolean;
}

export default function ToggleRow({ label, checked, onChange, disabled = false }: ToggleRowProps) {
  return (
    <label
      className={`flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <span className="text-gray-200 text-sm sm:text-base">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#FFD700]" : "bg-[#333]"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-black transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
