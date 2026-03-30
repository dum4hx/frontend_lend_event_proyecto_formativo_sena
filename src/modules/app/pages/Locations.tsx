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
import { useLanguage } from "../../../contexts/useLanguage";
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
  state: string;
  city: string;
  streetType: string;
  primaryNumber: string;
  secondaryNumber: string;
  complementaryNumber: string;
  additionalInfo: string;
}

interface LocationFormState {
  name: string;
  status: "available" | "full_capacity" | "maintenance" | "inactive";
  address: LocationFormAddress;
  materialCapacities: MaterialCapacityForm[];
}

/**
 * Calculate total capacity of a location by summing all material type limits
 */
const calculateLocationCapacity = (location: WarehouseLocation): number => {
  if (!location.materialCapacities || location.materialCapacities.length === 0) {
    return location.capacity ?? 0;
  }
  return location.materialCapacities.reduce((sum, cap) => sum + (cap.maxQuantity || 0), 0);
};

/**
 * Get status color classes for location status badges
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case "available":
      return "bg-green-500/10 text-green-400 border-green-500/30";
    case "full_capacity":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "maintenance":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    case "inactive":
      return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
};

export default function LocationsPage() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "es";
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

  // Preview modal state
  const [previewSearchTerm, setPreviewSearchTerm] = useState("");
  const [previewSelectedCategory, setPreviewSelectedCategory] = useState<string>("");
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_ITEMS_PER_PAGE = 8;

  const initialForm: LocationFormState = {
    name: "",
    status: "available",
    address: {
      state: "",
      city: "",
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
        // Normalize locations: calculate occupied from materialCapacities
        const normalizedLocations = responseData.items
          .map((loc: WarehouseLocation & { occupied?: number }) => ({
            ...loc,
            occupied:
              (loc.materialCapacities as Array<{ currentQuantity?: number }>)?.reduce(
                (sum, cap) => sum + (cap.currentQuantity || 0),
                0,
              ) || 0,
            id: loc.id || (loc as unknown as { _id?: string })._id || "",
          }))
          .filter((loc) => loc.id); // Only include locations with valid IDs
        setLocations(normalizedLocations as WarehouseLocation[]);
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
          streetType?: string;
          primaryNumber?: string;
          secondaryNumber?: string;
          complementaryNumber?: string;
          department?: string;
          city?: string;
          additionalDetails?: string;
        }) || {};
      return {
        Name: loc.name || "",
        Status: loc.isActive ? "active" : "inactive",
        "Street Type": address.streetType || "",
        "Primary Number": address.primaryNumber || "",
        "Secondary Number": address.secondaryNumber || "",
        "Complementary Number": address.complementaryNumber || "",
        Department: address.department || "",
        City: address.city || "",
        "Additional Details": address.additionalDetails || "",
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
          showToast("warning", isEs ? "Sin ubicaciones para exportar" : "No locations to export");
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
            isEs
              ? `Exportadas ${result.metadata.recordCount} ubicaciones como ${result.filename}`
              : `Exported ${result.metadata.recordCount} locations as ${result.filename}`,
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
    [locations, buildExportRows, showToast, user, isEs],
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
      showToast("success", isEs ? "Ubicación eliminada" : "Location deleted");
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast(
        "error",
        error.message ?? (isEs ? "Error al eliminar ubicación" : "Error deleting location"),
      );
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
    showToast("success", isEs ? "Capacidad en bloque aplicada" : "Bulk capacity applied");
  };

  const applyBulkCapacity = (val: number, categoryId?: string) => {
    if (val < 0 || isNaN(val)) {
      showToast(
        "warning",
        isEs
          ? "Ingresa un número válido no negativo"
          : "Please provide a valid non-negative number",
      );
      return;
    }
    setBulkConfirmPending({ val, categoryId });
  };

  const handleCreate = async () => {
    const validation = validateLocationV2({
      name: form.name,
      address: {
        streetType: form.address.streetType,
        primaryNumber: form.address.primaryNumber,
        secondaryNumber: form.address.secondaryNumber,
        complementaryNumber: form.address.complementaryNumber,
        department: form.address.state,
        city: form.address.city,
        additionalDetails: form.address.additionalInfo,
      },
      materialCapacities: form.materialCapacities,
    });

    if (!validation.isValid || !form.address.state.trim()) {
      const capErrors: Record<string, string> = {};
      form.materialCapacities.forEach((c) => {
        if (c.maxQuantity === "") capErrors[`capacity_${c.materialTypeId}`] = "Required";
      });
      const stateError = !form.address.state.trim()
        ? { "address.state": isEs ? "El departamento es obligatorio" : "Department is required" }
        : {};
      setFieldErrors({ ...validation.errors, ...capErrors, ...stateError });
      showToast(
        "warning",
        isEs ? "Completa todos los campos requeridos" : "Please fill all required fields",
      );
      return;
    }

    try {
      await apiCreateLocation({
        name: form.name,
        organizationId: user?.organizationId ?? "",
        status: form.status as "available" | "full_capacity" | "maintenance" | "inactive",
        address: {
          streetType: form.address.streetType,
          primaryNumber: form.address.primaryNumber,
          secondaryNumber: form.address.secondaryNumber,
          complementaryNumber: form.address.complementaryNumber,
          department: form.address.state,
          city: form.address.city,
          additionalDetails: form.address.additionalInfo || undefined,
        },
        materialCapacities: form.materialCapacities.map((c) => ({
          materialTypeId: c.materialTypeId,
          maxQuantity: Number(c.maxQuantity),
        })),
      });
      setShowCreateModal(false);
      showToast("success", isEs ? "Ubicación creada" : "Location created");
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast(
        "error",
        error.message ?? (isEs ? "Error al crear ubicación" : "Error creating location"),
      );
    }
  };

  const openEdit = (loc: WarehouseLocation) => {
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setFieldErrors({});
    setEditing(loc);

    const address =
      (loc.address as {
        department?: string;
        state?: string;
        city?: string;
        streetType?: string;
        primaryNumber?: string;
        secondaryNumber?: string;
        complementaryNumber?: string;
        additionalDetails?: string;
        additionalInfo?: string;
        // legacy fallback fields
        street?: string;
        propertyNumber?: string;
      }) || {};

    // Use department from API response (not state)
    const resolvedDepartment = address.department || address.state || "";

    setStateQuery(resolvedDepartment);
    setCityQuery(address.city || "");

    if (resolvedDepartment && departments) {
      const dept = departments.find((d) => d.name === resolvedDepartment);
      if (dept) setSelectedState(dept.id.toString());
    }

    // Use new direct fields; fall back to parsing legacy street if needed
    let parsedStreetType = address.streetType || "";
    let parsedPrimaryNumber = address.primaryNumber || "";
    let parsedSecondaryNumber = address.secondaryNumber || "";
    let parsedComplementaryNumber = address.complementaryNumber || "";

    if (!parsedStreetType && address.street) {
      // Try to parse: "Calle 10 #45" or "Calle 10 #45-30"
      const streetMatch = address.street.match(/^(.+?)\s+(\d+)\s*#\s*(\d+)(?:-(\d+))?/);
      if (streetMatch) {
        parsedStreetType = streetMatch[1].trim();
        parsedPrimaryNumber = streetMatch[2];
        parsedSecondaryNumber = streetMatch[3];
        parsedComplementaryNumber = streetMatch[4] || "";
      }
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
      status: loc.status || "available",
      address: {
        state: resolvedDepartment,
        city: address.city || "",
        streetType: parsedStreetType,
        primaryNumber: parsedPrimaryNumber,
        secondaryNumber: parsedSecondaryNumber,
        complementaryNumber: parsedComplementaryNumber,
        additionalInfo: address.additionalDetails || address.additionalInfo || "",
      },
      materialCapacities: caps,
    });

    setShowEditModal(true);
  };

  const openPreview = (loc: WarehouseLocation) => {
    setPreviewing(loc);
    setShowPreviewModal(true);
    setPreviewSearchTerm("");
    setPreviewSelectedCategory("");
    setPreviewPage(1);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewing(null);
    setPreviewSearchTerm("");
    setPreviewSelectedCategory("");
    setPreviewPage(1);
  };

  const handleUpdate = async () => {
    if (!editing) return;

    const validation = validateLocationV2({
      name: form.name,
      address: {
        streetType: form.address.streetType,
        primaryNumber: form.address.primaryNumber,
        secondaryNumber: form.address.secondaryNumber,
        complementaryNumber: form.address.complementaryNumber,
        department: form.address.state,
        city: form.address.city,
        additionalDetails: form.address.additionalInfo,
      },
      materialCapacities: form.materialCapacities,
    });

    if (!validation.isValid || !form.address.state.trim()) {
      const capErrors: Record<string, string> = {};
      form.materialCapacities.forEach((c) => {
        if (c.maxQuantity === "") capErrors[`capacity_${c.materialTypeId}`] = "Required";
      });
      const stateError = !form.address.state.trim()
        ? { "address.state": isEs ? "El departamento es obligatorio" : "Department is required" }
        : {};
      setFieldErrors({ ...validation.errors, ...capErrors, ...stateError });
      showToast(
        "warning",
        isEs ? "Completa todos los campos requeridos" : "Please fill all required fields",
      );
      return;
    }

    try {
      await apiUpdateLocation(editing._id, {
        name: form.name,
        status: form.status as "available" | "full_capacity" | "maintenance" | "inactive",
        address: {
          streetType: form.address.streetType,
          primaryNumber: form.address.primaryNumber,
          secondaryNumber: form.address.secondaryNumber,
          complementaryNumber: form.address.complementaryNumber,
          department: form.address.state,
          city: form.address.city,
          additionalDetails: form.address.additionalInfo || undefined,
        },
        materialCapacities: form.materialCapacities.map((c) => ({
          materialTypeId: c.materialTypeId,
          maxQuantity: Number(c.maxQuantity),
        })),
      });
      setShowEditModal(false);
      setEditing(null);
      showToast("success", isEs ? "Ubicación actualizada" : "Location updated");
      await fetchLocations();
    } catch (err) {
      const error = err as Error;
      showToast(
        "error",
        error.message ?? (isEs ? "Error al actualizar ubicación" : "Error updating location"),
      );
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const name = loc.name ?? "";
    const address =
      (loc.address as { streetType?: string; primaryNumber?: string; city?: string }) || {};
    const streetInfo = `${address.streetType ?? ""} ${address.primaryNumber ?? ""}`.trim();
    const city = address.city ?? "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      streetInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Import functionality
  const handleImport = async () => {
    if (!importFile) {
      showToast(
        "warning",
        isEs ? "Selecciona un archivo para importar" : "Please select a file to import",
      );
      return;
    }

    const selectedFile = importFile;

    setImporting(true);
    try {
      const fileExtension = selectedFile.name.toLowerCase().split(".").pop();
      const isExcel = fileExtension === "xlsx" || fileExtension === "xls";

      let headers: string[] = [];
      let rows: string[][] = [];

      if (isExcel) {
        // Handle Excel files
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (data.length < 2) {
          showToast(
            "error",
            isEs
              ? "El archivo está vacío o es inválido. Usa la plantilla."
              : "File is empty or invalid. Please use the template.",
          );
          setImporting(false);
          return;
        }

        headers = data[0].map((h) => String(h || ""));
        rows = data.slice(1).map((row) => headers.map((_, idx) => String(row[idx] || "")));
      } else {
        // Handle CSV files
        const text = await selectedFile.text();
        const lines = text.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length < 2) {
          showToast(
            "error",
            isEs
              ? "El archivo está vacío o es inválido. Usa la plantilla."
              : "File is empty or invalid. Please use the template.",
          );
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
        showToast(
          "error",
          isEs
            ? "Formato de archivo inválido. Encabezados no reconocidos."
            : "Invalid file format. Headers not recognized.",
        );
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

            // Try to parse legacy street into components
            let parsedStreetType = "";
            let parsedPrimaryNumber = street;
            let parsedSecondaryNumber = propertyNumber;
            let parsedComplementaryNumber = "";
            const streetMatch = street.match(/^(.+?)\s+(\S+)\s*#\s*(\S+)(?:-(\S+))?/);
            if (streetMatch) {
              parsedStreetType = streetMatch[1].trim();
              parsedPrimaryNumber = streetMatch[2];
              parsedSecondaryNumber = streetMatch[3];
              parsedComplementaryNumber = streetMatch[4] || "";
            }

            locationData = {
              name: name,
              organizationId: user?.organizationId ?? "",
              materialCapacities: rowCapacities,
              address: {
                streetType: parsedStreetType,
                primaryNumber: parsedPrimaryNumber,
                secondaryNumber: parsedSecondaryNumber,
                complementaryNumber: parsedComplementaryNumber,
                department: state,
                city: city,
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

            locationData = {
              name: name,
              organizationId: user?.organizationId ?? "",
              materialCapacities: rowCapacities,
              address: {
                streetType: streetType,
                primaryNumber: primaryNum,
                secondaryNumber: secondaryNum,
                complementaryNumber: complementaryNum,
                department: state,
                city: city,
                additionalDetails: additionalDetails || undefined,
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
        showToast(
          "success",
          isEs
            ? `Se importaron ${successCount} ubicación/es correctamente`
            : `Successfully imported ${successCount} location(s)`,
        );
        await fetchLocations();
      }

      if (errorCount > 0) {
        showToast(
          "warning",
          isEs
            ? `No se pudieron importar ${errorCount} ubicación/es`
            : `Failed to import ${errorCount} location(s)`,
        );
      }

      if (successCount === 0 && errorCount === 0) {
        showToast(
          "warning",
          isEs ? "No se encontraron filas válidas en el archivo" : "No valid rows found in file",
        );
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
          <h1 className="text-3xl font-bold text-white">
            {isEs ? "Ubicaciones del almacén" : "Warehouse Locations"}
          </h1>
          <p className="text-gray-400">
            {isEs
              ? "Gestiona zonas y ubicaciones de almacén"
              : "Manage warehouse zones and storage locations"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportOpen(true)}
            className="export-btn flex items-center gap-2"
          >
            <Download size={18} />
            {isEs ? "Exportar" : "Export"}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-lg hover:bg-[#222] hover:border-[#444] hover:text-white transition-all"
          >
            <Upload size={18} />
            {isEs ? "Importar" : "Import"}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFC107] transition-all"
          >
            <Plus size={20} />
            {isEs ? "Agregar ubicación" : "Add Location"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">
            {isEs ? "Ubicaciones totales" : "Total Locations"}
          </p>
          <p className="text-white text-2xl font-bold">{locations.length}</p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">{isEs ? "Capacidad total" : "Total Capacity"}</p>
          <p className="text-white text-2xl font-bold">
            {locations.reduce((s, l) => s + calculateLocationCapacity(l), 0)}
          </p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">{isEs ? "Ocupado" : "Occupied"}</p>
          <p className="text-white text-2xl font-bold">
            {locations.reduce(
              (s, l) => s + ((l as unknown as { occupied?: number })?.occupied ?? 0),
              0,
            )}
          </p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">{isEs ? "Utilización" : "Utilization"}</p>
          <p className="text-white text-2xl font-bold">
            {locations.length > 0
              ? Math.round(
                  (locations.reduce(
                    (s, l) => s + ((l as unknown as { occupied?: number })?.occupied ?? 0),
                    0,
                  ) /
                    Math.max(
                      1,
                      locations.reduce((s, l) => s + calculateLocationCapacity(l), 1),
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
          placeholder={isEs ? "Buscar por nombre o dirección..." : "Search by name or address..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading && (
          <div className="text-gray-400">
            {isEs ? "Cargando ubicaciones..." : "Loading locations..."}
          </div>
        )}
        {error && <div className="text-red-400">{error}</div>}
        {!loading &&
          !error &&
          filteredLocations.map((location) => {
            const calculatedCapacity = calculateLocationCapacity(location);
            return (
              <div
                key={location.id}
                className="group relative bg-gradient-to-br from-[#1a1a1a] to-[#121212] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#FFD700]/50 hover:shadow-lg hover:shadow-[#FFD700]/10 transition-all duration-300"
              >
                {/* Status Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(location.status)} border backdrop-blur-sm`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        location.status === "available"
                          ? "bg-green-400 animate-pulse"
                          : location.status === "full_capacity"
                            ? "bg-red-400"
                            : location.status === "maintenance"
                              ? "bg-yellow-400"
                              : "bg-gray-400"
                      }`}
                    />
                    {location.status.replace("_", " ")}
                  </span>
                </div>

                {/* Location Header */}
                <div className="mb-5 pr-24">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#FFD700] transition-colors">
                    {location.name}
                  </h3>
                  <div className="flex items-start gap-2 text-gray-400">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-[#FFD700]/70" />
                    <div className="text-sm leading-relaxed">
                      <p className="text-gray-300">
                        {(() => {
                          const addr = location.address as Record<string, unknown>;
                          const streetType = (addr?.streetType as string) || "";
                          const primaryNum = (addr?.primaryNumber as string) || "";
                          return streetType && primaryNum ? `${streetType} ${primaryNum}` : "N/A";
                        })()}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {((location.address as Record<string, unknown>)?.city as string) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-5" />

                {/* Capacity Section */}
                <div className="mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                        <Zap size={16} className="text-[#FFD700]" />
                      </div>
                      <span className="text-sm font-medium text-gray-300">
                        {isEs ? "Capacidad" : "Capacity"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {location.occupied ?? 0}
                        <span className="text-gray-500">/{calculatedCapacity || 0}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {Math.max(0, (calculatedCapacity || 0) - (location.occupied ?? 0))}{" "}
                        {isEs ? "disponible" : "available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {((location.address as Record<string, unknown>)?.additionalDetails as string) && (
                  <div className="bg-[#0f0f0f] border border-[#222] rounded-lg p-3 mb-5">
                    <p className="text-[#FFD700] text-xs font-semibold mb-1.5 uppercase tracking-wide">
                      {isEs ? "Info adicional" : "Additional Info"}
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                      {(location.address as Record<string, unknown>)?.additionalDetails as string}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => openPreview(location as WarehouseLocation)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:border-blue-500/50 hover:text-blue-400 transition-all duration-200 group/btn"
                    title={isEs ? "Ver detalles de la ubicación" : "View location details"}
                  >
                    <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">{isEs ? "Ver" : "View"}</span>
                  </button>
                  <button
                    onClick={() => openEdit(location as WarehouseLocation)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 hover:bg-[#FFD700]/10 hover:border-[#FFD700] hover:text-[#FFD700] transition-all duration-200 group/btn"
                    title={isEs ? "Editar ubicación" : "Edit location"}
                  >
                    <Edit2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">{isEs ? "Editar" : "Edit"}</span>
                  </button>
                  <button
                    onClick={() => void handleDelete(location.id)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-950/50 hover:border-red-500/50 hover:text-red-300 transition-all duration-200 group/btn"
                    title={isEs ? "Eliminar ubicación" : "Delete location"}
                  >
                    <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {filteredLocations.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            {isEs ? "No se encontraron ubicaciones" : "No locations found"}
          </p>
          <p className="text-gray-500 text-sm">
            {isEs
              ? "Intenta ajustar la búsqueda o crea una nueva ubicación"
              : "Try adjusting your search or create a new location"}
          </p>
        </div>
      )}

      {/* Create Modal - Full Horizontal Layout */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f10] border border-[#2a2a2a] rounded-xl max-w-6xl w-full p-6 shadow-lg max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isEs ? "Crear ubicación" : "Create Location"}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isEs
                    ? "Agrega una nueva ubicación de almacén con capacidades de material específicas"
                    : "Add a new warehouse location with specific material capacities"}
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
              {/* NOTE: Create modal -categoryId handler active below */}
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-l-4 border-[#FFD700] pl-3">
                    {isEs ? "Información general" : "General Information"}
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "Nombre de ubicación" : "Location Name"}{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => {
                        updateForm("name", e.target.value);
                        setFieldErrors((s) => ({
                          ...s,
                          name: e.target.value.trim()
                            ? undefined
                            : isEs
                              ? "El nombre es obligatorio"
                              : "Name is required",
                        }));
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim())
                          setFieldErrors((s) => ({
                            ...s,
                            name: isEs ? "El nombre es obligatorio" : "Name is required",
                          }));
                      }}
                      placeholder={isEs ? "Ej. Almacén principal A" : "e.g. Main Warehouse A"}
                      className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${fieldErrors.name ? "border-red-500" : "border-[#262626]"}`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "Estado" : "Status"} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => {
                        updateForm(
                          "status",
                          e.target.value as
                            | "available"
                            | "full_capacity"
                            | "maintenance"
                            | "inactive",
                        );
                      }}
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="available">{isEs ? "Disponible" : "Available"}</option>
                      <option value="full_capacity">
                        {isEs ? "Capacidad llena" : "Full Capacity"}
                      </option>
                      <option value="maintenance">{isEs ? "Mantenimiento" : "Maintenance"}</option>
                      <option value="inactive">{isEs ? "Inactivo" : "Inactive"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "País" : "Country"}
                    </label>
                    <input
                      value="Colombia"
                      disabled
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isEs ? "Departamento" : "Department"}{" "}
                        <span className="text-red-400">*</span>
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
                                "address.state": isEs
                                  ? "El departamento es obligatorio"
                                  : "Department is required",
                              }));
                          }}
                          placeholder={isEs ? "Buscar departamento..." : "Search department..."}
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
                            <div className="px-3 py-2 text-sm text-gray-400">
                              {isEs ? "Cargando..." : "Loading..."}
                            </div>
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
                        {isEs ? "Ciudad" : "City"} <span className="text-red-400">*</span>
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
                                : isEs
                                  ? "La ciudad es obligatoria"
                                  : "City is required",
                            }));
                          }}
                          onFocus={() => setShowCitySuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowCitySuggestions(false), 200);
                            if (!cityQuery.trim())
                              setFieldErrors((s) => ({
                                ...s,
                                "address.city": isEs
                                  ? "La ciudad es obligatoria"
                                  : "City is required",
                              }));
                          }}
                          disabled={!selectedState}
                          placeholder={
                            selectedState
                              ? isEs
                                ? "Buscar ciudad..."
                                : "Search city..."
                              : isEs
                                ? "Selecciona depto. primero"
                                : "Select dept first"
                          }
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
                            <div className="px-3 py-2 text-sm text-gray-400">
                              {isEs ? "Cargando..." : "Loading..."}
                            </div>
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
                        {isEs ? "Tipo de calle" : "Street Type"}{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={form.address.streetType}
                        onChange={(e) => {
                          updateAddressField("streetType", e.target.value);
                          setFieldErrors((s) => ({ ...s, "address.street": undefined }));
                        }}
                        className={`w-full h-11 px-2 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${fieldErrors["address.street"] ? "border-red-500" : "border-[#262626]"}`}
                      >
                        <option value="">{isEs ? "Seleccionar tipo" : "Select type"}</option>
                        <option value="Calle">Calle</option>
                        <option value="Carrera">Carrera</option>
                        <option value="Avenida">Avenida</option>
                        <option value="Diagonal">Diagonal</option>
                        <option value="Transversal">Transversal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isEs ? "Número" : "Number"} <span className="text-red-400">*</span>
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
                        {isEs ? "Propiedad #" : "Property #"}{" "}
                        <span className="text-red-400">*</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comp. <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.address.complementaryNumber}
                        onChange={(e) => {
                          updateAddressField("complementaryNumber", e.target.value);
                          setFieldErrors((s) => ({
                            ...s,
                            "address.complementaryNumber": e.target.value.trim()
                              ? undefined
                              : isEs
                                ? "El número complementario es obligatorio"
                                : "Complementary number is required",
                          }));
                        }}
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            setFieldErrors((s) => ({
                              ...s,
                              "address.complementaryNumber": isEs
                                ? "El número complementario es obligatorio"
                                : "Complementary number is required",
                            }));
                          }
                        }}
                        placeholder="e.g. 67"
                        className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                          fieldErrors["address.complementaryNumber"]
                            ? "border-red-500"
                            : "border-[#262626]"
                        }`}
                      />
                      {fieldErrors["address.complementaryNumber"] && (
                        <p className="text-xs text-red-400 mt-1">
                          {fieldErrors["address.complementaryNumber"]}
                        </p>
                      )}
                    </div>
                  </div>
                  {fieldErrors["address.street"] && (
                    <p className="text-xs text-red-400 -mt-4">{fieldErrors["address.street"]}</p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "Detalles adicionales" : "Additional Details"}
                    </label>
                    <textarea
                      value={form.address.additionalInfo}
                      onChange={(e) => updateAddressField("additionalInfo", e.target.value)}
                      placeholder={
                        isEs
                          ? "Ej. Cerca de la entrada principal, 2do piso"
                          : "e.g. Near the main entrance, 2nd floor"
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                    />
                  </div>
                </div>

                {/* Material Capacities Section */}
                <div className="space-y-6 flex flex-col">
                  <div className="flex items-center justify-between border-l-4 border-[#FFD700] pl-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {isEs ? "Capacidades de material" : "Material Capacities"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.materialCapacities.filter((c) => c.maxQuantity !== "").length}{" "}
                        {isEs ? "de" : "of"} {form.materialCapacities.length}{" "}
                        {isEs ? "configuradas — todas requeridas" : "configured — all required"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {isEs
                        ? `Pág. ${materialPage} de ${totalMaterialPages}`
                        : `Page ${materialPage} of ${totalMaterialPages}`}
                    </span>
                  </div>
                  {fieldErrors.materialCapacities && (
                    <p className="text-xs text-red-400 -mt-3">{fieldErrors.materialCapacities}</p>
                  )}

                  {/* Bulk Configuration Tool */}
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-[#FFD700] mb-4 pb-3 border-b border-[#2a2a2a]">
                      <Zap size={18} className="animate-pulse" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        {isEs ? "Configuración masiva de capacidad" : "Bulk Capacity Setting"}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          {isEs
                            ? "Filtrar por categoría (opcional)"
                            : "Filter by Category (optional)"}
                        </label>
                        <select
                          className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                          onChange={(e) => {
                            const catId = e.target.value || undefined;
                            const qty = Number(bulkQtyInput);
                            if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty, catId);
                          }}
                        >
                          <option value="">
                            {isEs ? "Todas las categorías" : "All Categories"}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          {isEs ? "Cantidad a establecer *" : "Quantity to Set *"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={bulkQtyInput}
                          onChange={(e) => setBulkQtyInput(e.target.value)}
                          placeholder={isEs ? "Ingresar cantidad" : "Enter quantity"}
                          className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const qty = Number(bulkQtyInput);
                          if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty);
                        }}
                        className="h-10 px-6 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                      >
                        {isEs ? "Aplicar a todos" : "Apply All"}
                      </button>
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

                      // Handle categoryId being either string or populated object/array
                      let categoryName = "General";
                      const catId = type.categoryId as unknown as
                        | string
                        | { name?: string; _id?: string }
                        | Array<{ name?: string; _id?: string }>;
                      if (typeof catId === "string") {
                        const category = categories.find((c) => c._id === catId);
                        categoryName = category?.name || "General";
                      } else if (Array.isArray(catId) && catId.length > 0) {
                        categoryName = (catId[0] as { name?: string })?.name || "General";
                      } else if (catId && typeof catId === "object") {
                        categoryName = (catId as { name?: string })?.name || "General";
                      }

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
                            <p className="text-xs text-gray-500">{categoryName}</p>
                          </div>
                          <div className="w-28 shrink-0">
                            <input
                              type="number"
                              min={0}
                              value={capacity?.maxQuantity ?? ""}
                              onChange={(e) => updateCapacity(type._id, e.target.value)}
                              placeholder={isEs ? "cant. requerida" : "qty required"}
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
                  {isEs ? "Crear ubicación" : "Create Location"}
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
                <h2 className="text-2xl font-bold text-white">
                  {isEs ? "Editar ubicación" : "Edit Location"}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isEs
                    ? "Actualiza la ubicación y las capacidades de material"
                    : "Update location and material capacities"}
                </p>
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
              {/* NOTE: Edit modal -categoryId handler active below */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-l-4 border-[#FFD700] pl-3">
                    {isEs ? "Información general" : "General Information"}
                  </h3>

                  {/* Location Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "Nombre de ubicación" : "Location Name"}{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => {
                        updateForm("name", e.target.value);
                        setFieldErrors((s) => ({ ...s, name: undefined }));
                      }}
                      onBlur={() => {
                        if (!form.name.trim())
                          setFieldErrors((s) => ({
                            ...s,
                            name: isEs ? "El nombre es obligatorio" : "Name is required",
                          }));
                      }}
                      placeholder={isEs ? "Nombre del almacén" : "Warehouse name"}
                      className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                        fieldErrors.name ? "border-red-500" : "border-[#262626]"
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "Estado" : "Status"} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => {
                        updateForm(
                          "status",
                          e.target.value as
                            | "available"
                            | "full_capacity"
                            | "maintenance"
                            | "inactive",
                        );
                      }}
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="available">{isEs ? "Disponible" : "Available"}</option>
                      <option value="full_capacity">
                        {isEs ? "Capacidad llena" : "Full Capacity"}
                      </option>
                      <option value="maintenance">{isEs ? "Mantenimiento" : "Maintenance"}</option>
                      <option value="inactive">{isEs ? "Inactivo" : "Inactive"}</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "País" : "Country"}
                    </label>
                    <input
                      value="Colombia"
                      disabled
                      className="w-full h-11 px-3 bg-[#111111] border border-[#262626] rounded-md text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isEs ? "Departamento" : "Department"}{" "}
                        <span className="text-red-400">*</span>
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
                                "address.state": isEs
                                  ? "El departamento es obligatorio"
                                  : "Department is required",
                              }));
                          }}
                          placeholder={isEs ? "Buscar departamento..." : "e.g. Cundinamarca"}
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
                        {isEs ? "Ciudad" : "City"} <span className="text-red-400">*</span>
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
                              "address.city": isEs
                                ? "La ciudad es obligatoria"
                                : "City is required",
                            }));
                        }}
                        placeholder={isEs ? "Buscar ciudad..." : "e.g. Bogotá"}
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
                        {isEs ? "Tipo de calle" : "Street Type"}{" "}
                        <span className="text-red-400">*</span>
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
                        <option value="">{isEs ? "Tipo" : "Type"}</option>
                        <option value="Calle">Calle</option>
                        <option value="Carrera">Carrera</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isEs ? "Número" : "#"} <span className="text-red-400">*</span>
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
                        {isEs ? "Número secundario" : "Secondary"}{" "}
                        <span className="text-red-400">*</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comp. <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.address.complementaryNumber}
                        onChange={(e) => {
                          updateAddressField("complementaryNumber", e.target.value);
                          setFieldErrors((s) => ({
                            ...s,
                            "address.complementaryNumber": undefined,
                          }));
                        }}
                        placeholder="30"
                        className={`w-full h-11 px-3 bg-[#111111] border rounded-md text-white focus:outline-none ${
                          fieldErrors["address.complementaryNumber"]
                            ? "border-red-500"
                            : "border-[#262626]"
                        }`}
                      />
                    </div>
                  </div>
                  {(fieldErrors["address.street"] ||
                    fieldErrors["address.propertyNumber"] ||
                    fieldErrors["address.complementaryNumber"]) && (
                    <p className="text-xs text-red-400 -mt-3">
                      {fieldErrors["address.street"] ||
                        fieldErrors["address.propertyNumber"] ||
                        fieldErrors["address.complementaryNumber"]}
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isEs ? "Detalles adicionales" : "Additional Details"}
                    </label>
                    <textarea
                      value={form.address.additionalInfo}
                      onChange={(e) => updateAddressField("additionalInfo", e.target.value)}
                      rows={2}
                      placeholder={
                        isEs
                          ? "Apartamento, piso, referencias..."
                          : "Apartment, suite, floor, references..."
                      }
                      className="w-full px-3 py-2 bg-[#111111] border border-[#262626] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6 flex flex-col">
                  <div className="flex items-center justify-between border-l-4 border-[#FFD700] pl-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {isEs ? "Capacidades de material" : "Material Capacities"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.materialCapacities.filter((c) => c.maxQuantity !== "").length}{" "}
                        {isEs ? "de" : "of"} {form.materialCapacities.length}{" "}
                        {isEs ? "configuradas — todas requeridas" : "configured — all required"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {isEs
                        ? `Pág. ${materialPage} de ${totalMaterialPages}`
                        : `Page ${materialPage} of ${totalMaterialPages}`}
                    </span>
                  </div>
                  {fieldErrors.materialCapacities && (
                    <p className="text-xs text-red-400 -mt-3">{fieldErrors.materialCapacities}</p>
                  )}

                  {/* Bulk Configuration Tool */}
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-[#FFD700] mb-4 pb-3 border-b border-[#2a2a2a]">
                      <Zap size={18} className="animate-pulse" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        {isEs ? "Configuración masiva de capacidad" : "Bulk Capacity Setting"}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          {isEs
                            ? "Filtrar por categoría (opcional)"
                            : "Filter by Category (optional)"}
                        </label>
                        <select
                          className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                          onChange={(e) => {
                            const catId = e.target.value || undefined;
                            const qty = Number(bulkQtyInput);
                            if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty, catId);
                          }}
                        >
                          <option value="">
                            {isEs ? "Todas las categorías" : "All Categories"}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          {isEs ? "Cantidad a establecer *" : "Quantity to Set *"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={bulkQtyInput}
                          onChange={(e) => setBulkQtyInput(e.target.value)}
                          placeholder={isEs ? "Ingresar cantidad" : "Enter quantity"}
                          className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const qty = Number(bulkQtyInput);
                          if (bulkQtyInput.trim() && !isNaN(qty)) applyBulkCapacity(qty);
                        }}
                        className="h-10 px-6 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                      >
                        {isEs ? "Aplicar a todos" : "Apply All"}
                      </button>
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

                      // Handle categoryId being either string or populated object/array
                      let categoryName = "General";
                      const catId = type.categoryId as unknown as
                        | string
                        | { name?: string; _id?: string }
                        | Array<{ name?: string; _id?: string }>;
                      if (typeof catId === "string") {
                        const category = categories.find((c) => c._id === catId);
                        categoryName = category?.name || "General";
                      } else if (Array.isArray(catId) && catId.length > 0) {
                        categoryName = (catId[0] as { name?: string })?.name || "General";
                      } else if (catId && typeof catId === "object") {
                        categoryName = (catId as { name?: string })?.name || "General";
                      }

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
                            <p className="text-xs text-gray-500">{categoryName}</p>
                          </div>
                          <div className="w-28 shrink-0">
                            <input
                              type="number"
                              min={0}
                              value={capacity?.maxQuantity ?? ""}
                              onChange={(e) => updateCapacity(type._id, e.target.value)}
                              placeholder={isEs ? "cant. requerida" : "qty required"}
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
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFC700] transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                >
                  {isEs ? "Guardar cambios" : "Save Changes"}
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
                <h2 className="text-2xl font-bold text-white">
                  {isEs ? "Detalles de ubicación" : "Location Details"}
                </h2>
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
                      {isEs ? "Información básica" : "Basic Information"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                          {isEs ? "Estado" : "Status"}
                        </p>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-1 shadow-sm ${
                            previewing.status === "available"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : previewing.status === "full_capacity"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${previewing.status === "available" ? "bg-green-400" : previewing.status === "full_capacity" ? "bg-red-400" : "bg-yellow-400"}`}
                          ></div>
                          {previewing.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">
                            {isEs ? "Creado" : "Created"}
                          </p>
                          <p className="text-white font-medium mt-1">
                            {previewing.createdAt
                              ? new Date(previewing.createdAt).toLocaleDateString()
                              : isEs
                                ? "N/D"
                                : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">
                            {isEs ? "Actualizado" : "Updated"}
                          </p>
                          <p className="text-white font-medium mt-1">
                            {previewing.updatedAt
                              ? new Date(previewing.updatedAt).toLocaleDateString()
                              : isEs
                                ? "N/D"
                                : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333]">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      {isEs ? "Datos de dirección" : "Address Details"}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">
                            {isEs ? "País" : "Country"}
                          </p>
                          <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                            Colombia
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">
                            {isEs ? "Departamento" : "Department"}
                          </p>
                          <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                            {previewing.address?.department || (isEs ? "N/D" : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">
                            {isEs ? "Ciudad" : "City"}
                          </p>
                          <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                            {previewing.address?.city || (isEs ? "N/D" : "N/A")}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">
                          {isEs ? "Dirección completa" : "Full Address"}
                        </p>
                        <p className="text-white text-sm bg-[#111] p-3 rounded-lg border border-[#2a2a2a] break-words">
                          {previewing.address?.streetType &&
                          previewing.address?.primaryNumber &&
                          previewing.address?.secondaryNumber
                            ? `${previewing.address.streetType} ${previewing.address.primaryNumber} #${previewing.address.secondaryNumber}${previewing.address.complementaryNumber ? `-${previewing.address.complementaryNumber}` : ""}`
                            : isEs
                              ? "N/D"
                              : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material Capacities Table */}
                <div className="bg-[#1a1a1a] rounded-xl border border-[#333] flex flex-col h-full">
                  <div className="p-4 border-b border-[#333]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                        {isEs ? "Capacidades de material" : "Material Capacities"}
                      </h3>
                      <div className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 font-bold">
                        {(() => {
                          const filtered = materialTypes.filter((mt) => {
                            // Get category ID from potentially populated field
                            const catId = mt.categoryId as unknown as
                              | string
                              | { name?: string; _id?: string }
                              | Array<{ name?: string; _id?: string }>;
                            let actualCategoryId = "";
                            if (typeof catId === "string") {
                              actualCategoryId = catId;
                            } else if (Array.isArray(catId) && catId.length > 0) {
                              actualCategoryId = (catId[0] as { _id?: string })?._id || "";
                            } else if (catId && typeof catId === "object") {
                              actualCategoryId = (catId as { _id?: string })?._id || "";
                            }

                            // Filter by selected category
                            if (
                              previewSelectedCategory &&
                              actualCategoryId !== previewSelectedCategory
                            ) {
                              return false;
                            }

                            // Filter by search term
                            if (previewSearchTerm) {
                              const matchesName = mt.name
                                .toLowerCase()
                                .includes(previewSearchTerm.toLowerCase());
                              if (!matchesName) {
                                let categoryName = "General";
                                if (typeof catId === "string") {
                                  const category = categories.find((c) => c._id === catId);
                                  categoryName = category?.name || "General";
                                } else if (Array.isArray(catId) && catId.length > 0) {
                                  categoryName = (catId[0] as { name?: string })?.name || "General";
                                } else if (catId && typeof catId === "object") {
                                  categoryName = (catId as { name?: string })?.name || "General";
                                }
                                return categoryName
                                  .toLowerCase()
                                  .includes(previewSearchTerm.toLowerCase());
                              }
                            }

                            return true;
                          });
                          return filtered.length;
                        })()}{" "}
                        / {materialTypes.length} {isEs ? "TIPOS" : "TYPES"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <select
                        value={previewSelectedCategory}
                        onChange={(e) => {
                          setPreviewSelectedCategory(e.target.value);
                          setPreviewPage(1);
                        }}
                        className="h-9 px-3 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="">{isEs ? "Todas las categorías" : "All Categories"}</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={previewSearchTerm}
                        onChange={(e) => {
                          setPreviewSearchTerm(e.target.value);
                          setPreviewPage(1);
                        }}
                        placeholder={
                          isEs ? "Buscar por nombre de material..." : "Search by material name..."
                        }
                        className="h-9 px-3 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-[#1a1a1a] z-10 shadow-sm shadow-black/20">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {isEs ? "Tipo de material" : "Material Type"}
                          </th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
                            {isEs ? "Límite" : "Limit"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a2a]">
                        {(() => {
                          const filteredMaterials = materialTypes.filter((mt) => {
                            // Get category ID from potentially populated field
                            const catId = mt.categoryId as unknown as
                              | string
                              | { name?: string; _id?: string }
                              | Array<{ name?: string; _id?: string }>;
                            let actualCategoryId = "";
                            if (typeof catId === "string") {
                              actualCategoryId = catId;
                            } else if (Array.isArray(catId) && catId.length > 0) {
                              actualCategoryId = (catId[0] as { _id?: string })?._id || "";
                            } else if (catId && typeof catId === "object") {
                              actualCategoryId = (catId as { _id?: string })?._id || "";
                            }

                            // Filter by selected category
                            if (
                              previewSelectedCategory &&
                              actualCategoryId !== previewSelectedCategory
                            ) {
                              return false;
                            }

                            // Filter by search term
                            if (previewSearchTerm) {
                              const matchesName = mt.name
                                .toLowerCase()
                                .includes(previewSearchTerm.toLowerCase());
                              if (!matchesName) {
                                let categoryName = "General";
                                if (typeof catId === "string") {
                                  const category = categories.find((c) => c._id === catId);
                                  categoryName = category?.name || "General";
                                } else if (Array.isArray(catId) && catId.length > 0) {
                                  categoryName = (catId[0] as { name?: string })?.name || "General";
                                } else if (catId && typeof catId === "object") {
                                  categoryName = (catId as { name?: string })?.name || "General";
                                }
                                return categoryName
                                  .toLowerCase()
                                  .includes(previewSearchTerm.toLowerCase());
                              }
                            }

                            return true;
                          });

                          const startIndex = (previewPage - 1) * PREVIEW_ITEMS_PER_PAGE;
                          const endIndex = startIndex + PREVIEW_ITEMS_PER_PAGE;
                          const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

                          return paginatedMaterials.map((mt) => {
                            const cap = (
                              (previewing.materialCapacities as {
                                materialTypeId: string;
                                maxQuantity: number;
                              }[]) || []
                            ).find((c) => c.materialTypeId === mt._id);

                            // Handle categoryId being either string or populated object/array
                            let categoryName = "General";
                            const catId = mt.categoryId as unknown as
                              | string
                              | { name?: string; _id?: string }
                              | Array<{ name?: string; _id?: string }>;
                            if (typeof catId === "string") {
                              const category = categories.find((c) => c._id === catId);
                              categoryName = category?.name || "General";
                            } else if (Array.isArray(catId) && catId.length > 0) {
                              categoryName = (catId[0] as { name?: string })?.name || "General";
                            } else if (catId && typeof catId === "object") {
                              categoryName = (catId as { name?: string })?.name || "General";
                            }

                            return (
                              <tr key={mt._id} className="group hover:bg-white/5 transition-colors">
                                <td className="px-3 py-2.5">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white">
                                      {mt.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500 group-hover:text-yellow-500/70 transition-colors">
                                      {categoryName}
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
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls */}
                  {(() => {
                    const filteredMaterials = materialTypes.filter((mt) => {
                      // Get category ID from potentially populated field
                      const catId = mt.categoryId as unknown as
                        | string
                        | { name?: string; _id?: string }
                        | Array<{ name?: string; _id?: string }>;
                      let actualCategoryId = "";
                      if (typeof catId === "string") {
                        actualCategoryId = catId;
                      } else if (Array.isArray(catId) && catId.length > 0) {
                        actualCategoryId = (catId[0] as { _id?: string })?._id || "";
                      } else if (catId && typeof catId === "object") {
                        actualCategoryId = (catId as { _id?: string })?._id || "";
                      }

                      // Filter by selected category
                      if (previewSelectedCategory && actualCategoryId !== previewSelectedCategory) {
                        return false;
                      }

                      // Filter by search term
                      if (previewSearchTerm) {
                        const matchesName = mt.name
                          .toLowerCase()
                          .includes(previewSearchTerm.toLowerCase());
                        if (!matchesName) {
                          let categoryName = "General";
                          if (typeof catId === "string") {
                            const category = categories.find((c) => c._id === catId);
                            categoryName = category?.name || "General";
                          } else if (Array.isArray(catId) && catId.length > 0) {
                            categoryName = (catId[0] as { name?: string })?.name || "General";
                          } else if (catId && typeof catId === "object") {
                            categoryName = (catId as { name?: string })?.name || "General";
                          }
                          return categoryName
                            .toLowerCase()
                            .includes(previewSearchTerm.toLowerCase());
                        }
                      }

                      return true;
                    });
                    const totalPages = Math.ceil(filteredMaterials.length / PREVIEW_ITEMS_PER_PAGE);

                    if (totalPages <= 1) return null;

                    return (
                      <div className="flex items-center justify-center gap-2 p-3 border-t border-[#333]">
                        <button
                          onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                          disabled={previewPage === 1}
                          className="p-1.5 rounded bg-[#111] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPreviewPage(p)}
                              className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                                previewPage === p
                                  ? "bg-yellow-500 text-black"
                                  : "bg-[#111] text-gray-400 hover:bg-[#222] hover:text-white"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                          disabled={previewPage === totalPages}
                          className="p-1.5 rounded bg-[#111] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-[#333] shrink-0">
              <button
                onClick={closePreviewModal}
                className="px-8 py-2.5 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-[#222] transition-all border border-[#333] shadow-lg shadow-black/20 active:scale-95 text-sm uppercase tracking-wider"
              >
                {isEs ? "Cerrar detalles" : "Close Details"}
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
              <h2 className="text-xl font-bold text-white">
                {isEs ? "Importar ubicaciones" : "Import Locations"}
              </h2>
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
                {isEs
                  ? "Sube un archivo CSV o Excel (.csv, .xlsx, .xls) con datos de ubicaciones. El archivo debe contener las siguientes columnas:"
                  : "Upload a CSV or Excel file (.csv, .xlsx, .xls) with location data. The file should contain the following columns:"}
              </p>

              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#333]">
                <p className="text-xs text-gray-500 mb-2">
                  {isEs ? "Columnas requeridas:" : "Required Columns:"}
                </p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• {isEs ? "Nombre" : "Name"}</li>
                  <li>• {isEs ? "Tipo de calle" : "Street Type"}</li>
                  <li>• {isEs ? "Número principal" : "Primary Number"}</li>
                  <li>• {isEs ? "Número secundario" : "Secondary Number"}</li>
                  <li>
                    •{" "}
                    {isEs ? "Número complementario (opcional)" : "Complementary Number (optional)"}
                  </li>
                  <li>• {isEs ? "Departamento" : "State"}</li>
                  <li>• {isEs ? "Ciudad" : "City"}</li>
                  <li>
                    • {isEs ? "Detalles adicionales (opcional)" : "Additional Details (optional)"}
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isEs ? "Seleccionar archivo" : "Select File"}
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
                    {isEs ? "Seleccionado:" : "Selected:"} {importFile.name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing
                    ? isEs
                      ? "Importando..."
                      : "Importing..."
                    : isEs
                      ? "Importar"
                      : "Import"}
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
                  {isEs ? "Cancelar" : "Cancel"}
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
        secondaryText={isEs ? "Mantener existentes" : "Keep existing"}
        onSecondaryAction={() => {
          if (bulkConfirmPending)
            doApplyBulkCapacity(bulkConfirmPending.val, bulkConfirmPending.categoryId, true);
          setBulkConfirmPending(null);
        }}
        title={isEs ? "Aplicar capacidad masiva" : "Apply bulk capacity"}
        message={
          isEs
            ? '¿Cómo deseas aplicar este valor? "Sobrescribir todo" reemplaza todos los valores. "Mantener existentes" solo completa los tipos de material que aún no han sido definidos.'
            : 'How do you want to apply this value? "Override all" replaces every value. "Keep existing" only fills in material types that haven\'t been set yet.'
        }
        confirmText={isEs ? "Sobrescribir todo" : "Override all"}
        cancelText={isEs ? "Cancelar" : "Cancel"}
        variant="warning"
      />

      {/* Delete confirmation dialog (reused ConfirmDialog component) */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={isEs ? "Eliminar ubicación" : "Delete location"}
        message={
          isEs
            ? "¿Confirmas eliminar esta ubicación? Esta acción no se puede deshacer."
            : "Are you sure you want to delete this location? This action cannot be undone."
        }
        confirmText={isEs ? "Eliminar" : "Delete"}
        cancelText={isEs ? "Cancelar" : "Cancel"}
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
