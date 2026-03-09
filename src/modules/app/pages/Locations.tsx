import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import {
  getLocations as getApiLocations,
  deleteLocation as apiDeleteLocation,
  LocationModel,
} from "../../../services/locationService";

export default function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApiLocations({ page: 1, limit: 100 });
      // Map backend LocationModel to the view's expected shape minimally
      const mapped = res.data.items.map((it: LocationModel) => ({
        id: it._id,
        code: it.name,
        section: it.address?.city ?? "",
        shelf: it.address?.street ?? "",
        capacity: 0,
        occupied: 0,
        status: "available",
      }));
      setLocations(mapped);
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
    if (!confirm("¿Eliminar esta ubicación?")) return;
    try {
      await apiDeleteLocation(id);
      // Refresh list
      await fetchLocations();
    } catch (err: any) {
      alert(err?.message ?? "Error al eliminar");
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
        <button className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFC107] transition-all">
          <Plus size={20} />
          Add Location
        </button>
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
                <button className="flex-1 flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg py-2 transition-all">
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
    </div>
  );
}
