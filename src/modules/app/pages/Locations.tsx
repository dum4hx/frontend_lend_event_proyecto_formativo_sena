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
  if (!hasPermission("materials:read")) return <Unauthorized />;
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

  const updateForm = (k: keyof typeof initialForm, v: string | number | any) => setForm((s) => ({ ...s, [k]: v }));
  const updateAddressField = (k: keyof typeof initialForm.address, v: string) => setForm((s) => ({ ...s, address: { ...(s as any).address, [k]: v } }));
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
      console.log('=== RAW BACKEND RESPONSE ===');
      console.log('Full response:', JSON.stringify(res.data, null, 2));
      
      // Helper function to parse street address into components
      const parseStreetAddress = (street: string) => {
        // Examples: "Diagonal 15 # 93-47", "Calle 30 #45-90", "Carrera 8 #18-22"
        const match = street.match(/^(Calle|Carrera|Avenida|Diagonal|Transversal)\s+(\d+)\s*#\s*(\d+)-?(\d*)$/i);
        if (match) {
          return {
            streetType: match[1],
            primaryNumber: match[2],
            secondaryNumber: match[3],
            complementaryNumber: match[4] || "",
          };
        }
        return { streetType: "", primaryNumber: "", secondaryNumber: "", complementaryNumber: "" };
      };
      
      // Map backend LocationModel to the view's expected shape
      if ((res.data as any).locations) {
        console.log('Using res.data.locations directly');
        const locations = (res.data as any).locations;
        console.log('First location:', JSON.stringify(locations[0], null, 2));
        setLocations(locations as WarehouseLocation[]);
      } else if ((res.data as any).items) {
        console.log('Mapping from res.data.items');
        const firstItem = (res.data as any).items[0];
        console.log('First item before mapping:', JSON.stringify(firstItem, null, 2));
        
        const mapped = (res.data as any).items.map((it: any) => {
          const addressData = it.address || {};
          const streetComponents = addressData.street ? parseStreetAddress(addressData.street) : { streetType: "", primaryNumber: "", secondaryNumber: "", complementaryNumber: "" };
          
          const mappedItem = {
            _id: it._id || it.id,
            id: it._id || it.id,
            name: it.name || "",
            organizationId: it.organizationId || "",
            status: it.status || "available",
            isActive: it.isActive !== undefined ? it.isActive : true,
            createdAt: it.createdAt || "",
            updatedAt: it.updatedAt || "",
            // Combine backend data with parsed street components
            address: {
              country: addressData.country || "Colombia",
              street: addressData.street || "",
              propertyNumber: addressData.propertyNumber || "",
              streetType: addressData.streetType || streetComponents.streetType,
              primaryNumber: addressData.primaryNumber || streetComponents.primaryNumber,
              secondaryNumber: addressData.secondaryNumber || streetComponents.secondaryNumber,
              complementaryNumber: addressData.complementaryNumber || streetComponents.complementaryNumber,
              state: addressData.state || "",
              city: addressData.city || "",
              additionalDetails: addressData.additionalInfo || addressData.additionalDetails || "",
              additionalInfo: addressData.additionalInfo || "",
              formatted: addressData.formatted || addressData.street || "",
            },
          };
          return mappedItem;
        });
        console.log('First mapped item:', JSON.stringify(mapped[0], null, 2));
        setLocations(mapped as WarehouseLocation[]);
      } else {
        console.log('No locations or items found in response');
        setLocations([]);
      }
    } catch (err: any) {
      console.error('Error fetching locations:', err);
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
      const locationName = locations.find(l => (l as any)._id === deleteTargetId || (l as any).id === deleteTargetId);
      await apiDeleteLocation(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      showToast('success', `Location "${(locationName as any)?.name || 'Location'}" deleted successfully`);
      await fetchLocations();
    } catch (err: any) {
      showToast('error', err?.message ?? 'Error deleting location');
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
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.address?.streetType || !form.address.streetType.trim()) errs['address.streetType'] = 'Street type is required';
    if (!form.address?.primaryNumber || !form.address.primaryNumber.trim()) errs['address.primaryNumber'] = 'Primary number is required';
    if (!form.address?.secondaryNumber || !form.address.secondaryNumber.trim()) errs['address.secondaryNumber'] = 'Secondary number is required';
    if (!form.address?.state || !form.address.state.trim()) errs['address.state'] = 'State is required';
    if (!form.address?.city || !form.address.city.trim()) errs['address.city'] = 'City is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast('warning', 'Please fix the form fields');
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
      closeCreateModal();
      showToast('success', `Location "${form.name}" created successfully`);
      await fetchLocations();
    } catch (err: any) {
      showToast('error', err?.message ?? 'Error creating location');
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
      name: (loc as any).name || "",
      status: (loc as any).status || "available",
      address: {
        streetType: existingStreetType,
        primaryNumber: existingPrimaryNumber,
        secondaryNumber: existingSecondaryNumber,
        complementaryNumber: existingComplementaryNumber,
        state: existingState,
        city: existingCity,
        additionalDetails: existingAdditionalDetails,
        formatted: locationAddress.formatted || "",
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
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.address?.streetType || !form.address.streetType.trim()) errs['address.streetType'] = 'Street type is required';
    if (!form.address?.primaryNumber || !form.address.primaryNumber.trim()) errs['address.primaryNumber'] = 'Primary number is required';
    if (!form.address?.secondaryNumber || !form.address.secondaryNumber.trim()) errs['address.secondaryNumber'] = 'Secondary number is required';
    if (!form.address?.state || !form.address.state.trim()) errs['address.state'] = 'State is required';
    if (!form.address?.city || !form.address.city.trim()) errs['address.city'] = 'City is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast('warning', 'Please fix the form fields');
      return;
    }
    
    // Build formatted address for backend
    const formattedAddress = `${form.address.streetType} ${form.address.primaryNumber} #${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    const propertyNumber = `${form.address.secondaryNumber}-${form.address.primaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    
    try {
      // Send only fields that backend accepts
      await apiUpdateLocation(editing.id ?? editing._id, {
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
      closeEditModal();
      setEditing(null);
      showToast('success', `Location "${form.name}" updated successfully`);
      await fetchLocations();
    } catch (err: any) {
      showToast('error', err?.message ?? 'Error updating location');
    }
  };

  const filteredLocations = locations.filter(
    (loc: any) =>
      (loc.name ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.address?.city ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.address?.state ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.address?.street ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase()),
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportOpen(true)}
            className="export-btn flex items-center gap-2"
            disabled={locations.length === 0}
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="export-btn flex items-center gap-2"
          >
            <Upload size={18} />
            Import
          </button>
          <button 
            onClick={openCreate} 
            className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFC107] transition-all"
          >
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
          return (
            <div
              key={location.id ?? location._id}
              className="bg-[#121212] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
            >
              {/* Location Header */}
              <div className="flex flex-col mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-2xl font-bold text-white">{(location as any).name}</h3>
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    (location as any).status === 'available' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    (location as any).status === 'full_capacity' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    (location as any).status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    (location as any).status === 'inactive' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {(location as any).status === 'available' ? 'Available' :
                     (location as any).status === 'full_capacity' ? 'Full Capacity' :
                     (location as any).status === 'maintenance' ? 'Maintenance' :
                     (location as any).status === 'inactive' ? 'Inactive' : 'Unknown'}
                  </span>
                </div>
                {(location as any).address?.formatted && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm flex items-start gap-2">
                      <MapPin size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">
                        {(location as any).address.formatted}
                        {(location as any).address.city && (location as any).address.state && (
                          <span className="block mt-1 text-gray-500">
                            {(location as any).address.city}, {(location as any).address.state}
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                )}
                {/* Additional Details - outside address block so it always shows if exists */}
                {((location as any).address?.additionalDetails || (location as any).address?.additionalInfo) && (
                  <p className="text-gray-500 text-xs flex items-start gap-2 mt-2">
                    <Info size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>{(location as any).address.additionalDetails || (location as any).address.additionalInfo}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <button 
                  onClick={() => openPreview(location as WarehouseLocation)} 
                  className="p-2 text-blue-400 hover:text-blue-300 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-all"
                  title="Preview location details"
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={() => openEdit(location as WarehouseLocation)} 
                  className="p-2 text-[#FFD700] hover:text-[#FFC700] bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-all"
                  title="Edit location"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => void handleDelete(location.id ?? location._id)} 
                  className="p-2 text-red-400 hover:text-red-300 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-all"
                  title="Delete location"
                >
                  <Trash2 size={18} />
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}>
            <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-6xl w-full p-8 shadow-lg max-h-[90vh] overflow-y-auto">
              {/* Header with close button */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Create Location</h2>
                  <p className="text-gray-400 text-sm">Add a new warehouse location. Fields marked with * are required.</p>
                </div>
                <button type="button" onClick={() => closeCreateModal()} className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
                  <X size={24} className="text-gray-400 hover:text-white" />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); void handleCreate(); }} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateForm('status', e.target.value as any)}
                      className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="available">Available</option>
                      <option value="full_capacity">Full Capacity</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

              {/* Address inputs - enhanced horizontal layout */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Tipo Vía *</label>
                    <select value={form.address.streetType} onChange={(e) => { updateAddressField('streetType', e.target.value); setFieldErrors((s) => ({ ...s, 'address.streetType': undefined })); }} className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]">
                      <option value="">Seleccionar</option>
                      <option value="Calle">Calle</option>
                      <option value="Carrera">Carrera</option>
                      <option value="Avenida">Avenida</option>
                      <option value="Diagonal">Diagonal</option>
                      <option value="Transversal">Transversal</option>
                    </select>
                    {fieldErrors['address.streetType'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.streetType']}</p>}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Número *</label>
                    <input 
                      type="text"
                      value={form.address.primaryNumber} 
                      onChange={(e) => { 
                        const value = e.target.value.replace(/\D/g, '');
                        updateAddressField('primaryNumber', value); 
                        setFieldErrors((s) => ({ ...s, 'address.primaryNumber': undefined })); 
                      }} 
                      placeholder="15" 
                      className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" 
                    />
                    {fieldErrors['address.primaryNumber'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.primaryNumber']}</p>}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Número 2 *</label>
                    <input 
                      type="text"
                      value={form.address.secondaryNumber} 
                      onChange={(e) => { 
                        const value = e.target.value.replace(/\D/g, '');
                        updateAddressField('secondaryNumber', value); 
                        setFieldErrors((s) => ({ ...s, 'address.secondaryNumber': undefined })); 
                      }} 
                      placeholder="93" 
                      className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" 
                    />
                    {fieldErrors['address.secondaryNumber'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.secondaryNumber']}</p>}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Número 3</label>
                    <input 
                      type="text"
                      value={form.address.complementaryNumber} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        updateAddressField('complementaryNumber', value);
                      }} 
                      placeholder="47" 
                      className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" 
                    />
                  </div>
                  <div className="flex-1 relative">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Departamento *</label>
                    <div className="relative">
                      <input 
                        value={stateQuery} 
                        onChange={(e) => {
                          setStateQuery(e.target.value);
                          setShowStateSuggestions(true);
                          if (!e.target.value.trim()) {
                            setSelectedState('');
                            updateAddressField('state', '');
                          }
                          setFieldErrors((s) => ({ ...s, 'address.state': undefined }));
                        }}
                        onFocus={() => setShowStateSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                        placeholder="Buscar departamento..." 
                        className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" 
                      />
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    {fieldErrors['address.state'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.state']}</p>}
                    {showStateSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {deptLoading ? (
                          <div className="p-3 text-gray-400 text-sm">Cargando...</div>
                        ) : filteredDepartments.length ? (
                          filteredDepartments.map((dept) => (
                            <button
                              key={dept.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1a1a1a] transition"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedState(dept.id.toString());
                                setStateQuery(dept.name);
                                updateAddressField('state', dept.name);
                                setShowStateSuggestions(false);
                                setFieldErrors((s) => ({ ...s, 'address.state': undefined }));
                                // Reset city
                                setCityQuery('');
                                setSelectedCity('');
                                updateAddressField('city', '');
                              }}
                            >
                              {dept.name}
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-gray-400 text-sm">No se encontraron departamentos</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Ciudad *</label>
                    <div className="relative">
                      <input 
                        value={cityQuery} 
                        onChange={(e) => {
                          setCityQuery(e.target.value);
                          setShowCitySuggestions(true);
                          if (!e.target.value.trim()) {
                            setSelectedCity('');
                            updateAddressField('city', '');
                          }
                          setFieldErrors((s) => ({ ...s, 'address.city': undefined }));
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                        placeholder={selectedState ? "Buscar ciudad..." : "Seleccione departamento primero"} 
                        disabled={!selectedState}
                        className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed" 
                      />
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    {fieldErrors['address.city'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.city']}</p>}
                    {showCitySuggestions && selectedState && (
                      <div className="absolute z-50 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {citiesLoading ? (
                          <div className="p-3 text-gray-400 text-sm">Cargando ciudades...</div>
                        ) : filteredCities.length ? (
                          filteredCities.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1a1a1a] transition"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedCity(city.id.toString());
                                setCityQuery(city.name);
                                updateAddressField('city', city.name);
                                setShowCitySuggestions(false);
                                setFieldErrors((s) => ({ ...s, 'address.city': undefined }));
                              }}
                            >
                              {city.name}
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-gray-400 text-sm">No se encontraron ciudades</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Detalles Adicionales</label>
                  <input value={form.address.additionalDetails} onChange={(e) => updateAddressField('additionalDetails', e.target.value)} placeholder="Ej. Edificio Torre Norte, Local 205" className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" />
                </div>
                {/* Address Preview - Always visible */}
                <div className="p-4 bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-[#FFD700]/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                    <label className="text-xs font-semibold text-[#FFD700] uppercase tracking-wider">Vista Previa de Dirección</label>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base text-white font-medium">
                      {form.address.streetType || '[Tipo Vía]'} {form.address.primaryNumber || '[#]'} # {form.address.secondaryNumber || '[#]'}{form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}
                    </p>
                    <p className="text-sm text-gray-400">
                      {form.address.city && form.address.state ? `${form.address.city}, ${form.address.state}` : form.address.city || form.address.state || '[Ciudad, Departamento]'}
                    </p>
                    {form.address.additionalDetails && (
                      <p className="text-xs text-gray-500 italic">{form.address.additionalDetails}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address removed: not required by DB */}

              <div className="flex items-center gap-4 pt-4">
                <button type="submit" className="flex-1 py-3 bg-[#FFD700] text-black font-semibold rounded-md hover:bg-[#FFC700] transition-colors">Create Location</button>
                <button type="button" onClick={() => closeCreateModal()} className="px-4 py-2 bg-[#141414] text-gray-300 font-medium rounded-md hover:bg-[#1b1b1b] transition-colors border border-[#333]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-6xl w-full p-8 shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Edit Location</h2>
                <p className="text-gray-400 text-sm">Update the location details below.</p>
              </div>
              <button type="button" onClick={() => closeEditModal()} className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <X size={24} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleUpdate(); }} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                    <input value={form.name} onChange={(e) => { updateForm('name', e.target.value); setFieldErrors((s) => ({ ...s, name: undefined })); }} placeholder="e.g. Main Warehouse - Site A" className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]" />
                    {fieldErrors.name && <p className="text-xs text-yellow-400 mt-1">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateForm('status', e.target.value as any)}
                      className="w-full h-12 px-4 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="available">Available</option>
                      <option value="full_capacity">Full Capacity</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              
              {/* Current Address Display */}
              {editing && (editing as any).address && (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-[#FFD700]" />
                    <h3 className="text-gray-300 font-semibold text-sm">Dirección Actual Registrada</h3>
                  </div>
                  <div className="text-gray-400 text-sm space-y-2">
                    {(editing as any).address.formatted && (
                      <p><span className="text-gray-500">Dirección:</span> <span className="text-white">{(editing as any).address.formatted}</span></p>
                    )}
                    {(editing as any).address.city && (editing as any).address.state && (
                      <p><span className="text-gray-500">Ubicación:</span> <span className="text-white">{(editing as any).address.city}, {(editing as any).address.state}</span></p>
                    )}
                    {((editing as any).address.additionalDetails || (editing as any).address.additionalInfo) && (
                      <p><span className="text-gray-500">Detalles:</span> <span className="text-white">{(editing as any).address.additionalDetails || (editing as any).address.additionalInfo}</span></p>
                    )}
                    {!(editing as any).address.formatted && !(editing as any).address.city && (
                      <div className="flex items-center gap-2 text-yellow-400 text-xs">
                        <Info size={14} />
                        <span>No hay dirección registrada para esta ubicación</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Address inputs - enhanced horizontal layout */}
              <div className="space-y-3">
                <h3 className="text-white font-semibold text-base">Actualizar Dirección</h3>
                <div className="flex gap-2">
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Tipo Vía *</label>
                    <select value={form.address.streetType} onChange={(e) => { updateAddressField('streetType', e.target.value); setFieldErrors((s) => ({ ...s, 'address.streetType': undefined })); }} className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]">
                      <option value="">Seleccionar</option>
                      <option value="Calle">Calle</option>
                      <option value="Carrera">Carrera</option>
                      <option value="Avenida">Avenida</option>
                      <option value="Diagonal">Diagonal</option>
                      <option value="Transversal">Transversal</option>
                    </select>
                    {fieldErrors['address.streetType'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.streetType']}</p>}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Número *</label>
                    <input 
                      type="text"
                      value={form.address.primaryNumber} 
                      onChange={(e) => { 
                        const value = e.target.value.replace(/\D/g, '');
                        updateAddressField('primaryNumber', value); 
                        setFieldErrors((s) => ({ ...s, 'address.primaryNumber': undefined })); 
                      }} 
                      placeholder="15" 
                      className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" 
                    />
                    {fieldErrors['address.primaryNumber'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.primaryNumber']}</p>}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Número 2 *</label>
                    <input 
                      type="text"
                      value={form.address.secondaryNumber} 
                      onChange={(e) => { 
                        const value = e.target.value.replace(/\D/g, '');
                        updateAddressField('secondaryNumber', value); 
                        setFieldErrors((s) => ({ ...s, 'address.secondaryNumber': undefined })); 
                      }} 
                      placeholder="93" 
                      className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" 
                    />
                    {fieldErrors['address.secondaryNumber'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.secondaryNumber']}</p>}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Número 3</label>
                    <input 
                      type="text"
                      value={form.address.complementaryNumber} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        updateAddressField('complementaryNumber', value);
                      }} 
                      placeholder="47" 
                      className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" 
                    />
                  </div>
                  {/* Departamento Autocomplete */}
                  <div className="flex-1 relative">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Departamento *</label>
                    <div className="relative">
                      <input
                        value={stateQuery}
                        onChange={(e) => {
                          setStateQuery(e.target.value);
                          setShowStateSuggestions(true);
                          setFieldErrors((s) => ({ ...s, 'address.state': undefined }));
                        }}
                        onFocus={() => {
                          setTimeout(() => setShowStateSuggestions(true), 100);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowStateSuggestions(false), 200);
                        }}
                        placeholder="Buscar departamento..."
                        className="w-full px-2 py-2 pr-8 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
                      />
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {fieldErrors['address.state'] && <p className="text-xs text-yellow-400 mt-1">{fieldErrors['address.state']}</p>}
                    {showStateSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                        {deptLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-400">Cargando...</div>
                        ) : deptError ? (
                          <div className="px-3 py-2 text-sm text-red-400">Error al cargar departamentos</div>
                        ) : filteredDepartments.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No se encontraron departamentos</div>
                        ) : (
                          filteredDepartments.map((dept) => (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => {
                                setStateQuery(dept.name);
                                setSelectedState(dept.id.toString());
                                updateAddressField('state', dept.name);
                                setShowStateSuggestions(false);
                                // Reset city when department changes
                                setCityQuery('');
                                setSelectedCity('');
                                updateAddressField('city', '');
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors"
                            >
                              {dept.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
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
                  <label className="block text-xs font-medium text-gray-300 mb-1">Detalles Adicionales</label>
                  <input value={form.address.additionalDetails} onChange={(e) => updateAddressField('additionalDetails', e.target.value)} placeholder="Ej. Edificio Torre Norte, Local 205" className="w-full px-2 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]" />
                </div>
                {/* Address Preview - Always visible */}
                <div className="p-4 bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-[#FFD700]/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                    <label className="text-xs font-semibold text-[#FFD700] uppercase tracking-wider">Vista Previa de Dirección</label>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base text-white font-medium">
                      {form.address.streetType || '[Tipo Vía]'} {form.address.primaryNumber || '[#]'} # {form.address.secondaryNumber || '[#]'}{form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}
                    </p>
                    <p className="text-sm text-gray-400">
                      {form.address.city && form.address.state ? `${form.address.city}, ${form.address.state}` : form.address.city || form.address.state || '[Ciudad, Departamento]'}
                    </p>
                    {form.address.additionalDetails && (
                      <p className="text-xs text-gray-500 italic">{form.address.additionalDetails}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors">Save changes</button>
                <button type="button" onClick={() => closeEditModal()} className="px-6 py-3 bg-[#1a1a1a] text-gray-300 font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportSettingsModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        module="locations"
        policy={LOCATIONS_POLICY}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
        allowedFormats={['xlsx']}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-2xl w-full p-8 shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Import Locations</h2>
                <p className="text-gray-400 text-sm">Upload a CSV file to import multiple locations at once</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }} 
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-6">
              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select CSV File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
                        showToast("error", "Please select a CSV file");
                        e.target.value = "";
                        return;
                      }
                      setImportFile(file);
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#FFD700] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#FFD700] file:text-black hover:file:bg-[#FFC107] file:cursor-pointer"
                />
                {importFile && (
                  <p className="text-sm text-green-400 mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-[#FFD700]" />
                  <h4 className="text-gray-300 font-semibold text-sm">Import Instructions</h4>
                </div>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• Use the "Export" button to download existing locations as Excel, then save as CSV for import</li>
                  <li>• CSV file must include headers in the first row</li>
                  <li>• Supported formats: Legacy format (name, country, state, city, street, propertyNumber) or full template format</li>
                  <li>• Status values: <strong>available</strong>, <strong>full</strong>, or <strong>maintenance</strong></li>
                  <li>• Empty rows will be skipped automatically</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC107] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Import Locations
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={importing}
                  className="px-6 py-3 bg-[#1a1a1a] text-gray-300 font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-[#333] rounded-[16px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#333] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Location Details</h2>
              <button 
                onClick={closePreviewModal} 
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-all"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
                <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                  <Info size={20} />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <p className="text-white text-base">{(previewing as any).name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                      (previewing as any).status === 'available' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      (previewing as any).status === 'full_capacity' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      (previewing as any).status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      (previewing as any).status === 'inactive' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {(previewing as any).status === 'available' ? 'Available' :
                       (previewing as any).status === 'full_capacity' ? 'Full Capacity' :
                       (previewing as any).status === 'maintenance' ? 'Maintenance' :
                       (previewing as any).status === 'inactive' ? 'Inactive' : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Active</label>
                    <p className="text-white text-base">
                      {(previewing as any).isActive !== undefined 
                        ? ((previewing as any).isActive ? 'Yes' : 'No')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Organization ID</label>
                    <p className="text-white text-base font-mono text-sm">{(previewing as any).organizationId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
                <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Address Information
                </h3>
                <div className="space-y-4">
                  {(previewing as any).address?.formatted && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Formatted Address</label>
                      <p className="text-white text-base">{(previewing as any).address.formatted}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Country</label>
                      <p className="text-white text-base">{(previewing as any).address?.country || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">State / Department</label>
                      <p className="text-white text-base">{(previewing as any).address?.state || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
                      <p className="text-white text-base">{(previewing as any).address?.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Street</label>
                      <p className="text-white text-base">{(previewing as any).address?.street || 'N/A'}</p>
                    </div>
                    {(previewing as any).address?.streetType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Street Type</label>
                        <p className="text-white text-base">{(previewing as any).address.streetType}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Property Number</label>
                      <p className="text-white text-base">{(previewing as any).address?.propertyNumber || 'N/A'}</p>
                    </div>
                    {(previewing as any).address?.primaryNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Primary Number</label>
                        <p className="text-white text-base">{(previewing as any).address.primaryNumber}</p>
                      </div>
                    )}
                    {(previewing as any).address?.secondaryNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Secondary Number</label>
                        <p className="text-white text-base">{(previewing as any).address.secondaryNumber}</p>
                      </div>
                    )}
                    {(previewing as any).address?.complementaryNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Complementary Number</label>
                        <p className="text-white text-base">{(previewing as any).address.complementaryNumber}</p>
                      </div>
                    )}
                  </div>
                  {((previewing as any).address?.additionalDetails || (previewing as any).address?.additionalInfo) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Additional Details</label>
                      <p className="text-white text-base">{(previewing as any).address.additionalDetails || (previewing as any).address.additionalInfo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
                <h3 className="text-lg font-semibold text-[#FFD700] mb-4">Timestamps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                    <p className="text-white text-base">
                      {(previewing as any).createdAt 
                        ? new Date((previewing as any).createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Updated At</label>
                    <p className="text-white text-base">
                      {(previewing as any).updatedAt 
                        ? new Date((previewing as any).updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-[#333] px-6 py-4 flex justify-end">
              <button 
                onClick={closePreviewModal} 
                className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#252525] transition-all font-medium"
              >
                Close
              </button>
            </div>
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
