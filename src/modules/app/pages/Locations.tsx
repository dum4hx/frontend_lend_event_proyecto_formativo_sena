import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Search, Plus, Edit2, Trash2, X, ChevronDown, Download, Upload, MapPin, Eye } from "lucide-react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import * as XLSX from 'xlsx';
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
import { usePermissions } from "../../../contexts/usePermissions";
import Unauthorized from "../../../../src/pages/Unauthorized";
import { useAuth } from "../../../contexts/useAuth";

// Colombia API types & fetcher
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

type LocationStatus = "available" | "full_capacity" | "maintenance" | "inactive";

interface LocationFormAddress {
  country: string;
  state: string;
  city: string;
  streetType: string;
  primaryNumber: string;
  secondaryNumber: string;
  complementaryNumber: string;
  additionalDetails: string;
}

interface LocationFormState {
  name: string;
  capacity: number;
  occupied: number;
  status: LocationStatus;
  address: LocationFormAddress;
}

/**
 * Calculate capacity percentage for location display
 */
const getCapacityPercentage = (occupied = 0, capacity = 0): number => {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((occupied / capacity) * 100));
};

/**
 * Get status color classes for location status badges
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case "available":
      return "bg-green-500/20 text-green-400";
    case "full_capacity":
      return "bg-red-500/20 text-red-400";
    case "maintenance":
      return "bg-yellow-500/20 text-yellow-400";
    case "inactive":
      return "bg-gray-500/20 text-gray-400";
    default:
      return "bg-blue-500/20 text-blue-400";
  }
};

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

  const initialForm: LocationFormState = {
    name: "",
    capacity: 0,
    occupied: 0,
    status: "available",
    address: {
      country: "Colombia",
      state: "",
      city: "",
      streetType: "",
      primaryNumber: "",
      secondaryNumber: "",
      complementaryNumber: "",
      additionalDetails: "",
    },
  };

  const [form, setForm] = useState<LocationFormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const { showToast } = useToast();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const updateForm = <K extends keyof Omit<LocationFormState, "address">>(
    k: K,
    v: LocationFormState[K],
  ) => setForm((s) => ({ ...s, [k]: v }));

  const updateAddressField = <K extends keyof LocationFormAddress>(
    k: K,
    v: LocationFormAddress[K],
  ) => setForm((s) => ({ ...s, address: { ...s.address, [k]: v } }));

  // Colombia API: Department & City autocomplete
  const [selectedState, setSelectedState] = useState<string>('');
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [stateQuery, setStateQuery] = useState("");
  const [debouncedStateQuery] = useDebounce(stateQuery, 200);

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  // Export/Import
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
      const responseData = res.data as { locations?: WarehouseLocation[]; items?: unknown[] };
      
      if (responseData.locations) {
        setLocations(responseData.locations);
      } else if (responseData.items) {
        const mapped = responseData.items.map((it: unknown) => {
          const item = it as Record<string, unknown>;
          return {
            _id: (item._id as string) ?? "",
            id: (item._id || item.id) as string,
            name: (item.name as string) ?? "",
            organizationId: (item.organizationId as string) ?? "",
            capacity: (item.capacity as number) ?? 0,
            occupied: (item.occupied as number) ?? 0,
            status: (item.status as string) ?? "available",
            address: item.address as Record<string, unknown>,
            isActive: (item.isActive as boolean) ?? true,
            createdAt: (item.createdAt as string) ?? "",
            updatedAt: (item.updatedAt as string) ?? "",
          } as WarehouseLocation;
        });
        setLocations(mapped);
      } else {
        setLocations([]);
      }
    } catch (err) {
      const error = err as Error;
      setError(error?.message ?? "Error fetching locations");
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
    setStateQuery('');
    setCityQuery('');
    setSelectedState('');
    setSelectedCity('');
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setStateQuery('');
    setCityQuery('');
    setSelectedState('');
    setSelectedCity('');
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditing(null);
    setForm(initialForm);
    setStateQuery('');
    setCityQuery('');
    setSelectedState('');
    setSelectedCity('');
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
  };

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!Number.isFinite(form.capacity) || form.capacity < 0) errs.capacity = 'Capacity must be >= 0';
    if (!Number.isFinite(form.occupied) || form.occupied < 0) errs.occupied = 'Occupied must be >= 0';
    if (!form.address?.country || !form.address.country.trim()) errs['address.country'] = 'Country is required';
    if (!form.address?.state || !form.address.state.trim()) errs['address.state'] = 'State is required';
    if (!form.address?.city || !form.address.city.trim()) errs['address.city'] = 'City is required';
    if (!form.address?.streetType || !form.address.streetType.trim()) errs['address.streetType'] = 'Street type is required';
    if (!form.address?.primaryNumber || !form.address.primaryNumber.trim()) errs['address.primaryNumber'] = 'Primary number is required';
    if (!form.address?.secondaryNumber || !form.address.secondaryNumber.trim()) errs['address.secondaryNumber'] = 'Secondary number is required';
    if (form.occupied > form.capacity) errs.occupied = 'Occupied cannot be greater than capacity';
    
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast("warning", "Please fix the form fields");
      return;
    }
    
    // Build street address from Colombian format
    const formattedStreet = `${form.address.streetType} ${form.address.primaryNumber} #${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    const propertyNumber = `${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    
    try {
      await apiCreateLocation({
        name: form.name,
        status: form.status,
        organizationId: user?.organizationId ?? "",
        address: {
          country: form.address.country,
          state: form.address.state,
          city: form.address.city,
          street: formattedStreet,
          propertyNumber: propertyNumber,
          additionalInfo: form.address.additionalDetails || "",
        },
      } as Parameters<typeof apiCreateLocation>[0]);
      setShowCreateModal(false);
      showToast('success', 'Location created');
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message ?? "Error creating location");
    }
  };

  const openEdit = (loc: WarehouseLocation) => {
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
    setEditing(loc);
    
    const locationData = loc as unknown as Record<string, unknown>;
    const locationAddress = (locationData.address as Record<string, unknown>) || {};
    
    const existingState = (locationAddress.state as string) || "";
    const existingCity = (locationAddress.city as string) || "";
    
    setStateQuery(existingState);
    setCityQuery(existingCity);
    
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
    
    // Extract address components - prefer existing fields, fallback to parsing street
    let streetType = (locationAddress.streetType as string) || "";
    let primaryNumber = (locationAddress.primaryNumber as string) || "";
    let secondaryNumber = (locationAddress.secondaryNumber as string) || "";
    let complementaryNumber = (locationAddress.complementaryNumber as string) || "";
    
    // If components are empty but street exists, try to parse it
    if (!streetType && !primaryNumber && !secondaryNumber) {
      const street = (locationAddress.street as string) || "";
      if (street) {
        // Parse Colombian address format: "Calle 123 #45-67"
        const match = street.match(/^([A-Za-záéíóúÁÉÍÓÚñÑ]+)\s+(\d+)\s*#\s*(\d+)(?:-(\d+))?/);
        if (match) {
          streetType = match[1];
          primaryNumber = match[2];
          secondaryNumber = match[3];
          complementaryNumber = match[4] || "";
        }
      }
    }
    
    setForm({
      name: (locationData.name as string) || "",
      capacity: (locationData.capacity as number) ?? 0,
      occupied: (locationData.occupied as number) ?? 0,
      status: (locationData.status as LocationStatus) ?? "available",
      address: {
        country: (locationAddress.country as string) || "Colombia",
        state: (locationAddress.state as string) || "",
        city: (locationAddress.city as string) || "",
        streetType: streetType,
        primaryNumber: primaryNumber,
        secondaryNumber: secondaryNumber,
        complementaryNumber: complementaryNumber,
        additionalDetails: (locationAddress.additionalDetails as string) || (locationAddress.additionalInfo as string) || "",
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
    if (!Number.isFinite(form.capacity) || form.capacity < 0) errs.capacity = 'Capacity must be >= 0';
    if (!Number.isFinite(form.occupied) || form.occupied < 0) errs.occupied = 'Occupied must be >= 0';
    if (!form.address?.country || !form.address.country.trim()) errs['address.country'] = 'Country is required';
    if (!form.address?.state || !form.address.state.trim()) errs['address.state'] = 'State is required';
    if (!form.address?.city || !form.address.city.trim()) errs['address.city'] = 'City is required';
    if (!form.address?.streetType || !form.address.streetType.trim()) errs['address.streetType'] = 'Street type is required';
    if (!form.address?.primaryNumber || !form.address.primaryNumber.trim()) errs['address.primaryNumber'] = 'Primary number is required';
    if (!form.address?.secondaryNumber || !form.address.secondaryNumber.trim()) errs['address.secondaryNumber'] = 'Secondary number is required';
    if (form.occupied > form.capacity) errs.occupied = 'Occupied cannot be greater than capacity';
    
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast("warning", "Please fix the form fields");
      return;
    }
    
    // Build street address from Colombian format
    const formattedStreet = `${form.address.streetType} ${form.address.primaryNumber} #${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    const propertyNumber = `${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ''}`;
    
    try {
      await apiUpdateLocation(editing.id, {
        name: form.name,
        status: form.status,
        organizationId: user?.organizationId ?? "",
        address: {
          country: form.address.country,
          state: form.address.state,
          city: form.address.city,
          street: formattedStreet,
          propertyNumber: propertyNumber,
          streetType: form.address.streetType || undefined,
          primaryNumber: form.address.primaryNumber || undefined,
          secondaryNumber: form.address.secondaryNumber || undefined,
          complementaryNumber: form.address.complementaryNumber || undefined,
          additionalInfo: form.address.additionalDetails || undefined,
          additionalDetails: form.address.additionalDetails || undefined,
        },
      } as Parameters<typeof apiUpdateLocation>[1]);
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
    (loc) => {
      const locationData = loc as unknown as Record<string, unknown>;
      const name = (locationData.name as string) ?? "";
      const address = (locationData.address as Record<string, unknown>) || {};
      const street = (address.street as string) ?? "";
      const city = (address.city as string) ?? "";
      
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             street.toLowerCase().includes(searchTerm.toLowerCase()) ||
             city.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  // Export functionality
  const buildExportRows = useCallback(
    (locs: WarehouseLocation[]) => {
      return locs.map((loc) => {
        const locationData = loc as unknown as Record<string, unknown>;
        const address = (locationData.address as Record<string, unknown>) || {};
        
        return {
          Name: (locationData.name as string) || "",
          Status: (locationData.status as string) || "active",
          "Street Type": (address.streetType as string) || "",
          "Primary Number": (address.primaryNumber as string) || "",
          "Secondary Number": (address.secondaryNumber as string) || "",
          "Complementary Number": (address.complementaryNumber as string) || "",
          State: (address.state as string) || "",
          City: (address.city as string) || "",
          "Additional Details": (address.additionalDetails as string) || "",
          "Formatted Address": (address.formatted as string) || "",
        };
      });
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
      } catch (err) {
        const error = err as Error;
        if (error.name !== "AbortError") {
          showToast("error", error?.message || "Export failed");
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

  // Import functionality
  const handleImport = async () => {
    if (!importFile) {
      showToast("warning", "Please select a file to import");
      return;
    }

    setImporting(true);
    try {
      const fileExtension = importFile.name.toLowerCase().split('.').pop();
      const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
      
      let headers: string[] = [];
      let rows: string[][] = [];
      
      if (isExcel) {
        // Handle Excel files
        const arrayBuffer = await importFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (data.length < 2) {
          showToast("error", "File is empty or invalid. Please use the template.");
          setImporting(false);
          return;
        }
        
        headers = data[0].map(h => String(h || ''));
        rows = data.slice(1).map(row => 
          headers.map((_, idx) => String(row[idx] || ''))
        );
      } else {
        // Handle CSV files
        const text = await importFile.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          showToast("error", "File is empty or invalid. Please use the template.");
          setImporting(false);
          return;
        }

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"' && inQuotes && nextChar === '"') {
              current += '"';
              i++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        headers = parseCSVLine(lines[0]);
        rows = lines.slice(1).map(line => parseCSVLine(line));
      }
      
      const isLegacyFormat = headers.includes("name") && headers.includes("organizationId");
      const isTemplateFormat = headers[0] === "Name" && headers[1] === "Street Type";
      
      if (!isLegacyFormat && !isTemplateFormat) {
        showToast("error", "Invalid file format. Headers not recognized.");
        setImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        if (row.length < 3 || !row[0]?.trim()) continue;

        try {
          let locationData: Parameters<typeof apiCreateLocation>[0];

          if (isLegacyFormat) {
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
        } catch (err) {
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
    } catch (err) {
      const error = err as Error;
      showToast("error", error?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export/Import Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Warehouse Locations</h1>
          <p className="text-gray-400">Manage warehouse zones and storage locations</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setExportOpen(true)}
            className="export-btn flex items-center gap-2"
          >
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-lg hover:bg-[#222] hover:border-[#444] hover:text-white transition-all"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Locations</p>
          <p className="text-white text-2xl font-bold">{locations.length}</p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Capacity</p>
          <p className="text-white text-2xl font-bold">{locations.reduce((s, l) => s + (l.capacity ?? 0), 0)}</p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Occupied</p>
          <p className="text-white text-2xl font-bold">{locations.reduce((s, l) => s + (l.occupied ?? 0), 0)}</p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Utilization</p>
          <p className="text-white text-2xl font-bold">
            {locations.length > 0 
              ? Math.round((locations.reduce((s, l) => s + (l.occupied ?? 0), 0) / Math.max(1, locations.reduce((s, l) => s + (l.capacity ?? 1), 1))) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <div className="text-gray-400">Loading locations...</div>}
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
                  <h3 className="text-xl font-bold text-white">{location.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {((location.address as Record<string, unknown>)?.city as string) || 'N/A'} • {((location.address as Record<string, unknown>)?.street as string) || 'N/A'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(location.status)}`}>
                  {location.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Capacity Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Capacity</p>
                  <p className="text-white font-semibold text-sm">
                    {location.occupied}/{location.capacity} ({capacityPercent}%)
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
                  {Math.max(0, location.capacity - location.occupied)} units
                </p>
              </div>

              {/* Additional Details */}
              {((location.address as Record<string, unknown>)?.additionalDetails as string) && (
                <div className="bg-[#1a1a1a] rounded-lg p-3 mb-4">
                  <p className="text-gray-400 text-xs mb-1">Additional Details</p>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {((location.address as Record<string, unknown>)?.additionalDetails as string)}
                  </p>
                </div>
              )}

              {/* Actions - Icon buttons only */}
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => openPreview(location as WarehouseLocation)} 
                  className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-blue-400 transition"
                  title="View location details"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => openEdit(location as WarehouseLocation)} 
                  className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-[#FFD700] transition"
                  title="Edit location"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => void handleDelete(location.id)} 
                  className="w-8 h-8 rounded-lg bg-red-900/20 hover:bg-red-900/40 flex items-center justify-center text-red-400 transition"
                  title="Delete location"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLocations.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-400 text-lg mb-2">No locations found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or create a new location</p>
        </div>
      )}

      {/* Create Modal - Full Horizontal Layout */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-6xl w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Create Location</h2>
                <p className="text-gray-400 text-sm">Add a new warehouse location to your inventory</p>
              </div>
              <button 
                onClick={closeCreateModal}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); void handleCreate(); }} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => { updateForm('name', e.target.value); setFieldErrors((s) => ({ ...s, name: undefined })); }}
                      placeholder="e.g. Main Warehouse A"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
                  </div>
                </div>
              </div>

              {/* Capacity & Status - 3 columns */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Capacity & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Capacity *</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => { updateForm('capacity', Number(e.target.value)); setFieldErrors((s) => ({ ...s, capacity: undefined })); }}
                      placeholder="0"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors.capacity && <p className="text-xs text-red-400 mt-1">{fieldErrors.capacity}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Occupied *</label>
                    <input
                      type="number"
                      value={form.occupied}
                      onChange={(e) => { updateForm('occupied', Number(e.target.value)); setFieldErrors((s) => ({ ...s, occupied: undefined })); }}
                      placeholder="0"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors.occupied && <p className="text-xs text-red-400 mt-1">{fieldErrors.occupied}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateForm('status', e.target.value as LocationStatus)}
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="available">Available</option>
                      <option value="full_capacity">Full Capacity</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information - Full Width with Autocomplete */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Address Information</h3>
                
                {/* Country & Department Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                    <input
                      value={form.address.country}
                      onChange={(e) => { updateAddressField('country', e.target.value); setFieldErrors((s) => ({ ...s, 'address.country': undefined })); }}
                      placeholder="Colombia"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors['address.country'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.country']}</p>}
                  </div>

                  {/* Department Autocomplete */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                    <div className="relative">
                      <input
                        value={stateQuery}
                        onChange={(e) => {
                          setStateQuery(e.target.value);
                          setShowStateSuggestions(true);
                          updateAddressField('state', e.target.value);
                          setFieldErrors((s) => ({ ...s, 'address.state': undefined }));
                        }}
                        onFocus={() => setShowStateSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                        placeholder="Search department..."
                        className="w-full h-11 px-3 pr-10 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {fieldErrors['address.state'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.state']}</p>}
                    
                    {showStateSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                        {deptLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-400">Loading departments...</div>
                        ) : deptError ? (
                          <div className="px-3 py-2 text-sm text-red-400">Error loading departments</div>
                        ) : filteredDepartments.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No departments found</div>
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
                </div>

                {/* City Row */}
                <div className="grid grid-cols-1 mb-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                    <div className="relative">
                      <input
                        value={cityQuery}
                        onChange={(e) => {
                          setCityQuery(e.target.value);
                          setShowCitySuggestions(true);
                          updateAddressField('city', e.target.value);
                          setFieldErrors((s) => ({ ...s, 'address.city': undefined }));
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                        disabled={!selectedState}
                        placeholder={selectedState ? "Search city..." : "Select department first"}
                        className="w-full h-11 px-3 pr-10 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {fieldErrors['address.city'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.city']}</p>}
                    
                    {showCitySuggestions && selectedState && (
                      <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                        {citiesLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-400">Loading cities...</div>
                        ) : citiesError ? (
                          <div className="px-3 py-2 text-sm text-red-400">Error loading cities</div>
                        ) : filteredCities.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No cities found</div>
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

                {/* Street Details - 4 columns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Street Type *</label>
                    <select
                      value={form.address.streetType}
                      onChange={(e) => { updateAddressField('streetType', e.target.value); setFieldErrors((s) => ({ ...s, 'address.streetType': undefined })); }}
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="">Select type</option>
                      <option value="Calle">Calle</option>
                      <option value="Carrera">Carrera</option>
                      <option value="Avenida">Avenida</option>
                      <option value="Diagonal">Diagonal</option>
                      <option value="Transversal">Transversal</option>
                    </select>
                    {fieldErrors['address.streetType'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.streetType']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Number *</label>
                    <input
                      value={form.address.primaryNumber}
                      onChange={(e) => { updateAddressField('primaryNumber', e.target.value); setFieldErrors((s) => ({ ...s, 'address.primaryNumber': undefined })); }}
                      placeholder="e.g. 123"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors['address.primaryNumber'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.primaryNumber']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Number *</label>
                    <input
                      value={form.address.secondaryNumber}
                      onChange={(e) => { updateAddressField('secondaryNumber', e.target.value); setFieldErrors((s) => ({ ...s, 'address.secondaryNumber': undefined })); }}
                      placeholder="e.g. 45"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors['address.secondaryNumber'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.secondaryNumber']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Complementary</label>
                    <input
                      value={form.address.complementaryNumber}
                      onChange={(e) => updateAddressField('complementaryNumber', e.target.value)}
                      placeholder="e.g. 67"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                  </div>
                </div>

                {/* Additional Details - Single field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Details</label>
                  <input
                    value={form.address.additionalDetails}
                    onChange={(e) => updateAddressField('additionalDetails', e.target.value)}
                    placeholder="e.g. Near main entrance"
                    className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#333]">
                <button 
                  type="button" 
                  onClick={closeCreateModal} 
                  className="px-6 py-3 bg-[#1a1a1a] text-gray-300 font-medium rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors"
                >
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - Same Horizontal Layout */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-6xl w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Location</h2>
                <p className="text-gray-400 text-sm">Update location details</p>
              </div>
              <button 
                onClick={closeEditModal}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); void handleUpdate(); }} className="space-y-6">
              {/* Same layout as Create Modal but with edit values */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => { updateForm('name', e.target.value); setFieldErrors((s) => ({ ...s, name: undefined })); }}
                      placeholder="e.g. Main Warehouse A"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
                  </div>
                </div>
              </div>

              {/* Capacity & Status - 3 columns */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Capacity & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Capacity *</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => { updateForm('capacity', Number(e.target.value)); setFieldErrors((s) => ({ ...s, capacity: undefined })); }}
                      placeholder="0"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors.capacity && <p className="text-xs text-red-400 mt-1">{fieldErrors.capacity}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Occupied *</label>
                    <input
                      type="number"
                      value={form.occupied}
                      onChange={(e) => { updateForm('occupied', Number(e.target.value)); setFieldErrors((s) => ({ ...s, occupied: undefined })); }}
                      placeholder="0"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors.occupied && <p className="text-xs text-red-400 mt-1">{fieldErrors.occupied}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateForm('status', e.target.value as LocationStatus)}
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="available">Available</option>
                      <option value="full_capacity">Full Capacity</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information - Full Width with Autocomplete */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Address Information</h3>
                
                {/* Country & Department Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                    <input
                      value={form.address.country}
                      onChange={(e) => { updateAddressField('country', e.target.value); setFieldErrors((s) => ({ ...s, 'address.country': undefined })); }}
                      placeholder="Colombia"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors['address.country'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.country']}</p>}
                  </div>

                  {/* Department Autocomplete */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                    <div className="relative">
                      <input
                        value={stateQuery}
                        onChange={(e) => {
                          setStateQuery(e.target.value);
                          setShowStateSuggestions(true);
                          updateAddressField('state', e.target.value);
                          setFieldErrors((s) => ({ ...s, 'address.state': undefined }));
                        }}
                        onFocus={() => setShowStateSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                        placeholder="Search department..."
                        className="w-full h-11 px-3 pr-10 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {fieldErrors['address.state'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.state']}</p>}
                    
                    {showStateSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                        {deptLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-400">Loading departments...</div>
                        ) : deptError ? (
                          <div className="px-3 py-2 text-sm text-red-400">Error loading departments</div>
                        ) : filteredDepartments.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No departments found</div>
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
                </div>

                {/* City Row */}
                <div className="grid grid-cols-1 mb-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                    <div className="relative">
                      <input
                        value={cityQuery}
                        onChange={(e) => {
                          setCityQuery(e.target.value);
                          setShowCitySuggestions(true);
                          updateAddressField('city', e.target.value);
                          setFieldErrors((s) => ({ ...s, 'address.city': undefined }));
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                        disabled={!selectedState}
                        placeholder={selectedState ? "Search city..." : "Select department first"}
                        className="w-full h-11 px-3 pr-10 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {fieldErrors['address.city'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.city']}</p>}
                    
                    {showCitySuggestions && selectedState && (
                      <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                        {citiesLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-400">Loading cities...</div>
                        ) : citiesError ? (
                          <div className="px-3 py-2 text-sm text-red-400">Error loading cities</div>
                        ) : filteredCities.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No cities found</div>
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

                {/* Street Details - 4 columns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Street Type *</label>
                    <select
                      value={form.address.streetType}
                      onChange={(e) => { updateAddressField('streetType', e.target.value); setFieldErrors((s) => ({ ...s, 'address.streetType': undefined })); }}
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="">Select type</option>
                      <option value="Calle">Calle</option>
                      <option value="Carrera">Carrera</option>
                      <option value="Avenida">Avenida</option>
                      <option value="Diagonal">Diagonal</option>
                      <option value="Transversal">Transversal</option>
                    </select>
                    {fieldErrors['address.streetType'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.streetType']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Number *</label>
                    <input
                      value={form.address.primaryNumber}
                      onChange={(e) => { updateAddressField('primaryNumber', e.target.value); setFieldErrors((s) => ({ ...s, 'address.primaryNumber': undefined })); }}
                      placeholder="e.g. 123"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors['address.primaryNumber'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.primaryNumber']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Number *</label>
                    <input
                      value={form.address.secondaryNumber}
                      onChange={(e) => { updateAddressField('secondaryNumber', e.target.value); setFieldErrors((s) => ({ ...s, 'address.secondaryNumber': undefined })); }}
                      placeholder="e.g. 45"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    {fieldErrors['address.secondaryNumber'] && <p className="text-xs text-red-400 mt-1">{fieldErrors['address.secondaryNumber']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Complementary</label>
                    <input
                      value={form.address.complementaryNumber}
                      onChange={(e) => updateAddressField('complementaryNumber', e.target.value)}
                      placeholder="e.g. 67"
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                  </div>
                </div>

                {/* Additional Details - Single field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Details</label>
                  <input
                    value={form.address.additionalDetails}
                    onChange={(e) => updateAddressField('additionalDetails', e.target.value)}
                    placeholder="e.g. Near main entrance"
                    className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#333]">
                <button 
                  type="button" 
                  onClick={closeEditModal} 
                  className="px-6 py-3 bg-[#1a1a1a] text-gray-300 font-medium rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-3xl w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Location Details</h2>
              <button 
                onClick={closePreviewModal} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Location Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Basic Information */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-white font-medium">{previewing.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      previewing.status === 'available' ? 'bg-green-900/30 text-green-400' :
                      previewing.status === 'full' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {previewing.status.charAt(0).toUpperCase() + previewing.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity Information */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Capacity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total Capacity</span>
                    <span className="text-white font-bold text-lg">{previewing.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Occupied</span>
                    <span className="text-white font-bold text-lg">{previewing.occupied}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Available</span>
                    <span className="text-green-400 font-bold text-lg">{Math.max(0, previewing.capacity - previewing.occupied)}</span>
                  </div>
                  <div className="pt-3 border-t border-[#333]">
                    <p className="text-xs text-gray-500 mb-2">Utilization</p>
                    <div className="w-full bg-[#111] rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all" 
                        style={{ width: `${Math.min(100, (previewing.occupied / Math.max(1, previewing.capacity)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {previewing.capacity > 0 ? Math.round((previewing.occupied / previewing.capacity) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333] mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Address</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="text-white">{previewing.address?.country || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">State/Department</p>
                    <p className="text-white">{previewing.address?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">City</p>
                    <p className="text-white">{previewing.address?.city || 'N/A'}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#333]">
                  <p className="text-xs text-gray-500 mb-1">Street Address</p>
                  <p className="text-white">
                    {previewing.address?.street || 
                     (previewing.address?.streetType && previewing.address?.primaryNumber && previewing.address?.secondaryNumber
                       ? `${previewing.address.streetType} ${previewing.address.primaryNumber} #${previewing.address.secondaryNumber}${previewing.address.complementaryNumber ? `-${previewing.address.complementaryNumber}` : ''}`
                       : 'N/A')}
                  </p>
                </div>
                {previewing.address?.additionalDetails && (
                  <div className="pt-3 border-t border-[#333]">
                    <p className="text-xs text-gray-500 mb-1">Additional Details</p>
                    <p className="text-gray-300 text-sm">{previewing.address.additionalDetails}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#333]">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-gray-300 text-sm">
                  {previewing.createdAt ? new Date(previewing.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-gray-300 text-sm">
                  {previewing.updatedAt ? new Date(previewing.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-[#333]">
              <button 
                onClick={closePreviewModal} 
                className="px-6 py-2 bg-[#1a1a1a] text-gray-300 font-medium rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Settings Modal */}
      <ExportSettingsModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        module="locations"
        policy={LOCATIONS_POLICY}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-[#333] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Import Locations</h2>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-gray-400 hover:text-white transition"
                disabled={importing}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Upload a CSV or Excel file (.csv, .xlsx, .xls) with location data.
                The file should contain the following columns:
              </p>
              
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#333]">
                <p className="text-xs text-gray-500 mb-2">Required Columns:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Name</li>
                  <li>• Street Type</li>
                  <li>• Primary Number</li>
                  <li>• Secondary Number</li>
                  <li>• Complementary Number (optional)</li>
                  <li>• State</li>
                  <li>• City</li>
                  <li>• Additional Details (optional)</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                  disabled={importing}
                />
                {importFile && (
                  <p className="text-xs text-gray-400 mt-2">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? "Importing..." : "Import"}
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={importing}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] text-gray-300 font-medium rounded-lg hover:bg-[#222] transition-colors border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
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
