import { useState } from "react";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import {
  createPaymentMethod,
  updatePaymentMethod,
} from "../../../../services/paymentMethodService";
import { useToast } from "../../../../hooks/useToast";
import type {
  PaymentMethod,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from "../../../../types/api";
import { EMPTY_FORM, methodToForm, type MethodForm } from "./types";

interface PaymentMethodFormModalProps {
  /** `null` for create mode, a PaymentMethod for edit mode. */
  editingMethod: PaymentMethod | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Modal for creating or editing a payment method.
 * Default ("Efectivo") cannot have its name changed.
 */
export default function PaymentMethodFormModal({
  editingMethod,
  onClose,
  onSaved,
}: PaymentMethodFormModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { showToast } = useToast();
  const isEditing = editingMethod !== null;

  const [form, setForm] = useState<MethodForm>(
    editingMethod ? methodToForm(editingMethod) : EMPTY_FORM,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      onSaved();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : isEs ? "Error al crear" : "Failed to create",
      );
    } finally {
      setSubmitting(false);
    }
  };

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
      onSaved();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : isEs ? "Error al actualizar" : "Failed to update",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md"
        data-help-id={isEditing ? "payment-method-form-edit" : "payment-method-form-create"}
      >
        {/* Header */}
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
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
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
                data-help-id="payment-method-form-name"
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
              data-help-id="payment-method-form-description"
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
                data-help-id="payment-method-form-status"
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#222] flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={onClose}
                data-help-id="payment-method-form-cancel"
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={isEditing ? handleUpdate : handleCreate}
                disabled={submitting}
                data-help-id="payment-method-form-submit"
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
  );
}
