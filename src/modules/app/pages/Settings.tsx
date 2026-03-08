import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Bell, Lock, Palette, Save } from "lucide-react";
import { StatCard } from "../components";
import { getOrganization, updateOrganization } from "../../../services/adminService";
import { ApiError } from "../../../lib/api";

type Setting = {
  id: string;
  category: string;
  icon: React.ReactNode;
  description: string;
};

const settings: Setting[] = [
  {
    id: "1",
    category: "Notifications",
    icon: <Bell size={28} />,
    description: "Manage notification preferences",
  },
  {
    id: "2",
    category: "Security",
    icon: <Lock size={28} />,
    description: "Update security settings",
  },
  {
    id: "3",
    category: "Appearance",
    icon: <Palette size={28} />,
    description: "Customize interface theme",
  },
  {
    id: "4",
    category: "Account",
    icon: <SettingsIcon size={28} />,
    description: "Manage account settings",
  },
];

export default function Settings() {
  const [orgData, setOrgData] = useState({
    name: "",
    email: "",
    phone: "",
    legalName: "",
    taxId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        setLoading(true);
        const response = await getOrganization();
        const org = response.data.organization;

        setOrgData({
          name: org?.name || "",
          email: org?.email || "",
          phone: org?.phone || "",
          legalName: org?.legalName || "",
          taxId: org?.taxId || "",
        });
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.message : "Failed to load organization data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await updateOrganization({
        name: orgData.name,
        email: orgData.email,
        phone: orgData.phone,
        legalName: orgData.legalName,
        taxId: orgData.taxId,
      });

      setError(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Error updating settings";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your preferences and account</p>
        </div>
        <div className="text-center text-gray-400 py-8">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your preferences and account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          label="Settings Sections"
          value={settings.length}
          icon={<SettingsIcon size={28} />}
        />
        <StatCard label="Organization" value={orgData.name || "N/A"} icon={<Bell size={28} />} />
      </div>

      {error && (
        <div className="bg-red-900 border border-red-600 rounded-lg p-4 text-red-200">{error}</div>
      )}

      {success && (
        <div className="bg-green-900 border border-green-600 rounded-lg p-4 text-green-200">
          Settings updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Settings */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Organization Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="Your organization name"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Legal Name</label>
              <input
                type="text"
                value={orgData.legalName}
                onChange={(e) => setOrgData({ ...orgData, legalName: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="Legal business name"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Tax ID</label>
              <input
                type="text"
                value={orgData.taxId}
                onChange={(e) => setOrgData({ ...orgData, taxId: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="Tax identification number"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={orgData.email}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={orgData.phone}
                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Settings Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="bg-[#121212] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-[#FFD700]">{setting.icon}</div>
                <h3 className="text-white font-semibold text-lg">{setting.category}</h3>
              </div>
              <p className="text-gray-400 text-sm">{setting.description}</p>
              <button className="mt-4 px-4 py-2 bg-[#FFD700] text-black font-medium rounded-[8px] hover:bg-yellow-400 transition-all">
                Manage
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
