import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  Download,
  Upload,
  MapPin,
  Eye,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import * as XLSX from "xlsx";
import {
  getLocations as getApiLocations,
  deleteLocation as apiDeleteLocation,
  createLocation as apiCreateLocation,
  updateLocation as apiUpdateLocation,
} from "../../../services/warehouseOperatorService";
import type {
  WarehouseLocation,
  LocationCreatePayload,
} from "../../../services/warehouseOperatorService";
import { getMaterialTypes, getMaterialCategories } from "../../../services/materialService";
import type { MaterialType, MaterialCategory } from "../../../types/api";
import { ConfirmDialog } from "../../../components/ui";
import { useToast } from "../../../contexts/ToastContext";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, LOCATIONS_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
import { usePermissions } from "../../../contexts/usePermissions";
import Unauthorized from "../../../../src/pages/Unauthorized";
import { useAuth } from "../../../contexts/useAuth";
import { validateLocationV2 } from "../../../utils/validators";

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

interface MaterialCapacityForm {
  materialTypeId: string;
  maxQuantity: number | "";
}

interface LocationFormAddress {
  country: string;
  state: string;
  city: string;
  street: string;
  propertyNumber: string;
  streetType?: string;
  primaryNumber?: string;
  secondaryNumber?: string;
  complementaryNumber?: string;
  additionalInfo: string;
}

interface LocationFormState {
  name: string;
  address: LocationFormAddress;
  materialCapacities: MaterialCapacityForm[];
}

/**
 * Get capacity percentage for visual indicator
 */
const getCapacityPercentage = (occupied: number, total: number): number => {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((occupied / total) * 100));
};

/**
 * Get status color classes for location status badges
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case "available":
      return "bg-green-500/20 text-green-400";
    case "full":
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
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<WarehouseLocation | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewing, setPreviewing] = useState<WarehouseLocation | null>(null);

  // Pagination for material capacities in modal
  const [materialPage, setMaterialPage] = useState(1);
  const ITEMS_PER_MODAL_PAGE = 5;

  const initialForm: LocationFormState = {
    name: "",
    address: {
      country: "Colombia",
      state: "",
      city: "",
      street: "",
      propertyNumber: "",
      streetType: "",
      primaryNumber: "",
      secondaryNumber: "",
      complementaryNumber: "",
      additionalInfo: "",
    },
    materialCapacities: [],
  };

  const [form, setForm] = useState<LocationFormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const { showToast } = useToast();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkConfirmPending, setBulkConfirmPending] = useState<{
    val: number;
    categoryId?: string;
  } | null>(null);
  const [bulkQtyInput, setBulkQtyInput] = useState("");

  const updateForm = <K extends keyof Omit<LocationFormState, "address" | "materialCapacities">>(
    k: K,
    v: LocationFormState[K],
  ) => setForm((s) => ({ ...s, [k]: v }));

  const updateAddressField = <K extends keyof LocationFormAddress>(
    k: K,
    v: LocationFormAddress[K],
  ) => setForm((s) => ({ ...s, address: { ...s.address, [k]: v } }));

  const updateCapacity = (id: string, val: string | number) => {
    setForm((s) => ({
      ...s,
      materialCapacities: s.materialCapacities.map((c) =>
        c.materialTypeId === id ? { ...c, maxQuantity: val === "" ? "" : Number(val) } : c,
      ),
    }));
    if (val !== "") {
      setFieldErrors((s) => ({ ...s, [`capacity_${id}`]: undefined }));
    }
  };

  // Colombia API: Department & City autocomplete
  const [selectedState, setSelectedState] = useState<string>("");
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [stateQuery, setStateQuery] = useState("");
  const [debouncedStateQuery] = useDebounce(stateQuery, 200);

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

  // Load setup data
  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const [typesRes, catsRes] = await Promise.all([
          getMaterialTypes({ limit: 100 }),
          getMaterialCategories(),
        ]);
        setMaterialTypes(typesRes.data.materialTypes || []);
        setCategories(catsRes.data.categories || []);
      } catch (err) {
        console.error("Error loading setup data:", err);
      }
    };
    void loadSetupData();
  }, []);

  // SWR: load all departments once, then filter client-side
  const { data: departments, isLoading: deptLoading } = useSWR<ColombiaDepartment[]>(
    "https://api-colombia.com/api/v1/Department",
    colombiaFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    },
  );

  // SWR: fetch cities for the selected department
  const { data: stateCities, isLoading: citiesLoading } = useSWR<ColombiaCity[]>(
    selectedState ? `https://api-colombia.com/api/v1/Department/${selectedState}/cities` : null,
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  // Normalize text: remove accents/tildes for accent-insensitive matching
  const normalize = useCallback((s: string | undefined | null): string => {
    if (!s) return "";
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }, []);

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
    const prefixCityMatches = stateCities.filter(
      (c) => c?.name && normalize(c.name).startsWith(normalizedCityQuery),
    );
    if (prefixCityMatches.length) return prefixCityMatches;
    return stateCities.filter((c) => c?.name && normalize(c.name).includes(normalizedCityQuery));
  }, [stateCities, cityQuery, normalize]);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApiLocations({ page: 1, limit: 100 });
      const responseData = res.data;

      if (responseData.items) {
        setLocations(responseData.items);
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

  const paginatedMaterials = useMemo(() => {
    const start = (materialPage - 1) * ITEMS_PER_MODAL_PAGE;
    return materialTypes.slice(start, start + ITEMS_PER_MODAL_PAGE);
  }, [materialTypes, materialPage]);

  const totalMaterialPages = Math.ceil(materialTypes.length / ITEMS_PER_MODAL_PAGE);

  // Export functionality
  const buildExportRows = useCallback((locs: WarehouseLocation[]) => {
    return locs.map((loc) => {
      const address =
        (loc.address as {
          street?: string;
          propertyNumber?: string;
          state?: string;
          city?: string;
          additionalInfo?: string;
        }) || {};
      return {
        Name: loc.name || "",
        Status: loc.isActive ? "active" : "inactive",
        Street: address.street || "",
        "Property Number": address.propertyNumber || "",
        State: address.state || "",
        City: address.city || "",
        "Additional Info": address.additionalInfo || "",
      };
    });
  }, []);

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
      showToast("success", "Location deleted");
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
      materialCapacities: materialTypes.map((t) => ({ materialTypeId: t._id, maxQuantity: "" })),
    });
    setStateQuery("");
    setCityQuery("");
    setSelectedState("");
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
    setMaterialPage(1);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setStateQuery("");
    setCityQuery("");
    setSelectedState("");
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditing(null);
    setForm(initialForm);
    setStateQuery("");
    setCityQuery("");
    setSelectedState("");
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
  };

  const doApplyBulkCapacity = (val: number, categoryId?: string, fillEmptyOnly = false) => {
    setForm((s) => ({
      ...s,
      materialCapacities: s.materialCapacities.map((c) => {
        const isTarget =
          !categoryId ||
          materialTypes.find((t) => t._id === c.materialTypeId)?.categoryId === categoryId;
        if (!isTarget) return c;
        if (fillEmptyOnly && c.maxQuantity !== "") return c;
        return { ...c, maxQuantity: val };
      }),
    }));
    if (!fillEmptyOnly) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k.startsWith("capacity_")) delete next[k];
        });
        return next;
      });
    }
    showToast("success", "Bulk capacity applied");
  };

  const applyBulkCapacity = (val: number, categoryId?: string) => {
    if (val < 0 || isNaN(val)) {
      showToast("warning", "Please provide a valid non-negative number");
      return;
    }
    setBulkConfirmPending({ val, categoryId });
  };

  const handleCreate = async () => {
    const formattedStreet = form.address.streetType
      ? `${form.address.streetType} ${form.address.primaryNumber} #${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ""}`
      : form.address.street;

    const propertyNum =
      form.address.propertyNumber ||
      `${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ""}`;

    const validation = validateLocationV2({
      name: form.name,
      address: {
        country: form.address.country,
        state: form.address.state,
        city: form.address.city,
        street: formattedStreet,
        propertyNumber: propertyNum,
        additionalInfo: form.address.additionalInfo,
      },
      materialCapacities: form.materialCapacities,
    });

    if (!validation.isValid || !form.address.state.trim()) {
      const capErrors: Record<string, string> = {};
      form.materialCapacities.forEach((c) => {
        if (c.maxQuantity === "") capErrors[`capacity_${c.materialTypeId}`] = "Required";
      });
      const stateError = !form.address.state.trim()
        ? { "address.state": "Department is required" }
        : {};
      setFieldErrors({ ...validation.errors, ...capErrors, ...stateError });
      showToast("warning", "Please fill all required fields");
      return;
    }

    try {
      await apiCreateLocation({
        name: form.name,
        organizationId: user?.organizationId ?? "",
        address: {
          country: form.address.country,
          state: form.address.state,
          city: form.address.city,
          street: formattedStreet,
          propertyNumber: propertyNum,
          additionalInfo: form.address.additionalInfo,
        },
        materialCapacities: form.materialCapacities.map((c) => ({
          materialTypeId: c.materialTypeId,
          maxQuantity: Number(c.maxQuantity),
        })),
      });
      setShowCreateModal(false);
      showToast("success", "Location created");
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

    const address =
      (loc.address as {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        propertyNumber?: string;
        streetType?: string;
        primaryNumber?: string;
        secondaryNumber?: string;
        complementaryNumber?: string;
        additionalInfo?: string;
        additionalDetails?: string;
      }) || {};

    setStateQuery(address.state || "");
    setCityQuery(address.city || "");

    if (address.state && departments) {
      const dept = departments.find((d) => d.name === address.state);
      if (dept) setSelectedState(dept.id.toString());
    }

    // Material capacities mapping
    const caps: MaterialCapacityForm[] = materialTypes.map((t) => {
      const existing = (
        loc.materialCapacities as { materialTypeId: string; maxQuantity: number }[]
      )?.find((c) => c.materialTypeId === t._id);
      return {
        materialTypeId: t._id,
        maxQuantity: existing ? existing.maxQuantity : "",
      };
    });

    setForm({
      name: loc.name || "",
      address: {
        country: address.country || "Colombia",
        state: address.state || "",
        city: address.city || "",
        street: address.street || "",
        propertyNumber: address.propertyNumber || "",
        streetType: address.streetType || "",
        primaryNumber: address.primaryNumber || "",
        secondaryNumber: address.secondaryNumber || "",
        complementaryNumber: address.complementaryNumber || "",
        additionalInfo: address.additionalInfo || address.additionalDetails || "",
      },
      materialCapacities: caps,
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

    const formattedStreet = form.address.streetType
      ? `${form.address.streetType} ${form.address.primaryNumber} #${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ""}`
      : form.address.street;

    const propertyNum =
      form.address.propertyNumber ||
      `${form.address.secondaryNumber}${form.address.complementaryNumber ? `-${form.address.complementaryNumber}` : ""}`;

    const validation = validateLocationV2({
      name: form.name,
      address: {
        country: form.address.country,
        state: form.address.state,
        city: form.address.city,
        street: formattedStreet,
        propertyNumber: propertyNum,
        additionalInfo: form.address.additionalInfo,
      },
      materialCapacities: form.materialCapacities,
    });

    if (!validation.isValid || !form.address.state.trim()) {
      const capErrors: Record<string, string> = {};
      form.materialCapacities.forEach((c) => {
        if (c.maxQuantity === "") capErrors[`capacity_${c.materialTypeId}`] = "Required";
      });
      const stateError = !form.address.state.trim()
        ? { "address.state": "Department is required" }
        : {};
      setFieldErrors({ ...validation.errors, ...capErrors, ...stateError });
      showToast("warning", "Please fill all required fields");
      return;
    }

    try {
      await apiUpdateLocation(editing._id, {
        name: form.name,
        address: {
          country: form.address.country,
          state: form.address.state,
          city: form.address.city,
          street: formattedStreet,
          propertyNumber: propertyNum,
          additionalInfo: form.address.additionalInfo,
        },
        materialCapacities: form.materialCapacities.map((c) => ({
          materialTypeId: c.materialTypeId,
          maxQuantity: Number(c.maxQuantity),
        })),
      });
      setShowEditModal(false);
      setEditing(null);
      showToast("success", "Location updated");
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message ?? "Error updating location");
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const name = loc.name ?? "";
    const address = (loc.address as { street?: string; city?: string }) || {};
    const street = address.street ?? "";
    const city = address.city ?? "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Import functionality
  const handleImport = async () => {
    if (!importFile) {
      showToast("warning", "Please select a file to import");
      return;
    }

    setImporting(true);
    try {
      const fileExtension = importFile.name.toLowerCase().split(".").pop();
      const isExcel = fileExtension === "xlsx" || fileExtension === "xls";

      let headers: string[] = [];
      let rows: string[][] = [];

      if (isExcel) {
        // Handle Excel files
        const arrayBuffer = await importFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (data.length < 2) {
          showToast("error", "File is empty or invalid. Please use the template.");
          setImporting(false);
          return;
        }

        headers = data[0].map((h) => String(h || ""));
        rows = data.slice(1).map((row) => headers.map((_, idx) => String(row[idx] || "")));
      } else {
        // Handle CSV files
        const text = await importFile.text();
        const lines = text.split(/\r?\n/).filter((line) => line.trim());

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
        rows = lines.slice(1).map((line) => parseCSVLine(line));
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

      // Extract dynamic material type headers
      const materialTypeIndices: { [key: string]: number } = {};
      materialTypes.forEach((mt) => {
        const headerName = mt.name.toLowerCase().trim();
        const index = headers.findIndex((h) => h.toLowerCase().trim() === headerName);
        if (index !== -1) {
          materialTypeIndices[mt._id] = index;
        }
      });

      for (const row of rows) {
        if (!row[0]?.trim()) continue;

        try {
          let locationData: LocationCreatePayload;

          // Map material capacities from row columns
          const rowCapacities = materialTypes.map((mt) => {
            const index = materialTypeIndices[mt._id];
            const value = index !== undefined ? row[index] : "";
            const numValue = value ? parseInt(value) : 0;
            return {
              materialTypeId: mt._id,
              maxQuantity: isNaN(numValue) ? 0 : numValue,
            };
          });

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
              materialCapacities: rowCapacities,
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

            const formattedStreet =
              streetType && primaryNum && secondaryNum
                ? `${streetType} ${primaryNum} # ${secondaryNum}${complementaryNum ? `-${complementaryNum}` : ""}`
                : "";

            locationData = {
              name: name,
              organizationId: user?.organizationId ?? "",
              materialCapacities: rowCapacities,
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
          console.error("Row import error:", err);
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
          <p className="text-white text-2xl font-bold">
            {locations.reduce((s, l) => s + (l.capacity ?? 0), 0)}
          </p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Occupied</p>
          <p className="text-white text-2xl font-bold">
            {locations.reduce((s, l) => s + (l.occupied ?? 0), 0)}
          </p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Utilization</p>
          <p className="text-white text-2xl font-bold">
            {locations.length > 0
              ? Math.round(
                  (locations.reduce((s, l) => s + (l.occupied ?? 0), 0) /
                    Math.max(
                      1,
                      locations.reduce((s, l) => s + (l.capacity ?? 1), 1),
                    )) *
                    100,
                )
              : 0}
            %
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
        {!loading &&
          !error &&
          filteredLocations.map((location) => {
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
                      {((location.address as Record<string, unknown>)?.city as string) || "N/A"} •{" "}
                      {((location.address as Record<string, unknown>)?.street as string) || "N/A"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(location.status)}`}
                  >
                    {location.status.replace("_", " ").toUpperCase()}
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
                      {(location.address as Record<string, unknown>)?.additionalDetails as string}
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
          <p className="text-gray-500 text-sm">
            Try adjusting your search or create a new location
          </p>
        </div>
      )}

      {/* Create Modal - Full Horizontal Layout */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-6xl w-full p-6 shadow-lg max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Create Location</h2>
                <p className="text-gray-400 text-sm">
                  Add a new warehouse location with specific material capacities
                </p>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreate();
              }}
              className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar"
            >
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-l-4 border-[#FFD700] pl-3">
                    General Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => {
                        updateForm("name", e.target.value);
                        setFieldErrors((s) => ({
                          ...s,
                          name: e.target.value.trim() ? undefined : "Name is required",
                        }));
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim())
                          setFieldErrors((s) => ({ ...s, name: "Name is required" }));
                      }}
                      placeholder="e.g. Main Warehouse A"
                      className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${fieldErrors.name ? "border-red-500" : "border-[#262626]"}`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.address.country}
                      onChange={(e) => {
                        updateAddressField("country", e.target.value);
                        setFieldErrors((s) => ({
                          ...s,
                          "address.country": e.target.value.trim()
                            ? undefined
                            : "Country is required",
                        }));
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim())
                          setFieldErrors((s) => ({
                            ...s,
                            "address.country": "Country is required",
                          }));
                      }}
                      placeholder="e.g. Colombia"
                      className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${fieldErrors["address.country"] ? "border-red-500" : "border-[#262626]"}`}
                    />
                    {fieldErrors["address.country"] && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors["address.country"]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          value={stateQuery}
                          onChange={(e) => {
                            setStateQuery(e.target.value);
                            setShowStateSuggestions(true);
                            updateAddressField("state", e.target.value);
                            setFieldErrors((s) => ({ ...s, "address.state": undefined }));
                          }}
                          onFocus={() => setShowStateSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowStateSuggestions(false), 200);
                            if (!form.address.state.trim())
                              setFieldErrors((s) => ({
                                ...s,
                                "address.state": "Department is required",
                              }));
                          }}
                          placeholder="Search department..."
                          className={`w-full h-11 px-3 pr-10 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                            fieldErrors["address.state"] ? "border-red-500" : "border-[#262626]"
                          }`}
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                      {fieldErrors["address.state"] && (
                        <p className="text-xs text-red-400 mt-1">{fieldErrors["address.state"]}</p>
                      )}
                      {showStateSuggestions && (
                        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                          {deptLoading ? (
                            <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
                          ) : (
                            filteredDepartments.map((dept) => (
                              <button
                                key={dept.id}
                                type="button"
                                onClick={() => {
                                  setStateQuery(dept.name);
                                  setSelectedState(dept.id.toString());
                                  updateAddressField("state", dept.name);
                                  setShowStateSuggestions(false);
                                  setCityQuery("");
                                  updateAddressField("city", "");
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

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          value={cityQuery}
                          onChange={(e) => {
                            setCityQuery(e.target.value);
                            setShowCitySuggestions(true);
                            updateAddressField("city", e.target.value);
                            setFieldErrors((s) => ({
                              ...s,
                              "address.city": e.target.value.trim()
                                ? undefined
                                : "City is required",
                            }));
                          }}
                          onFocus={() => setShowCitySuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowCitySuggestions(false), 200);
                            if (!cityQuery.trim())
                              setFieldErrors((s) => ({
                                ...s,
                                "address.city": "City is required",
                              }));
                          }}
                          disabled={!selectedState}
                          placeholder={selectedState ? "Search city..." : "Select dept first"}
                          className={`w-full h-11 px-3 pr-10 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] disabled:opacity-50 ${fieldErrors["address.city"] ? "border-red-500" : "border-[#262626]"}`}
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                      {fieldErrors["address.city"] && (
                        <p className="text-xs text-red-400 mt-1">{fieldErrors["address.city"]}</p>
                      )}
                      {showCitySuggestions && selectedState && (
                        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl max-h-48 overflow-y-auto">
                          {citiesLoading ? (
                            <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
                          ) : (
                            filteredCities.map((city) => (
                              <button
                                key={city.id}
                                type="button"
                                onClick={() => {
                                  setCityQuery(city.name);
                                  updateAddressField("city", city.name);
                                  setShowCitySuggestions(false);
                                  setFieldErrors((s) => ({ ...s, "address.city": undefined }));
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Street Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={form.address.streetType}
                        onChange={(e) => {
                          updateAddressField("streetType", e.target.value);
                          setFieldErrors((s) => ({ ...s, "address.street": undefined }));
                        }}
                        className={`w-full h-11 px-2 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${fieldErrors["address.street"] ? "border-red-500" : "border-[#262626]"}`}
                      >
                        <option value="">Select type</option>
                        <option value="Calle">Calle</option>
                        <option value="Carrera">Carrera</option>
                        <option value="Avenida">Avenida</option>
                        <option value="Diagonal">Diagonal</option>
                        <option value="Transversal">Transversal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.address.primaryNumber}
                        onChange={(e) => {
                          updateAddressField("primaryNumber", e.target.value);
                          setFieldErrors((s) => ({ ...s, "address.street": undefined }));
                        }}
                        placeholder="e.g. 10"
                        className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${fieldErrors["address.street"] ? "border-red-500" : "border-[#262626]"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Property # <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.address.secondaryNumber}
                        onChange={(e) => {
                          updateAddressField("secondaryNumber", e.target.value);
                          setFieldErrors((s) => ({
                            ...s,
                            "address.street": undefined,
                            "address.propertyNumber": undefined,
                          }));
                        }}
                        placeholder="e.g. 45"
                        className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${fieldErrors["address.propertyNumber"] ? "border-red-500" : "border-[#262626]"}`}
                      />
                      {fieldErrors["address.propertyNumber"] && (
                        <p className="text-xs text-red-400 mt-1">
                          {fieldErrors["address.propertyNumber"]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Comp.</label>
                      <input
                        value={form.address.complementaryNumber}
                        onChange={(e) => updateAddressField("complementaryNumber", e.target.value)}
                        placeholder="e.g. 67"
                        className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      />
                    </div>
                  </div>
                  {fieldErrors["address.street"] && (
                    <p className="text-xs text-red-400 -mt-4">{fieldErrors["address.street"]}</p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Additional Details
                    </label>
                    <textarea
                      value={form.address.additionalInfo}
                      onChange={(e) => updateAddressField("additionalInfo", e.target.value)}
                      placeholder="e.g. Near the main entrance, 2nd floor"
                      rows={2}
                      className="w-full px-3 py-2 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                    />
                  </div>
                </div>

                {/* Material Capacities Section */}
                <div className="space-y-6 flex flex-col">
                  <div className="flex items-center justify-between border-l-4 border-[#FFD700] pl-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Material Capacities</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.materialCapacities.filter((c) => c.maxQuantity !== "").length} of{" "}
                        {form.materialCapacities.length} configured — all required
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      Page {materialPage} of {totalMaterialPages}
                    </span>
                  </div>
                  {fieldErrors.materialCapacities && (
                    <p className="text-xs text-red-400 -mt-3">{fieldErrors.materialCapacities}</p>
                  )}

                  {/* Bulk Configuration Tool */}
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-[#FFD700] mb-2">
                      <Zap size={16} />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        Bulk Capacity Setting
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Filter by Category (optional)
                        </label>
                        <select
                          className="w-full h-9 px-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:border-[#FFD700]"
                          onChange={(e) => {
                            const catId = e.target.value || undefined;
                            const qty = Number(bulkQtyInput);
                            if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty, catId);
                          }}
                        >
                          <option value="">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Quantity to Set *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={0}
                            value={bulkQtyInput}
                            onChange={(e) => setBulkQtyInput(e.target.value)}
                            placeholder="Enter qty"
                            className="flex-1 h-9 px-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:border-[#FFD700]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const qty = Number(bulkQtyInput);
                              if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty);
                            }}
                            className="bg-[#333] hover:bg-[#444] text-white px-3 rounded text-xs transition-colors"
                          >
                            Apply All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paginated Material List */}
                  <div className="flex-1 space-y-3 min-h-[300px]">
                    {paginatedMaterials.map((type) => {
                      const capacity = form.materialCapacities.find(
                        (c) => c.materialTypeId === type._id,
                      );
                      const hasError = !!fieldErrors[`capacity_${type._id}`];
                      const isEdited = capacity?.maxQuantity !== "";

                      return (
                        <div
                          key={type._id}
                          className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                            hasError
                              ? "bg-red-950/20 border-red-500/40"
                              : isEdited
                                ? "bg-[#111] border-[#333]"
                                : "bg-[#1a1111]/30 border-red-900/30"
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{type.name}</p>
                            <p className="text-xs text-gray-500">
                              {categories.find((c) => c._id === type.categoryId)?.name || "General"}
                            </p>
                          </div>
                          <div className="w-28 shrink-0">
                            <input
                              type="number"
                              min={0}
                              value={capacity?.maxQuantity ?? ""}
                              onChange={(e) => updateCapacity(type._id, e.target.value)}
                              placeholder="qty required"
                              className={`w-full h-9 px-2 bg-[#0a0a0a] border rounded text-right text-sm text-white focus:outline-none focus:ring-1 ${
                                hasError
                                  ? "border-red-500 focus:ring-red-500"
                                  : isEdited
                                    ? "border-[#333] focus:ring-[#FFD700]"
                                    : "border-red-900/50 focus:ring-red-500"
                              }`}
                            />
                            {hasError && (
                              <p className="text-[10px] text-red-400 mt-0.5 text-right">
                                {fieldErrors[`capacity_${type._id}`]}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Material Pagination Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                    <button
                      type="button"
                      disabled={materialPage === 1}
                      onClick={() => setMaterialPage((p) => Math.max(1, p - 1))}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalMaterialPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setMaterialPage(p)}
                          className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                            materialPage === p
                              ? "bg-[#FFD700] text-black"
                              : "text-gray-500 hover:bg-[#222]"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={materialPage === totalMaterialPages}
                      onClick={() => setMaterialPage((p) => Math.min(totalMaterialPages, p + 1))}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 shrink-0">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFC700] transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                >
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - Full Horizontal Layout */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-6xl w-full p-6 shadow-lg max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Location</h2>
                <p className="text-gray-400 text-sm">Update location and material capacities</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleUpdate();
              }}
              className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-l-4 border-[#FFD700] pl-3">
                    General Information
                  </h3>

                  {/* Location Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => {
                        updateForm("name", e.target.value);
                        setFieldErrors((s) => ({ ...s, name: undefined }));
                      }}
                      onBlur={() => {
                        if (!form.name.trim())
                          setFieldErrors((s) => ({ ...s, name: "Name is required" }));
                      }}
                      placeholder="Warehouse name"
                      className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                        fieldErrors.name ? "border-red-500" : "border-[#262626]"
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.address.country}
                      onChange={(e) => {
                        updateAddressField("country", e.target.value);
                        setFieldErrors((s) => ({ ...s, "address.country": undefined }));
                      }}
                      onBlur={() => {
                        if (!form.address.country.trim())
                          setFieldErrors((s) => ({
                            ...s,
                            "address.country": "Country is required",
                          }));
                      }}
                      placeholder="Colombia"
                      className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                        fieldErrors["address.country"] ? "border-red-500" : "border-[#262626]"
                      }`}
                    />
                    {fieldErrors["address.country"] && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors["address.country"]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          value={stateQuery}
                          onChange={(e) => {
                            setStateQuery(e.target.value);
                            setShowStateSuggestions(true);
                            updateAddressField("state", e.target.value);
                            setFieldErrors((s) => ({ ...s, "address.state": undefined }));
                          }}
                          onBlur={() => {
                            if (!form.address.state.trim())
                              setFieldErrors((s) => ({
                                ...s,
                                "address.state": "Department is required",
                              }));
                          }}
                          placeholder="e.g. Cundinamarca"
                          className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                            fieldErrors["address.state"] ? "border-red-500" : "border-[#262626]"
                          }`}
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      </div>
                      {fieldErrors["address.state"] && (
                        <p className="text-xs text-red-400 mt-1">{fieldErrors["address.state"]}</p>
                      )}
                      {showStateSuggestions && (
                        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-md max-h-48 overflow-y-auto">
                          {filteredDepartments.map((dept) => (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => {
                                setStateQuery(dept.name);
                                setSelectedState(dept.id.toString());
                                updateAddressField("state", dept.name);
                                setShowStateSuggestions(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2a2a2a]"
                            >
                              {dept.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={cityQuery}
                        onChange={(e) => {
                          setCityQuery(e.target.value);
                          setShowCitySuggestions(true);
                          updateAddressField("city", e.target.value);
                          setFieldErrors((s) => ({ ...s, "address.city": undefined }));
                        }}
                        onBlur={() => {
                          if (!form.address.city.trim())
                            setFieldErrors((s) => ({
                              ...s,
                              "address.city": "City is required",
                            }));
                        }}
                        placeholder="e.g. Bogotá"
                        className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                          fieldErrors["address.city"] ? "border-red-500" : "border-[#262626]"
                        }`}
                      />
                      {fieldErrors["address.city"] && (
                        <p className="text-xs text-red-400 mt-1">{fieldErrors["address.city"]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Street Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={form.address.streetType}
                        onChange={(e) => {
                          updateAddressField("streetType", e.target.value);
                          setFieldErrors((s) => ({ ...s, "address.street": undefined }));
                        }}
                        className={`w-full h-11 px-2 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                          fieldErrors["address.street"] ? "border-red-500" : "border-[#262626]"
                        }`}
                      >
                        <option value="">Type</option>
                        <option value="Calle">Calle</option>
                        <option value="Carrera">Carrera</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        # <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.address.primaryNumber}
                        onChange={(e) => {
                          updateAddressField("primaryNumber", e.target.value);
                          setFieldErrors((s) => ({ ...s, "address.street": undefined }));
                        }}
                        placeholder="10"
                        className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none ${
                          fieldErrors["address.street"] ? "border-red-500" : "border-[#262626]"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Secondary <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.address.secondaryNumber}
                        onChange={(e) => {
                          updateAddressField("secondaryNumber", e.target.value);
                          setFieldErrors((s) => ({ ...s, "address.propertyNumber": undefined }));
                        }}
                        placeholder="20"
                        className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none ${
                          fieldErrors["address.propertyNumber"]
                            ? "border-red-500"
                            : "border-[#262626]"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Comp.</label>
                      <input
                        value={form.address.complementaryNumber}
                        onChange={(e) => updateAddressField("complementaryNumber", e.target.value)}
                        placeholder="30"
                        className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  {(fieldErrors["address.street"] || fieldErrors["address.propertyNumber"]) && (
                    <p className="text-xs text-red-400 -mt-3">
                      {fieldErrors["address.street"] || fieldErrors["address.propertyNumber"]}
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Additional Details
                    </label>
                    <textarea
                      value={form.address.additionalInfo}
                      onChange={(e) => updateAddressField("additionalInfo", e.target.value)}
                      rows={2}
                      placeholder="Apartment, suite, floor, references..."
                      className="w-full px-3 py-2 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6 flex flex-col">
                  <div className="flex items-center justify-between border-l-4 border-[#FFD700] pl-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Material Capacities</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.materialCapacities.filter((c) => c.maxQuantity !== "").length} of{" "}
                        {form.materialCapacities.length} configured — all required
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      Page {materialPage} of {totalMaterialPages}
                    </span>
                  </div>
                  {fieldErrors.materialCapacities && (
                    <p className="text-xs text-red-400 -mt-3">{fieldErrors.materialCapacities}</p>
                  )}

                  {/* Bulk Configuration Tool */}
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-[#FFD700] mb-2">
                      <Zap size={16} />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        Bulk Capacity Setting
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Filter by Category (optional)
                        </label>
                        <select
                          className="w-full h-9 px-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:border-[#FFD700]"
                          onChange={(e) => {
                            const catId = e.target.value || undefined;
                            const qty = Number(bulkQtyInput);
                            if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty, catId);
                          }}
                        >
                          <option value="">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Quantity to Set *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={0}
                            value={bulkQtyInput}
                            onChange={(e) => setBulkQtyInput(e.target.value)}
                            placeholder="Enter qty"
                            className="flex-1 h-9 px-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:border-[#FFD700]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const qty = Number(bulkQtyInput);
                              if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty);
                            }}
                            className="bg-[#333] hover:bg-[#444] text-white px-3 rounded text-xs transition-colors"
                          >
                            Apply All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paginated Material List */}
                  <div className="flex-1 space-y-3 min-h-[300px]">
                    {paginatedMaterials.map((type) => {
                      const capacity = form.materialCapacities.find(
                        (c) => c.materialTypeId === type._id,
                      );
                      const hasError = !!fieldErrors[`capacity_${type._id}`];
                      const isEdited = capacity?.maxQuantity !== "";

                      return (
                        <div
                          key={type._id}
                          className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                            hasError
                              ? "bg-red-950/20 border-red-500/40"
                              : isEdited
                                ? "bg-[#111] border-[#333]"
                                : "bg-[#1a1111]/30 border-red-900/30"
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{type.name}</p>
                            <p className="text-xs text-gray-500">
                              {categories.find((c) => c._id === type.categoryId)?.name || "General"}
                            </p>
                          </div>
                          <div className="w-28 shrink-0">
                            <input
                              type="number"
                              min={0}
                              value={capacity?.maxQuantity ?? ""}
                              onChange={(e) => updateCapacity(type._id, e.target.value)}
                              placeholder="qty required"
                              className={`w-full h-9 px-2 bg-[#0a0a0a] border rounded text-right text-sm text-white focus:outline-none focus:ring-1 ${
                                hasError
                                  ? "border-red-500 focus:ring-red-500"
                                  : isEdited
                                    ? "border-[#333] focus:ring-[#FFD700]"
                                    : "border-red-900/50 focus:ring-red-500"
                              }`}
                            />
                            {hasError && (
                              <p className="text-[10px] text-red-400 mt-0.5 text-right">
                                {fieldErrors[`capacity_${type._id}`]}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Material Pagination Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                    <button
                      type="button"
                      disabled={materialPage === 1}
                      onClick={() => setMaterialPage((p) => Math.max(1, p - 1))}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalMaterialPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setMaterialPage(p)}
                          className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                            materialPage === p
                              ? "bg-[#FFD700] text-black"
                              : "text-gray-500 hover:bg-[#222]"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={materialPage === totalMaterialPages}
                      onClick={() => setMaterialPage((p) => Math.min(totalMaterialPages, p + 1))}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 shrink-0">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFC700] transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-4xl w-full p-6 shadow-lg max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Location Details</h2>
                <p className="text-gray-400 text-sm mt-1">{previewing.name}</p>
              </div>
              <button
                onClick={closePreviewModal}
                className="text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] p-2 rounded-lg border border-[#333]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Basic & Address Info */}
                <div className="space-y-6">
                  <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333]">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-1 shadow-sm ${
                            previewing.status === "available"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : previewing.status === "full"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${previewing.status === "available" ? "bg-green-400" : previewing.status === "full" ? "bg-red-400" : "bg-yellow-400"}`}
                          ></div>
                          {previewing.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">Created</p>
                          <p className="text-white font-medium mt-1">
                            {previewing.createdAt
                              ? new Date(previewing.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">Updated</p>
                          <p className="text-white font-medium mt-1">
                            {previewing.updatedAt
                              ? new Date(previewing.updatedAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333]">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      Address Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Country</p>
                          <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                            {previewing.address?.country || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">State</p>
                          <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                            {previewing.address?.state || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">City</p>
                          <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                            {previewing.address?.city || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Full Address</p>
                        <p className="text-white text-sm bg-[#111] p-3 rounded-lg border border-[#2a2a2a] break-words">
                          {previewing.address?.street ||
                            (previewing.address?.streetType &&
                            previewing.address?.primaryNumber &&
                            previewing.address?.secondaryNumber
                              ? `${previewing.address.streetType} ${previewing.address.primaryNumber} #${previewing.address.secondaryNumber}${previewing.address.complementaryNumber ? `-${previewing.address.complementaryNumber}` : ""}`
                              : "N/A")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material Capacities Table */}
                <div className="bg-[#1a1a1a] rounded-xl border border-[#333] flex flex-col h-full">
                  <div className="p-4 border-b border-[#333] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      Material Capacities
                    </h3>
                    <div className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 font-bold">
                      {materialTypes.length} TYPES
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-[#1a1a1a] z-10 shadow-sm shadow-black/20">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Material Type
                          </th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
                            Limit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a2a]">
                        {materialTypes.map((mt) => {
                          const cap = (
                            (previewing.materialCapacities as {
                              materialTypeId: string;
                              maxQuantity: number;
                            }[]) || []
                          ).find((c) => c.materialTypeId === mt._id);

                          return (
                            <tr key={mt._id} className="group hover:bg-white/5 transition-colors">
                              <td className="px-3 py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white">
                                    {mt.name}
                                  </span>
                                  <span className="text-[10px] text-gray-500 group-hover:text-yellow-500/70 transition-colors">
                                    {categories.find((c) => c._id === mt.categoryId)?.name ||
                                      "General"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className="text-sm font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 group-hover:shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                  {cap?.maxQuantity || 0}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-[#333] shrink-0">
              <button
                onClick={closePreviewModal}
                className="px-8 py-2.5 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-[#222] transition-all border border-[#333] shadow-lg shadow-black/20 active:scale-95 text-sm uppercase tracking-wider"
              >
                Close Details
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
                Upload a CSV or Excel file (.csv, .xlsx, .xls) with location data. The file should
                contain the following columns:
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Select File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                  disabled={importing}
                />
                {importFile && (
                  <p className="text-xs text-gray-400 mt-2">Selected: {importFile.name}</p>
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

      {/* Bulk capacity override confirmation */}
      <ConfirmDialog
        isOpen={bulkConfirmPending !== null}
        onClose={() => setBulkConfirmPending(null)}
        onConfirm={() => {
          if (bulkConfirmPending)
            doApplyBulkCapacity(bulkConfirmPending.val, bulkConfirmPending.categoryId, false);
          setBulkConfirmPending(null);
        }}
        secondaryText="Keep existing"
        onSecondaryAction={() => {
          if (bulkConfirmPending)
            doApplyBulkCapacity(bulkConfirmPending.val, bulkConfirmPending.categoryId, true);
          setBulkConfirmPending(null);
        }}
        title="Apply bulk capacity"
        message='How do you want to apply this value? \"Override all\" replaces every value. \"Keep existing\" only fills in material types that haven&apos;t been set yet.'
        confirmText="Override all"
        cancelText="Cancel"
        variant="warning"
      />

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
