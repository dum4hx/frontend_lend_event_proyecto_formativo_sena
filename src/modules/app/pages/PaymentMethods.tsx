import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, CreditCard, RefreshCcw, Lock } from "lucide-react";
import { Button, IconButton } from "../../../components/ui";
import { useLanguage } from "../../../contexts/useLanguage";
import { useToast } from "../../../hooks/useToast";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../../../services/paymentMethodService";
import type {
  PaymentMethod,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from "../../../types/api";

// ─── Internal form state ──────────────────────────────────────────────────

interface MethodForm {
  name: string;
  description: string;
  status: "active" | "inactive";
}

const EMPTY_FORM: MethodForm = { name: "", description: "", status: "active" };

function methodToForm(method: PaymentMethod): MethodForm {
  return {
    name: method.name,
    description: method.description ?? "",
    status: method.status,
  };
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * PaymentMethods — CRUD management page for payment methods.
 * Default ("Efectivo") method is protected: cannot be renamed or deleted.
 */
export default function PaymentMethods() {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { showToast } = useToast();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<MethodForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPaymentMethods();
      setMethods(res.data.paymentMethods);
    } catch (err) {
      setError(err instanceof Error ? err.message : isEs ? "Error al cargar" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = methods.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ── Open modals ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowCreate(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setForm(methodToForm(method));
    setFormError(null);
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditingMethod(null);
    setFormError(null);
  };

  // ── Submit create ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setFormError(isEs ? "El nombre es requerido" : "Name is required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: CreatePaymentMethodPayload = {
        name: form.name.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      };
      await createPaymentMethod(payload);
      showToast(
        "success",
        isEs ? "Método de pago creado" : "Payment method created",
        isEs ? "Éxito" : "Success",
        { duration: 3000 },
      );
      closeModal();
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : isEs ? "Error al crear" : "Failed to create",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit update ─────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (!editingMethod) return;
    if (!form.name.trim()) {
      setFormError(isEs ? "El nombre es requerido" : "Name is required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: UpdatePaymentMethodPayload = {
        ...(editingMethod.isDefault ? {} : { name: form.name.trim() }),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        status: form.status,
      };
      await updatePaymentMethod(editingMethod.id, payload);
      showToast(
        "success",
        isEs ? "Método de pago actualizado" : "Payment method updated",
        isEs ? "Éxito" : "Success",
        { duration: 3000 },
      );
      closeModal();
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : isEs ? "Error al actualizar" : "Failed to update",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deletePaymentMethod(id);
      showToast(
        "success",
        isEs ? "Método de pago eliminado" : "Payment method deleted",
        isEs ? "Éxito" : "Success",
        { duration: 3000 },
      );
      await load();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al eliminar" : "Failed to delete",
        isEs ? "Error" : "Error",
        { duration: 4000 },
      );
    } finally {
      setDeletingId(null);
    }
  };

  const isModalOpen = showCreate || editingMethod !== null;
  const isEditing = editingMethod !== null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {isEs ? "Métodos de" : "Payment"}{" "}
            <span className="text-[#FFD700]">{isEs ? "Pago" : "Methods"}</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            {isEs
              ? "Gestiona los métodos de pago aceptados por la organización."
              : "Manage the payment methods accepted by your organization."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            title={isEs ? "Actualizar" : "Refresh"}
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button variant="primary" size="md" onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            {isEs ? "Nuevo Método" : "New Method"}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
        <input
          type="text"
          placeholder={isEs ? "Buscar métodos de pago..." : "Search payment methods..."}
          className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
        {loading && methods.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CreditCard className="w-10 h-10 text-gray-600" />
            <p className="text-gray-500 text-sm">
              {isEs ? "Sin métodos de pago" : "No payment methods"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d0d0d] border-b border-[#222]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {isEs ? "Nombre" : "Name"}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {isEs ? "Descripción" : "Description"}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {isEs ? "Estado" : "Status"}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {isEs ? "Acciones" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filtered.map((method) => (
                  <tr key={method.id} className="hover:bg-[#1a1a1a] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-[#FFD700]" />
                        <span className="text-white font-medium text-sm">{method.name}</span>
                        {method.isDefault && (
                          <span className="ml-1 px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] text-xs rounded-full font-semibold flex items-center gap-1">
                            <Lock size={10} />
                            {isEs ? "Predeterminado" : "Default"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{method.description ?? "—"}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          method.status === "active"
                            ? "text-green-400 bg-green-500/10"
                            : "text-gray-400 bg-gray-500/10"
                        }`}
                      >
                        {method.status === "active"
                          ? isEs
                            ? "Activo"
                            : "Active"
                          : isEs
                            ? "Inactivo"
                            : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          icon={Pencil}
                          ariaLabel={isEs ? "Editar" : "Edit"}
                          intent="edit"
                          onClick={() => openEdit(method)}
                        />
                        {!method.isDefault && (
                          <>
                            {confirmDeleteId === method.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDelete(method.id)}
                                  disabled={deletingId === method.id}
                                  className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded transition-all disabled:opacity-50"
                                >
                                  {deletingId === method.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : isEs ? (
                                    "Confirmar"
                                  ) : (
                                    "Confirm"
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 bg-[#222] hover:bg-[#333] text-gray-400 text-xs rounded transition-all"
                                >
                                  {isEs ? "Cancelar" : "Cancel"}
                                </button>
                              </div>
                            ) : (
                              <IconButton
                                icon={Trash2}
                                ariaLabel={isEs ? "Eliminar" : "Delete"}
                                intent="delete"
                                onClick={() => setConfirmDeleteId(method.id)}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#222]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1a1a1a] rounded-xl border border-[#333]">
                  <CreditCard size={18} className="text-[#FFD700]" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {isEditing
                    ? isEs
                      ? "Editar Método de Pago"
                      : "Edit Payment Method"
                    : isEs
                      ? "Nuevo Método de Pago"
                      : "New Payment Method"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {isEs ? "Nombre" : "Name"} *
                </label>
                {isEditing && editingMethod?.isDefault ? (
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5">
                    <Lock size={12} className="text-gray-500" />
                    <span className="text-gray-400 text-sm">{form.name}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-all placeholder-gray-600"
                    placeholder={isEs ? "Ej: Tarjeta de Crédito" : "e.g. Credit Card"}
                  />
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {isEs ? "Descripción" : "Description"}
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-all placeholder-gray-600 resize-none"
                  placeholder={isEs ? "Descripción opcional..." : "Optional description..."}
                />
              </div>

              {/* Active toggle (edit only) */}
              {isEditing && (
                <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-300">
                    {isEs ? "Método activo" : "Active method"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        status: f.status === "active" ? "inactive" : "active",
                      }))
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      form.status === "active" ? "bg-[#FFD700]" : "bg-[#333]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-black rounded-full transition-transform ${
                        form.status === "active" ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Form error */}
              {formError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#222] flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={closeModal}>
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={isEditing ? handleUpdate : handleCreate}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {isEditing
                  ? isEs
                    ? "Guardar Cambios"
                    : "Save Changes"
                  : isEs
                    ? "Crear Método"
                    : "Create Method"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
