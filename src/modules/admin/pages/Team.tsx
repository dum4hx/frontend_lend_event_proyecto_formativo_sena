import { useState, useEffect } from "react";
import { Users, Shield, Plus, Trash2, Edit } from "lucide-react";
import { StatCard } from "../components";
import {
  getUsers,
  inviteUser,
  updateUser,
  updateUserRole,
  deactivateUser,
} from "../../../services/adminService";
import { ApiError } from "../../../lib/api";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "invited";
};

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    firstSurname: "",
    email: "",
    phone: "",
    role: "commercial_advisor",
  });

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();

      const members: TeamMember[] = (response.data.users ?? []).map(
        (user: any) => {
          const profile = (user.profile || user.name || {}) as Record<
            string,
            string
          >;
          const firstName = profile.firstName || "";
          const lastName = profile.lastName || profile.firstSurname || "";
          const status = user.status === "inactive" ? "inactive" : user.status === "invited" ? "invited" : "active";
          return {
            id: (user._id as string) || (user.id as string),
            name: `${firstName} ${lastName}`.trim() || (user.email as string),
            email: user.email as string,
            role: (user.role as string) || "undefined",
            status: status
          };
        },
      );

      setTeamMembers(members);
      setError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load team members";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingId(member.id);
      const [firstName, ...rest] = member.name.trim().split(" ");
      const firstSurname = rest.join(" ").trim();
      setFormData({
        firstName: firstName || "",
        firstSurname: firstSurname || "",
        email: member.email,
        phone: "",
        role: member.role,
      });
    } else {
      setEditingId(null);
      setFormData({ firstName: "", firstSurname: "", email: "", phone: "", role: "commercial_advisor" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ firstName: "", firstSurname: "", email: "", phone: "", role: "commercial_advisor" });
  };

  const handleSaveUser = async () => {
    try {
      if (!formData.firstName || !formData.firstSurname || !formData.email) {
        alert("Por favor completa todos los campos requeridos");
        return;
      }

      // Validate phone format (E.164) only for new users
      if (!editingId) {
        if (!formData.phone) {
          alert("El teléfono es requerido");
          return;
        }
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
          alert("Formato de teléfono inválido. Use formato E.164 (ej: +573001234567)");
          return;
        }
      }

      if (editingId) {
        await updateUser(editingId, {
          name: {
            firstName: formData.firstName,
            firstSurname: formData.firstSurname,
          },
        });

        await updateUserRole(editingId, {
          role: formData.role as import("../../../types/api").UserRole,
        });
      } else {
        await inviteUser({
          email: formData.email,
          phone: formData.phone,
          name: {
            firstName: formData.firstName,
            firstSurname: formData.firstSurname,
          },
          role: formData.role as import("../../../types/api").UserRole,
        });
      }

      handleCloseModal();
      await fetchTeamMembers();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Unknown error";
      alert("Error: " + message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas desactivar este usuario?"))
      return;

    try {
      await deactivateUser(userId);
      await fetchTeamMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Error: " + message);
    }
  };

  const activeCount = teamMembers.filter((m) => m.status === "active").length;
  const rolesCount = new Set(teamMembers.map((m) => m.role)).size;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Members</h1>
          <p className="text-gray-400">Manage your team and permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-yellow-400 transition"
        >
          <Plus size={20} />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Members"
          value={teamMembers.length}
          icon={<Users size={28} />}
        />
        <StatCard
          label="Active Members"
          value={activeCount}
          icon={<Shield size={28} />}
        />
        <StatCard label="Roles" value={rolesCount} icon={<Users size={28} />} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Team List</h2>
        <div className="bg-[#121212] border border-[#333] rounded-[12px] overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-400">
              Loading team members...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">{error}</div>
          ) : teamMembers.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No team members found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#333]">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all"
                  >
                    <td className="px-6 py-4 text-white">{member.name}</td>
                    <td className="px-6 py-4 text-gray-400">{member.email}</td>
                    <td className="px-6 py-4 text-gray-400">{member.role}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${member.status === "active" ? "bg-green-900 text-green-200" : member.status === "inactive" ? "bg-red-900 text-red-200" : "bg-yellow-900 text-yellow-200"}`}
                      >
                        {member.status === "active" ? "Active" : member.status === "inactive" ? "Inactive" : "Invited"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(member)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
                          title="Deactivate"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-[#333] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingId ? "Edit Member" : "Invite New Member"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Primer Nombre *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Juan"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Primer Apellido *
                </label>
                <input
                  type="text"
                  value={formData.firstSurname}
                  onChange={(e) =>
                    setFormData({ ...formData, firstSurname: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Pérez"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!!editingId}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700] disabled:opacity-50"
                  placeholder="email@example.com"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Teléfono * (formato E.164)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                    placeholder="+573001234567"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="warehouse_operator">Warehouse Operator</option>
                  <option value="commercial_advisor">Commercial Advisor</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-yellow-400 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
