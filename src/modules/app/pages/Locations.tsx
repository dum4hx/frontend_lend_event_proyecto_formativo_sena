import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import {
  getLocations as getApiLocations,
  deleteLocation as apiDeleteLocation,
  createLocation as apiCreateLocation,
  updateLocation as apiUpdateLocation,
} from "../../../services/warehouseOperatorService";
import type { WarehouseLocation } from "../../../services/warehouseOperatorService";
import { ConfirmDialog } from "../../../components/ui";
import { useToast } from "../../../contexts/ToastContext";
// publicGet removed - address/countries removed from form
import { usePermissions } from "../../../contexts/usePermissions";
import Unauthorized from "../../../../src/pages/Unauthorized";
import { useAuth } from "../../../contexts/useAuth";

export default function LocationsPage() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  if (!hasPermission("materials:read")) return <Unauthorized />;
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<WarehouseLocation | null>(null);

  const initialForm = {
    code: "",
    name: "",
    section: "",
    shelf: "",
    capacity: 0,
    occupied: 0,
    status: "available" as WarehouseLocation["status"],
    address: {
      country: "",
      city: "",
      street: "",
      propertyNumber: "",
    },
  };
  const [form, setForm] = useState<typeof initialForm>(initialForm);
  const { showToast } = useToast();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const updateForm = (k: keyof typeof initialForm, v: string | number | any) => setForm((s) => ({ ...s, [k]: v }));
  const updateAddressField = (k: keyof typeof initialForm.address, v: string) => setForm((s) => ({ ...s, address: { ...(s as any).address, [k]: v } }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApiLocations({ page: 1, limit: 100 });
      // Map backend LocationModel to the view's expected shape minimally
      // If backend returns { locations: WarehouseLocation[] } use it directly,
      // otherwise if it returns items array map to WarehouseLocation shape.
      if ((res.data as any).locations) {
        setLocations((res.data as any).locations as WarehouseLocation[]);
      } else if ((res.data as any).items) {
        const mapped = (res.data as any).items.map((it: any) => ({
          id: it._id || it.id,
          code: it.name || it.code,
          section: it.address?.city ?? it.section ?? "",
          shelf: it.address?.street ?? it.shelf ?? "",
          capacity: it.capacity ?? 0,
          occupied: it.occupied ?? 0,
          status: it.status ?? "available",
        } as WarehouseLocation));
        setLocations(mapped);
      } else {
        setLocations([]);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error fetching locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLocations();
  }, []);

  const handleDelete = async (id: string) => {
    // open confirm dialog
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await apiDeleteLocation(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      showToast('success', 'Location deleted');
      await fetchLocations();
    } catch (err: any) {
      showToast('error', err?.message ?? 'Error deleting location');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreate = () => {
    setForm(initialForm);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    // client-side validation
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.section.trim()) errs.section = 'Section is required';
    if (!form.shelf.trim()) errs.shelf = 'Shelf is required';
    if (!Number.isFinite(form.capacity) || form.capacity < 0) errs.capacity = 'Capacity must be >= 0';
    if (!Number.isFinite(form.occupied) || form.occupied < 0) errs.occupied = 'Occupied must be >= 0';
    if (!form.address?.country || !form.address.country.trim()) errs['address.country'] = 'Country is required';
    if (!form.address?.city || !form.address.city.trim()) errs['address.city'] = 'City is required';
    if (!form.address?.street || !form.address.street.trim()) errs['address.street'] = 'Street is required';
    if (!form.address?.propertyNumber || !form.address.propertyNumber.trim()) errs['address.propertyNumber'] = 'Property number is required';
    if (form.occupied > form.capacity) errs.occupied = 'Occupied cannot be greater than capacity';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast('warning', 'Please fix the form fields');
      return;
    }
    try {
      await apiCreateLocation({
        code: form.code,
        name: form.name,
        organizationId: user?.organizationId ?? "",
        section: form.section,
        shelf: form.shelf,
        capacity: form.capacity,
        occupied: form.occupied,
        status: form.status,
        // backend currently validates presence of address; send object with empty strings
        address: {
          country: form.address.country,
          city: form.address.city,
          street: form.address.street,
          propertyNumber: form.address.propertyNumber,
        },
      });
      setShowCreateModal(false);
      showToast('success', 'Location created');
      await fetchLocations();
    } catch (err: any) {
      showToast('error', err?.message ?? 'Error creating location');
    }
  };

  const openEdit = (loc: WarehouseLocation) => {
    setEditing(loc);
    setForm({
      code: (loc as any).code ?? "",
      name: (loc as any).name ?? "",
      section: (loc as any).section ?? "",
      shelf: (loc as any).shelf ?? "",
      capacity: (loc as any).capacity ?? 0,
      occupied: (loc as any).occupied ?? 0,
      status: (loc as any).status ?? "available",
      address: {
        country: (loc as any).address?.country ?? "",
        city: (loc as any).address?.city ?? "",
        street: (loc as any).address?.street ?? "",
        propertyNumber: (loc as any).address?.propertyNumber ?? "",
      },
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.section.trim()) errs.section = 'Section is required';
    if (!form.shelf.trim()) errs.shelf = 'Shelf is required';
    if (!Number.isFinite(form.capacity) || form.capacity < 0) errs.capacity = 'Capacity must be >= 0';
    if (!Number.isFinite(form.occupied) || form.occupied < 0) errs.occupied = 'Occupied must be >= 0';
    if (!form.address?.country || !form.address.country.trim()) errs['address.country'] = 'Country is required';
    if (!form.address?.city || !form.address.city.trim()) errs['address.city'] = 'City is required';
    if (!form.address?.street || !form.address.street.trim()) errs['address.street'] = 'Street is required';
    if (!form.address?.propertyNumber || !form.address.propertyNumber.trim()) errs['address.propertyNumber'] = 'Property number is required';
    if (form.occupied > form.capacity) errs.occupied = 'Occupied cannot be greater than capacity';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast('warning', 'Please fix the form fields');
      return;
    }
    try {
      await apiUpdateLocation(editing.id, {
        code: form.code,
        name: form.name,
        organizationId: user?.organizationId ?? "",
        section: form.section,
        shelf: form.shelf,
        capacity: form.capacity,
        occupied: form.occupied,
        status: form.status,
        address: {
          country: form.address.country,
          city: form.address.city,
          street: form.address.street,
          propertyNumber: form.address.propertyNumber,
        },
      } as any);
      setShowEditModal(false);
      setEditing(null);
      showToast('success', 'Location updated');
      await fetchLocations();
    } catch (err: any) {
      showToast('error', err?.message ?? 'Error updating location');
    }
  };

  const filteredLocations = locations.filter(
    (loc: any) =>
      (loc.code ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.section ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/20 text-green-400";
      case "full":
        return "bg-yellow-500/20 text-yellow-400";
      case "maintenance":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getCapacityPercentage = (occupied: number, capacity: number) => {
    return Math.round((occupied / capacity) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Warehouse Locations</h1>
          <p className="text-gray-400">Manage warehouse zones and storage locations</p>
        </div>
        <div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFC107] transition-all">
            <Plus size={20} />
            Add Location
          </button>
        </div>
      </div>

      {/* Preview / Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total locations</p>
          <p className="text-white text-2xl font-bold">{locations.length}</p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total capacity</p>
          <p className="text-white text-2xl font-bold">{locations.reduce((s, l) => s + (l.capacity ?? 0), 0)}</p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Occupied</p>
          <p className="text-white text-2xl font-bold">{locations.reduce((s, l) => s + (l.occupied ?? 0), 0)}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by location code or section..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading && <div className="text-gray-400">Cargando ubicaciones...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && filteredLocations.map((location) => {
          const capacityPercent = getCapacityPercentage(location.occupied, location.capacity);
          return (
            <div
              key={location.id}
              className="bg-[#121212] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
            >
              {/* Location Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{location.code}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Section {location.section} - Shelf {location.shelf}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(location.status)}`}>
                  {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                </span>
              </div>

              {/* Capacity Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Capacity</p>
                  <p className="text-white font-semibold text-sm">
                    {location.occupied}/{location.capacity} units ({capacityPercent}%)
                  </p>
                </div>
                <div className="w-full bg-[#333] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      capacityPercent > 90
                        ? "bg-red-500"
                        : capacityPercent > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Available Space */}
              <div className="bg-[#1a1a1a] rounded-lg p-3 mb-4">
                <p className="text-gray-400 text-xs mb-1">Available Space</p>
                <p className="text-white font-semibold text-lg">
                  {location.capacity - location.occupied} units
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(location as WarehouseLocation)} className="flex-1 flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg py-2 transition-all">
                  <Edit2 size={18} />
                  Edit
                </button>
                <button onClick={() => void handleDelete(location.id)} className="flex-1 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg py-2 transition-all">
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No locations found matching your search</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
            <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-lg w-full p-6 shadow-lg">
              <h2 className="text-3xl font-bold mb-3">Create Location</h2>
              <p className="text-gray-400 text-sm mb-5">Add a new warehouse location. Fields marked with * are required.</p>
              <form onSubmit={(e) => { e.preventDefault(); void handleCreate(); }} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => { updateForm('name', e.target.value); setFieldErrors((s) => ({ ...s, name: undefined })); }}
                    placeholder="e.g. Main Warehouse - Site A"
                    className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                  {fieldErrors.name && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.name}</p>}
                </div>

                {/* Organization ID is inferred from authenticated user; not editable here */}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => { updateForm('code', e.target.value); setFieldErrors((s) => ({ ...s, code: undefined })); }}
                    placeholder="e.g. A-12"
                    className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                  {fieldErrors.code && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.code}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Section *</label>
                  <input
                    value={form.section}
                    onChange={(e) => { updateForm('section', e.target.value); setFieldErrors((s) => ({ ...s, section: undefined })); }}
                    placeholder="e.g. Zone 1"
                    className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                  {fieldErrors.section && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.section}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Shelf *</label>
                  <input
                    value={form.shelf}
                    onChange={(e) => { updateForm('shelf', e.target.value); setFieldErrors((s) => ({ ...s, shelf: undefined })); }}
                    placeholder="e.g. Shelf A"
                    className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                  {fieldErrors.shelf && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.shelf}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateForm('status', e.target.value)}
                    className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  >
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Capacity *</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => { updateForm('capacity', Number(e.target.value)); setFieldErrors((s) => ({ ...s, capacity: undefined })); }}
                    placeholder="0"
                    className="w-full h-12 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                  {fieldErrors.capacity && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.capacity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Occupied *</label>
                  <input
                    type="number"
                    value={form.occupied}
                    onChange={(e) => { updateForm('occupied', Number(e.target.value)); setFieldErrors((s) => ({ ...s, occupied: undefined })); }}
                    placeholder="0"
                    className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                  {fieldErrors.occupied && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.occupied}</p>}
                </div>
              </div>

              {/* Address inputs - compact horizontal, responsive */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Country *</label>
                  <input value={form.address.country} onChange={(e) => { updateAddressField('country', e.target.value); setFieldErrors((s) => ({ ...s, 'address.country': undefined })); }} placeholder="Country" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.country'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.country']}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                  <input value={form.address.city} onChange={(e) => { updateAddressField('city', e.target.value); setFieldErrors((s) => ({ ...s, 'address.city': undefined })); }} placeholder="City" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.city'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.city']}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Street *</label>
                  <input value={form.address.street} onChange={(e) => { updateAddressField('street', e.target.value); setFieldErrors((s) => ({ ...s, 'address.street': undefined })); }} placeholder="Street" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.street'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.street']}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Property # *</label>
                  <input value={form.address.propertyNumber} onChange={(e) => { updateAddressField('propertyNumber', e.target.value); setFieldErrors((s) => ({ ...s, 'address.propertyNumber': undefined })); }} placeholder="Property number" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.propertyNumber'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.propertyNumber']}</p>}
                </div>
              </div>

              {/* Address removed: not required by DB */}

              <div className="flex items-center gap-4 pt-4">
                <button type="submit" className="flex-1 py-3 bg-[#FFD700] text-black font-semibold rounded-md hover:bg-[#FFC700] transition-colors">Create Location</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-[#141414] text-gray-300 font-medium rounded-md hover:bg-[#1b1b1b] transition-colors border border-[#333]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-lg w-full p-6 shadow-lg">
            <h2 className="text-3xl font-bold mb-3">Edit Location</h2>
            <p className="text-gray-400 text-sm mb-5">Update the location details below.</p>
            <form onSubmit={(e) => { e.preventDefault(); void handleUpdate(); }} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => { updateForm('name', e.target.value); setFieldErrors((s) => ({ ...s, name: undefined })); }} placeholder="e.g. Main Warehouse - Site A" className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]" />
                  {fieldErrors.name && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.name}</p>}
                </div>

                {/* Organization ID is inferred from authenticated user; not editable here */}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Code *</label>
                  <input value={form.code} onChange={(e) => { updateForm('code', e.target.value); setFieldErrors((s) => ({ ...s, code: undefined })); }} placeholder="e.g. A-12" className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]" />
                  {fieldErrors.code && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.code}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Section *</label>
                  <input value={form.section} onChange={(e) => { updateForm('section', e.target.value); setFieldErrors((s) => ({ ...s, section: undefined })); }} placeholder="e.g. Zone 1" className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]" />
                  {fieldErrors.section && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.section}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Shelf *</label>
                  <input value={form.shelf} onChange={(e) => { updateForm('shelf', e.target.value); setFieldErrors((s) => ({ ...s, shelf: undefined })); }} placeholder="e.g. Shelf A" className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]" />
                  {fieldErrors.shelf && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.shelf}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
                  <select value={form.status} onChange={(e) => updateForm('status', e.target.value)} className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]">
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Capacity *</label>
                  <input type="number" value={form.capacity} onChange={(e) => { updateForm('capacity', Number(e.target.value)); setFieldErrors((s) => ({ ...s, capacity: undefined })); }} placeholder="0" className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]" />
                  {fieldErrors.capacity && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.capacity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Occupied *</label>
                  <input type="number" value={form.occupied} onChange={(e) => { updateForm('occupied', Number(e.target.value)); setFieldErrors((s) => ({ ...s, occupied: undefined })); }} placeholder="0" className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]" />
                  {fieldErrors.occupied && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.occupied}</p>}
                </div>
              </div>
              {/* Address inputs - compact horizontal, responsive */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Country *</label>
                  <input value={form.address.country} onChange={(e) => { updateAddressField('country', e.target.value); setFieldErrors((s) => ({ ...s, 'address.country': undefined })); }} placeholder="Country" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.country'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.country']}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                  <input value={form.address.city} onChange={(e) => { updateAddressField('city', e.target.value); setFieldErrors((s) => ({ ...s, 'address.city': undefined })); }} placeholder="City" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.city'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.city']}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Street *</label>
                  <input value={form.address.street} onChange={(e) => { updateAddressField('street', e.target.value); setFieldErrors((s) => ({ ...s, 'address.street': undefined })); }} placeholder="Street" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.street'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.street']}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Property # *</label>
                  <input value={form.address.propertyNumber} onChange={(e) => { updateAddressField('propertyNumber', e.target.value); setFieldErrors((s) => ({ ...s, 'address.propertyNumber': undefined })); }} placeholder="Property number" className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white" />
                  {fieldErrors['address.propertyNumber'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.propertyNumber']}</p>}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Save changes</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 bg-[#1a1a1a] text-gray-300 font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete confirmation dialog (reused ConfirmDialog component) */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar ubicación"
        message="¿Confirmas eliminar esta ubicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
