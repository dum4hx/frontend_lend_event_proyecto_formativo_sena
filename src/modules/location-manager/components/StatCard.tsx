import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, trendUp }) => {
  return (
    <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 shadow-lg hover:border-[#FFD700] transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
          {trend && (
            <p className={`text-xs mt-2 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className="text-[#FFD700] opacity-80">{icon}</div>
      </div>
    </div>
  );
};
