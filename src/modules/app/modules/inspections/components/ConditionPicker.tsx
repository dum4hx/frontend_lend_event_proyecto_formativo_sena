import React from "react";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { InspectionCondition } from "../../../../../types/api";

interface ConditionPickerProps {
  value: InspectionCondition;
  onChange: (value: InspectionCondition) => void;
  disabled?: boolean;
}

/**
 * Interactive status picker for material instance condition.
 * Users can choose between Good, Damaged, and Lost with visual feedback.
 */
export const ConditionPicker: React.FC<ConditionPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options: {
    id: InspectionCondition;
    label: string;
    icon: React.ElementType;
    activeColor: string;
    hoverColor: string;
  }[] = [
    {
      id: "good",
      label: "Good",
      icon: CheckCircle,
      activeColor: "bg-green-600 border-green-500",
      hoverColor: "hover:bg-green-700 hover:border-green-600",
    },
    {
      id: "damaged",
      label: "Damaged",
      icon: AlertTriangle,
      activeColor: "bg-yellow-600 border-yellow-500",
      hoverColor: "hover:bg-yellow-700 hover:border-yellow-600",
    },
    {
      id: "lost",
      label: "Lost",
      icon: XCircle,
      activeColor: "bg-red-600 border-red-500",
      hoverColor: "hover:bg-red-700 hover:border-red-600",
    },
  ];

  return (
    <div className="flex space-x-2">
      {options.map((option) => {
        const isActive = value === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`
              flex flex-col items-center justify-center
              px-3 py-2 rounded-md border text-xs font-medium transition-all duration-200
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${
                isActive
                  ? `${option.activeColor} text-white`
                  : "bg-transparent border-[#333] text-gray-400 hover:text-white " +
                    option.hoverColor
              }
            `}
          >
            <Icon className="w-4 h-4 mb-1" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
