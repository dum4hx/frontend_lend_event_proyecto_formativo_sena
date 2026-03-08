import { Bot, Zap, Settings as SettingsIcon } from 'lucide-react';
import { StatCard } from '../components';

type AISetting = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

const aiSettings: AISetting[] = [
  { id: '1', name: 'Auto Response', description: 'Automatically respond to event inquiries', enabled: true },
  { id: '2', name: 'Smart Scheduling', description: 'AI-powered event scheduling', enabled: true },
  { id: '3', name: 'Attendee Analysis', description: 'Analyze attendee patterns and trends', enabled: false },
  { id: '4', name: 'Predictive Pricing', description: 'AI-based pricing recommendations', enabled: true },
];

export default function IASettings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Settings</h1>
        <p className="text-gray-400">Configure artificial intelligence features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Features" value={aiSettings.length} icon={<Bot size={28} />} />
        <StatCard label="Enabled" value={aiSettings.filter(s => s.enabled).length} icon={<Zap size={28} />} />
        <StatCard label="Disabled" value={aiSettings.filter(s => !s.enabled).length} icon={<SettingsIcon size={28} />} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">AI Features</h2>
        <div className="space-y-4">
          {aiSettings.map((setting) => (
            <div key={setting.id} className="bg-[#121212] border border-[#333] rounded-[12px] p-6 flex items-center justify-between hover:border-[#FFD700] transition-all">
              <div>
                <h3 className="text-white font-semibold mb-1">{setting.name}</h3>
                <p className="text-gray-400 text-sm">{setting.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={setting.enabled} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FFD700] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFD700]"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
