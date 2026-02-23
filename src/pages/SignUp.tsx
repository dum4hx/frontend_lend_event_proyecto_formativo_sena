import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
const TOTAL_STEPS = 4;

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get("returnTo");
  const [showRegSuccessModal, setShowRegSuccessModal] = useState(false);
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
  const [streetType, setStreetType] = useState("");
  const [mainNumber, setMainNumber] = useState("");
  const [secondaryNumber, setSecondaryNumber] = useState("");
  const [complementaryNumber, setComplementaryNumber] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

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
    { revalidateOnFocus: false, revalidateOnReconnect: false, keepPreviousData: true },
  );

  // Invalidate cache when user deletes characters (not extending previous query)
  useEffect(() => {
    if (debouncedStateQuery && prevStateQueryRef.current) {
      const isExtending = debouncedStateQuery.startsWith(prevStateQueryRef.current);
      if (!isExtending) {
        mutate(
          `https://api-colombia.com/api/v1/Department/search/${encodeURIComponent(debouncedStateQuery)}`,
          undefined,
          { revalidate: true },
        );
      }
    }
    prevStateQueryRef.current = debouncedStateQuery;
  }, [debouncedStateQuery]);

  // SWR: fetch cities for the selected department
  const { data: stateCities, isLoading: citiesLoading } = useSWR<ColombiaCity[]>(
    selectedState ? `https://api-colombia.com/api/v1/Department/${selectedState.id}/cities` : null,
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  // Normalize text: remove accents/tildes for accent-insensitive matching
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const isNormalizedEqual = (a: string, b: string) =>
    normalize(a.trim()) === normalize(b.trim());

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
    const normalizedCityQuery = normalize(cityQuery);
    return stateCities.filter((c) => normalize(c.name).includes(normalizedCityQuery));
  }, [stateCities, cityQuery]);

  useEffect(() => {
    setPostalCode(selectedCity?.postalCode ?? "");
  }, [selectedCity]);

  // --- Helpers: input formatting/masking ---------------------------------
  const formatNameInput = (value: string) => {
    let v = value.replace(/[^A-Za-zÀ-ÿ\s]/g, ""); // only letters & spaces
    v = v.replace(/\s{2,}/g, " "); // collapse multiple spaces
    return v.slice(0, 50);
  };

  const formatPhoneInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.slice(0, 10);
  };

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

  const toColombianPhone = (digits: string) =>
    digits ? `${COLOMBIA_PHONE_PREFIX}${digits}` : "";

  const formatTaxIdInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const groups = digits.match(/.{1,3}/g) || [];
    return groups.join("-");
  };

  const cleanTaxIdForApi = (formatted: string) => formatted.replace(/-/g, "");

  const setErrorFor = (field: string, message?: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-zinc-900 rounded-xl py-4 px-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"}`;

  const phoneInputWrapperClass = (hasError: boolean) =>
    `w-full bg-zinc-900 rounded-xl text-white transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus-within:border-red-500" : "border-zinc-800 focus-within:border-yellow-400"}`;

  const formattedStreetBase = useMemo(() => {
    if (!streetType || !mainNumber || !secondaryNumber || !complementaryNumber) return "";
    return `${streetType} ${mainNumber} # ${secondaryNumber}-${complementaryNumber}`;
  }, [streetType, mainNumber, secondaryNumber, complementaryNumber]);

  const formattedStreet = useMemo(() => {
    if (!formattedStreetBase) return "";
    const normalizedDetails = additionalDetails.trim();
    return normalizedDetails ? `${formattedStreetBase}, ${normalizedDetails}` : formattedStreetBase;
  }, [formattedStreetBase, additionalDetails]);

  const progressWidthClass =
    currentStep === 1 ? "w-1/4" : currentStep === 2 ? "w-2/4" : currentStep === 3 ? "w-3/4" : "w-full";

  const validateAddressSegmentField = (value: string, label: string) => {
    if (!value) {
      return { isValid: false, message: `${label} is required` };
    }

    if (!COLOMBIAN_ADDRESS_SEGMENT_REGEX.test(value)) {
      return {
        isValid: false,
        message: `${label} must follow formats like 8, 8A, 8ª or 8ª E`,
      };
    }

    return { isValid: true };
  };

  const validateStructuredAddress = () => {
    let isValid = true;

    if (!streetType) {
      setErrorFor("streetType", "Street type is required");
      isValid = false;
    } else {
      setErrorFor("streetType", undefined);
    }

    const mainValidation = validateAddressSegmentField(mainNumber, "Primary number");
    setErrorFor("mainNumber", mainValidation.isValid ? undefined : mainValidation.message);
    if (!mainValidation.isValid) isValid = false;

    const secondaryValidation = validateAddressSegmentField(secondaryNumber, "Secondary number");
    setErrorFor("secondaryNumber", secondaryValidation.isValid ? undefined : secondaryValidation.message);
    if (!secondaryValidation.isValid) isValid = false;

    const complementaryValidation = validateAddressSegmentField(
      complementaryNumber,
      "Complementary number",
    );
    setErrorFor(
      "complementaryNumber",
      complementaryValidation.isValid ? undefined : complementaryValidation.message,
    );
    if (!complementaryValidation.isValid) isValid = false;

    if (!formattedStreetBase) {
      setErrorFor("street", "Address is required");
      isValid = false;
    } else {
      setErrorFor("street", undefined);
    }

    if (additionalDetails.length > ADDRESS_DETAILS_MAX_LENGTH) {
      setErrorFor(
        "additionalDetails",
        `Additional business location details must not exceed ${ADDRESS_DETAILS_MAX_LENGTH} characters`,
      );
      isValid = false;
    } else {
      setErrorFor("additionalDetails", undefined);
    }

    return isValid;
  };

  const validateStepOne = () => {
    let isValid = true;

    const firstNameValidation = validateFirstName(firstName);
    setErrorFor("firstName", firstNameValidation.isValid ? undefined : firstNameValidation.message);
    if (!firstNameValidation.isValid) isValid = false;

    const lastNameValidation = validateLastName(lastName);
    setErrorFor("lastName", lastNameValidation.isValid ? undefined : lastNameValidation.message);
    if (!lastNameValidation.isValid) isValid = false;

    const ownerEmailValidation = validateEmail(ownerEmail);
    setErrorFor("ownerEmail", ownerEmailValidation.isValid ? undefined : ownerEmailValidation.message);
    if (!ownerEmailValidation.isValid) isValid = false;

    const ownerPhoneValidation = validateRequiredPhone(toColombianPhone(ownerPhone));
    setErrorFor("ownerPhone", ownerPhoneValidation.isValid ? undefined : ownerPhoneValidation.message);
    if (!ownerPhoneValidation.isValid) isValid = false;

    return isValid;
  };

  const validateStepTwo = () => {
    let isValid = true;

    const organizationNameValidation = validateOrganizationName(organizationName);
    setErrorFor(
      "organizationName",
      organizationNameValidation.isValid ? undefined : organizationNameValidation.message,
    );
    if (!organizationNameValidation.isValid) isValid = false;

    const legalNameValidation = validateLegalName(legalName);
    setErrorFor("legalName", legalNameValidation.isValid ? undefined : legalNameValidation.message);
    if (!legalNameValidation.isValid) isValid = false;

    const taxIdValidation = validateTaxId(taxId);
    setErrorFor("taxId", taxIdValidation.isValid ? undefined : taxIdValidation.message);
    if (!taxIdValidation.isValid) isValid = false;

    const organizationEmailValidation = validateEmail(organizationEmail);
    setErrorFor(
      "organizationEmail",
      organizationEmailValidation.isValid ? undefined : organizationEmailValidation.message,
    );
    if (!organizationEmailValidation.isValid) isValid = false;

    if (organizationPhone) {
      const organizationPhoneValidation = validatePhone(toColombianPhone(organizationPhone));
      setErrorFor(
        "organizationPhone",
        organizationPhoneValidation.isValid ? undefined : organizationPhoneValidation.message,
      );
      if (!organizationPhoneValidation.isValid) isValid = false;
    } else {
      setErrorFor("organizationPhone", undefined);
    }

    return isValid;
  };

  const validateStepThree = () => {
    let isValid = validateStructuredAddress();

    const stateValidation = validateState(stateQuery, !!selectedState);
    setErrorFor("state", stateValidation.isValid ? undefined : stateValidation.message);
    if (!stateValidation.isValid) isValid = false;

    if (cityQuery && !selectedCity) {
      setErrorFor("city", "Please select a valid city from the list");
      isValid = false;
    } else {
      setErrorFor("city", undefined);
    }

    return isValid;
  };

  const validateStepFour = () => {
    let isValid = true;

    const passwordValidation = validatePassword(password);
    setErrorFor("password", passwordValidation.isValid ? undefined : passwordValidation.message);
    if (!passwordValidation.isValid) isValid = false;

    const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
    setErrorFor(
      "confirmPassword",
      confirmPasswordValidation.isValid ? undefined : confirmPasswordValidation.message,
    );
    if (!confirmPasswordValidation.isValid) isValid = false;

    return isValid;
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) return validateStepOne();
    if (currentStep === 2) return validateStepTwo();
    if (currentStep === 3) return validateStepThree();
    return validateStepFour();
  };

  const handleNextStep = () => {
    const isValid = validateCurrentStep();
    if (!isValid) {
      setError("Please fix the highlighted fields before continuing");
      return;
    }
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePreviousStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const ownerPhoneForValidation = toColombianPhone(ownerPhone);
    const organizationPhoneForValidation = toColombianPhone(organizationPhone);

    // Validate form
    // Block submit if any current field errors exist
    if (Object.keys(fieldErrors).length > 0) {
      setError("Please fix the highlighted fields");
      return;
    }

    const isAddressValid = validateStructuredAddress();
    if (!isAddressValid) {
      setError("Please complete the address using the required Colombian format");
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
      street: formattedStreet,
      city,
      state: stateQuery,
      isStateSelected: !!selectedState,
      postalCode,
      password,
      confirmPassword,
      ownerPhone: ownerPhoneForValidation,
      organizationPhone: organizationPhoneForValidation,
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
          phone: organizationPhoneForValidation || undefined,
          taxId: taxId ? cleanTaxIdForApi(taxId) : undefined,
          address: {
            street: formattedStreet || undefined,
            city: city || undefined,
            state: selectedState?.name || undefined,
            country: "Colombia",
            postalCode: postalCode || undefined,
          },
        },
        owner: {
          email: ownerEmail,
          password: password,
          phone: ownerPhoneForValidation,
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
        setShowRegSuccessModal(true);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const detailsCode =
          err.details && typeof err.details === "object" && typeof err.details["code"] === "string"
            ? (err.details["code"] as string)
            : undefined;

        // Map well-known registration conflict codes to user-friendly messages
        // and highlight the corresponding field.
        const REGISTER_CODE_MAP: Record<string, { field: string; message: string }> = {
          USER_EMAIL_ALREADY_EXISTS: {
            field: "ownerEmail",
            message:
              "This owner email is already registered. Please use a different email or sign in.",
          },
          ORG_EMAIL_ALREADY_EXISTS: {
            field: "organizationEmail",
            message:
              "An organization with this email already exists. Please use a different organization email.",
          },
          TAX_ID_ALREADY_EXISTS: {
            field: "taxId",
            message: "This Tax ID (NIT) is already associated with another organization.",
          },
          USER_PHONE_ALREADY_EXISTS: {
            field: "ownerPhone",
            message:
              "This owner phone number is already in use. Please provide a different phone number.",
          },
          ORG_PHONE_ALREADY_EXISTS: {
            field: "organizationPhone",
            message:
              "This organization phone number is already in use. Please provide a different one.",
          },
        };

        if (detailsCode && REGISTER_CODE_MAP[detailsCode]) {
          const { field, message } = REGISTER_CODE_MAP[detailsCode];
          setErrorFor(field, message);
          setError(message);
        } else {
          // Fallback: surface any other detail values or the generic message
          const detailsMsg =
            err.details && typeof err.details === "object"
              ? Object.values(err.details)
                  .filter((v) => typeof v === "string")
                  .join(". ")
              : undefined;
          setError(detailsMsg ?? err.message);
        }
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
                  <p className="font-bold text-white">Instant Setup</p>
                  <p className="text-sm text-gray-400">
                    Access your dashboard in less than 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-6 bg-black relative z-10 overflow-y-auto">
          <div className="w-full max-w-2xl py-4">
            <h2 className="text-4xl font-extrabold mb-2">Get Started</h2>
            <p className="text-gray-400 mb-10">Create your Lend Event account today</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-300 font-semibold">Step {currentStep} of {TOTAL_STEPS}</span>
                  <span className="text-gray-400">
                    {currentStep === 1 && "Personal Information"}
                    {currentStep === 2 && "Organization Information"}
                    {currentStep === 3 && "Business Address"}
                    {currentStep === 4 && "Security"}
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-yellow-400 transition-all duration-300 ${progressWidthClass}`} />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Owner Phone
                    </label>
                    <div className={phoneInputWrapperClass(!!fieldErrors.ownerPhone)}>
                      <div className="flex items-center">
                        <span className="text-white pl-4 pr-2 select-none whitespace-pre">
                          {`${COLOMBIA_PHONE_PREFIX} `}
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          placeholder="3001234567"
                          value={ownerPhone}
                          onChange={(e) => {
                            const v = formatPhoneInput(e.target.value);
                            setOwnerPhone(v);
                            const res = validateRequiredPhone(toColombianPhone(v));
                            setErrorFor("ownerPhone", res.isValid ? undefined : res.message);
                          }}
                          onBlur={() => {
                            const res = validateRequiredPhone(toColombianPhone(ownerPhone));
                            setErrorFor("ownerPhone", res.isValid ? undefined : res.message);
                          }}
                          disabled={loading}
                          className="w-full bg-transparent py-4 pr-4 text-white outline-none"
                        />
                      </div>
                    </div>
                    {fieldErrors.ownerPhone && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.ownerPhone}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        const res = validateTaxId(v);
                        setErrorFor("taxId", res.isValid ? undefined : res.message);
                      }}
                      onBlur={() => {
                        const res = validateTaxId(taxId);
                        setErrorFor("taxId", res.isValid ? undefined : res.message);
                      }}
                      disabled={loading}
                      className={inputClass(!!fieldErrors.taxId)}
                    />
                    {fieldErrors.taxId && <p className="text-red-400 text-xs mt-1">{fieldErrors.taxId}</p>}
                  </div>

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

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Organization Phone <span className="text-gray-600">(Optional)</span>
                    </label>
                    <div className={phoneInputWrapperClass(!!fieldErrors.organizationPhone)}>
                      <div className="flex items-center">
                        <span className="text-white pl-4 pr-2 select-none whitespace-pre">
                          {`${COLOMBIA_PHONE_PREFIX} `}
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          placeholder="3001234567"
                          value={organizationPhone}
                          onChange={(e) => {
                            const v = formatPhoneInput(e.target.value);
                            setOrganizationPhone(v);
                            if (v) {
                              const res = validatePhone(toColombianPhone(v));
                              setErrorFor("organizationPhone", res.isValid ? undefined : res.message);
                            } else {
                              setErrorFor("organizationPhone", undefined);
                            }
                          }}
                          onBlur={() => {
                            if (!organizationPhone) {
                              setErrorFor("organizationPhone", undefined);
                              return;
                            }
                            const res = validatePhone(toColombianPhone(organizationPhone));
                            setErrorFor("organizationPhone", res.isValid ? undefined : res.message);
                          }}
                          disabled={loading}
                          className="w-full bg-transparent py-4 pr-4 text-white outline-none"
                        />
                      </div>
                    </div>
                    {fieldErrors.organizationPhone && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.organizationPhone}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Street Type
                      </label>
                      <select
                        title="Street Type"
                        value={streetType}
                        onChange={(e) => {
                          const v = e.target.value;
                          setStreetType(v);
                          setErrorFor("streetType", v ? undefined : "Street type is required");
                        }}
                        onBlur={() => {
                          setErrorFor("streetType", streetType ? undefined : "Street type is required");
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.streetType)}
                      >
                        <option value="">Select street type</option>
                        {COLOMBIA_STREET_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.streetType && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.streetType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Primary Number
                      </label>
                      <input
                        type="text"
                        inputMode="text"
                        pattern="[0-9]{1,4}([ª°º])?([ ]?[A-Za-z])?"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="8ª E"
                        value={mainNumber}
                        onChange={(e) => {
                          const v = formatAddressSegmentInput(e.target.value);
                          setMainNumber(v);
                          const res = validateAddressSegmentField(v, "Primary number");
                          setErrorFor("mainNumber", res.isValid ? undefined : res.message);
                        }}
                        onBlur={() => {
                          const res = validateAddressSegmentField(mainNumber, "Primary number");
                          setErrorFor("mainNumber", res.isValid ? undefined : res.message);
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.mainNumber)}
                      />
                      {fieldErrors.mainNumber && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.mainNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Secondary Number
                      </label>
                      <input
                        type="text"
                        inputMode="text"
                        pattern="[0-9]{1,4}([ª°º])?([ ]?[A-Za-z])?"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="93B"
                        value={secondaryNumber}
                        onChange={(e) => {
                          const v = formatAddressSegmentInput(e.target.value);
                          setSecondaryNumber(v);
                          const res = validateAddressSegmentField(v, "Secondary number");
                          setErrorFor("secondaryNumber", res.isValid ? undefined : res.message);
                        }}
                        onBlur={() => {
                          const res = validateAddressSegmentField(secondaryNumber, "Secondary number");
                          setErrorFor("secondaryNumber", res.isValid ? undefined : res.message);
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.secondaryNumber)}
                      />
                      {fieldErrors.secondaryNumber && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.secondaryNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Complementary Number
                      </label>
                      <input
                        type="text"
                        inputMode="text"
                        pattern="[0-9]{1,4}([ª°º])?([ ]?[A-Za-z])?"
                        maxLength={ADDRESS_SEGMENT_MAX_LENGTH}
                        placeholder="47A"
                        value={complementaryNumber}
                        onChange={(e) => {
                          const v = formatAddressSegmentInput(e.target.value);
                          setComplementaryNumber(v);
                          const res = validateAddressSegmentField(v, "Complementary number");
                          setErrorFor("complementaryNumber", res.isValid ? undefined : res.message);
                        }}
                        onBlur={() => {
                          const res = validateAddressSegmentField(
                            complementaryNumber,
                            "Complementary number",
                          );
                          setErrorFor("complementaryNumber", res.isValid ? undefined : res.message);
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.complementaryNumber)}
                      />
                      {fieldErrors.complementaryNumber && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.complementaryNumber}</p>
                      )}
                    </div>

                    <div>
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
                            setPostalCode("");
                          }
                          setShowStateSuggestions(true);
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
                                  setPostalCode("");
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
                      {fieldErrors.state && <p className="text-red-400 text-xs mt-1">{fieldErrors.state}</p>}
                    </div>

                    <div>
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
                          if (selectedCity && !isNormalizedEqual(v, selectedCity.name)) {
                            setSelectedCity(null);
                            setCity("");
                            setPostalCode("");
                          }
                          setShowCitySuggestions(true);
                          if (v && !(selectedCity && isNormalizedEqual(v, selectedCity.name))) {
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
                                  setPostalCode(c.postalCode ?? "");
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
                      {fieldErrors.city && <p className="text-red-400 text-xs mt-1">{fieldErrors.city}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Additional Business Location Details <span className="text-gray-600">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Centro Empresarial Altos, Office 602"
                        value={additionalDetails}
                        onChange={(e) => {
                          const v = formatAddressDetailsInput(e.target.value);
                          setAdditionalDetails(v);
                          setErrorFor(
                            "additionalDetails",
                            v.length > ADDRESS_DETAILS_MAX_LENGTH
                              ? `Additional business location details must not exceed ${ADDRESS_DETAILS_MAX_LENGTH} characters`
                              : undefined,
                          );
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.additionalDetails)}
                      />
                      {fieldErrors.additionalDetails && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.additionalDetails}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder={selectedCity ? "Auto-filled from city" : "Select a city first"}
                        value={postalCode}
                        readOnly
                        disabled={loading || !selectedCity}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Formatted Address Preview
                      </label>
                      <input
                        type="text"
                        value={formattedStreet}
                        readOnly
                        placeholder="Carrera 15 # 93-47"
                        disabled={loading}
                        className={inputClass(!!fieldErrors.street)}
                      />
                      {fieldErrors.street && <p className="text-red-400 text-xs mt-1">{fieldErrors.street}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 text-xs text-gray-400">
                    Password must include at least 8 characters, 1 uppercase letter, 1 number and 1
                    special character (!@#$%^&*).
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Password
                    </label>
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
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={loading || currentStep === 1}
                  className="px-5 py-3 rounded-xl border border-zinc-700 text-gray-300 font-semibold hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Back
                </button>

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading}
                    className={`px-6 py-3 rounded-xl bg-yellow-400 text-black font-extrabold ${styles.glowButton} hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || Object.keys(fieldErrors).length > 0}
                    className={`px-6 py-3 rounded-xl bg-yellow-400 text-black font-extrabold ${styles.glowButton} hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                )}
              </div>
            </form>

            {/* Link a Login */}
            <p className="text-center text-sm text-gray-500 mt-8">
              Already have an account?{" "}
              <Link to="/login" className="text-yellow-400 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Registration Success Modal */}
      {showRegSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center w-14 h-14 bg-green-400/10 border border-green-400/30 rounded-full mx-auto mb-5">
              <svg
                className="w-7 h-7 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white text-center mb-3">
              Account Created!
            </h2>
            <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
              Your account has been created successfully. Before you can sign in and access your
              dashboard, you need to purchase a subscription plan. Choose a plan that fits your
              needs to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-gray-300 font-semibold hover:bg-zinc-800 hover:text-white transition"
              >
                Go to Sign In
              </button>
              <button
                onClick={() => navigate(returnTo ?? "/packages")}
                className="flex-1 py-3 rounded-xl bg-yellow-400 text-black font-extrabold hover:bg-yellow-300 transition"
              >
                Buy Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
