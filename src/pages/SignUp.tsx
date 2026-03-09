import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { registerUser } from "../services/authService";
import { ApiError } from "../lib/api";
import {
  validateEmail,
  validateFirstName,
  validateLastName,
  validateOrganizationName,
  validateLegalName,
  validateRequiredPhone,
  validatePhone,
  validatePostalCode,
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

interface SignUpFormData {
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationEmail: string;
  ownerEmail: string;
  password: string;
  confirmPassword: string;
  ownerPhone: string;
  organizationPhone: string;
  legalName: string;
  taxId: string;
  streetType: string;
  mainNumber: string;
  secondaryNumber: string;
  complementaryNumber: string;
  additionalDetails: string;
  stateQuery: string;
  cityQuery: string;
  city: string;
  postalCode: string;
}

type FormField = keyof SignUpFormData;
type FieldValidationStatus = "pending" | "invalid" | "valid";

const FIELD_ORDER: FormField[] = [
  "firstName",
  "lastName",
  "ownerEmail",
  "ownerPhone",
  "organizationName",
  "legalName",
  "taxId",
  "organizationEmail",
  "organizationPhone",
  "streetType",
  "mainNumber",
  "secondaryNumber",
  "complementaryNumber",
  "additionalDetails",
  "stateQuery",
  "cityQuery",
  "postalCode",
  "password",
  "confirmPassword",
];

const STEP_FIELDS: Record<number, FormField[]> = {
  1: ["firstName", "lastName", "ownerEmail", "ownerPhone"],
  2: ["organizationName", "legalName", "taxId", "organizationEmail", "organizationPhone"],
  3: [
    "streetType",
    "mainNumber",
    "secondaryNumber",
    "complementaryNumber",
    "additionalDetails",
    "stateQuery",
    "cityQuery",
    "postalCode",
  ],
  4: ["password", "confirmPassword"],
};

const FIELD_TO_STEP: Record<FormField, number> = {
  firstName: 1,
  lastName: 1,
  ownerEmail: 1,
  ownerPhone: 1,
  organizationName: 2,
  legalName: 2,
  taxId: 2,
  organizationEmail: 2,
  organizationPhone: 2,
  streetType: 3,
  mainNumber: 3,
  secondaryNumber: 3,
  complementaryNumber: 3,
  additionalDetails: 3,
  stateQuery: 3,
  cityQuery: 3,
  city: 3,
  postalCode: 3,
  password: 4,
  confirmPassword: 4,
};

const ALL_FIELDS_TOUCHED: Record<FormField, boolean> = {
  firstName: true,
  lastName: true,
  ownerEmail: true,
  ownerPhone: true,
  organizationName: true,
  legalName: true,
  taxId: true,
  organizationEmail: true,
  organizationPhone: true,
  streetType: true,
  mainNumber: true,
  secondaryNumber: true,
  complementaryNumber: true,
  additionalDetails: true,
  stateQuery: true,
  cityQuery: true,
  city: true,
  postalCode: true,
  password: true,
  confirmPassword: true,
};

const INITIAL_FIELD_VALIDATION_STATUS: Record<FormField, FieldValidationStatus> = {
  firstName: "pending",
  lastName: "pending",
  ownerEmail: "pending",
  ownerPhone: "pending",
  organizationName: "pending",
  legalName: "pending",
  taxId: "pending",
  organizationEmail: "pending",
  organizationPhone: "pending",
  streetType: "pending",
  mainNumber: "pending",
  secondaryNumber: "pending",
  complementaryNumber: "pending",
  additionalDetails: "pending",
  stateQuery: "pending",
  cityQuery: "pending",
  city: "pending",
  postalCode: "pending",
  password: "pending",
  confirmPassword: "pending",
};

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: "",
    lastName: "",
    organizationName: "",
    organizationEmail: "",
    ownerEmail: "",
    password: "",
    confirmPassword: "",
    ownerPhone: "",
    organizationPhone: "",
    legalName: "",
    taxId: "",
    streetType: "",
    mainNumber: "",
    secondaryNumber: "",
    complementaryNumber: "",
    additionalDetails: "",
    stateQuery: "",
    cityQuery: "",
    city: "",
    postalCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendErrors, setBackendErrors] = useState<Partial<Record<FormField, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldValidationStatus, setFieldValidationStatus] = useState<
    Record<FormField, FieldValidationStatus>
  >(INITIAL_FIELD_VALIDATION_STATUS);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [, setSubmitAttempt] = useState(0);

  const {
    firstName,
    lastName,
    organizationName,
    organizationEmail,
    ownerEmail,
    password,
    confirmPassword,
    ownerPhone,
    organizationPhone,
    legalName,
    taxId,
    streetType,
    mainNumber,
    secondaryNumber,
    complementaryNumber,
    additionalDetails,
    stateQuery,
    cityQuery,
    city,
    postalCode,
  } = formData;

  const setFormField = useCallback(<K extends FormField>(field: K, value: SignUpFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFirstName = (value: string) => setFormField("firstName", value);
  const setLastName = (value: string) => setFormField("lastName", value);
  const setOrganizationName = (value: string) => setFormField("organizationName", value);
  const setOrganizationEmail = (value: string) => setFormField("organizationEmail", value);
  const setOwnerEmail = (value: string) => setFormField("ownerEmail", value);
  const setPassword = (value: string) => setFormField("password", value);
  const setConfirmPassword = (value: string) => setFormField("confirmPassword", value);
  const setOwnerPhone = (value: string) => setFormField("ownerPhone", value);
  const setOrganizationPhone = (value: string) => setFormField("organizationPhone", value);
  const setLegalName = (value: string) => setFormField("legalName", value);
  const setTaxId = (value: string) => setFormField("taxId", value);
  const setStreetType = (value: string) => setFormField("streetType", value);
  const setMainNumber = (value: string) => setFormField("mainNumber", value);
  const setSecondaryNumber = (value: string) => setFormField("secondaryNumber", value);
  const setComplementaryNumber = (value: string) => setFormField("complementaryNumber", value);
  const setAdditionalDetails = (value: string) => setFormField("additionalDetails", value);
  const setStateQuery = (value: string) => setFormField("stateQuery", value);
  const setCityQuery = (value: string) => setFormField("cityQuery", value);
  const setCity = (value: string) => setFormField("city", value);
  const setPostalCode = (value: string) => setFormField("postalCode", value);

  // Refs for focusing/scrolling to fields with errors
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const ownerEmailRef = useRef<HTMLInputElement | null>(null);
  const ownerPhoneRef = useRef<HTMLInputElement | null>(null);
  const organizationNameRef = useRef<HTMLInputElement | null>(null);
  const legalNameRef = useRef<HTMLInputElement | null>(null);
  const taxIdRef = useRef<HTMLInputElement | null>(null);
  const organizationEmailRef = useRef<HTMLInputElement | null>(null);
  const organizationPhoneRef = useRef<HTMLInputElement | null>(null);
  const streetTypeRef = useRef<HTMLSelectElement | null>(null);
  const mainNumberRef = useRef<HTMLInputElement | null>(null);
  const secondaryNumberRef = useRef<HTMLInputElement | null>(null);
  const complementaryNumberRef = useRef<HTMLInputElement | null>(null);
  const additionalDetailsRef = useRef<HTMLInputElement | null>(null);
  const stateRef = useRef<HTMLInputElement | null>(null);
  const cityRef = useRef<HTMLInputElement | null>(null);
  const postalCodeRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
  const createAccountButtonRef = useRef<HTMLButtonElement | null>(null);

  // --- State (Departamento) autocomplete ------------------------------------
  const [selectedState, setSelectedState] = useState<ColombiaDepartment | null>(null);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [debouncedStateQuery] = useDebounce(stateQuery, 200);

  // --- City autocomplete (depends on selected state) ------------------------
  const [selectedCity, setSelectedCity] = useState<ColombiaCity | null>(null);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // SWR: load all departments once, then filter client-side
  const { data: departments, isLoading: deptLoading } = useSWR<ColombiaDepartment[]>(
    "https://api-colombia.com/api/v1/Department",
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, keepPreviousData: true },
  );

  // SWR: fetch cities for the selected department
  const { data: stateCities, isLoading: citiesLoading } = useSWR<ColombiaCity[]>(
    selectedState ? `https://api-colombia.com/api/v1/Department/${selectedState.id}/cities` : null,
    colombiaFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  // Normalize text: remove accents/tildes for accent-insensitive matching
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

  // Client-side filter: only show departments whose name matches the query
  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!debouncedStateQuery.trim()) return departments;
    const nq = normalize(debouncedStateQuery);
    // Prefer prefix matches for progressive "starts with" behavior
    const prefixMatches = departments.filter((d) => normalize(d.name).startsWith(nq));
    if (prefixMatches.length) return prefixMatches;
    // Fallback to contains if no prefix matches
    return departments.filter((d) => normalize(d.name).includes(nq));
  }, [departments, debouncedStateQuery, normalize]);

  // Client-side filter for city suggestions
  const filteredCities = useMemo(() => {
    if (!stateCities) return [];
    if (!cityQuery.trim()) return stateCities;
    const normalizedCityQuery = normalize(cityQuery);
    // Prefer prefix matches for progressive suggestions
    const prefixCityMatches = stateCities.filter((c) =>
      normalize(c.name).startsWith(normalizedCityQuery),
    );
    if (prefixCityMatches.length) return prefixCityMatches;
    return stateCities.filter((c) => normalize(c.name).includes(normalizedCityQuery));
  }, [stateCities, cityQuery, normalize]);

  // --- Helpers: input formatting/masking ---------------------------------
  const formatNameInput = (value: string) => {
    let v = value.replace(/[^A-Za-zÀ-ÿ\s]/g, ""); // only letters & spaces
    v = v.replace(/\s{2,}/g, " "); // collapse multiple spaces
    v = v.slice(0, 50);

    if (!v) return v;

    return v.charAt(0).toUpperCase() + v.slice(1);
  };

  const formatPhoneInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.slice(0, 10);
  };

  const formatEmailInput = (value: string) => value.trim().toLowerCase();

  const formatPostalCodeInput = (value: string) => value.replace(/\D/g, "").slice(0, 6);

  const formatStateInput = (value: string) =>
    value.replace(/[^A-Za-zÀ-ÿ\s]/g, "").replace(/\s{2,}/g, " ");

  const formatOrganizationNameInput = (value: string) =>
    value.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, "").replace(/\s{2,}/g, " ");

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

  const toColombianPhone = (digits: string) => (digits ? `${COLOMBIA_PHONE_PREFIX}${digits}` : "");

  const formatTaxIdInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const groups = digits.match(/.{1,3}/g) || [];
    return groups.join("-");
  };

  const cleanTaxIdForApi = (formatted: string) => formatted.replace(/-/g, "");

  const markFieldTouched = (field: FormField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const setFieldValidation = (field: FormField, status: FieldValidationStatus) => {
    setFieldValidationStatus((prev) =>
      prev[field] === status ? prev : { ...prev, [field]: status },
    );
  };

  const setErrorFor = (field: string, message?: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const clearBackendError = (field: FormField) => {
    setBackendErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearFieldValue = (field: FormField) => {
    if (field === "city") return;
    if (field === "stateQuery") {
      setStateQuery("");
      setSelectedState(null);
      setSelectedCity(null);
      setCity("");
      setCityQuery("");
      setPostalCode("");
      return;
    }
    if (field === "cityQuery") {
      setCityQuery("");
      setSelectedCity(null);
      setCity("");
      setPostalCode("");
      return;
    }
    setFormField(field, "");
  };

  const setBackendFieldError = (field: FormField, message: string) => {
    // Don't clear sensitive password fields so the user can correct without retyping
    if (field !== "password" && field !== "confirmPassword") {
      clearFieldValue(field);
    }
    setBackendErrors((prev) => ({ ...prev, [field]: message }));
    setErrorFor(field, message);
    markFieldTouched(field);
    setFieldValidation(field, "invalid");
    focusField(field);
  };

  const fieldRefs: Record<FormField, React.RefObject<HTMLElement>> = {
    firstName: firstNameRef as React.RefObject<HTMLElement>,
    lastName: lastNameRef as React.RefObject<HTMLElement>,
    ownerEmail: ownerEmailRef as React.RefObject<HTMLElement>,
    ownerPhone: ownerPhoneRef as React.RefObject<HTMLElement>,
    organizationName: organizationNameRef as React.RefObject<HTMLElement>,
    legalName: legalNameRef as React.RefObject<HTMLElement>,
    taxId: taxIdRef as React.RefObject<HTMLElement>,
    organizationEmail: organizationEmailRef as React.RefObject<HTMLElement>,
    organizationPhone: organizationPhoneRef as React.RefObject<HTMLElement>,
    streetType: streetTypeRef as React.RefObject<HTMLElement>,
    mainNumber: mainNumberRef as React.RefObject<HTMLElement>,
    secondaryNumber: secondaryNumberRef as React.RefObject<HTMLElement>,
    complementaryNumber: complementaryNumberRef as React.RefObject<HTMLElement>,
    additionalDetails: additionalDetailsRef as React.RefObject<HTMLElement>,
    stateQuery: stateRef as React.RefObject<HTMLElement>,
    cityQuery: cityRef as React.RefObject<HTMLElement>,
    city: cityRef as React.RefObject<HTMLElement>,
    postalCode: postalCodeRef as React.RefObject<HTMLElement>,
    password: passwordRef as React.RefObject<HTMLElement>,
    confirmPassword: confirmPasswordRef as React.RefObject<HTMLElement>,
  };

  const focusField = (field: FormField) => {
    const targetStep = FIELD_TO_STEP[field];
    if (targetStep && targetStep !== currentStep) {
      setCurrentStep(targetStep);
    }

    const targetRef = fieldRefs[field];
    setTimeout(() => {
      const el = targetRef?.current;
      if (!el) return;
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement | HTMLSelectElement).focus?.();
      } catch {
        // ignore scroll/focus errors
      }
    }, 0);
  };

  const getFirstInvalidField = (validationErrors: Record<string, string>) => {
    for (const field of FIELD_ORDER) {
      if (validationErrors[field]) return field;
    }
    return undefined;
  };

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

  const validateFormData = useCallback(
    (
      data: SignUpFormData,
      options: {
        touched?: Record<string, boolean>;
        submitted?: boolean;
      } = {},
    ) => {
      const validationErrors: Record<string, string> = {};
      const touchedState = options.touched ?? touched;
      const submittedState = options.submitted ?? submitted;

      const firstNameValidation = validateFirstName(data.firstName);
      if (!firstNameValidation.isValid && firstNameValidation.message) {
        validationErrors.firstName = firstNameValidation.message;
      }

      const lastNameValidation = validateLastName(data.lastName);
      if (!lastNameValidation.isValid && lastNameValidation.message) {
        validationErrors.lastName = lastNameValidation.message;
      }

      const ownerEmailValidation = validateEmail(data.ownerEmail);
      if (!ownerEmailValidation.isValid && ownerEmailValidation.message) {
        validationErrors.ownerEmail = ownerEmailValidation.message;
      }

      const ownerPhoneValidation = validateRequiredPhone(toColombianPhone(data.ownerPhone));
      if (!ownerPhoneValidation.isValid && ownerPhoneValidation.message) {
        validationErrors.ownerPhone = ownerPhoneValidation.message;
      }

      const organizationNameValidation = validateOrganizationName(data.organizationName);
      if (!organizationNameValidation.isValid && organizationNameValidation.message) {
        validationErrors.organizationName = organizationNameValidation.message;
      }

      const legalNameValidation = validateLegalName(data.legalName);
      if (!legalNameValidation.isValid && legalNameValidation.message) {
        validationErrors.legalName = legalNameValidation.message;
      }

      const taxIdValidation = validateTaxId(data.taxId);
      if (!taxIdValidation.isValid && taxIdValidation.message) {
        validationErrors.taxId = taxIdValidation.message;
      }

      const organizationEmailValidation = validateEmail(data.organizationEmail);
      if (!organizationEmailValidation.isValid && organizationEmailValidation.message) {
        validationErrors.organizationEmail = organizationEmailValidation.message;
      }

      if (
        data.ownerEmail.trim() &&
        data.organizationEmail.trim() &&
        data.ownerEmail.trim().toLowerCase() === data.organizationEmail.trim().toLowerCase()
      ) {
        validationErrors.organizationEmail =
          "Organization email must be different from owner email";
      }

      if (data.organizationPhone) {
        const organizationPhoneValidation = validatePhone(toColombianPhone(data.organizationPhone));
        if (!organizationPhoneValidation.isValid && organizationPhoneValidation.message) {
          validationErrors.organizationPhone = organizationPhoneValidation.message;
        }
      }

      if (!data.streetType) {
        validationErrors.streetType = "Street type is required";
      }

      const mainValidation = validateAddressSegmentField(data.mainNumber, "Primary number");
      if (!mainValidation.isValid && mainValidation.message) {
        validationErrors.mainNumber = mainValidation.message;
      }

      const secondaryValidation = validateAddressSegmentField(
        data.secondaryNumber,
        "Secondary number",
      );
      if (!secondaryValidation.isValid && secondaryValidation.message) {
        validationErrors.secondaryNumber = secondaryValidation.message;
      }

      const complementaryValidation = validateAddressSegmentField(
        data.complementaryNumber,
        "Complementary number",
      );
      if (!complementaryValidation.isValid && complementaryValidation.message) {
        validationErrors.complementaryNumber = complementaryValidation.message;
      }

      const hasStreetBase =
        !!data.streetType &&
        !!data.mainNumber &&
        !!data.secondaryNumber &&
        !!data.complementaryNumber;
      if (!hasStreetBase) {
        validationErrors.street = "Address is required";
      }

      if (data.additionalDetails.length > ADDRESS_DETAILS_MAX_LENGTH) {
        validationErrors.additionalDetails = `Additional business location details must not exceed ${ADDRESS_DETAILS_MAX_LENGTH} characters`;
      }

      const isStateSelected =
        !!selectedState && isNormalizedEqual(data.stateQuery, selectedState.name);
      const stateValidation = validateState(data.stateQuery, isStateSelected);
      if (!stateValidation.isValid && stateValidation.message) {
        validationErrors.stateQuery = stateValidation.message;
      }

      if (!data.cityQuery.trim()) {
        validationErrors.cityQuery = "City is required";
      } else if (!selectedCity || !isNormalizedEqual(data.cityQuery, selectedCity.name)) {
        validationErrors.cityQuery = "Please select a valid city from the list";
      }

      if (selectedCity && !selectedCity.postalCode && !data.postalCode.trim()) {
        validationErrors.postalCode = "Postal code is required";
      } else {
        const postalValidation = validatePostalCode(data.postalCode);
        if (!postalValidation.isValid && postalValidation.message) {
          validationErrors.postalCode = postalValidation.message;
        }
      }

      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid && passwordValidation.message) {
        validationErrors.password = passwordValidation.message;
      }

      const shouldValidateConfirmPassword =
        submittedState || (!!data.password && !!touchedState.confirmPassword);
      if (shouldValidateConfirmPassword) {
        const confirmPasswordValidation = validateConfirmPassword(
          data.password,
          data.confirmPassword,
        );
        if (!confirmPasswordValidation.isValid && confirmPasswordValidation.message) {
          validationErrors.confirmPassword = confirmPasswordValidation.message;
        }
      }

      return validationErrors;
    },
    [touched, submitted, selectedState, selectedCity, isNormalizedEqual],
  );

  const runValidation = useCallback(
    (
      data: SignUpFormData = formData,
      options: {
        touched?: Record<string, boolean>;
        submitted?: boolean;
      } = {},
    ) => {
      const nextErrors = validateFormData(data, {
        touched: options.touched ?? touched,
        submitted: options.submitted ?? submitted,
      });
      setErrors(nextErrors);
      const touchedState = options.touched ?? touched;
      const submittedState = options.submitted ?? submitted;
      const mergedErrors = { ...nextErrors, ...backendErrors };

      setFieldValidationStatus((prev) => {
        const nextStatus = { ...prev };
        for (const field of FIELD_ORDER) {
          if (mergedErrors[field]) {
            nextStatus[field] = "invalid";
          } else if (submittedState || touchedState[field]) {
            nextStatus[field] = "valid";
          } else {
            nextStatus[field] = "pending";
          }
        }
        return nextStatus;
      });

      return nextErrors;
    },
    [formData, touched, submitted, validateFormData, backendErrors],
  );

  const visibleErrors = useMemo(() => {
    const merged: Record<string, string> = { ...errors, ...backendErrors };
    if (submitted) return merged;
    const next: Record<string, string> = {};
    for (const [field, message] of Object.entries(merged)) {
      if (touched[field]) {
        next[field] = message;
      }
    }
    return next;
  }, [errors, backendErrors, touched, submitted]);

  const fieldErrors = visibleErrors;
  const hasInvalidFields = useMemo(
    () => FIELD_ORDER.some((field) => fieldValidationStatus[field] === "invalid"),
    [fieldValidationStatus],
  );

  const validateFieldOnBlur = (field: FormField, data: SignUpFormData = formData) => {
    const nextTouched = { ...touched, [field]: true };
    markFieldTouched(field);
    const nextErrors = runValidation(data, { touched: nextTouched, submitted });
    const fieldMessage = nextErrors[field] ?? backendErrors[field];

    if (fieldMessage) {
      setFieldValidation(field, "invalid");
      return false;
    }

    clearBackendError(field);
    setFieldValidation(field, "valid");
    return true;
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

  const canEditPostalCode = !!selectedCity && !selectedCity.postalCode;

  const progressWidthClass =
    currentStep === 1
      ? "w-1/4"
      : currentStep === 2
        ? "w-2/4"
        : currentStep === 3
          ? "w-3/4"
          : "w-full";

  const validateCurrentStep = () => {
    const currentStepFields = STEP_FIELDS[currentStep] ?? [];
    const nextTouched = {
      ...touched,
      ...Object.fromEntries(currentStepFields.map((field) => [field, true])),
    };
    setTouched(nextTouched);
    const nextErrors = runValidation(formData, { touched: nextTouched, submitted });
    const mergedErrors = { ...nextErrors, ...backendErrors };
    const firstInvalidInCurrentStep = currentStepFields.find((field) => !!mergedErrors[field]);
    return {
      isValid: !firstInvalidInCurrentStep,
      firstInvalidField: firstInvalidInCurrentStep,
    };
  };

  const handleNextStep = () => {
    const { isValid, firstInvalidField } = validateCurrentStep();
    if (!isValid) {
      setError("Please fix the highlighted fields before continuing");
      setSubmitAttempt((prev) => prev + 1);
      if (firstInvalidField) {
        focusField(firstInvalidField);
      }
      return;
    }
    setError("");

    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  useEffect(() => {
    if (!submitted) return;
    if (Object.keys({ ...errors, ...backendErrors }).length) return;
    if (currentStep === TOTAL_STEPS) return;

    setCurrentStep(TOTAL_STEPS);
    setTimeout(() => {
      const btn = createAccountButtonRef.current;
      if (!btn) return;
      try {
        btn.scrollIntoView({ behavior: "smooth", block: "center" });
        btn.focus?.();
      } catch {
        // ignore scroll/focus errors
      }
    }, 0);
  }, [submitted, errors, backendErrors, currentStep]);

  const handlePreviousStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    setTouched(ALL_FIELDS_TOUCHED);

    const ownerPhoneForValidation = toColombianPhone(ownerPhone);
    const organizationPhoneForValidation = toColombianPhone(organizationPhone);

    const nextErrors = runValidation(formData, { touched: ALL_FIELDS_TOUCHED, submitted: true });
    const mergedErrors = { ...nextErrors, ...backendErrors };
    if (Object.keys(mergedErrors).length > 0) {
      setError("Please fix the highlighted fields");
      setSubmitAttempt((prev) => prev + 1);
      const firstInvalidField = getFirstInvalidField(mergedErrors);
      if (firstInvalidField) {
        focusField(firstInvalidField);
      }
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
        navigate("/verify-email", { state: { email: ownerEmail }, replace: true });
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
          PENDING_EMAIL_VERIFICATION: {
            field: "ownerEmail",
            message:
              "A registration with this email is already pending verification. Please check your email or try again in 5 minutes.",
          },
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
          setBackendFieldError(field as FormField, message);
          setError(message);
          setSubmitAttempt((prev) => prev + 1);
        } else if (
          err.details &&
          typeof err.details === "object" &&
          Array.isArray((err.details as any).errors)
        ) {
          // API returned structured validation errors array
          const apiErrors: Array<{ field?: string; message?: string }> = (err.details as any)
            .errors;
          const otherMessages: string[] = [];
          for (const e of apiErrors) {
            const fieldPath = e.field ?? "";
            const msg = e.message ?? "Validation error";
            // Map API field paths to local FormField keys
            let mappedField: FormField | null = null;

            if (fieldPath === "owner.password" || fieldPath.endsWith(".password")) {
              mappedField = "password";
            } else if (fieldPath === "owner.email") {
              mappedField = "ownerEmail";
            } else if (fieldPath === "owner.phone") {
              mappedField = "ownerPhone";
            } else if (fieldPath === "organization.email") {
              mappedField = "organizationEmail";
            } else if (fieldPath === "organization.phone") {
              mappedField = "organizationPhone";
            } else if (fieldPath === "organization.taxId" || fieldPath === "taxId") {
              mappedField = "taxId";
            } else if (fieldPath === "organization.name") {
              mappedField = "organizationName";
            }

            if (mappedField) {
              setBackendFieldError(mappedField, msg);
            } else {
              otherMessages.push(msg);
            }
          }

          const combined = otherMessages.length
            ? otherMessages.join(". ")
            : apiErrors
                .map((x) => x.message)
                .filter(Boolean)
                .join(". ");
          setError(combined || err.message);
          setSubmitAttempt((prev) => prev + 1);
        } else {
          // Fallback: surface any other detail values or the generic message
          const detailsMsg =
            err.details && typeof err.details === "object"
              ? Object.values(err.details)
                  .filter((v) => typeof v === "string")
                  .join(". ")
              : undefined;
          setError(detailsMsg ?? err.message);
          if (detailsMsg) {
            setSubmitAttempt((prev) => prev + 1);
          }
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
                  <span className="text-gray-300 font-semibold">
                    Step {currentStep} of {TOTAL_STEPS}
                  </span>
                  <span className="text-gray-400">
                    {currentStep === 1 && "Personal Information"}
                    {currentStep === 2 && "Organization Information"}
                    {currentStep === 3 && "Business Address"}
                    {currentStep === 4 && "Security"}
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-yellow-400 transition-all duration-300 ${progressWidthClass}`}
                  />
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
                      ref={firstNameRef}
                      onChange={(e) => {
                        const v = formatNameInput(e.target.value);
                        setFirstName(v);
                        if (touched.firstName || backendErrors.firstName) {
                          setFieldValidation("firstName", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("firstName");
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
                      ref={lastNameRef}
                      onChange={(e) => {
                        const v = formatNameInput(e.target.value);
                        setLastName(v);
                        if (touched.lastName || backendErrors.lastName) {
                          setFieldValidation("lastName", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("lastName");
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
                      ref={ownerEmailRef}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(e) => {
                        const v = formatEmailInput(e.target.value);
                        setOwnerEmail(v);
                        clearBackendError("ownerEmail");
                        if (touched.ownerEmail || backendErrors.ownerEmail) {
                          setFieldValidation("ownerEmail", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("ownerEmail");
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
                          ref={ownerPhoneRef}
                          onChange={(e) => {
                            const v = formatPhoneInput(e.target.value);
                            setOwnerPhone(v);
                            clearBackendError("ownerPhone");
                            if (touched.ownerPhone || backendErrors.ownerPhone) {
                              setFieldValidation("ownerPhone", "pending");
                            }
                          }}
                          onBlur={() => {
                            validateFieldOnBlur("ownerPhone");
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
                      ref={organizationNameRef}
                      onChange={(e) => {
                        const v = formatOrganizationNameInput(e.target.value);
                        setOrganizationName(v);
                        if (touched.organizationName || backendErrors.organizationName) {
                          setFieldValidation("organizationName", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("organizationName");
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
                      ref={legalNameRef}
                      onChange={(e) => {
                        const v = formatOrganizationNameInput(e.target.value);
                        setLegalName(v);
                        if (touched.legalName || backendErrors.legalName) {
                          setFieldValidation("legalName", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("legalName");
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
                      ref={taxIdRef}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      minLength={11}
                      maxLength={14}
                      onChange={(e) => {
                        const v = formatTaxIdInput(e.target.value);
                        setTaxId(v);
                        clearBackendError("taxId");
                        if (touched.taxId || backendErrors.taxId) {
                          setFieldValidation("taxId", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("taxId");
                      }}
                      disabled={loading}
                      className={inputClass(!!fieldErrors.taxId)}
                    />
                    {fieldErrors.taxId && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.taxId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Organization Email
                    </label>
                    <input
                      type="email"
                      placeholder="admin@yourcompany.com"
                      value={organizationEmail}
                      ref={organizationEmailRef}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(e) => {
                        const v = formatEmailInput(e.target.value);
                        setOrganizationEmail(v);
                        clearBackendError("organizationEmail");
                        if (touched.organizationEmail || backendErrors.organizationEmail) {
                          setFieldValidation("organizationEmail", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("organizationEmail");
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
                          ref={organizationPhoneRef}
                          onChange={(e) => {
                            const v = formatPhoneInput(e.target.value);
                            setOrganizationPhone(v);
                            clearBackendError("organizationPhone");
                            if (touched.organizationPhone || backendErrors.organizationPhone) {
                              setFieldValidation("organizationPhone", "pending");
                            }
                          }}
                          onBlur={() => {
                            validateFieldOnBlur("organizationPhone");
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
                        ref={streetTypeRef}
                        onChange={(e) => {
                          const v = e.target.value;
                          setStreetType(v);
                          if (touched.streetType || backendErrors.streetType) {
                            setFieldValidation("streetType", "pending");
                          }
                        }}
                        onBlur={() => {
                          validateFieldOnBlur("streetType");
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.streetType)}
                      >
                        <option disabled value="">
                          Select street type
                        </option>
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
                        ref={mainNumberRef}
                        onChange={(e) => {
                          const v = formatAddressSegmentInput(e.target.value);
                          setMainNumber(v);
                          if (touched.mainNumber || backendErrors.mainNumber) {
                            setFieldValidation("mainNumber", "pending");
                          }
                        }}
                        onBlur={() => {
                          validateFieldOnBlur("mainNumber");
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
                        ref={secondaryNumberRef}
                        onChange={(e) => {
                          const v = formatAddressSegmentInput(e.target.value);
                          setSecondaryNumber(v);
                          if (touched.secondaryNumber || backendErrors.secondaryNumber) {
                            setFieldValidation("secondaryNumber", "pending");
                          }
                        }}
                        onBlur={() => {
                          validateFieldOnBlur("secondaryNumber");
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
                        ref={complementaryNumberRef}
                        onChange={(e) => {
                          const v = formatAddressSegmentInput(e.target.value);
                          setComplementaryNumber(v);
                          if (touched.complementaryNumber || backendErrors.complementaryNumber) {
                            setFieldValidation("complementaryNumber", "pending");
                          }
                        }}
                        onBlur={() => {
                          validateFieldOnBlur("complementaryNumber");
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.complementaryNumber)}
                      />
                      {fieldErrors.complementaryNumber && (
                        <p className="text-red-400 text-xs mt-1">
                          {fieldErrors.complementaryNumber}
                        </p>
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
                        ref={stateRef}
                        autoComplete="off"
                        onChange={(e) => {
                          const v = formatStateInput(e.target.value);
                          setStateQuery(v);
                          if (selectedState && v !== selectedState.name) {
                            setSelectedState(null);
                            setCity("");
                            setCityQuery("");
                            setSelectedCity(null);
                            setPostalCode("");
                          }
                          setShowStateSuggestions(true);
                          if (touched.stateQuery || backendErrors.stateQuery) {
                            setFieldValidation("stateQuery", "pending");
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowStateSuggestions(false), 200);
                          validateFieldOnBlur("stateQuery");
                        }}
                        onFocus={() => {
                          if (filteredDepartments.length && !selectedState) {
                            setShowStateSuggestions(true);
                          }
                        }}
                        disabled={loading}
                        className={inputClass(!!fieldErrors.stateQuery)}
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
                                  clearBackendError("stateQuery");
                                  setFieldValidation("stateQuery", "pending");
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
                      {fieldErrors.stateQuery && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.stateQuery}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder={selectedState ? "Search city..." : "Select a state first"}
                        value={cityQuery}
                        ref={cityRef}
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
                          if (touched.cityQuery || backendErrors.cityQuery) {
                            setFieldValidation("cityQuery", "pending");
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowCitySuggestions(false), 200);
                          validateFieldOnBlur("cityQuery");
                        }}
                        onFocus={() => {
                          if (filteredCities.length && !selectedCity) {
                            setShowCitySuggestions(true);
                          }
                        }}
                        disabled={loading || !selectedState}
                        className={inputClass(!!fieldErrors.cityQuery)}
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
                                  setFieldValidation("cityQuery", "pending");
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
                      {fieldErrors.cityQuery && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.cityQuery}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Additional Business Location Details{" "}
                        <span className="text-gray-600">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Centro Empresarial Altos, Office 602"
                        value={additionalDetails}
                        ref={additionalDetailsRef}
                        onChange={(e) => {
                          const v = formatAddressDetailsInput(e.target.value);
                          setAdditionalDetails(v);
                          if (touched.additionalDetails || backendErrors.additionalDetails) {
                            setFieldValidation("additionalDetails", "pending");
                          }
                        }}
                        onBlur={() => {
                          validateFieldOnBlur("additionalDetails");
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
                        placeholder={
                          selectedCity
                            ? canEditPostalCode
                              ? "Enter postal code"
                              : "Auto-filled from city"
                            : "Select a city first"
                        }
                        value={postalCode}
                        ref={postalCodeRef}
                        readOnly={!canEditPostalCode}
                        disabled={loading || !selectedCity}
                        onChange={(e) => {
                          if (!canEditPostalCode) return;
                          const v = formatPostalCodeInput(e.target.value);
                          setPostalCode(v);
                          if (touched.postalCode || backendErrors.postalCode) {
                            setFieldValidation("postalCode", "pending");
                          }
                        }}
                        onBlur={() => {
                          if (!canEditPostalCode) return;
                          validateFieldOnBlur("postalCode");
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white outline-none transition duration-200 disabled:opacity-50"
                      />
                      {fieldErrors.postalCode && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.postalCode}</p>
                      )}
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
                      {fieldErrors.street && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.street}</p>
                      )}
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
                      ref={passwordRef}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPassword(v);
                        // clear backend error as user edits the password so it can re-validate
                        clearBackendError("password");
                        if (touched.password || backendErrors.password) {
                          setFieldValidation("password", "pending");
                        }
                        if (touched.confirmPassword || backendErrors.confirmPassword) {
                          setFieldValidation("confirmPassword", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("password");
                        if (touched.confirmPassword || submitted) {
                          validateFieldOnBlur("confirmPassword");
                        }
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
                      ref={confirmPasswordRef}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConfirmPassword(v);
                        // clear backend error as user edits the confirmation
                        clearBackendError("confirmPassword");
                        if (touched.confirmPassword || backendErrors.confirmPassword) {
                          setFieldValidation("confirmPassword", "pending");
                        }
                      }}
                      onBlur={() => {
                        validateFieldOnBlur("confirmPassword");
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
                    disabled={loading || Object.keys(fieldErrors).length > 0 || hasInvalidFields}
                    ref={createAccountButtonRef}
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
    </div>
  );
}
