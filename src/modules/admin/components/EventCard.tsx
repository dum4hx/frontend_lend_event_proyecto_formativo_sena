import React from 'react';

interface EventCardProps {
  name: string;
  date: string;
  status: 'Upcoming' | 'Live' | 'Completed';
  capacity: number;
  attendees: number;
}

export const EventCard: React.FC<EventCardProps> = ({ name, date, status, capacity, attendees }) => {
  const progress = Math.min(100, (attendees / capacity) * 100);

  const statusStyles: Record<EventCardProps['status'], string> = {
    Upcoming: 'bg-blue-900 text-blue-200',
    Live: 'bg-green-900 text-green-200',
    Completed: 'bg-gray-700 text-gray-200',
  };

  return (
    <div className="bg-[#121212] border border-[#333] rounded-[12px] p-5 shadow-lg hover:border-[#FFD700] transition-all">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-white font-semibold text-lg">{name}</h4>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[status]}`}>
          {status}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-4">{date}</p>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Capacity</span>
          <span>{attendees}/{capacity}</span>
        </div>
        <div className="w-full bg-[#0a0a0a] rounded-full h-2 border border-[#333]">
          <div
            className="bg-[#FFD700] h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="text-right text-xs text-[#FFD700] font-medium">
        {Math.round(progress)}% Full
      </div>
    </div>
  );
};
