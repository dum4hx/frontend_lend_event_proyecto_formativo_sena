import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Package, X } from "lucide-react";
import {
  getMaterialInstances,
  getMaterialTypes,
  createMaterialInstance,
  updateMaterialInstanceStatus,
  deleteMaterialInstance,
} from "../../../services/materialService";
import { ConfirmDialog, LoadingSpinner, EmptyState } from "../../../components/ui";
import { useToast } from "../../../contexts/ToastContext";
import type {
  MaterialInstance,
  MaterialInstanceStatus,
  MaterialType,
  CreateMaterialInstancePayload,
  UpdateMaterialInstanceStatusPayload,
} from "../../../types/api";

// ─── Status helpers ────────────────────────────────────────────────────────

const STATUS_OPTIONS: MaterialInstanceStatus[] = [
  "available",
  "reserved",
  "loaned",
  "returned",
  "maintenance",
  "damaged",
  "lost",
  "retired",
];

const STATUS_STYLES: Record<MaterialInstanceStatus, string> = {
  available: "bg-green-500/20 text-green-400",
  reserved: "bg-blue-500/20 text-blue-400",
  loaned: "bg-yellow-500/20 text-yellow-400",
  returned: "bg-purple-500/20 text-purple-400",
  maintenance: "bg-orange-500/20 text-orange-400",
  damaged: "bg-red-500/20 text-red-400",
  lost: "bg-red-700/20 text-red-600",
  retired: "bg-gray-500/20 text-gray-500",
};

function formatCop(value?: number): string {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

// ─── Add / Edit Instance Modal ─────────────────────────────────────────────

interface InstanceModalProps {
  /** When set, we are editing an existing instance's status; otherwise adding. */
  instance?: MaterialInstance;
  materialTypes: MaterialType[];
  onClose: () => void;
  onSave: (
    payload: CreateMaterialInstancePayload | UpdateMaterialInstanceStatusPayload,
    instanceId?: string,
  ) => Promise<void>;
}

function InstanceModal({ instance, materialTypes, onClose, onSave }: InstanceModalProps) {
  const isEditing = Boolean(instance);
  const [modelId, setModelId] = useState(instance?.modelId ?? "");
  const [serialNumber, setSerialNumber] = useState(instance?.serialNumber ?? "");
  const [purchaseDate, setPurchaseDate] = useState(instance?.purchaseDate ?? "");
  const [purchaseCostRaw, setPurchaseCostRaw] = useState(
    instance?.purchaseCost != null ? String(instance.purchaseCost) : "",
  );
  const [purchaseCostDisplay, setPurchaseCostDisplay] = useState(
    instance?.purchaseCost != null ? formatCop(instance.purchaseCost) : "",
  );
  const [status, setStatus] = useState<MaterialInstanceStatus>(instance?.status ?? "available");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleCostChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setPurchaseCostRaw(digits);
    setPurchaseCostDisplay(digits ? formatCop(parseInt(digits, 10)) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !modelId) {
      showToast("error", "Material type is required");
      return;
    }
    if (!isEditing && !serialNumber.trim()) {
      showToast("error", "Serial number is required");
      return;
    }
    try {
      setIsSubmitting(true);
      if (isEditing && instance) {
        const payload: UpdateMaterialInstanceStatusPayload = { status, notes: notes || undefined };
        await onSave(payload, instance._id);
      } else {
        const payload: CreateMaterialInstancePayload = {
          modelId,
          serialNumber: serialNumber.trim(),
          purchaseDate: purchaseDate || undefined,
          purchaseCost: purchaseCostRaw ? parseInt(purchaseCostRaw, 10) : undefined,
        };
        await onSave(payload);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save instance";
      showToast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#121212] border border-[#333] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="instance-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] px-6 py-4 flex items-center justify-between">
          <h2 id="instance-modal-title" className="text-xl font-bold text-white">
            {isEditing ? "Update Instance Status" : "Add New Instance"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serial Number
                </label>
                <p className="px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-gray-400 font-mono text-sm">
                  {instance!.serialNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MaterialInstanceStatus)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  required
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Reason for status change..."
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Material Type *
                </label>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  required
                >
                  <option value="">Select a material type</option>
                  {materialTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serial Number / Identifier *
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g., SN-001, CHAIR-A-01..."
                  maxLength={100}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for this item (max 100 chars)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Purchase Cost (COP)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={purchaseCostDisplay}
                    onChange={(e) => handleCostChange(e.target.value)}
                    placeholder="e.g., $ 150.000"
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Instance"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#1a1a1a] text-gray-300 font-semibold rounded-lg hover:bg-[#222] border border-[#333] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [instances, setInstances] = useState<MaterialInstance[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialInstanceStatus | "all">("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<MaterialInstance | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<MaterialInstance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [instRes, typesRes] = await Promise.all([getMaterialInstances(), getMaterialTypes()]);
      setInstances(instRes.data.instances ?? []);
      setMaterialTypes(typesRes.data.materialTypes ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load inventory";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTypeName = (modelId: string) =>
    materialTypes.find((t) => t._id === modelId)?.name ?? "Unknown";

  const filteredInstances = instances.filter((inst) => {
    const matchesSearch =
      inst.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTypeName(inst.modelId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = instances.reduce<Record<string, number>>((acc, inst) => {
    acc[inst.status] = (acc[inst.status] ?? 0) + 1;
    return acc;
  }, {});

  const handleSave = async (
    payload: CreateMaterialInstancePayload | UpdateMaterialInstanceStatusPayload,
    instanceId?: string,
  ) => {
    if (instanceId) {
      const res = await updateMaterialInstanceStatus(
        instanceId,
        payload as UpdateMaterialInstanceStatusPayload,
      );
      setInstances((prev) => prev.map((i) => (i._id === instanceId ? res.data.instance : i)));
      showToast("success", "Instance status updated successfully");
    } else {
      const res = await createMaterialInstance(payload as CreateMaterialInstancePayload);
      setInstances((prev) => [...prev, res.data.instance]);
      showToast("success", "Material instance created successfully");
    }
  };

  const handleDelete = async () => {
    if (!deletingInstance) return;
    try {
      setIsDeleting(true);
      await deleteMaterialInstance(deletingInstance._id);
      setInstances((prev) => prev.filter((i) => i._id !== deletingInstance._id));
      showToast("success", "Instance deleted successfully");
      setDeletingInstance(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete instance";
      showToast("error", msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading inventory..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg font-semibold">Failed to load inventory</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          <p className="text-gray-400">Monitor and manage all warehouse items</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFC107] transition-all"
        >
          <Plus size={20} />
          Add Instance
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Total Instances</p>
          <p className="text-3xl font-bold text-white">{instances.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Available</p>
          <p className="text-3xl font-bold text-green-400">{statusCounts.available ?? 0}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">In Use</p>
          <p className="text-3xl font-bold text-yellow-400">
            {(statusCounts.reserved ?? 0) + (statusCounts.loaned ?? 0)}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Needs Attention</p>
          <p className="text-3xl font-bold text-red-400">
            {(statusCounts.maintenance ?? 0) +
              (statusCounts.damaged ?? 0) +
              (statusCounts.lost ?? 0)}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by serial number or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MaterialInstanceStatus | "all")}
          className="px-4 py-3 bg-[#1a1a1a] border border-[#333] text-white rounded-lg focus:outline-none focus:border-[#FFD700] min-w-[160px]"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredInstances.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No instances found"
          description={
            searchTerm || statusFilter !== "all"
              ? "No items match your current filters. Try adjusting your search or status filter."
              : "No material instances have been registered yet. Add your first item to get started."
          }
          action={
            !searchTerm && statusFilter === "all"
              ? { label: "Add First Instance", onClick: () => setShowAddModal(true) }
              : undefined
          }
        />
      ) : (
        <div className="bg-[#121212] border border-[#333] rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#333]">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">
                  Serial Number
                </th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">
                  Material Type
                </th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">
                  Purchase Date
                </th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">
                  Purchase Cost
                </th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstances.map((inst) => (
                <tr
                  key={inst._id}
                  className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="px-6 py-4 text-white font-mono font-semibold">
                    {inst.serialNumber}
                  </td>
                  <td className="px-6 py-4 text-white">{getTypeName(inst.modelId)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${STATUS_STYLES[inst.status]}`}
                    >
                      {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {inst.purchaseDate ? new Date(inst.purchaseDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-[#FFD700] font-semibold text-sm">
                    {formatCop(inst.purchaseCost)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingInstance(inst)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        aria-label={`Edit status for ${inst.serialNumber}`}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeletingInstance(inst)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        aria-label={`Delete ${inst.serialNumber}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingInstance) && (
        <InstanceModal
          instance={editingInstance ?? undefined}
          materialTypes={materialTypes}
          onClose={() => {
            setShowAddModal(false);
            setEditingInstance(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingInstance)}
        title="Delete Instance"
        message={`Are you sure you want to delete instance "${deletingInstance?.serialNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeletingInstance(null)}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
