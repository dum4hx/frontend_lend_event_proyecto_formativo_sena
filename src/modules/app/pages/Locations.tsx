import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Search, Plus, Edit2, Trash2, X, ChevronDown, Download, Upload, MapPin, Info, Eye } from "lucide-react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import {
  getLocations as getApiLocations,
  deleteLocation as apiDeleteLocation,
  createLocation as apiCreateLocation,
  updateLocation as apiUpdateLocation,
} from "../../../services/warehouseOperatorService";
import type { WarehouseLocation } from "../../../services/warehouseOperatorService";
import { ConfirmDialog } from "../../../components/ui";
import { useToast } from "../../../contexts/ToastContext";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, LOCATIONS_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
// publicGet removed - address/countries removed from form
import { usePermissions } from "../../../contexts/usePermissions";
import Unauthorized from "../../../../src/pages/Unauthorized";
import { useAuth } from "../../../contexts/useAuth";

// --- Colombia API types & fetcher -------------------------------------------
interface ColombiaDepartment {
  id: number;
  name: string;
}

interface ColombiaCity {
  id: number;
  name: string;
  departmentId: number;
  postalCode: string | null;
}

const colombiaFetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Colombia API error: ${res.status}`);
    return res.json();
  });

export default function LocationsPage() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<WarehouseLocation | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewing, setPreviewing] = useState<WarehouseLocation | null>(null);

  const initialForm = {
    name: "",
    status: "available" as "available" | "full_capacity" | "maintenance" | "inactive",
    address: {
      streetType: "",
      primaryNumber: "",
      secondaryNumber: "",
      complementaryNumber: "",
      state: "",
      city: "",
      additionalDetails: "",
      formatted: "",
    },
  };
  const [form, setForm] = useState<typeof initialForm>(initialForm);
  const { showToast } = useToast();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const updateForm = (k: keyof typeof initialForm, v: string | number) =>
    setForm((s) => ({ ...s, [k]: v }));
  const updateAddressField = (k: keyof typeof initialForm.address, v: string) =>
    setForm((s) => ({ ...s, address: { ...s.address, [k]: v } }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // --- Colombia API: Department & City autocomplete ----------------------------
  const [selectedState, setSelectedState] = useState<string>('');
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [stateQuery, setStateQuery] = useState("");
  const [debouncedStateQuery] = useDebounce(stateQuery, 200);

  const [_selectedCity, setSelectedCity] = useState<string>('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  // --- Export/Import ----------------------------
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const exportAbort = useRef<AbortController | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SWR: load all departments once, then filter client-side
  const { data: departments, isLoading: deptLoading, error: deptError } = useSWR<ColombiaDepartment[]>(
    "https://api-colombia.com/api/v1/Department",
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, keepPreviousData: true },
  );

  // SWR: fetch cities for the selected department
  const { data: stateCities, isLoading: citiesLoading, error: citiesError } = useSWR<ColombiaCity[]>(
    selectedState ? `https://api-colombia.com/api/v1/Department/${selectedState}/cities` : null,
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  // Normalize text: remove accents/tildes for accent-insensitive matching
  const normalize = useCallback(
    (s: string | undefined | null): string => {
      if (!s) return "";
      return s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    },
    [],
  );

  // Client-side filter: only show departments whose name matches the query
  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!debouncedStateQuery.trim()) return departments;
    const nq = normalize(debouncedStateQuery);
    const prefixMatches = departments.filter((d) => d?.name && normalize(d.name).startsWith(nq));
    if (prefixMatches.length) return prefixMatches;
    return departments.filter((d) => d?.name && normalize(d.name).includes(nq));
  }, [departments, debouncedStateQuery, normalize]);

  // Client-side filter for city suggestions
  const filteredCities = useMemo(() => {
    if (!stateCities) return [];
    if (!cityQuery.trim()) return stateCities;
    const normalizedCityQuery = normalize(cityQuery);
    const prefixCityMatches = stateCities.filter((c) =>
      c?.name && normalize(c.name).startsWith(normalizedCityQuery),
    );
    if (prefixCityMatches.length) return prefixCityMatches;
    return stateCities.filter((c) => c?.name && normalize(c.name).includes(normalizedCityQuery));
  }, [stateCities, cityQuery, normalize]);

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
        console.log('No locations or items found in response');
        setLocations([]);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error fetching locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission("materials:read")) {
      void fetchLocations();
    }
  }, [hasPermission]);

  if (!hasPermission("materials:read")) return <Unauthorized />;

  const handleDelete = async (id: string) => {
    // open confirm dialog
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      const locationName = locations.find(l => (l as any)._id === deleteTargetId || (l as any).id === deleteTargetId);
      await apiDeleteLocation(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      showToast('success', 'Location deleted');
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message ?? "Error deleting location");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreate = () => {
    setForm({
      ...initialForm,
      status: "available"
    });
    // Reset autocomplete fields
    setStateQuery('');
    setCityQuery('');
    setSelectedState('');
    setSelectedCity('');
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    // Reset autocomplete fields
    setStateQuery('');
    setCityQuery('');
    setSelectedState('');
    setSelectedCity('');
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditing(null);
    // Reset form to initial values
    setForm(initialForm);
    // Reset autocomplete fields
    setStateQuery('');
    setCityQuery('');
    setSelectedState('');
    setSelectedCity('');
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    // Clear field errors
    setFieldErrors({});
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
      showToast("warning", "Please fix the form fields");
      return;
    }
    
    // Build formatted address for backend
    const formattedAddress = `${form.address.streetType} ${form.address.primaryNumber} #${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    const propertyNumber = `${form.address.primaryNumber}-${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    
    try {
      // Send only fields that backend accepts
      await apiCreateLocation({
        name: form.name,
        status: form.status,
        organizationId: user?.organizationId ?? "",
        address: {
          country: "Colombia",
          state: form.address.state,
          city: form.address.city,
          street: formattedAddress,
          propertyNumber: propertyNumber,
          additionalInfo: form.address.additionalDetails || "",
        },
      });
      setShowCreateModal(false);
      showToast('success', 'Location created');
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message ?? "Error creating location");
    }
  };

  const openEdit = (loc: WarehouseLocation) => {
    console.log('=== OPENING EDIT FOR LOCATION ===');
    console.log('Full location object:', JSON.stringify(loc, null, 2));
    
    // First, close any open suggestions and clear errors
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
    
    setEditing(loc);
    
    // Extract address values
    const locationAddress = (loc as any).address || {};
    console.log('Address object:', JSON.stringify(locationAddress, null, 2));
    
    const existingState = locationAddress.state || "";
    const existingCity = locationAddress.city || "";
    const existingStreetType = locationAddress.streetType || "";
    const existingPrimaryNumber = locationAddress.primaryNumber || "";
    const existingSecondaryNumber = locationAddress.secondaryNumber || "";
    const existingComplementaryNumber = locationAddress.complementaryNumber || "";
    const existingAdditionalDetails = locationAddress.additionalDetails || locationAddress.additionalInfo || "";
    
    console.log('Extracted values:', {
      streetType: existingStreetType,
      primaryNumber: existingPrimaryNumber,
      secondaryNumber: existingSecondaryNumber,
      state: existingState,
      city: existingCity
    });
    
    // Set autocomplete fields
    setStateQuery(existingState);
    setCityQuery(existingCity);
    
    // Find department ID if state name exists
    if (existingState && departments) {
      const dept = departments.find(d => d.name === existingState);
      if (dept) {
        setSelectedState(dept.id.toString());
        setSelectedCity(existingCity);
      } else {
        setSelectedState('');
      }
    } else {
      setSelectedState('');
    }
    
    // Set the complete form with all values
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

  const openPreview = (loc: WarehouseLocation) => {
    setPreviewing(loc);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewing(null);
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
      showToast("warning", "Please fix the form fields");
      return;
    }
    
    // Build formatted address for backend
    const formattedAddress = `${form.address.streetType} ${form.address.primaryNumber} #${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    const propertyNumber = `${form.address.secondaryNumber}-${form.address.primaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    
    try {
      await apiUpdateLocation(editing.id, {
        code: form.code,
        name: form.name,
        status: form.status,
        organizationId: user?.organizationId ?? "",
        address: {
          country: "Colombia",
          state: form.address.state,
          city: form.address.city,
          street: formattedAddress,
          propertyNumber: propertyNumber,
          additionalInfo: form.address.additionalDetails || "",
        },
      } as any);
      setShowEditModal(false);
      setEditing(null);
      showToast('success', 'Location updated');
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message ?? "Error updating location");
    }
  };

  const filteredLocations = locations.filter(
    (loc: any) =>
      (loc.code ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.section ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ─── Export ────────────────────────────────────────────────────────────────
  
  const buildExportRows = useCallback(
    (locs: WarehouseLocation[]) => {
      return locs.map((loc: any) => ({
        Name: loc.name || "",
        Status: loc.status || "active",
        "Street Type": loc.address?.streetType || "",
        "Primary Number": loc.address?.primaryNumber || "",
        "Secondary Number": loc.address?.secondaryNumber || "",
        "Complementary Number": loc.address?.complementaryNumber || "",
        State: loc.address?.state || "",
        City: loc.address?.city || "",
        "Additional Details": loc.address?.additionalDetails || "",
        "Formatted Address": loc.address?.formatted || "",
      }));
    },
    [],
  );

  const handleExport = useCallback(
    async (config: ExportConfig) => {
      const abort = new AbortController();
      exportAbort.current = abort;
      setExporting(true);
      setExportProgress(undefined);

      try {
        const rows = buildExportRows(locations);
        
        if (rows.length === 0) {
          showToast("warning", "No locations to export");
          return;
        }

        const result = await exportService.export(
          rows,
          config,
          user?.id ?? "anonymous",
          (progress: ExportProgress) => setExportProgress(progress),
          abort.signal,
        );

        if (result.status === "success") {
          showToast(
            "success",
            `Exported ${result.metadata.recordCount} locations as ${result.filename}`,
          );
          setExportOpen(false);
        } else if (result.status === "cancelled") {
          showToast("info", result.reason);
        } else {
          showToast("error", result.error);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          showToast("error", err?.message || "Export failed");
        }
      } finally {
        setExporting(false);
        setExportProgress(undefined);
        exportAbort.current = null;
      }
    },
    [locations, buildExportRows, showToast, user],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
    setExporting(false);
    setExportProgress(undefined);
    exportAbort.current = null;
  }, []);

  // ─── Import ────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!importFile) {
      showToast("warning", "Please select a file to import");
      return;
    }

    setImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        showToast("error", "File is empty or invalid. Please use the template.");
        setImporting(false);
        return;
      }

      // Parse CSV - handles quoted fields properly
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"' && inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else if (char === '"') {
            // Toggle quotes
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      
      // Detect CSV format
      const isLegacyFormat = headers.includes("name") && headers.includes("organizationId");
      const isTemplateFormat = headers[0] === "Name" && headers[1] === "Street Type";
      
      if (!isLegacyFormat && !isTemplateFormat) {
        showToast("error", "Invalid file format. Headers not recognized.");
        setImporting(false);
        return;
      }

      const rows = lines.slice(1).map(line => parseCSVLine(line));

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        if (row.length < 3 || !row[0]?.trim()) continue; // Skip empty/invalid rows

        try {
          let locationData: any;

          if (isLegacyFormat) {
            // Legacy format: name,organizationId,country,state,city,street,propertyNumber,isActive
            const nameIdx = headers.indexOf("name");
            const stateIdx = headers.indexOf("state");
            const cityIdx = headers.indexOf("city");
            const streetIdx = headers.indexOf("street");
            const propertyNumberIdx = headers.indexOf("propertyNumber");

            const name = row[nameIdx]?.trim() || "";
            const street = row[streetIdx]?.trim() || "";
            const state = row[stateIdx]?.trim() || "";
            const city = row[cityIdx]?.trim() || "";
            const propertyNumber = row[propertyNumberIdx]?.trim() || "";

            locationData = {
              name: name,
              organizationId: user?.organizationId ?? "",
              address: {
                country: "Colombia",
                state: state,
                city: city,
                street: street,
                propertyNumber: propertyNumber,
              },
            };
          } else {
            // Template format: Name, StreetType, PrimaryNumber, SecondaryNumber, ComplementaryNumber, State, City, AdditionalDetails
            const name = row[0]?.trim() || "";
            const streetType = row[1]?.trim() || "";
            const primaryNum = row[2]?.trim() || "";
            const secondaryNum = row[3]?.trim() || "";
            const complementaryNum = row[4]?.trim() || "";
            const state = row[5]?.trim() || "";
            const city = row[6]?.trim() || "";
            const additionalDetails = row[7]?.trim() || "";
            
            const formattedStreet = streetType && primaryNum && secondaryNum
              ? `${streetType} ${primaryNum} # ${secondaryNum}${complementaryNum ? `-${complementaryNum}` : ""}`
              : "";

            locationData = {
              name: name,
              organizationId: user?.organizationId ?? "",
              address: {
                country: "Colombia",
                state: state,
                city: city,
                street: formattedStreet,
                propertyNumber: `${secondaryNum}${complementaryNum ? `-${complementaryNum}` : ""}`,
                additionalInfo: additionalDetails,
              },
            };
          }

          await apiCreateLocation(locationData);
          successCount++;
        } catch (err: any) {
          console.error(`Error importing location ${row[0]}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast("success", `Successfully imported ${successCount} location(s)`);
        await fetchLocations();
      }
      
      if (errorCount > 0) {
        showToast("warning", `Failed to import ${errorCount} location(s)`);
      }
      
      if (successCount === 0 && errorCount === 0) {
        showToast("warning", "No valid rows found in file");
      }

      setShowImportModal(false);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      showToast("error", err?.message || "Import failed");
      console.error("Import error:", err);
    } finally {
      setImporting(false);
    }
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
          placeholder="Search by location name, city, or address..."
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

                  {/* Ciudad Autocomplete */}
                  <div className="flex-1 relative">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Ciudad *</label>
                    <div className="relative">
                      <input
                        value={cityQuery}
                        onChange={(e) => {
                          setCityQuery(e.target.value);
                          setShowCitySuggestions(true);
                          setFieldErrors((s) => ({ ...s, 'address.city': undefined }));
                        }}
                        onFocus={() => {
                          setTimeout(() => setShowCitySuggestions(true), 100);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowCitySuggestions(false), 200);
                        }}
                        disabled={!selectedState}
                        placeholder={selectedState ? "Buscar ciudad..." : "Seleccione departamento primero"}
                        className="w-full px-2 py-2 pr-8 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {fieldErrors['address.city'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.city']}</p>}
                    {showCitySuggestions && selectedState && (
                      <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                        {citiesLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-400">Cargando ciudades...</div>
                        ) : citiesError ? (
                          <div className="px-3 py-2 text-sm text-red-400">Error al cargar ciudades</div>
                        ) : filteredCities.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No se encontraron ciudades</div>
                        ) : (
                          filteredCities.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => {
                                setCityQuery(city.name);
                                setSelectedCity(city.id.toString());
                                updateAddressField('city', city.name);
                                setShowCitySuggestions(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors"
                            >
                              {city.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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
