import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Shield, Plus, UserX, Edit, X, RotateCcw, Search } from "lucide-react";
import { StatCard } from "../components";
import { AdminPagination, AdminTable } from "../components";
import {
  getUsers,
  inviteUser,
  updateUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
} from "../../../services/adminService";
import { getRoles } from "../../../services/roleService";
import { ApiError } from "../../../lib/api";
import {
  validateFirstName,
  validateLastName,
  validateEmail,
  validateRequiredPhone,
} from "../../../utils/validators";
import { AlertModal, type AlertModalType } from "../../../components/ui/AlertModal";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import type { Role } from "../../../types/api";

const COLOMBIA_PHONE_PREFIX = "+57";

type TeamFormField = "firstName" | "firstSurname" | "email" | "phone" | "role";
type OwnerSecurityField =
  | "acceptedCritical"
  | "acceptedIrreversible"
  | "confirmEmail"
  | "confirmPhrase";

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
  phone: string;
  role: string;
  status: "active" | "inactive" | "invited";
};

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    firstSurname: "",
    email: "",
    phone: "",
    role: "", // populated once availableRoles load
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<TeamFormField, string>>>({});
  const [formTouched, setFormTouched] = useState<Partial<Record<TeamFormField, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [initialRole, setInitialRole] = useState<string>("");
  const [ownerSecurity, setOwnerSecurity] = useState<{
    acceptedCritical: boolean;
    acceptedIrreversible: boolean;
    confirmEmail: string;
    confirmPhrase: string;
  }>({
    acceptedCritical: false,
    acceptedIrreversible: false,
    confirmEmail: "",
    confirmPhrase: "",
  });
  const [ownerSecurityErrors, setOwnerSecurityErrors] = useState<
    Partial<Record<OwnerSecurityField, string>>
  >({});
  const [ownerSecurityTouched, setOwnerSecurityTouched] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    open: boolean;
    type: AlertModalType;
    title?: string;
    message: string;
  }>({ open: false, type: "error", message: "" });
  const { showConfirm, ConfirmModal } = useConfirmModal();

  const showAlert = (type: AlertModalType, message: string, title?: string) =>
    setAlertModal({ open: true, type, message, title });
  const closeAlert = () => setAlertModal((prev) => ({ ...prev, open: false }));

  const selectedRoleName = availableRoles.find((r) => r._id === formData.role)?.name ?? "";
  const isOwnerPromotion = !!editingId && initialRole !== "owner" && selectedRoleName === "owner";

  const resetOwnerSecurity = () => {
    setOwnerSecurity({
      acceptedCritical: false,
      acceptedIrreversible: false,
      confirmEmail: "",
      confirmPhrase: "",
    });
    setOwnerSecurityErrors({});
    setOwnerSecurityTouched(false);
  };

  const validateField = useCallback(
    (field: TeamFormField, data = formData): string | undefined => {
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
    },
    [editingId, formData],
  );

  const getOwnerSecurityErrors = useCallback((): Partial<Record<OwnerSecurityField, string>> => {
    const nextErrors: Partial<Record<OwnerSecurityField, string>> = {};

    if (!ownerSecurity.acceptedCritical) {
      nextErrors.acceptedCritical = "You must acknowledge full administrative access.";
    }
    if (!ownerSecurity.acceptedIrreversible) {
      nextErrors.acceptedIrreversible = "You must acknowledge this sensitive ownership change.";
    }

    const normalizedConfirmationEmail = ownerSecurity.confirmEmail.trim().toLowerCase();
    const normalizedTargetEmail = formData.email.trim().toLowerCase();
    if (!normalizedConfirmationEmail) {
      nextErrors.confirmEmail = "Confirm the member email to continue.";
    } else if (normalizedConfirmationEmail !== normalizedTargetEmail) {
      nextErrors.confirmEmail = "The confirmation email does not match this member.";
    }

    const requiredPhrase = "TRANSFER OWNER";
    if (!ownerSecurity.confirmPhrase.trim()) {
      nextErrors.confirmPhrase = `Type "${requiredPhrase}" to authorize ownership transfer.`;
    } else if (ownerSecurity.confirmPhrase.trim().toUpperCase() !== requiredPhrase) {
      nextErrors.confirmPhrase = `The phrase must be exactly: ${requiredPhrase}`;
    }

    return nextErrors;
  }, [ownerSecurity, formData.email]);

  const validateOwnerSecurity = () => {
    const nextErrors = getOwnerSecurityErrors();
    setOwnerSecurityErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();

      interface UserData {
        _id?: string;
        id?: string;
        email?: string;
        phone?: string;
        name?: { firstName: string; firstSurname: string };
        roleName?: string;
        status?: string;
        profile?: {
          firstName?: string;
          lastName?: string;
          firstSurname?: string;
        };
      }

      const users = (response.data.users ?? []) as unknown as UserData[];
      const members: TeamMember[] = users.map((user) => {
        const profile = user.profile || {};
        const firstName = profile.firstName || user.name?.firstName || "";
        const lastName = profile.lastName || profile.firstSurname || user.name?.firstSurname || "";
        const status =
          user.status === "inactive"
            ? "inactive"
            : user.status === "invited"
              ? "invited"
              : "active";
        return {
          id: user._id || user.id || "",
          name: `${firstName} ${lastName}`.trim() || user.email || "",
          email: user.email || "",
          phone: user.phone || "—",
          role: user.roleName || "undefined",
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

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await getRoles();
        setAvailableRoles(res.data.items);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load roles";
        showAlert("error", message);
      }
    };
    void loadRoles();
  }, []);

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      const normalizedSearch = searchQuery.trim().toLowerCase();
      if (normalizedSearch) {
        const haystack = `${m.name} ${m.email}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      if (roleFilter && m.role !== roleFilter) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });
  }, [teamMembers, searchQuery, roleFilter, statusFilter]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedTeamMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (!Object.values(formTouched).some(Boolean)) return;

    setFormErrors((prev) => {
      const next = { ...prev };
      (Object.keys(formTouched) as TeamFormField[]).forEach((field) => {
        if (!formTouched[field]) return;
        const msg = validateField(field);
        if (msg) next[field] = msg;
        else delete next[field];
      });
      return next;
    });
  }, [formData, formTouched, editingId, validateField]);

  useEffect(() => {
    if (!isOwnerPromotion || !ownerSecurityTouched) return;
    setOwnerSecurityErrors(getOwnerSecurityErrors());
  }, [
    ownerSecurity,
    formData.email,
    isOwnerPromotion,
    ownerSecurityTouched,
    getOwnerSecurityErrors,
  ]);

  const handleFieldChange = (field: TeamFormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
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
      setInitialRole(member.role); // keeps role name for owner-promo check
      const [firstName, ...rest] = member.name.trim().split(" ");
      const firstSurname = rest.join(" ").trim();
      // Resolve the role _id by matching the stored role name
      const matchedRole = availableRoles.find((r) => r.name === member.role);
      setFormData({
        firstName: firstName || "",
        firstSurname: firstSurname || "",
        email: member.email,
        phone: "",
        role: matchedRole?._id ?? "",
      });
    } else {
      setEditingId(null);
      setInitialRole("");
      const defaultRole = availableRoles.find((r) => !r.isReadOnly)?._id ?? "";
      setFormData({
        firstName: "",
        firstSurname: "",
        email: "",
        phone: "",
        role: defaultRole,
      });
    }
    setFormErrors({});
    setFormTouched({});
    resetOwnerSecurity();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setInitialRole("");
    const defaultRole = availableRoles.find((r) => !r.isReadOnly)?._id ?? "";
    setFormData({
      firstName: "",
      firstSurname: "",
      email: "",
      phone: "",
      role: defaultRole,
    });
    setFormErrors({});
    setFormTouched({});
    resetOwnerSecurity();
  };

  const handleSaveUser = async (e?: { preventDefault?: () => void }) => {
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

      if (isOwnerPromotion) {
        setOwnerSecurityTouched(true);
        const securityValid = validateOwnerSecurity();
        if (!securityValid) {
          showAlert(
            "warning",
            "Complete all ownership transfer security checks before saving this role change.",
            "Security Verification Required",
          );
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
          roleId: formData.role,
        });
      } else {
        const invitePayload = {
          email: formData.email,
          phone: toColombianPhone(formData.phone),
          name: {
            firstName: formData.firstName,
            firstSurname: formData.firstSurname,
          },
          roleId: formData.role,
        };

        await inviteUser(invitePayload);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, memberName: string) => {
    const confirmed = await showConfirm({
      title: `Deactivate ${memberName}?`,
      message: "The member will lose access to the platform.",
      confirmText: "Deactivate",
      variant: "warning",
    });
    if (!confirmed) return;

    try {
      await deactivateUser(userId);
      await fetchTeamMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlert("error", message);
    }
  };

  const handleReactivateUser = async (userId: string, memberName: string) => {
    const confirmed = await showConfirm({
      title: `Reactivate ${memberName}?`,
      message: "This will restore the member's access to the platform.",
      confirmText: "Reactivate",
      variant: "info",
    });
    if (!confirmed) return;

    try {
      await reactivateUser(userId);
      await fetchTeamMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlert("error", message);
    }
  };

  const activeCount = teamMembers.filter((m) => m.status === "active").length;
  const inactiveCount = teamMembers.filter((m) => m.status === "inactive").length;
  const invitedCount = teamMembers.filter((m) => m.status === "invited").length;
  const rolesCount = new Set(teamMembers.map((m) => m.role)).size;

  const getStatusBadge = (status: TeamMember["status"]) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success">Active</span>;
      case "inactive":
        return <span className="badge badge-warning">Inactive</span>;
      case "invited":
        return <span className="badge badge-info">Invited</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Members</h1>
          <p className="text-gray-400">Manage your team and permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition gold-action-btn"
        >
          <Plus size={20} />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard label="Total Members" value={teamMembers.length} icon={<Users size={28} />} />
        <StatCard label="Active Members" value={activeCount} icon={<Shield size={28} />} />
        <StatCard label="Invited" value={invitedCount} icon={<Users size={28} />} />
        <StatCard label="Inactive" value={inactiveCount} icon={<Shield size={28} />} />
        <StatCard label="Roles" value={rolesCount} icon={<Users size={28} />} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Team List</h2>

        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input pl-10"
              />
            </div>

            {/* Filter by role */}
            <select
              title="Filter by role"
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input md:w-48"
            >
              <option value="">All roles</option>
              {availableRoles.map((r) => (
                <option key={r._id} value={r.name}>
                  {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                </option>
              ))}
            </select>

            {/* Filter by status */}
            <select
              title="Filter by status"
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input md:w-48"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="invited">Invited</option>
            </select>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="card flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
              <p className="mt-4 text-gray-400">Loading team members...</p>
            </div>
          ) : error ? (
            <div className="card bg-red-500/10 border-red-500/30 p-6 text-center text-red-400">
              {error}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="card p-6 text-center text-gray-400">
              {roleFilter || statusFilter ? "No members match the selected filters" : "No team members found"}
            </div>
          ) : (
            <AdminTable>
              <thead className="bg-[#0f0f0f] border-b border-[#333]">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Name</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Email</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Phone</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Role</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedTeamMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all"
                  >
                    <td className="px-6 py-4 text-white">{member.name}</td>
                    <td className="px-6 py-4 text-gray-400">{member.email}</td>
                    <td className="px-6 py-4 text-gray-400">{member.phone}</td>
                    <td className="px-6 py-4 text-gray-400">{member.role}</td>
                    <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(member)}
                          className="btn-icon text-blue-400 hover:text-blue-300"
                          title="Edit member"
                          aria-label="Edit member"
                        >
                          <Edit size={18} />
                        </button>

                        {/* Reactivate — only for inactive members */}
                        {member.status === "inactive" && (
                          <button
                            onClick={() => void handleReactivateUser(member.id, member.name)}
                            className="btn-icon text-emerald-500 hover:text-emerald-400"
                            title="Reactivate member"
                            aria-label="Reactivate member"
                          >
                            <RotateCcw size={18} />
                          </button>
                        )}

                        {/* Deactivate — only for active or invited members */}
                        {member.status !== "inactive" && (
                          <button
                            onClick={() => void handleDeleteUser(member.id, member.name)}
                            className="btn-icon text-orange-500 hover:text-orange-400"
                            title="Deactivate member"
                            aria-label="Deactivate member"
                          >
                            <UserX size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </div>
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          itemLabel="members"
          onPageChange={setCurrentPage}
        />
      </div>

      <AlertModal
        open={alertModal.open}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
      <ConfirmModal />

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
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Member" : "Invite New Member"}
              </h2>
              <button
                onClick={() => handleCloseModal()}
                className="btn-icon"
                title="Close modal"
                aria-label="Close modal"
              >
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
                        handleFieldChange("firstName", formatNameInput(e.target.value))
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
                        handleFieldChange("firstSurname", formatNameInput(e.target.value))
                      }
                      onBlur={() => handleFieldBlur("firstSurname")}
                      className={inputClass(!!getFieldError("firstSurname"))}
                      placeholder="Smith"
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
                      onChange={(e) => handleFieldChange("email", formatEmailInput(e.target.value))}
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
                              handleFieldChange("phone", formatPhoneInput(e.target.value))
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
                    onChange={(e) => {
                      const nextRoleId = e.target.value;
                      handleFieldChange("role", nextRoleId);
                      const nextRoleName =
                        availableRoles.find((r) => r._id === nextRoleId)?.name ?? "";
                      if (nextRoleName !== "owner") resetOwnerSecurity();
                    }}
                    className={inputClass(false)}
                    disabled={submitting}
                  >
                    {availableRoles.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {isOwnerPromotion && (
                  <div className="space-y-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4">
                    <h3 className="text-sm font-semibold text-yellow-300">
                      Ownership Transfer Security
                    </h3>

                    <div className="space-y-2">
                      <label className="flex items-start gap-2 text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={ownerSecurity.acceptedCritical}
                          onChange={(e) => {
                            setOwnerSecurityTouched(true);
                            setOwnerSecurity((prev) => ({
                              ...prev,
                              acceptedCritical: e.target.checked,
                            }));
                          }}
                          disabled={submitting}
                        />
                        I understand this user will get full owner permissions over organization
                        data.
                      </label>
                      {ownerSecurityErrors.acceptedCritical && (
                        <p className="text-red-400 text-xs">
                          {ownerSecurityErrors.acceptedCritical}
                        </p>
                      )}

                      <label className="flex items-start gap-2 text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={ownerSecurity.acceptedIrreversible}
                          onChange={(e) => {
                            setOwnerSecurityTouched(true);
                            setOwnerSecurity((prev) => ({
                              ...prev,
                              acceptedIrreversible: e.target.checked,
                            }));
                          }}
                          disabled={submitting}
                        />
                        I confirm this is a deliberate and sensitive ownership transfer decision.
                      </label>
                      {ownerSecurityErrors.acceptedIrreversible && (
                        <p className="text-red-400 text-xs">
                          {ownerSecurityErrors.acceptedIrreversible}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="form-label">Confirm target email</label>
                      <input
                        type="email"
                        value={ownerSecurity.confirmEmail}
                        onChange={(e) => {
                          setOwnerSecurityTouched(true);
                          setOwnerSecurity((prev) => ({
                            ...prev,
                            confirmEmail: formatEmailInput(e.target.value),
                          }));
                        }}
                        className={inputClass(!!ownerSecurityErrors.confirmEmail)}
                        placeholder={formData.email}
                        disabled={submitting}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      {ownerSecurityErrors.confirmEmail && (
                        <p className="text-red-400 text-xs">{ownerSecurityErrors.confirmEmail}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="form-label">Type phrase: TRANSFER OWNER</label>
                      <input
                        type="text"
                        value={ownerSecurity.confirmPhrase}
                        onChange={(e) => {
                          setOwnerSecurityTouched(true);
                          setOwnerSecurity((prev) => ({
                            ...prev,
                            confirmPhrase: e.target.value,
                          }));
                        }}
                        className={inputClass(!!ownerSecurityErrors.confirmPhrase)}
                        placeholder="TRANSFER OWNER"
                        disabled={submitting}
                      />
                      {ownerSecurityErrors.confirmPhrase && (
                        <p className="text-red-400 text-xs">{ownerSecurityErrors.confirmPhrase}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? editingId
                      ? "Saving..."
                      : "Sending..."
                    : editingId
                      ? "Save Changes"
                      : "Invite User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
