import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, Ban, X } from "lucide-react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import {
  getCustomers,
  getDocumentTypes,
  createCustomer,
  updateCustomer,
  blacklistCustomer,
  deleteCustomer,
} from "../../../services/customerService";
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerStatus,
  DocumentType,
  DocumentTypeInfo,
} from "../../../types/api";
import { ApiError } from "../../../lib/api";
import {
  validateEmail,
  validateFirstName,
  validateLastName,
  validateRequiredPhone,
  validatePostalCode,
  validateState,
} from "../../../utils/validators";
import { useAlertModal } from "../../../hooks/useAlertModal";

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

const COLOMBIA_PHONE_PREFIX = "+57";
const COLOMBIA_STREET_TYPES = [
  "Calle",
  "Carrera",
  "Avenida",
  "Transversal",
  "Diagonal",
  "Circular",
] as const;
const ADDRESS_SEGMENT_MAX_LENGTH = 8;
const ADDRESS_DETAILS_MAX_LENGTH = 80;
const COLOMBIAN_ADDRESS_SEGMENT_REGEX = /^[0-9]{1,4}(?:[ª°º])?(?:\s?[A-Za-z])?$/;

type CustomerFormField =
  | "firstName"
  | "firstSurname"
  | "email"
  | "phone"
  | "documentNumber"
  | "streetType"
  | "mainNumber"
  | "secondaryNumber"
  | "complementaryNumber"
  | "additionalDetails"
  | "stateQuery"
  | "cityQuery"
  | "postalCode";

/** Try to decompose a previously-composed street string. */
function parseStreet(street: string) {
  const re =
    /^(Calle|Carrera|Avenida|Transversal|Diagonal|Circular)\s+(.+?)\s*#\s*(.+?)\s*-\s*(.+?)(?:\s*,\s*(.+))?$/i;
  const m = street.match(re);
  if (!m) return null;
  return {
    streetType: m[1],
    mainNumber: m[2],
    secondaryNumber: m[3],
    complementaryNumber: m[4],
    additionalDetails: m[5] ?? "",
  };
}

export default function Customers() {
  const { showError, AlertModal } = useAlertModal();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerPayload>({
    name: {
      firstName: "",
      firstSurname: "",
    },
    email: "",
    phone: "",
    documentType: "cc",
    documentNumber: "",
  });

  // Address sub-fields (split like SignUp)
  const [streetType, setStreetType] = useState("");
  const [mainNumber, setMainNumber] = useState("");
  const [secondaryNumber, setSecondaryNumber] = useState("");
  const [complementaryNumber, setComplementaryNumber] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [postalCodeField, setPostalCodeField] = useState("");

  // Colombia API autocomplete
  const [selectedState, setSelectedState] = useState<ColombiaDepartment | null>(null);
  const [selectedCity, setSelectedCity] = useState<ColombiaCity | null>(null);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [debouncedStateQuery] = useDebounce(stateQuery, 200);

  // Real-time validation state (like SignUp)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- SWR: Colombia departments & cities ------------------------------------
  const { data: departments, isLoading: deptLoading } = useSWR<ColombiaDepartment[]>(
    "https://api-colombia.com/api/v1/Department",
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, keepPreviousData: true },
  );

  const { data: stateCities, isLoading: citiesLoading } = useSWR<ColombiaCity[]>(
    selectedState ? `https://api-colombia.com/api/v1/Department/${selectedState.id}/cities` : null,
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  // --- Normalize helpers ----------------------------------------------------
  const normalize = useCallback(
    (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    [],
  );

  const isNormalizedEqual = useCallback(
    (a: string, b: string) => normalize(a.trim()) === normalize(b.trim()),
    [normalize],
  );

  // Client-side filter for departments
  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!debouncedStateQuery.trim()) return departments;
    const nq = normalize(debouncedStateQuery);
    const prefixMatches = departments.filter((d) => normalize(d.name).startsWith(nq));
    if (prefixMatches.length) return prefixMatches;
    return departments.filter((d) => normalize(d.name).includes(nq));
  }, [departments, debouncedStateQuery, normalize]);

  // Client-side filter for cities
  const filteredCities = useMemo(() => {
    if (!stateCities) return [];
    if (!cityQuery.trim()) return stateCities;
    const nq = normalize(cityQuery);
    const prefixMatches = stateCities.filter((c) => normalize(c.name).startsWith(nq));
    if (prefixMatches.length) return prefixMatches;
    return stateCities.filter((c) => normalize(c.name).includes(nq));
  }, [stateCities, cityQuery, normalize]);

  // --- Input formatting helpers (matching SignUp) ----------------------------
  const formatNameInput = (value: string) => {
    let v = value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
    v = v.replace(/\s{2,}/g, " ");
    v = v.slice(0, 50);
    if (!v) return v;
    return v.charAt(0).toUpperCase() + v.slice(1);
  };

  const formatPhoneInput = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const formatEmailInput = (value: string) => value.trim().toLowerCase();

  const formatPostalCodeInput = (value: string) => value.replace(/\D/g, "").slice(0, 6);

  const formatStateInput = (value: string) =>
    value.replace(/[^A-Za-zÀ-ÿ\s]/g, "").replace(/\s{2,}/g, " ");

  const formatAddressSegmentInput = (value: string) => {
    const cleaned = value
      .toUpperCase()
      .replace(/[^0-9A-Zª°º\s]/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
    const digitsMatch = cleaned.match(/^\d{0,4}/);
    const digits = digitsMatch?.[0] ?? "";
    const remainder = cleaned.slice(digits.length).replace(/\s/g, "");
    if (!digits) return "";
    const ordinal = remainder.match(/[ª°º]/)?.[0] ?? "";
    const suffix = remainder.match(/[A-Z]/)?.[0] ?? "";
    const withSuffix = suffix ? `${digits}${ordinal} ${suffix}` : `${digits}${ordinal}`;
    return withSuffix.slice(0, ADDRESS_SEGMENT_MAX_LENGTH);
  };

  const formatAddressDetailsInput = (value: string) =>
    value
      .replace(/[^A-Za-zÀ-ÿ0-9\s#.,\-/]/g, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, ADDRESS_DETAILS_MAX_LENGTH);

  const toColombianPhone = useCallback(
    (digits: string) => (digits ? `${COLOMBIA_PHONE_PREFIX}${digits}` : ""),
    [],
  );

  // --- Composed street preview ----------------------------------------------
  const formattedStreetBase = useMemo(() => {
    if (!streetType || !mainNumber || !secondaryNumber || !complementaryNumber) return "";
    return `${streetType} ${mainNumber} # ${secondaryNumber}-${complementaryNumber}`;
  }, [streetType, mainNumber, secondaryNumber, complementaryNumber]);

  const formattedStreet = useMemo(() => {
    if (!formattedStreetBase) return "";
    const d = additionalDetails.trim();
    return d ? `${formattedStreetBase}, ${d}` : formattedStreetBase;
  }, [formattedStreetBase, additionalDetails]);

  const canEditPostalCode = !!selectedCity && !selectedCity.postalCode;

  // --- Styling helper (same as SignUp) --------------------------------------
  const inputClass = (hasError: boolean) =>
    `w-full bg-zinc-900 rounded-xl py-3 px-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"}`;

  const phoneInputWrapperClass = (hasError: boolean) =>
    `w-full bg-zinc-900 rounded-xl text-white transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus-within:border-red-500" : "border-zinc-800 focus-within:border-yellow-400"}`;

  // --- Validation helpers ---------------------------------------------------
  const markFieldTouched = (field: CustomerFormField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleFieldChange = (field: CustomerFormField) => {
    markFieldTouched(field);
  };

  const validateAddressSegmentField = (value: string, label: string) => {
    if (!value) return { isValid: false, message: `${label} is required` };
    if (!COLOMBIAN_ADDRESS_SEGMENT_REGEX.test(value))
      return { isValid: false, message: `${label} must follow formats like 8, 8A, 8ª or 8ª E` };
    return { isValid: true };
  };

  /** Run validation across all form fields and return the error map. */
  const runValidation = useCallback(
    (opts?: { allTouched?: boolean }) => {
      const nextErrors: Record<string, string> = {};
      const touchedState = opts?.allTouched
        ? Object.fromEntries(
            (
              [
                "firstName",
                "firstSurname",
                "email",
                "phone",
                "documentNumber",
                "streetType",
                "mainNumber",
                "secondaryNumber",
                "complementaryNumber",
                "additionalDetails",
                "stateQuery",
                "cityQuery",
                "postalCode",
              ] as CustomerFormField[]
            ).map((f) => [f, true]),
          )
        : touched;

      // --- Name ---
      const fnV = validateFirstName(formData.name.firstName);
      if (!fnV.isValid && fnV.message) nextErrors.firstName = fnV.message;

      const lnV = validateLastName(formData.name.firstSurname);
      if (!lnV.isValid && lnV.message) nextErrors.firstSurname = lnV.message;

      // --- Contact ---
      const emailV = validateEmail(formData.email);
      if (!emailV.isValid && emailV.message) nextErrors.email = emailV.message;

      const phoneV = validateRequiredPhone(toColombianPhone(formData.phone));
      if (!phoneV.isValid && phoneV.message) nextErrors.phone = phoneV.message;

      // --- Document ---
      if (!formData.documentNumber.trim()) {
        nextErrors.documentNumber = "Document number is required";
      } else if (formData.documentNumber.length > 50) {
        nextErrors.documentNumber = "Maximum 50 characters";
      }

      // --- Address (optional but validated if any part filled) ---
      if (!streetType) nextErrors.streetType = "Street type is required";

      const mainV = validateAddressSegmentField(mainNumber, "Primary number");
      if (!mainV.isValid && mainV.message) nextErrors.mainNumber = mainV.message;

      const secV = validateAddressSegmentField(secondaryNumber, "Secondary number");
      if (!secV.isValid && secV.message) nextErrors.secondaryNumber = secV.message;

      const compV = validateAddressSegmentField(complementaryNumber, "Complementary number");
      if (!compV.isValid && compV.message) nextErrors.complementaryNumber = compV.message;

      if (additionalDetails.length > ADDRESS_DETAILS_MAX_LENGTH)
        nextErrors.additionalDetails = `Must not exceed ${ADDRESS_DETAILS_MAX_LENGTH} characters`;

      const isStateSelected = !!selectedState && isNormalizedEqual(stateQuery, selectedState.name);
      const stateV = validateState(stateQuery, isStateSelected);
      if (!stateV.isValid && stateV.message) nextErrors.stateQuery = stateV.message;

      if (!cityQuery.trim()) {
        nextErrors.cityQuery = "City is required";
      } else if (!selectedCity || !isNormalizedEqual(cityQuery, selectedCity.name)) {
        nextErrors.cityQuery = "Please select a valid city from the list";
      }

      if (selectedCity && !selectedCity.postalCode && !postalCodeField.trim()) {
        nextErrors.postalCode = "Postal code is required";
      } else {
        const pcV = validatePostalCode(postalCodeField);
        if (!pcV.isValid && pcV.message) nextErrors.postalCode = pcV.message;
      }

      // Only expose errors for touched or submitted fields
      const visible: Record<string, string> = {};
      for (const [field, msg] of Object.entries(nextErrors)) {
        if (touchedState[field] || submitted || opts?.allTouched) {
          visible[field] = msg;
        }
      }
      setFieldErrors(visible);
      return nextErrors;
    },
    [
      formData,
      touched,
      submitted,
      streetType,
      mainNumber,
      secondaryNumber,
      complementaryNumber,
      additionalDetails,
      stateQuery,
      cityQuery,
      postalCodeField,
      selectedState,
      selectedCity,
      isNormalizedEqual,
      toColombianPhone,
    ],
  );

  /** Validate a single field on blur. */
  const validateFieldOnBlur = (field: CustomerFormField) => {
    markFieldTouched(field);
    // Rerun full validation so cross-field checks stay in sync
    const nextTouched = { ...touched, [field]: true };
    setTouched(nextTouched);
    // We need to compute visible errors with updated touched
    runValidation();
  };

  // Re-run validation whenever relevant state changes (after touched updates)
  useEffect(() => {
    if (Object.keys(touched).length > 0 || submitted) {
      runValidation();
    }
  }, [
    formData,
    streetType,
    mainNumber,
    secondaryNumber,
    complementaryNumber,
    additionalDetails,
    stateQuery,
    cityQuery,
    postalCodeField,
    selectedState,
    selectedCity,
    touched,
    submitted,
    runValidation,
  ]);

  // Fetch document types
  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const response = await getDocumentTypes();
        setDocumentTypes(response.data.documentTypes);
      } catch (err) {
        console.error("Failed to fetch document types:", err);
        setDocumentTypes([
          { value: "cc", displayName: "Colombian National ID", description: "Colombian National ID" },
          { value: "ce", displayName: "Colombian Foreign ID", description: "Colombian Foreign ID" },
          { value: "passport", displayName: "Passport", description: "International Passport" },
          { value: "nit", displayName: "NIT", description: "Tax Identification Number" },
          { value: "other", displayName: "Other", description: "Other identification type" },
        ]);
      } finally {
        setLoadingDocTypes(false);
      }
    };
    void fetchDocTypes();
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCustomers({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setCustomers(response.data.customers);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Error loading customers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  // --- Build address payload from sub-fields --------------------------------
  const buildAddressPayload = () => ({
    street: formattedStreet || undefined,
    city: selectedCity?.name || undefined,
    state: selectedState?.name || undefined,
    country: "Colombia",
    postalCode: postalCodeField || undefined,
  });

  // --- Create customer ------------------------------------------------------
  const handleCreate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const allErrors = runValidation({ allTouched: true });
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload: CreateCustomerPayload = {
        ...formData,
        phone: toColombianPhone(formData.phone),
        address: buildAddressPayload(),
      };
      await createCustomer(payload);
      setShowCreateModal(false);
      resetForm();
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create customer";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Update customer ------------------------------------------------------
  const handleUpdate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSubmitted(true);
    const allErrors = runValidation({ allTouched: true });
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload: UpdateCustomerPayload = {
        name: {
          firstName: formData.name.firstName,
          firstSurname: formData.name.firstSurname,
          secondName: formData.name.secondName,
          secondSurname: formData.name.secondSurname,
        },
        email: formData.email,
        phone: toColombianPhone(formData.phone),
        address: buildAddressPayload(),
      };
      await updateCustomer(selectedCustomer._id, payload);
      setShowEditModal(false);
      resetForm();
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update customer";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Blacklist customer
  const handleBlacklist = async (customer: Customer) => {
    if (!confirm(`Block ${customer.name.firstName} ${customer.name.firstSurname}?`)) return;

    try {
      await blacklistCustomer(customer._id);
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to blacklist customer";
      showError(message);
    }
  };

  // Delete customer
  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete ${customer.name.firstName} ${customer.name.firstSurname}?`)) return;

    try {
      await deleteCustomer(customer._id);
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete customer";
      showError(message);
    }
  };

  // --- Reset address sub-fields --------------------------------------------
  const resetAddressFields = () => {
    setStreetType("");
    setMainNumber("");
    setSecondaryNumber("");
    setComplementaryNumber("");
    setAdditionalDetails("");
    setStateQuery("");
    setCityQuery("");
    setPostalCodeField("");
    setSelectedState(null);
    setSelectedCity(null);
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
  };

  /** Populate address sub-fields from a customer's saved address. */
  const loadAddressFields = (customer: Customer) => {
    const addr = customer.address;
    if (!addr) {
      resetAddressFields();
      return;
    }
    // Try to decompose the street
    if (addr.street) {
      const parsed = parseStreet(addr.street);
      if (parsed) {
        setStreetType(parsed.streetType);
        setMainNumber(parsed.mainNumber);
        setSecondaryNumber(parsed.secondaryNumber);
        setComplementaryNumber(parsed.complementaryNumber);
        setAdditionalDetails(parsed.additionalDetails);
      } else {
        // Fallback: put entire street in additionalDetails
        setStreetType("");
        setMainNumber("");
        setSecondaryNumber("");
        setComplementaryNumber("");
        setAdditionalDetails(addr.street);
      }
    } else {
      setStreetType("");
      setMainNumber("");
      setSecondaryNumber("");
      setComplementaryNumber("");
      setAdditionalDetails("");
    }
    setStateQuery(addr.state ?? "");
    setCityQuery(addr.city ?? "");
    setPostalCodeField(addr.postalCode ?? "");
    // State/City objects will need re-selection from autocomplete
    setSelectedState(null);
    setSelectedCity(null);
  };

  // --- Open edit modal ------------------------------------------------------
  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Strip +57 prefix from phone for the input
    const phoneDigits = customer.phone.startsWith(COLOMBIA_PHONE_PREFIX)
      ? customer.phone.slice(COLOMBIA_PHONE_PREFIX.length)
      : customer.phone;
    setFormData({
      name: {
        firstName: customer.name.firstName,
        firstSurname: customer.name.firstSurname,
        secondName: customer.name.secondName,
        secondSurname: customer.name.secondSurname,
      },
      email: customer.email,
      phone: phoneDigits,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
    });
    loadAddressFields(customer);
    setTouched({});
    setFieldErrors({});
    setSubmitted(false);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: { firstName: "", firstSurname: "" },
      email: "",
      phone: "",
      documentType: documentTypes[0]?.value || "cc",
      documentNumber: "",
    });
    resetAddressFields();
    setTouched({});
    setFieldErrors({});
    setSubmitted(false);
    setSelectedCustomer(null);
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success">Active</span>;
      case "inactive":
        return <span className="badge badge-warning">Inactive</span>;
      case "blacklisted":
        return <span className="badge badge-danger">Blocked</span>;
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const docType = documentTypes.find((dt) => dt.value === type);
    return docType?.displayName || type;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-gray-400">Manage your organization's customers</p>
        </div>

        {/* Global Error */}
        {error && (
          <div className="card mb-6 bg-red-500/10 border-red-500/30">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or document..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CustomerStatus | "");
                setCurrentPage(1);
              }}
              className="input md:w-48"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blocked</option>
            </select>

            {/* Create Button */}
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              New Customer
            </button>
          </div>
        </div>

        {/* Table */}
        {loading || loadingDocTypes ? (
          <div className="card flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
            <p className="mt-4 text-gray-400">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">No customers found</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="font-medium text-white">
                        {customer.name.firstName} {customer.name.firstSurname}
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>
                        <div className="text-xs">
                          <div className="text-gray-500">{getDocumentTypeLabel(customer.documentType)}</div>
                          <div>{customer.documentNumber}</div>
                        </div>
                      </td>
                      <td>{getStatusBadge(customer.status)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(customer)}
                            className="btn-icon text-blue-400 hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          {customer.status !== "blacklisted" && (
                            <button
                              onClick={() => void handleBlacklist(customer)}
                              className="btn-icon text-yellow-400 hover:text-yellow-300"
                              title="Block"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => void handleDelete(customer)}
                            className="btn-icon text-red-400 hover:text-red-300"
                            title="Delete"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, total)} of {total} customers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateModal(false);
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-xl font-bold">Create New Customer</h2>
                <button onClick={() => setShowCreateModal(false)} className="btn-icon">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        value={formData.name.firstName}
                        onChange={(e) => {
                          handleFieldChange("firstName");
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, firstName: v } });
                        }}
                        onBlur={() => validateFieldOnBlur("firstName")}
                        className={inputClass(!!fieldErrors.firstName)}
                        disabled={submitting}
                      />
                      {fieldErrors.firstName && <p className="text-red-400 text-xs mt-1">{fieldErrors.firstName}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        value={formData.name.secondName || ""}
                        onChange={(e) => {
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, secondName: v } });
                        }}
                        className={inputClass(false)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        value={formData.name.firstSurname}
                        onChange={(e) => {
                          handleFieldChange("firstSurname");
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, firstSurname: v } });
                        }}
                        onBlur={() => validateFieldOnBlur("firstSurname")}
                        className={inputClass(!!fieldErrors.firstSurname)}
                        disabled={submitting}
                      />
                      {fieldErrors.firstSurname && <p className="text-red-400 text-xs mt-1">{fieldErrors.firstSurname}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Second Last Name</label>
                      <input
                        type="text"
                        value={formData.name.secondSurname || ""}
                        onChange={(e) => {
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, secondSurname: v } });
                        }}
                        className={inputClass(false)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        onChange={(e) => {
                          handleFieldChange("email");
                          const v = formatEmailInput(e.target.value);
                          setFormData({ ...formData, email: v });
                        }}
                        onBlur={() => validateFieldOnBlur("email")}
                        className={inputClass(!!fieldErrors.email)}
                        disabled={submitting}
                      />
                      {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <div className={phoneInputWrapperClass(!!fieldErrors.phone)}>
                        <div className="flex items-center">
                          <span className="text-white pl-4 pr-2 select-none whitespace-pre">{`${COLOMBIA_PHONE_PREFIX} `}</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            placeholder="3001234567"
                            value={formData.phone}
                            onChange={(e) => {
                              handleFieldChange("phone");
                              const v = formatPhoneInput(e.target.value);
                              setFormData({ ...formData, phone: v });
                            }}
                            onBlur={() => validateFieldOnBlur("phone")}
                            className="w-full bg-transparent py-3 pr-4 text-white outline-none"
                            disabled={submitting}
                          />
                        </div>
                      </div>
                      {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Document */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Document Type *</label>
                      <select
                        value={formData.documentType}
                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                        className={inputClass(false)}
                        disabled={submitting}
                      >
                        {documentTypes.map((docType) => (
                          <option key={docType.value} value={docType.value}>
                            {docType.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Document Number *</label>
                      <input
                        type="text"
                        value={formData.documentNumber}
                        onChange={(e) => {
                          handleFieldChange("documentNumber");
                          setFormData({ ...formData, documentNumber: e.target.value });
                        }}
                        onBlur={() => validateFieldOnBlur("documentNumber")}
                        className={inputClass(!!fieldErrors.documentNumber)}
                        disabled={submitting}
                      />
                      {fieldErrors.documentNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.documentNumber}</p>}
                    </div>
                  </div>

                  {/* Address */}
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pt-2">Address</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Street Type *</label>
                      <select
                        title="Street Type"
                        value={streetType}
                        onChange={(e) => {
                          handleFieldChange("streetType");
                          setStreetType(e.target.value);
                        }}
                        onBlur={() => validateFieldOnBlur("streetType")}
                        className={inputClass(!!fieldErrors.streetType)}
                        disabled={submitting}
                      >
                        <option disabled value="">Select street type</option>
                        {COLOMBIA_STREET_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {fieldErrors.streetType && <p className="text-red-400 text-xs mt-1">{fieldErrors.streetType}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Primary Number *</label>
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="8ª E"
                        value={mainNumber}
                        onChange={(e) => {
                          handleFieldChange("mainNumber");
                          setMainNumber(formatAddressSegmentInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("mainNumber")}
                        className={inputClass(!!fieldErrors.mainNumber)}
                        disabled={submitting}
                      />
                      {fieldErrors.mainNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.mainNumber}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Secondary Number *</label>
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="93B"
                        value={secondaryNumber}
                        onChange={(e) => {
                          handleFieldChange("secondaryNumber");
                          setSecondaryNumber(formatAddressSegmentInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("secondaryNumber")}
                        className={inputClass(!!fieldErrors.secondaryNumber)}
                        disabled={submitting}
                      />
                      {fieldErrors.secondaryNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.secondaryNumber}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Complementary Number *</label>
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="47A"
                        value={complementaryNumber}
                        onChange={(e) => {
                          handleFieldChange("complementaryNumber");
                          setComplementaryNumber(formatAddressSegmentInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("complementaryNumber")}
                        className={inputClass(!!fieldErrors.complementaryNumber)}
                        disabled={submitting}
                      />
                      {fieldErrors.complementaryNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.complementaryNumber}</p>}
                    </div>

                    <div className="form-group relative">
                      <label className="form-label">Department *</label>
                      <input
                        type="text"
                        placeholder="Search department..."
                        value={stateQuery}
                        autoComplete="off"
                        onChange={(e) => {
                          handleFieldChange("stateQuery");
                          const v = formatStateInput(e.target.value);
                          setStateQuery(v);
                          if (selectedState && v !== selectedState.name) {
                            setSelectedState(null);
                            setSelectedCity(null);
                            setCityQuery("");
                            setPostalCodeField("");
                          }
                          setShowStateSuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowStateSuggestions(false), 200);
                          validateFieldOnBlur("stateQuery");
                        }}
                        onFocus={() => {
                          if (filteredDepartments.length && !selectedState) setShowStateSuggestions(true);
                        }}
                        className={inputClass(!!fieldErrors.stateQuery)}
                        disabled={submitting}
                      />
                      {showStateSuggestions && stateQuery && !selectedState && (
                        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                          {deptLoading || stateQuery !== debouncedStateQuery ? (
                            <div className="p-3 text-gray-400 text-sm">Searching...</div>
                          ) : filteredDepartments.length ? (
                            filteredDepartments.map((dept) => (
                              <button
                                key={dept.id}
                                type="button"
                                className="w-full text-left px-4 py-3 text-white hover:bg-zinc-800 transition"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelectedState(dept);
                                  setStateQuery(dept.name);
                                  setShowStateSuggestions(false);
                                  setCityQuery("");
                                  setSelectedCity(null);
                                  setPostalCodeField("");
                                }}
                              >
                                {dept.name}
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-gray-400 text-sm">No departments found</div>
                          )}
                        </div>
                      )}
                      {fieldErrors.stateQuery && <p className="text-red-400 text-xs mt-1">{fieldErrors.stateQuery}</p>}
                    </div>

                    <div className="form-group relative">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        placeholder={selectedState ? "Search city..." : "Select a department first"}
                        value={cityQuery}
                        autoComplete="off"
                        onChange={(e) => {
                          handleFieldChange("cityQuery");
                          const v = e.target.value;
                          setCityQuery(v);
                          if (selectedCity && !isNormalizedEqual(v, selectedCity.name)) {
                            setSelectedCity(null);
                            setPostalCodeField("");
                          }
                          setShowCitySuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowCitySuggestions(false), 200);
                          validateFieldOnBlur("cityQuery");
                        }}
                        onFocus={() => {
                          if (filteredCities.length && !selectedCity) setShowCitySuggestions(true);
                        }}
                        className={inputClass(!!fieldErrors.cityQuery)}
                        disabled={submitting || !selectedState}
                      />
                      {showCitySuggestions && selectedState && !selectedCity && (
                        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                          {citiesLoading ? (
                            <div className="p-3 text-gray-400 text-sm">Loading cities...</div>
                          ) : filteredCities.length ? (
                            filteredCities.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-4 py-3 text-white hover:bg-zinc-800 transition"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelectedCity(c);
                                  setCityQuery(c.name);
                                  setPostalCodeField(c.postalCode ?? "");
                                  setShowCitySuggestions(false);
                                }}
                              >
                                {c.name}
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-gray-400 text-sm">No cities found</div>
                          )}
                        </div>
                      )}
                      {fieldErrors.cityQuery && <p className="text-red-400 text-xs mt-1">{fieldErrors.cityQuery}</p>}
                    </div>

                    <div className="form-group md:col-span-2">
                      <label className="form-label">Additional Details <span className="text-gray-600">(Optional)</span></label>
                      <input
                        type="text"
                        placeholder="Centro Empresarial, Oficina 602"
                        value={additionalDetails}
                        onChange={(e) => {
                          handleFieldChange("additionalDetails");
                          setAdditionalDetails(formatAddressDetailsInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("additionalDetails")}
                        className={inputClass(!!fieldErrors.additionalDetails)}
                        disabled={submitting}
                      />
                      {fieldErrors.additionalDetails && <p className="text-red-400 text-xs mt-1">{fieldErrors.additionalDetails}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input
                        type="text"
                        placeholder={
                          selectedCity
                            ? canEditPostalCode
                              ? "Enter postal code"
                              : "Auto-filled from city"
                            : "Select a city first"
                        }
                        value={postalCodeField}
                        readOnly={!canEditPostalCode}
                        disabled={submitting || !selectedCity}
                        onChange={(e) => {
                          if (!canEditPostalCode) return;
                          handleFieldChange("postalCode");
                          setPostalCodeField(formatPostalCodeInput(e.target.value));
                        }}
                        onBlur={() => {
                          if (canEditPostalCode) validateFieldOnBlur("postalCode");
                        }}
                        className={inputClass(!!fieldErrors.postalCode)}
                      />
                      {fieldErrors.postalCode && <p className="text-red-400 text-xs mt-1">{fieldErrors.postalCode}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Address Preview</label>
                      <input
                        type="text"
                        value={formattedStreet}
                        readOnly
                        placeholder="Carrera 15 # 93-47"
                        className={inputClass(false)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedCustomer && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditModal(false);
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-xl font-bold">Edit Customer</h2>
                <button onClick={() => setShowEditModal(false)} className="btn-icon">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        value={formData.name.firstName}
                        onChange={(e) => {
                          handleFieldChange("firstName");
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, firstName: v } });
                        }}
                        onBlur={() => validateFieldOnBlur("firstName")}
                        className={inputClass(!!fieldErrors.firstName)}
                        disabled={submitting}
                      />
                      {fieldErrors.firstName && <p className="text-red-400 text-xs mt-1">{fieldErrors.firstName}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        value={formData.name.secondName || ""}
                        onChange={(e) => {
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, secondName: v } });
                        }}
                        className={inputClass(false)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        value={formData.name.firstSurname}
                        onChange={(e) => {
                          handleFieldChange("firstSurname");
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, firstSurname: v } });
                        }}
                        onBlur={() => validateFieldOnBlur("firstSurname")}
                        className={inputClass(!!fieldErrors.firstSurname)}
                        disabled={submitting}
                      />
                      {fieldErrors.firstSurname && <p className="text-red-400 text-xs mt-1">{fieldErrors.firstSurname}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Second Last Name</label>
                      <input
                        type="text"
                        value={formData.name.secondSurname || ""}
                        onChange={(e) => {
                          const v = formatNameInput(e.target.value);
                          setFormData({ ...formData, name: { ...formData.name, secondSurname: v } });
                        }}
                        className={inputClass(false)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        onChange={(e) => {
                          handleFieldChange("email");
                          const v = formatEmailInput(e.target.value);
                          setFormData({ ...formData, email: v });
                        }}
                        onBlur={() => validateFieldOnBlur("email")}
                        className={inputClass(!!fieldErrors.email)}
                        disabled={submitting}
                      />
                      {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <div className={phoneInputWrapperClass(!!fieldErrors.phone)}>
                        <div className="flex items-center">
                          <span className="text-white pl-4 pr-2 select-none whitespace-pre">{`${COLOMBIA_PHONE_PREFIX} `}</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            placeholder="3001234567"
                            value={formData.phone}
                            onChange={(e) => {
                              handleFieldChange("phone");
                              const v = formatPhoneInput(e.target.value);
                              setFormData({ ...formData, phone: v });
                            }}
                            onBlur={() => validateFieldOnBlur("phone")}
                            className="w-full bg-transparent py-3 pr-4 text-white outline-none"
                            disabled={submitting}
                          />
                        </div>
                      </div>
                      {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Document (read-only in edit) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                    <div className="form-group">
                      <label className="form-label">Document Type</label>
                      <input type="text" value={getDocumentTypeLabel(selectedCustomer.documentType)} className={inputClass(false)} disabled />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Document Number</label>
                      <input type="text" value={selectedCustomer.documentNumber} className={inputClass(false)} disabled />
                    </div>
                  </div>

                  {/* Address */}
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pt-2">Address</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Street Type *</label>
                      <select
                        title="Street Type"
                        value={streetType}
                        onChange={(e) => {
                          handleFieldChange("streetType");
                          setStreetType(e.target.value);
                        }}
                        onBlur={() => validateFieldOnBlur("streetType")}
                        className={inputClass(!!fieldErrors.streetType)}
                        disabled={submitting}
                      >
                        <option disabled value="">Select street type</option>
                        {COLOMBIA_STREET_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {fieldErrors.streetType && <p className="text-red-400 text-xs mt-1">{fieldErrors.streetType}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Primary Number *</label>
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="8ª E"
                        value={mainNumber}
                        onChange={(e) => {
                          handleFieldChange("mainNumber");
                          setMainNumber(formatAddressSegmentInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("mainNumber")}
                        className={inputClass(!!fieldErrors.mainNumber)}
                        disabled={submitting}
                      />
                      {fieldErrors.mainNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.mainNumber}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Secondary Number *</label>
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="93B"
                        value={secondaryNumber}
                        onChange={(e) => {
                          handleFieldChange("secondaryNumber");
                          setSecondaryNumber(formatAddressSegmentInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("secondaryNumber")}
                        className={inputClass(!!fieldErrors.secondaryNumber)}
                        disabled={submitting}
                      />
                      {fieldErrors.secondaryNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.secondaryNumber}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Complementary Number *</label>
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="47A"
                        value={complementaryNumber}
                        onChange={(e) => {
                          handleFieldChange("complementaryNumber");
                          setComplementaryNumber(formatAddressSegmentInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("complementaryNumber")}
                        className={inputClass(!!fieldErrors.complementaryNumber)}
                        disabled={submitting}
                      />
                      {fieldErrors.complementaryNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.complementaryNumber}</p>}
                    </div>

                    <div className="form-group relative">
                      <label className="form-label">Department *</label>
                      <input
                        type="text"
                        placeholder="Search department..."
                        value={stateQuery}
                        autoComplete="off"
                        onChange={(e) => {
                          handleFieldChange("stateQuery");
                          const v = formatStateInput(e.target.value);
                          setStateQuery(v);
                          if (selectedState && v !== selectedState.name) {
                            setSelectedState(null);
                            setSelectedCity(null);
                            setCityQuery("");
                            setPostalCodeField("");
                          }
                          setShowStateSuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowStateSuggestions(false), 200);
                          validateFieldOnBlur("stateQuery");
                        }}
                        onFocus={() => {
                          if (filteredDepartments.length && !selectedState) setShowStateSuggestions(true);
                        }}
                        className={inputClass(!!fieldErrors.stateQuery)}
                        disabled={submitting}
                      />
                      {showStateSuggestions && stateQuery && !selectedState && (
                        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                          {deptLoading || stateQuery !== debouncedStateQuery ? (
                            <div className="p-3 text-gray-400 text-sm">Searching...</div>
                          ) : filteredDepartments.length ? (
                            filteredDepartments.map((dept) => (
                              <button
                                key={dept.id}
                                type="button"
                                className="w-full text-left px-4 py-3 text-white hover:bg-zinc-800 transition"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelectedState(dept);
                                  setStateQuery(dept.name);
                                  setShowStateSuggestions(false);
                                  setCityQuery("");
                                  setSelectedCity(null);
                                  setPostalCodeField("");
                                }}
                              >
                                {dept.name}
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-gray-400 text-sm">No departments found</div>
                          )}
                        </div>
                      )}
                      {fieldErrors.stateQuery && <p className="text-red-400 text-xs mt-1">{fieldErrors.stateQuery}</p>}
                    </div>

                    <div className="form-group relative">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        placeholder={selectedState ? "Search city..." : "Select a department first"}
                        value={cityQuery}
                        autoComplete="off"
                        onChange={(e) => {
                          handleFieldChange("cityQuery");
                          const v = e.target.value;
                          setCityQuery(v);
                          if (selectedCity && !isNormalizedEqual(v, selectedCity.name)) {
                            setSelectedCity(null);
                            setPostalCodeField("");
                          }
                          setShowCitySuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowCitySuggestions(false), 200);
                          validateFieldOnBlur("cityQuery");
                        }}
                        onFocus={() => {
                          if (filteredCities.length && !selectedCity) setShowCitySuggestions(true);
                        }}
                        className={inputClass(!!fieldErrors.cityQuery)}
                        disabled={submitting || !selectedState}
                      />
                      {showCitySuggestions && selectedState && !selectedCity && (
                        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                          {citiesLoading ? (
                            <div className="p-3 text-gray-400 text-sm">Loading cities...</div>
                          ) : filteredCities.length ? (
                            filteredCities.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-4 py-3 text-white hover:bg-zinc-800 transition"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelectedCity(c);
                                  setCityQuery(c.name);
                                  setPostalCodeField(c.postalCode ?? "");
                                  setShowCitySuggestions(false);
                                }}
                              >
                                {c.name}
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-gray-400 text-sm">No cities found</div>
                          )}
                        </div>
                      )}
                      {fieldErrors.cityQuery && <p className="text-red-400 text-xs mt-1">{fieldErrors.cityQuery}</p>}
                    </div>

                    <div className="form-group md:col-span-2">
                      <label className="form-label">Additional Details <span className="text-gray-600">(Optional)</span></label>
                      <input
                        type="text"
                        placeholder="Centro Empresarial, Oficina 602"
                        value={additionalDetails}
                        onChange={(e) => {
                          handleFieldChange("additionalDetails");
                          setAdditionalDetails(formatAddressDetailsInput(e.target.value));
                        }}
                        onBlur={() => validateFieldOnBlur("additionalDetails")}
                        className={inputClass(!!fieldErrors.additionalDetails)}
                        disabled={submitting}
                      />
                      {fieldErrors.additionalDetails && <p className="text-red-400 text-xs mt-1">{fieldErrors.additionalDetails}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input
                        type="text"
                        placeholder={
                          selectedCity
                            ? canEditPostalCode
                              ? "Enter postal code"
                              : "Auto-filled from city"
                            : "Select a city first"
                        }
                        value={postalCodeField}
                        readOnly={!canEditPostalCode}
                        disabled={submitting || !selectedCity}
                        onChange={(e) => {
                          if (!canEditPostalCode) return;
                          handleFieldChange("postalCode");
                          setPostalCodeField(formatPostalCodeInput(e.target.value));
                        }}
                        onBlur={() => {
                          if (canEditPostalCode) validateFieldOnBlur("postalCode");
                        }}
                        className={inputClass(!!fieldErrors.postalCode)}
                      />
                      {fieldErrors.postalCode && <p className="text-red-400 text-xs mt-1">{fieldErrors.postalCode}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Address Preview</label>
                      <input
                        type="text"
                        value={formattedStreet}
                        readOnly
                        placeholder="Carrera 15 # 93-47"
                        className={inputClass(false)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <AlertModal />
    </div>
  );
}
