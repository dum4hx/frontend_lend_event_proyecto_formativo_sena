import { useState, useEffect } from "react";
import { Users, Shield, Plus, Trash2, Edit, X } from "lucide-react";
import { StatCard } from "../components";
import {
  getUsers,
  inviteUser,
  updateUser,
  updateUserRole,
  deactivateUser,
} from "../../../services/adminService";
import { ApiError } from "../../../lib/api";
import {
  validateFirstName,
  validateLastName,
  validateEmail,
  validateRequiredPhone,
} from "../../../utils/validators";
import { AlertModal, type AlertModalType } from "../../../components/ui/AlertModal";

const COLOMBIA_PHONE_PREFIX = "+57";

type TeamFormField = "firstName" | "firstSurname" | "email" | "phone" | "role";

const formatNameInput = (value: string) => {
  let v = value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
  v = v.replace(/\s{2,}/g, " ");
  v = v.slice(0, 50);
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1);
};

const formatPhoneInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.slice(0, 10);
};

const formatEmailInput = (value: string) => value.trim().toLowerCase();

const toColombianPhone = (digits: string) => (digits ? `${COLOMBIA_PHONE_PREFIX}${digits}` : "");

const inputClass = (hasError: boolean) =>
  `w-full bg-zinc-900 rounded-xl py-4 px-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"}`;

const phoneInputWrapperClass = (hasError: boolean) =>
  `w-full bg-zinc-900 rounded-xl text-white transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus-within:border-red-500" : "border-zinc-800 focus-within:border-yellow-400"}`;

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
  const [formErrors, setFormErrors] = useState<Partial<Record<TeamFormField, string>>>({});
  const [formTouched, setFormTouched] = useState<Partial<Record<TeamFormField, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    open: boolean;
    type: AlertModalType;
    title?: string;
    message: string;
  }>({ open: false, type: "error", message: "" });

  const showAlert = (type: AlertModalType, message: string, title?: string) =>
    setAlertModal({ open: true, type, message, title });
  const closeAlert = () => setAlertModal((prev) => ({ ...prev, open: false }));

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();

      const members: TeamMember[] = (response.data.users ?? []).map((user: any) => {
        const profile = (user.profile || user.name || {}) as Record<string, string>;
        const firstName = profile.firstName || "";
        const lastName = profile.lastName || profile.firstSurname || "";
        const status =
          user.status === "inactive"
            ? "inactive"
            : user.status === "invited"
              ? "invited"
              : "active";
        return {
          id: (user._id as string) || (user.id as string),
          name: `${firstName} ${lastName}`.trim() || (user.email as string),
          email: user.email as string,
          role: (user.role as string) || "undefined",
          status: status,
        };
      });

      setTeamMembers(members);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load team members";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const validateField = (field: TeamFormField, data = formData): string | undefined => {
    switch (field) {
      case "firstName": {
        const r = validateFirstName(data.firstName);
        return r.isValid ? undefined : r.message;
      }
      case "firstSurname": {
        const r = validateLastName(data.firstSurname);
        return r.isValid ? undefined : r.message;
      }
      case "email": {
        const r = validateEmail(data.email);
        return r.isValid ? undefined : r.message;
      }
      case "phone": {
        if (!editingId) {
          const r = validateRequiredPhone(toColombianPhone(data.phone));
          return r.isValid ? undefined : r.message;
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const handleFieldBlur = (field: TeamFormField) => {
    setFormTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field);
    setFormErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const getFieldError = (field: TeamFormField) =>
    formTouched[field] ? formErrors[field] : undefined;

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
      setFormData({
        firstName: "",
        firstSurname: "",
        email: "",
        phone: "",
        role: "commercial_advisor",
      });
    }
    setFormErrors({});
    setFormTouched({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      firstName: "",
      firstSurname: "",
      email: "",
      phone: "",
      role: "commercial_advisor",
    });
    setFormErrors({});
    setFormTouched({});
  };

  const handleSaveUser = async (e?: any) => {
    e?.preventDefault?.();
    setSubmitting(true);
    try {
      // Touch all fields and run full validation
      const fieldsToValidate: TeamFormField[] = editingId
        ? ["firstName", "firstSurname", "email"]
        : ["firstName", "firstSurname", "email", "phone"];
      const allTouched: Partial<Record<TeamFormField, boolean>> = {};
      const allErrors: Partial<Record<TeamFormField, string>> = {};
      for (const field of fieldsToValidate) {
        allTouched[field] = true;
        const msg = validateField(field);
        if (msg) allErrors[field] = msg;
      }
      setFormTouched((prev) => ({ ...prev, ...allTouched }));
      setFormErrors(allErrors);
      if (Object.keys(allErrors).length > 0) return;

      if (editingId) {
        await updateUser(editingId, {
          name: {
            firstName: formData.firstName,
            firstSurname: formData.firstSurname,
          },
        });

        console.log("[Team] Updating user role to:", formData.role, "| User ID:", editingId);

        await updateUserRole(editingId, {
          role: formData.role as import("../../../types/api").UserRole,
        });
      } else {
        console.log(
          "[Team] 🚀 Inviting new user with role:",
          formData.role,
          "| Email:",
          formData.email,
          "| Full payload:",
          {
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            name: {
              firstName: formData.firstName,
              firstSurname: formData.firstSurname,
            },
          },
        );

        const invitePayload = {
          email: formData.email,
          phone: toColombianPhone(formData.phone),
          name: {
            firstName: formData.firstName,
            firstSurname: formData.firstSurname,
          },
          role: formData.role as import("../../../types/api").UserRole,
        };

        const response = await inviteUser(invitePayload);

        console.log(
          "[Team] ✅ Invitation sent successfully for:",
          formData.email,
          "| Role assigned:",
          formData.role,
          "| Server response:",
          response,
        );

        console.log(
          "[Team] 📋 User data from server:",
          response.data?.user || "No user data returned",
        );
      }

      handleCloseModal();
      await fetchTeamMembers();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const detailsCode =
          err.details && typeof err.details === "object" && typeof err.details["code"] === "string"
            ? (err.details["code"] as string)
            : undefined;

        if (detailsCode === "USER_EMAIL_ALREADY_EXISTS") {
          const fieldMsg = "This email is already registered. Please use a different email.";
          setFormErrors((prev) => ({ ...prev, email: fieldMsg }));
          setFormTouched((prev) => ({ ...prev, email: true }));
          showAlert("warning", fieldMsg, "Duplicate Email");
        } else {
          showAlert("error", err.message);
        }
      } else {
        showAlert("error", "An unexpected error occurred. Please try again.");
      }
    }
    finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      await deactivateUser(userId);
      await fetchTeamMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlert("error", message);
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
        <StatCard label="Total Members" value={teamMembers.length} icon={<Users size={28} />} />
        <StatCard label="Active Members" value={activeCount} icon={<Shield size={28} />} />
        <StatCard label="Roles" value={rolesCount} icon={<Users size={28} />} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Team List</h2>
        <div className="bg-[#121212] border border-[#333] rounded-[12px] overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-400">Loading team members...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">{error}</div>
          ) : teamMembers.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No team members found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#333]">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Name</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Email</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Role</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Actions</th>
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
                        {member.status === "active"
                          ? "Active"
                          : member.status === "inactive"
                            ? "Inactive"
                            : "Invited"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(member)}
                          className="p-2 text-[#FFD700] hover:bg-[#FFD700]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 size={18} />
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

      <AlertModal
        open={alertModal.open}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />

      {/* Modal Create/Edit */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="text-xl font-bold">{editingId ? "Edit Member" : "Invite New Member"}</h2>
              <button onClick={() => handleCloseModal()} className="btn-icon" title="Close modal" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: formatNameInput(e.target.value) })
                      }
                      onBlur={() => handleFieldBlur("firstName")}
                      className={inputClass(!!getFieldError("firstName"))}
                      placeholder="Juan"
                      maxLength={50}
                      disabled={submitting}
                    />
                    {getFieldError("firstName") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("firstName")}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      value={formData.firstSurname}
                      onChange={(e) =>
                        setFormData({ ...formData, firstSurname: formatNameInput(e.target.value) })
                      }
                      onBlur={() => handleFieldBlur("firstSurname")}
                      className={inputClass(!!getFieldError("firstSurname"))}
                      placeholder="Pérez"
                      maxLength={50}
                      disabled={submitting}
                    />
                    {getFieldError("firstSurname") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("firstSurname")}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: formatEmailInput(e.target.value) })
                      }
                      onBlur={() => handleFieldBlur("email")}
                      disabled={!!editingId || submitting}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className={inputClass(!!getFieldError("email"))}
                      placeholder="email@example.com"
                    />
                    {getFieldError("email") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("email")}</p>
                    )}
                  </div>

                  {!editingId && (
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <div className={phoneInputWrapperClass(!!getFieldError("phone"))}>
                        <div className="flex items-center">
                          <span className="text-white pl-4 pr-2 select-none whitespace-pre">{`${COLOMBIA_PHONE_PREFIX} `}</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })
                            }
                            onBlur={() => handleFieldBlur("phone")}
                            className="w-full bg-transparent py-3 pr-4 text-white outline-none"
                            placeholder="3001234567"
                            disabled={submitting}
                          />
                        </div>
                      </div>
                      {getFieldError("phone") && (
                        <p className="text-red-400 text-xs mt-1">{getFieldError("phone")}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Role</label>
                  <select
                    title="Role"
                    aria-label="Role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={inputClass(false)}
                    disabled={submitting}
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="warehouse_operator">Warehouse Operator</option>
                    <option value="commercial_advisor">Commercial Advisor</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn-secondary" disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (editingId ? "Guardando..." : "Enviando...") : editingId ? "Guardar Cambios" : "Invitar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
