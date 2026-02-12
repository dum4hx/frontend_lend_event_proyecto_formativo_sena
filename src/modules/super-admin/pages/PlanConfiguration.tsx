import { useEffect, useState, useCallback } from "react";
import { Pencil, Check, X } from "lucide-react";
import {
  getSubscriptionTypes,
  updateSubscriptionType,
  deleteSubscriptionType,
} from "../../../services/subscriptionTypeService";
import { ApiError } from "../../../lib/api";
import type { SubscriptionType } from "../../../types/api";

// --- Validation helpers ----------------------------------------------------

interface PlanValidationErrors {
  displayName?: string;
  baseCost?: string;
  pricePerSeat?: string;
  maxSeats?: string;
  maxCatalogItems?: string;
}

function validatePlanFields(
  fields: Partial<
    Pick<
      SubscriptionType,
      "displayName" | "baseCost" | "pricePerSeat" | "maxSeats" | "maxCatalogItems"
    >
  >,
): PlanValidationErrors {
  const errors: PlanValidationErrors = {};

  if (fields.displayName !== undefined) {
    const name = fields.displayName.trim();
    if (!name) errors.displayName = "Display name is required.";
    else if (name.length > 100) errors.displayName = "Max 100 characters.";
  }

  if (fields.baseCost !== undefined) {
    if (!Number.isFinite(fields.baseCost) || fields.baseCost < 0) {
      errors.baseCost = "Must be a non-negative number.";
    }
  }

  if (fields.pricePerSeat !== undefined) {
    if (!Number.isFinite(fields.pricePerSeat) || fields.pricePerSeat < 0) {
      errors.pricePerSeat = "Must be a non-negative number.";
    }
  }

  if (fields.maxSeats !== undefined) {
    if (!Number.isInteger(fields.maxSeats) || fields.maxSeats < -1) {
      errors.maxSeats = "Must be -1 (unlimited) or a positive integer.";
    }
  }

  if (fields.maxCatalogItems !== undefined) {
    if (!Number.isInteger(fields.maxCatalogItems) || fields.maxCatalogItems < -1) {
      errors.maxCatalogItems = "Must be -1 (unlimited) or a positive integer.";
    }
  }

  return errors;
}

function hasErrors(errors: PlanValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// --- Helpers ----------------------------------------------------------------

function formatDollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const CARD_BORDER: Record<string, string> = {
  starter: "border-[#333]",
  professional: "border-[#FFD700]",
  enterprise: "border-[#333]",
};

// ---------------------------------------------------------------------------

export default function PlanConfiguration() {
  const [plans, setPlans] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<SubscriptionType>>({});
  const [validationErrors, setValidationErrors] = useState<PlanValidationErrors>({});
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSubscriptionTypes();
      setPlans(res.data.subscriptionTypes);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  // Start editing a plan
  const startEdit = (plan: SubscriptionType) => {
    setEditingPlan(plan.plan);
    setEditFields({
      displayName: plan.displayName,
      baseCost: plan.baseCost,
      pricePerSeat: plan.pricePerSeat,
      maxSeats: plan.maxSeats,
      maxCatalogItems: plan.maxCatalogItems,
    });
    setValidationErrors({});
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPlan(null);
    setEditFields({});
    setValidationErrors({});
  };

  // Save edits
  const saveEdit = async () => {
    if (!editingPlan) return;

    const errors = validatePlanFields(editFields);
    setValidationErrors(errors);
    if (hasErrors(errors)) return;

    try {
      setSaving(true);
      await updateSubscriptionType(editingPlan, {
        displayName: editFields.displayName,
        baseCost: editFields.baseCost,
        pricePerSeat: editFields.pricePerSeat,
        maxSeats: editFields.maxSeats,
        maxCatalogItems: editFields.maxCatalogItems,
      });
      setEditingPlan(null);
      setEditFields({});
      await fetchPlans();
    } catch (err: unknown) {
      alert(err instanceof ApiError ? err.message : "Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  // Set to draft (soft delete)
  const setToDraft = async (plan: string) => {
    if (!confirm(`Deactivate the "${plan}" plan? It will no longer be visible to users.`)) return;

    try {
      await deleteSubscriptionType(plan);
      await fetchPlans();
    } catch (err: unknown) {
      alert(err instanceof ApiError ? err.message : "Failed to deactivate plan.");
    }
  };

  // --- Render ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4" />
          <p className="text-gray-400">Loading plans…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPlans}
            className="px-6 py-2 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Plan Configuration</h1>
        <p className="text-gray-400 mt-1">Manage subscription plans, pricing, and features</p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEditing = editingPlan === plan.plan;
          const border = CARD_BORDER[plan.plan] ?? "border-[#333]";

          return (
            <div
              key={plan.plan}
              className={`bg-[#121212] border ${border} rounded-xl p-6 flex flex-col transition hover:border-[#FFD700]`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                    <span className="text-lg">⚡</span>
                  </div>
                  <div>
                    {isEditing ? (
                      <div>
                        <input
                          value={editFields.displayName ?? ""}
                          onChange={(e) =>
                            setEditFields((f) => ({
                              ...f,
                              displayName: e.target.value,
                            }))
                          }
                          maxLength={100}
                          className="bg-[#1a1a1a] border border-[#444] rounded px-2 py-1 text-white text-sm focus:border-[#FFD700] outline-none w-full"
                        />
                        {validationErrors.displayName && (
                          <p className="text-red-400 text-xs mt-1">
                            {validationErrors.displayName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <h3 className="text-xl font-bold text-white">{plan.displayName}</h3>
                    )}
                  </div>
                </div>

                {/* Edit / Save / Cancel buttons */}
                {isEditing ? (
                  <div className="flex gap-1">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="w-8 h-8 rounded-lg bg-green-900/30 hover:bg-green-900/50 flex items-center justify-center text-green-400 transition disabled:opacity-50"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="w-8 h-8 rounded-lg bg-red-900/30 hover:bg-red-900/50 flex items-center justify-center text-red-400 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(plan)}
                    className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-[#FFD700] transition"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>

              {/* Price */}
              <div className="mb-1">
                {isEditing ? (
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-gray-400">$</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        min={0}
                        value={editFields.baseCost ?? 0}
                        onChange={(e) =>
                          setEditFields((f) => ({
                            ...f,
                            baseCost: Number(e.target.value),
                          }))
                        }
                        className="bg-[#1a1a1a] border border-[#444] rounded px-2 py-1 text-white text-lg font-bold w-24 focus:border-[#FFD700] outline-none"
                      />
                      {validationErrors.baseCost && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.baseCost}</p>
                      )}
                    </div>
                    <span className="text-gray-500 text-sm">/month (cents)</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      ${formatDollars(plan.baseCost)}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                )}

                {/* Status badge */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${
                    plan.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : plan.status === "deprecated"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              {/* Divider */}
              <hr className="border-[#333] my-4" />

              {/* Features */}
              <div className="flex-1 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Features Included
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-300">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limits */}
              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p>
                  Max seats:{" "}
                  <span className="text-white">
                    {plan.maxSeats === -1 ? "Unlimited" : plan.maxSeats}
                  </span>
                </p>
                <p>
                  Max catalog items:{" "}
                  <span className="text-white">
                    {plan.maxCatalogItems === -1 ? "Unlimited" : plan.maxCatalogItems}
                  </span>
                </p>
                <p>
                  Price per seat:{" "}
                  <span className="text-white">${formatDollars(plan.pricePerSeat)}</span>
                </p>
              </div>

              {/* Set to Draft button */}
              {plan.status === "active" && (
                <button
                  onClick={() => setToDraft(plan.plan)}
                  className="w-full border border-[#333] text-gray-400 hover:text-white hover:border-[#555] py-2.5 rounded-lg text-sm font-medium transition"
                >
                  Set to Draft
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
