import React from "react";

interface SuperAdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const SuperAdminStatCard: React.FC<SuperAdminStatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendUp,
}) => {
  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-5 hover:border-[#FFD700] transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFD700] flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        </div>
        {trend && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              trendUp ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {trendUp ? "▲" : "▼"} {trend}
          </span>
        )}
      </div>
    </div>
  );
};
