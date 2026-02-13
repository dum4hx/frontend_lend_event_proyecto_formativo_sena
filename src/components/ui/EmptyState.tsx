/**
 * Reusable empty state component for when no data is available.
 * Provides clear visual feedback and optional actions.
 */

import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-4">
          <Icon size={32} className="text-gray-500" />
        </div>
      )}

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
