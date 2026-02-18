import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSWR, { mutate } from "swr";
import { useDebounce } from "use-debounce";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { registerUser } from "../services/authService";
import { ApiError } from "../lib/api";
import {
  validateRegistrationForm,
  validateEmail,
  validateFirstName,
  validateLastName,
  validateOrganizationName,
  validateLegalName,
  validateRequiredPhone,
  validatePhone,
  validateTaxId,
  validatePassword,
  validateConfirmPassword,
  validateState,
} from "../utils/validators";
import styles from "./SignUp.module.css";

// --- Colombia API types & fetcher -------------------------------------------
interface ColombiaDepartment {
  id: number;
  name: string;
}

interface ColombiaCity {
  id: number;
  name: string;
  departmentId: number;
}

const colombiaFetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Colombia API error: ${res.status}`);
    return res.json();
  });

export default function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  // Separate emails: organization vs owner
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Separate phones: owner (required) vs organization (optional)
  const [ownerPhone, setOwnerPhone] = useState("");
  const [organizationPhone, setOrganizationPhone] = useState("");
  const [error, setError] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // --- State (Departamento) autocomplete ------------------------------------
  const [stateQuery, setStateQuery] = useState("");
  const [selectedState, setSelectedState] = useState<ColombiaDepartment | null>(null);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [debouncedStateQuery] = useDebounce(stateQuery, 500);
  const prevStateQueryRef = useRef("");

  // --- City autocomplete (depends on selected state) ------------------------
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<ColombiaCity | null>(null);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // SWR: search departments by keyword
  const { data: departments, isLoading: deptLoading } = useSWR<ColombiaDepartment[]>(
    debouncedStateQuery && !selectedState
      ? `https://api-colombia.com/api/v1/Department/search/${encodeURIComponent(debouncedStateQuery)}`
      : null,
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, keepPreviousData: true }
  );

  // Invalidate cache when user deletes characters (not extending previous query)
  useEffect(() => {
    if (debouncedStateQuery && prevStateQueryRef.current) {
      const isExtending = debouncedStateQuery.startsWith(prevStateQueryRef.current);
      if (!isExtending) {
        mutate(
          `https://api-colombia.com/api/v1/Department/search/${encodeURIComponent(debouncedStateQuery)}`,
          undefined,
          { revalidate: true }
        );
      }
    }
    prevStateQueryRef.current = debouncedStateQuery;
  }, [debouncedStateQuery]);

  // SWR: fetch cities for the selected department
  const { data: stateCities, isLoading: citiesLoading } = useSWR<ColombiaCity[]>(
    selectedState
      ? `https://api-colombia.com/api/v1/Department/${selectedState.id}/cities`
      : null,
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // Normalize text: remove accents/tildes for accent-insensitive matching
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Client-side filter: only show departments whose name matches the query
  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!debouncedStateQuery.trim()) return departments;
    const nq = normalize(debouncedStateQuery);
    return departments.filter((d) => normalize(d.name).includes(nq));
  }, [departments, debouncedStateQuery]);

  // Client-side filter for city suggestions
  const filteredCities = useMemo(() => {
    if (!stateCities) return [];
    if (!cityQuery.trim()) return stateCities;
    const lc = cityQuery.toLowerCase();
    return stateCities.filter((c) => c.name.toLowerCase().includes(lc));
  }, [stateCities, cityQuery]);

  // --- Helpers: input formatting/masking ---------------------------------
  const formatNameInput = (value: string) => {
    let v = value.replace(/[^A-Za-zÀ-ÿ\s]/g, ""); // only letters & spaces
    v = v.replace(/\s{2,}/g, " "); // collapse multiple spaces
    return v.slice(0, 50);
  };

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const clamped = digits.slice(0, 15); // E.164 max 15 digits
    return clamped ? `+${clamped}` : "";
  };

  const formatTaxIdInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const groups = digits.match(/.{1,3}/g) || [];
    return groups.join("-");
  };

  const cleanTaxIdForApi = (formatted: string) => formatted.replace(/-/g, "");

  const setErrorFor = (field: string, message?: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message; else delete next[field];
      return next;
    });
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-zinc-900 rounded-xl py-4 px-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate form
    // Block submit if any current field errors exist
    if (Object.keys(fieldErrors).length > 0) {
      setError("Please fix the highlighted fields");
      return;
    }
    const validation = validateRegistrationForm({
      firstName,
      lastName,
      ownerEmail,
      organizationEmail,
      organizationName,
      legalName,
      taxId,
      street,
      city,
      state: stateQuery,
      isStateSelected: !!selectedState,
      postalCode,
      password,
      confirmPassword,
      ownerPhone,
      organizationPhone,
    });

    if (!validation.isValid) {
      setError(validation.message || "Validation failed");
      return;
    }

    setLoading(true);

    try {
      // Build payload matching API documentation: organization + owner
      const payload = {
        organization: {
          name: organizationName,
          legalName: legalName || undefined,
          email: organizationEmail,
          phone: organizationPhone || undefined,
          taxId: taxId ? cleanTaxIdForApi(taxId) : undefined,
          address: {
            street: street || undefined,
            city: city || undefined,
            state: selectedState?.name || undefined,
            country: "Colombia",
            postalCode: postalCode || undefined,
          },
        },
        owner: {
          email: ownerEmail,
          password: password,
          phone: ownerPhone,
          name: {
            firstName: firstName,
            secondName: undefined,
            firstSurname: lastName || "",
            secondSurname: undefined,
          },
        },
      };

      const response = await registerUser(payload);

      if (response.status === "success") {
        // Success - navigate to login
        alert("Account created successfully. Please log in.");
        navigate("/login");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const code = err.code ? ` (${err.code})` : "";
        // Attempt to surface field-level validation messages when available
        const detailsMsg = err.details && typeof err.details === "object"
          ? Object.values(err.details).flat().join(". ")
          : undefined;
        setError(detailsMsg ?? `${err.message}${code}`);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left Section - Desktop Only */}
        <div
          className={`hidden md:flex md:w-1/2 ${styles.bgOverlay} p-12 lg:p-20 flex-col justify-center relative border-r border-zinc-800 z-0`}
        >
          <div className="z-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-12">
              <div className="bg-yellow-400 p-2 rounded-lg shadow-lg">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              Create your account
              <br />
              <span className="text-yellow-400">for Business</span>
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              Join the companies already transforming their events with our cutting-edge technology.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">
                    Instant Setup
                  </p>
                  <p className="text-sm text-gray-400">
                    Access your dashboard in less than 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black relative z-10 overflow-y-auto">
          <div className="w-full max-w-md py-12">
            <h2 className="text-4xl font-extrabold mb-2">Get Started</h2>
            <p className="text-gray-400 mb-10">
              Create your Lend Event account today
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Nombre */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => {
                    const v = formatNameInput(e.target.value);
                    setFirstName(v);
                    const res = validateFirstName(v);
                    setErrorFor("firstName", res.isValid ? undefined : res.message);
                  }}
                  onBlur={() => {
                    const res = validateFirstName(firstName);
                    setErrorFor("firstName", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.firstName)}
                />
                {fieldErrors.firstName && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.firstName}</p>
                )}
              </div>

              {/* Apellido */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => {
                    const v = formatNameInput(e.target.value);
                    setLastName(v);
                    const res = validateLastName(v);
                    setErrorFor("lastName", res.isValid ? undefined : res.message);
                  }}
                  onBlur={() => {
                    const res = validateLastName(lastName);
                    setErrorFor("lastName", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.lastName)}
                />
                {fieldErrors.lastName && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.lastName}</p>
                )}
              </div>

              {/* Organization Name */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="Your Company Inc."
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  onBlur={() => {
                    const res = validateOrganizationName(organizationName);
                    setErrorFor("organizationName", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.organizationName)}
                />
                {fieldErrors.organizationName && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.organizationName}</p>
                )}
              </div>

              {/* Legal Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Legal Name
                </label>
                <input
                  type="text"
                  placeholder="Your Company S.A."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  onBlur={() => {
                    const res = validateLegalName(legalName);
                    setErrorFor("legalName", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.legalName)}
                />
                {fieldErrors.legalName && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.legalName}</p>
                )}
              </div>

              {/* NIT / Tax ID */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  NIT / Tax ID
                </label>
                <input
                  type="text"
                  placeholder="123-123-123"
                  value={taxId}
                  onChange={(e) => {
                    const v = formatTaxIdInput(e.target.value);
                    setTaxId(v);
                    if (v) {
                      const res = validateTaxId(v);
                      setErrorFor("taxId", res.isValid ? undefined : res.message);
                    } else {
                      setErrorFor("taxId", undefined);
                    }
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.taxId)}
                />
                {fieldErrors.taxId && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.taxId}</p>
                )}
              </div>

              {/* Organization Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Organization Email
                </label>
                <input
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={organizationEmail}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOrganizationEmail(v);
                    const res = validateEmail(v);
                    setErrorFor("organizationEmail", res.isValid ? undefined : res.message);
                  }}
                  onBlur={() => {
                    const res = validateEmail(organizationEmail);
                    setErrorFor("organizationEmail", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.organizationEmail)}
                />
                {fieldErrors.organizationEmail && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.organizationEmail}</p>
                )}
              </div>

              {/* Owner Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Owner Email
                </label>
                <input
                  type="email"
                  placeholder="owner.personal@example.com"
                  value={ownerEmail}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOwnerEmail(v);
                    const res = validateEmail(v);
                    setErrorFor("ownerEmail", res.isValid ? undefined : res.message);
                  }}
                  onBlur={() => {
                    const res = validateEmail(ownerEmail);
                    setErrorFor("ownerEmail", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.ownerEmail)}
                />
                {fieldErrors.ownerEmail && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.ownerEmail}</p>
                )}
              </div>

              {/* Organization Phone (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Organization Phone <span className="text-gray-600">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={organizationPhone}
                  onChange={(e) => {
                    const v = formatPhoneInput(e.target.value);
                    setOrganizationPhone(v);
                    if (v) {
                      const res = validatePhone(v);
                      setErrorFor("organizationPhone", res.isValid ? undefined : res.message);
                    } else {
                      setErrorFor("organizationPhone", undefined);
                    }
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.organizationPhone)}
                />
                {fieldErrors.organizationPhone && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.organizationPhone}</p>
                )}
              </div>

              {/* Owner Phone (Required) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Owner Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={ownerPhone}
                  onChange={(e) => {
                    const v = formatPhoneInput(e.target.value);
                    setOwnerPhone(v);
                    const res = validateRequiredPhone(v);
                    setErrorFor("ownerPhone", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.ownerPhone)}
                />
                {fieldErrors.ownerPhone && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.ownerPhone}</p>
                )}
              </div>

              {/* Address (Optional fields) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Calle 123"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* State (Departamento) */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  State (Departamento)
                </label>
                <input
                  type="text"
                  placeholder="Search department..."
                  value={stateQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    const v = e.target.value;
                    setStateQuery(v);
                    if (selectedState && v !== selectedState.name) {
                      setSelectedState(null);
                      setCity("");
                      setCityQuery("");
                      setSelectedCity(null);
                    }
                    setShowStateSuggestions(true);
                    // Real-time validation
                    const res = validateState(v, !!(selectedState && v === selectedState.name));
                    setErrorFor("state", res.isValid ? undefined : res.message);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowStateSuggestions(false), 200);
                    const res = validateState(stateQuery, !!selectedState);
                    setErrorFor("state", res.isValid ? undefined : res.message);
                  }}
                  onFocus={() => {
                    if (filteredDepartments.length && !selectedState) {
                      setShowStateSuggestions(true);
                    }
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.state)}
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
                            setErrorFor("state", undefined);
                            setCityQuery("");
                            setSelectedCity(null);
                            setCity("");
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
                {fieldErrors.state && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.state}</p>
                )}
              </div>

              {/* City (depends on selected state) */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder={selectedState ? "Search city..." : "Select a state first"}
                  value={cityQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    const v = e.target.value;
                    setCityQuery(v);
                    if (selectedCity && v !== selectedCity.name) {
                      setSelectedCity(null);
                      setCity("");
                    }
                    setShowCitySuggestions(true);
                    // Real-time validation: error only when text entered without a selection
                    if (v && !(selectedCity && v === selectedCity.name)) {
                      setErrorFor("city", "Please select a valid city from the list");
                    } else {
                      setErrorFor("city", undefined);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowCitySuggestions(false), 200);
                    if (cityQuery && !selectedCity) {
                      setErrorFor("city", "Please select a valid city from the list");
                    } else {
                      setErrorFor("city", undefined);
                    }
                  }}
                  onFocus={() => {
                    if (filteredCities.length && !selectedCity) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  disabled={loading || !selectedState}
                  className={inputClass(!!fieldErrors.city)}
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
                            setCity(c.name);
                            setShowCitySuggestions(false);
                            setErrorFor("city", undefined);
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
                {fieldErrors.city && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="110111"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="text-xs text-gray-400 mb-2">
                  Minimum 8 characters, 1 uppercase letter, 1 number and 1 special
                  character (!@#$%^&*)
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPassword(v);
                    const res = validatePassword(v);
                    setErrorFor("password", res.isValid ? undefined : res.message);
                  }}
                  disabled={loading}
                  className={inputClass(!!fieldErrors.password)}
                />
                {fieldErrors.password && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                  <input
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      const v = e.target.value;
                      setConfirmPassword(v);
                      const res = validateConfirmPassword(password, v);
                      setErrorFor("confirmPassword", res.isValid ? undefined : res.message);
                    }}
                    disabled={loading}
                    className={inputClass(!!fieldErrors.confirmPassword)}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                  )}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading || Object.keys(fieldErrors).length > 0}
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} mt-4 shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {/* Link a Login */}
            <p className="text-center text-sm text-gray-500 mt-8">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-yellow-400 font-bold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}