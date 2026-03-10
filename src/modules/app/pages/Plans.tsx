import { useState, useEffect } from "react";
import { Plus, Eye, Search, X, Loader2, AlertCircle } from "lucide-react";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { getPackages, createPackage, getMaterialTypes } from "../../../services/materialService";
import { normalizeError, logError } from "../../../utils/errorHandling";
import type { Package, PackageMaterialEntry, MaterialType } from "../../../types/api";

// ─── Create Modal ───────────────────────────────────────────────────────────

interface PackageFormData {
  name: string;
  description: string;
  pricePerDay: string;
  entries: PackageMaterialEntry[];
}

const DEFAULT_FORM: PackageFormData = {
  name: "",
  description: "",
  pricePerDay: "",
  entries: [{ materialTypeId: "", quantity: 1 }],
};

interface CreatePackageModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function CreatePackageModal({ onClose, onSaved }: CreatePackageModalProps) {
  const [form, setForm] = useState<PackageFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none disabled:opacity-50";

  const updateEntry = (idx: number, key: keyof PackageMaterialEntry, value: string | number) =>
    setForm((prev) => {
      const entries = [...prev.entries];
      entries[idx] = { ...entries[idx], [key]: value };
      return { ...prev, entries };
    });

  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setTypesLoading(true);
      try {
        const res = await getMaterialTypes();
        if (!mounted) return;
        const types = res.data?.materialTypes ?? [];
        setMaterialTypes(types);
        // If first entry has empty materialTypeId, prefill with first available type
        if (types.length > 0) {
          setForm((prev) => ({
            ...prev,
            entries: prev.entries.map((e) => ({
              ...e,
              materialTypeId: e.materialTypeId || types[0]._id,
            })),
          }));
        }
      } catch {
        // ignore — leave fields empty and allow manual input fallback
      } finally {
        if (mounted) setTypesLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addEntry = () =>
    setForm((prev) => ({
      ...prev,
      entries: [...prev.entries, { materialTypeId: "", quantity: 1 }],
    }));

  const removeEntry = (idx: number) =>
    setForm((prev) => ({ ...prev, entries: prev.entries.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validEntries = form.entries.filter((e) => e.materialTypeId.trim() !== "");
    if (validEntries.length === 0) {
      setError("Add at least one material type.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      items: validEntries.map((e) => ({
        materialTypeId: e.materialTypeId.trim(),
        quantity: Math.max(1, Number(e.quantity)),
      })),
      pricePerDay: form.pricePerDay !== "" ? parseFloat(form.pricePerDay) : undefined,
    };

    setSubmitting(true);
    try {
      await createPackage(payload);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(normalizeError(err).message);
      logError(err, "CreatePackageModal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">New Package</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Name <span className="text-[#FFD700]">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Office Starter Pack"
              disabled={submitting}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              disabled={submitting}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Price per Day ($){" "}
              <span className="text-gray-600 font-normal">(leave blank to sum materials)</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.pricePerDay}
              onChange={(e) => setForm((p) => ({ ...p, pricePerDay: e.target.value }))}
              placeholder="Optional override"
              disabled={submitting}
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400">
                Material Types <span className="text-[#FFD700]">*</span>
              </label>
              <button
                type="button"
                onClick={addEntry}
                disabled={submitting}
                className="text-xs text-[#FFD700] hover:text-yellow-300 transition disabled:opacity-50"
              >
                + Add row
              </button>
            </div>
            <div className="space-y-2">
              {form.entries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  {materialTypes.length > 0 ? (
                    <select
                      value={entry.materialTypeId}
                      onChange={(e) => updateEntry(idx, "materialTypeId", e.target.value)}
                      disabled={submitting || typesLoading}
                      className={`${inputCls} flex-1`}
                    >
                      <option value="">Select material type</option>
                      {materialTypes.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={entry.materialTypeId}
                      onChange={(e) => updateEntry(idx, "materialTypeId", e.target.value)}
                      placeholder={typesLoading ? "Loading material types..." : "Material Type ID"}
                      disabled={submitting || typesLoading}
                      className={`${inputCls} flex-1`}
                    />
                  )}
                  <input
                    type="number"
                    min={1}
                    value={entry.quantity}
                    onChange={(e) =>
                      updateEntry(idx, "quantity", parseInt(e.target.value, 10) || 1)
                    }
                    disabled={submitting}
                    className="w-20 bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none disabled:opacity-50"
                  />
                  {form.entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(idx)}
                      disabled={submitting}
                      className="text-red-400 hover:text-red-300 transition disabled:opacity-50 px-1"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition text-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail Modal ───────────────────────────────────────────────────────────

function PackageDetailModal({ pkg, onClose }: { pkg: Package; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-md w-full">
        <div className="border-b border-[#333] p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{pkg.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {pkg.description && <p className="text-gray-400 text-sm">{pkg.description}</p>}

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Price / Day</span>
            <span className="text-[#FFD700] font-bold">
              {pkg.pricePerDay != null ? `$${pkg.pricePerDay.toFixed(2)}` : "Sum of materials"}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              Material Types
            </p>
            {pkg.materialTypes.length > 0 ? (
              <ul className="space-y-2">
                {pkg.materialTypes.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-gray-300 font-mono text-xs truncate flex-1 mr-2">
                      {m.materialTypeId}
                    </span>
                    <span className="bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                      × {m.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No materials assigned.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MaterialPlans() {
  const { data, isLoading, error, refetch } = useApiQuery(() => getPackages(), {
    context: "MaterialPlans",
  });
  const packages = data?.data?.packages ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewPkg, setViewPkg] = useState<Package | null>(null);

  const filtered = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="text-red-400" size={32} />
        <p className="text-red-400 text-sm">{error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-lg hover:border-[#FFD700] text-sm transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Plans</h1>
          <p className="text-gray-400 mt-1">Create and manage rental plans for material bundles</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all"
        >
          <Plus size={20} />
          Add Plan
        </button>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          size={20}
        />
        <input
          type="text"
          placeholder="Search plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filtered.map((pkg) => (
          <div
            key={pkg._id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-lg font-bold text-white truncate">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{pkg.description}</p>
                )}
              </div>
              <button
                onClick={() => setViewPkg(pkg)}
                className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all shrink-0"
                title="View details"
              >
                <Eye size={18} />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-3 border-t border-[#333] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Price / Day</span>
                <span className="text-[#FFD700] font-bold text-lg">
                  {pkg.pricePerDay != null ? `$${pkg.pricePerDay.toFixed(2)}` : "Auto"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Material Types</span>
                <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-sm font-semibold">
                  {pkg.materialTypes.length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No plans found</p>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreatePackageModal onClose={() => setShowCreate(false)} onSaved={() => void refetch()} />
      )}
      {viewPkg && <PackageDetailModal pkg={viewPkg} onClose={() => setViewPkg(null)} />}
    </div>
  );
}
