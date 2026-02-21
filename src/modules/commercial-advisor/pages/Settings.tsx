import { useState } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

interface CommercialSettings {
  salesPersonName: string;
  email: string;
  phone: string;
  region: string;
  currency: string;
  language: string;
  notifyNewOrders: boolean;
  notifyPayments: boolean;
  weeklyReport: boolean;
}

const DEFAULT_SETTINGS: CommercialSettings = {
  salesPersonName: "John Doe",
  email: "john@lend.com",
  phone: "+1 (555) 123-4567",
  region: "North America",
  currency: "USD",
  language: "en",
  notifyNewOrders: true,
  notifyPayments: true,
  weeklyReport: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<CommercialSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleInputChange = (field: keyof CommercialSettings, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-[8px] ${
            saveMessage.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : "bg-red-500/20 border border-red-500/30 text-red-400"
          }`}
        >
          {saveMessage.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Forms Section */}
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={settings.salesPersonName}
                onChange={(e) => handleInputChange("salesPersonName", e.target.value)}
                className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Region
              </label>
              <input
                type="text"
                value={settings.region}
                onChange={(e) => handleInputChange("region", e.target.value)}
                className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleInputChange("language", e.target.value)}
                  className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="pt">Português</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="BRL">BRL - Brazilian Real</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-6">Notifications</h2>

          <div className="space-y-4">
            {/* Notify New Orders */}
            <div className="flex items-center justify-between p-4 bg-[#121212] rounded-[8px] border border-[#333]">
              <div>
                <p className="font-semibold text-white">New Orders</p>
                <p className="text-gray-400 text-sm">Get notified when new orders are placed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyNewOrders}
                  onChange={(e) => handleInputChange("notifyNewOrders", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFD700]"></div>
              </label>
            </div>

            {/* Notify Payments */}
            <div className="flex items-center justify-between p-4 bg-[#121212] rounded-[8px] border border-[#333]">
              <div>
                <p className="font-semibold text-white">Payment Updates</p>
                <p className="text-gray-400 text-sm">Get notified about payment status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyPayments}
                  onChange={(e) => handleInputChange("notifyPayments", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFD700]"></div>
              </label>
            </div>

            {/* Weekly Report */}
            <div className="flex items-center justify-between p-4 bg-[#121212] rounded-[8px] border border-[#333]">
              <div>
                <p className="font-semibold text-white">Weekly Report</p>
                <p className="text-gray-400 text-sm">Receive weekly sales summary report</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.weeklyReport}
                  onChange={(e) => handleInputChange("weeklyReport", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFD700]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-[8px] hover:bg-[#FFC700] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Save size={20} />
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
