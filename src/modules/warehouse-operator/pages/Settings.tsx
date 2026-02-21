import { useState } from "react";
import { Save, AlertCircle } from "lucide-react";
import { useAuth } from "../../../contexts/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.name.firstName || "",
    firstSurname: user?.name.firstSurname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    language: "en",
    notifications: {
      lowStock: true,
      criticalStock: true,
      movementAlerts: true,
      emailNotifications: true,
    },
  });

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your warehouse operator preferences</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-green-500" size={20} />
          <p className="text-green-400 font-semibold">Settings saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 font-medium text-sm mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium text-sm mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="firstSurname"
                value={formData.firstSurname}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 font-medium text-sm mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled
              className="w-full bg-[#1a1a1a] border border-[#333] text-gray-500 rounded-lg px-4 py-3 focus:outline-none cursor-not-allowed"
            />
            <p className="text-gray-500 text-xs mt-2">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-gray-300 font-medium text-sm mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>

          <div className="mb-6">
            <label className="block text-gray-300 font-medium text-sm mb-2">
              Language
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                name="lowStock"
                checked={formData.notifications.lowStock}
                onChange={handleCheckboxChange}
                className="w-4 h-4 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer accent-[#FFD700]"
              />
              <div className="flex-1">
                <p className="text-white font-medium">Low Stock Alerts</p>
                <p className="text-gray-500 text-sm">Get notified when items are low</p>
              </div>
            </label>

            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                name="criticalStock"
                checked={formData.notifications.criticalStock}
                onChange={handleCheckboxChange}
                className="w-4 h-4 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer accent-[#FFD700]"
              />
              <div className="flex-1">
                <p className="text-white font-medium">Critical Stock Alerts</p>
                <p className="text-gray-500 text-sm">Get notified when items are critical</p>
              </div>
            </label>

            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                name="movementAlerts"
                checked={formData.notifications.movementAlerts}
                onChange={handleCheckboxChange}
                className="w-4 h-4 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer accent-[#FFD700]"
              />
              <div className="flex-1">
                <p className="text-white font-medium">Stock Movement Notifications</p>
                <p className="text-gray-500 text-sm">Get notified about all stock movements</p>
              </div>
            </label>

            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.notifications.emailNotifications}
                onChange={handleCheckboxChange}
                className="w-4 h-4 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer accent-[#FFD700]"
              />
              <div className="flex-1">
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-gray-500 text-sm">Receive notifications via email</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#FFC107] transition-all disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
