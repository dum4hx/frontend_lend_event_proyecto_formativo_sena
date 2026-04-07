/**
 * useCustomerForm — Shared hook for customer create/edit form state,
 * validation, Colombian address logic, and Colombia API queries (TanStack Query).
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address, CreateCustomerPayload, Customer, DocumentType } from "../../../../types/api";
import {
  validateEmail,
  validateFirstName,
  validateLastName,
  validateRequiredPhone,
  validatePostalCode,
  validateState,
} from "../../../../utils/validators";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { TranslationKey } from "../../../../i18n/translations";

// ─── Colombia API types ────────────────────────────────────────────────────

export interface ColombiaDepartment {
  id: number;
  name: string;
}

export interface ColombiaCity {
  id: number;
  name: string;
  departmentId: number;
  postalCode: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────

export const COLOMBIA_PHONE_PREFIX = "+57";

export const COLOMBIA_STREET_TYPES = [
  "Calle",
  "Carrera",
  "Avenida",
  "Avenida Calle",
  "Avenida Carrera",
  "Transversal",
  "Diagonal",
  "Circular",
  "Via",
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

const ALL_FIELDS: CustomerFormField[] = [
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
];

type LegacyCustomerAddress = Address & {
  street?: string;
  state?: string;
  additionalInfo?: string;
  details?: string;
  cityName?: string;
  municipality?: string;
  town?: string;
  province?: string;
  region?: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isNormalizedEqual(a: string, b: string): boolean {
  return normalize(a.trim()) === normalize(b.trim());
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseStreet(street: string) {
  const re =
    /^(Calle|Carrera|Avenida|Avenida Calle|Avenida Carrera|Transversal|Diagonal|Circular|Via)\s+(.+?)\s*#\s*(.+?)\s*-\s*(.+?)(?:\s*,\s*(.+))?$/i;
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

function normalizeStreetTypeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const canonical = COLOMBIA_STREET_TYPES.find((type) => isNormalizedEqual(type, trimmed));
  return canonical ?? trimmed;
}

// ─── Input formatters ──────────────────────────────────────────────────────

export function formatNameInput(value: string): string {
  let v = value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
  v = v.replace(/\s{2,}/g, " ");
  v = v.slice(0, 50);
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export function formatPhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

function formatPostalCodeInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function formatStateInput(value: string): string {
  return value.replace(/[^A-Za-zÀ-ÿ\s]/g, "").replace(/\s{2,}/g, " ");
}

export function formatAddressSegmentInput(value: string): string {
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
}

export function formatAddressDetailsInput(value: string): string {
  return value
    .replace(/[^A-Za-zÀ-ÿ0-9\s#.,\-/]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, ADDRESS_DETAILS_MAX_LENGTH);
}

// ─── Hook ──────────────────────────────────────────────────────────────────

interface UseCustomerFormOptions {
  /** Pre-populate from an existing customer (for edit). */
  initialCustomer?: Customer | null;
}

export function useCustomerForm({ initialCustomer }: UseCustomerFormOptions = {}) {
  const { t } = useLanguage();
  // ── Core form data ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CreateCustomerPayload>({
    name: { firstName: "", firstSurname: "" },
    email: "",
    phone: "",
    documentType: "cc" as DocumentType,
    documentNumber: "",
  });

  // ── Address sub-fields ──────────────────────────────────────────────────
  const [streetType, setStreetType] = useState("");
  const [mainNumber, setMainNumber] = useState("");
  const [secondaryNumber, setSecondaryNumber] = useState("");
  const [complementaryNumber, setComplementaryNumber] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [postalCodeField, setPostalCodeField] = useState("");
  const [showAddress, setShowAddress] = useState(false);

  // ── Colombia autocomplete state ─────────────────────────────────────────
  const [selectedState, setSelectedState] = useState<ColombiaDepartment | null>(null);
  const [selectedCity, setSelectedCity] = useState<ColombiaCity | null>(null);

  // ── Validation state ────────────────────────────────────────────────────
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // ── Colombia API (TanStack Query) ───────────────────────────────────────
  const { data: departments, isLoading: deptLoading } = useQuery<ColombiaDepartment[]>({
    queryKey: ["colombia", "departments"],
    queryFn: () =>
      fetch("https://api-colombia.com/api/v1/Department").then((r) => {
        if (!r.ok) throw new Error(`Colombia API error: ${r.status}`);
        return r.json() as Promise<ColombiaDepartment[]>;
      }),
    staleTime: 1000 * 60 * 60,
  });

  const { data: stateCities, isLoading: citiesLoading } = useQuery<ColombiaCity[]>({
    queryKey: ["colombia", "cities", selectedState?.id],
    queryFn: () =>
      fetch(`https://api-colombia.com/api/v1/Department/${selectedState!.id}/cities`).then((r) => {
        if (!r.ok) throw new Error(`Colombia API error: ${r.status}`);
        return r.json() as Promise<ColombiaCity[]>;
      }),
    enabled: !!selectedState,
    staleTime: 1000 * 60 * 60,
  });

  // ── Filtered department / city lists ─────────────────────────────────────
  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!stateQuery.trim()) return departments;
    const nq = normalize(stateQuery);
    const prefix = departments.filter((d) => normalize(d.name).startsWith(nq));
    return prefix.length ? prefix : departments.filter((d) => normalize(d.name).includes(nq));
  }, [departments, stateQuery]);

  const filteredCities = useMemo(() => {
    if (!stateCities) return [];
    if (!cityQuery.trim()) return stateCities;
    const nq = normalize(cityQuery);
    const prefix = stateCities.filter((c) => normalize(c.name).startsWith(nq));
    return prefix.length ? prefix : stateCities.filter((c) => normalize(c.name).includes(nq));
  }, [stateCities, cityQuery]);

  // ── Composed street preview ──────────────────────────────────────────────
  const formattedStreet = useMemo(() => {
    if (!streetType || !mainNumber || !secondaryNumber || !complementaryNumber) return "";
    const base = `${streetType} ${mainNumber} # ${secondaryNumber}-${complementaryNumber}`;
    const d = additionalDetails.trim();
    return d ? `${base}, ${d}` : base;
  }, [streetType, mainNumber, secondaryNumber, complementaryNumber, additionalDetails]);

  const canEditPostalCode = !!cityQuery.trim() && (!selectedCity || !selectedCity.postalCode);

  // ── Auto-select matching department/city when editing ─────────────────────
  // Use refs to synchronize initial city/state selection without triggering
  // cascading renders (React 19 discourages setState inside effects).
  const cityInitializedRef = useRef(false);
  const stateInitializedRef = useRef(false);

  useEffect(() => {
    if (cityInitializedRef.current) return;
    if (stateCities && cityQuery && !selectedCity) {
      const found = stateCities.find((c) => isNormalizedEqual(c.name, cityQuery));
      if (found) {
        cityInitializedRef.current = true;
        queueMicrotask(() => {
          setSelectedCity(found);
          if (found.postalCode) setPostalCodeField(found.postalCode);
        });
      }
    }
  }, [stateCities, cityQuery, selectedCity]);

  useEffect(() => {
    if (stateInitializedRef.current) return;
    if (departments && stateQuery && !selectedState) {
      const found = departments.find((d) => isNormalizedEqual(d.name, stateQuery));
      if (found) {
        stateInitializedRef.current = true;
        queueMicrotask(() => setSelectedState(found));
      }
    }
  }, [departments, stateQuery, selectedState]);

  // ── Validation helpers ───────────────────────────────────────────────────
  const validateAddressSegment = (value: string, label: string) => {
    if (!value) return { isValid: false, message: `${label} is required` };
    if (!COLOMBIAN_ADDRESS_SEGMENT_REGEX.test(value))
      return { isValid: false, message: `${label} must follow formats like 8, 8A, 8ª or 8ª E` };
    return { isValid: true };
  };

  const runValidation = useCallback(
    (opts?: { allTouched?: boolean }) => {
      const nextErrors: Record<string, string> = {};
      const touchedState = opts?.allTouched
        ? Object.fromEntries(ALL_FIELDS.map((f) => [f, true]))
        : touched;

      const fnV = validateFirstName(formData.name.firstName);
      if (!fnV.isValid && fnV.message) nextErrors.firstName = t(fnV.message as TranslationKey);

      const lnV = validateLastName(formData.name.firstSurname);
      if (!lnV.isValid && lnV.message) nextErrors.firstSurname = t(lnV.message as TranslationKey);

      const emailV = validateEmail(formData.email);
      if (!emailV.isValid && emailV.message) nextErrors.email = t(emailV.message as TranslationKey);

      const phoneV = validateRequiredPhone(
        formData.phone ? `${COLOMBIA_PHONE_PREFIX}${formData.phone}` : "",
      );
      if (!phoneV.isValid && phoneV.message) nextErrors.phone = t(phoneV.message as TranslationKey);

      const docNum = formData.documentNumber.trim();
      if (!docNum) {
        nextErrors.documentNumber = "Document number is required";
      } else if (docNum.length < 8) {
        nextErrors.documentNumber = "Document number must be at least 8 characters";
      } else if (docNum.length > 11) {
        nextErrors.documentNumber = "Document number must not exceed 11 characters";
      }

      if (showAddress) {
        if (!streetType) nextErrors.streetType = "Street type is required";
        const mainV = validateAddressSegment(mainNumber, "Primary number");
        if (!mainV.isValid && mainV.message) nextErrors.mainNumber = mainV.message;
        const secV = validateAddressSegment(secondaryNumber, "Secondary number");
        if (!secV.isValid && secV.message) nextErrors.secondaryNumber = secV.message;
        const compV = validateAddressSegment(complementaryNumber, "Complementary number");
        if (!compV.isValid && compV.message) nextErrors.complementaryNumber = compV.message;
        if (additionalDetails.length > ADDRESS_DETAILS_MAX_LENGTH)
          nextErrors.additionalDetails = `Must not exceed ${ADDRESS_DETAILS_MAX_LENGTH} characters`;
        const stV = validateState(stateQuery, !!stateQuery.trim());
        if (!stV.isValid && stV.message) nextErrors.stateQuery = t(stV.message as TranslationKey);
        if (!cityQuery.trim()) nextErrors.cityQuery = "City is required";
        if (selectedCity && !selectedCity.postalCode && !postalCodeField.trim()) {
          nextErrors.postalCode = "Postal code is required";
        } else {
          const pcV = validatePostalCode(postalCodeField);
          if (!pcV.isValid && pcV.message) nextErrors.postalCode = t(pcV.message as TranslationKey);
        }
      }

      const visible: Record<string, string> = {};
      for (const [field, msg] of Object.entries(nextErrors)) {
        if (touchedState[field] || submitted || opts?.allTouched) visible[field] = msg;
      }
      setFieldErrors(visible);
      return nextErrors;
    },
    [
      t,
      formData,
      touched,
      submitted,
      showAddress,
      streetType,
      mainNumber,
      secondaryNumber,
      complementaryNumber,
      additionalDetails,
      stateQuery,
      cityQuery,
      postalCodeField,
      selectedCity,
    ],
  );

  // Re-run validation on state changes — use a ref to avoid the
  // "setState inside effect" React 19 warning.
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (Object.keys(touched).length > 0 || submitted) {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = setTimeout(() => runValidation(), 0);
    }
    return () => {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
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

  const markTouched = (field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const blurField = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runValidation();
  };

  // ── Department / city select handlers ────────────────────────────────────
  const selectDepartment = (dept: ColombiaDepartment) => {
    setSelectedState(dept);
    setStateQuery(dept.name);
    setCityQuery("");
    setSelectedCity(null);
    setPostalCodeField("");
  };

  const selectCity = (city: ColombiaCity) => {
    setSelectedCity(city);
    setCityQuery(city.name);
    setPostalCodeField(city.postalCode ?? "");
  };

  const handleStateQueryChange = (value: string) => {
    markTouched("stateQuery");
    const v = formatStateInput(value);
    setStateQuery(v);
    if (selectedState && v !== selectedState.name) {
      setSelectedState(null);
      setSelectedCity(null);
      setCityQuery("");
      setPostalCodeField("");
    }
  };

  const handleCityQueryChange = (value: string) => {
    markTouched("cityQuery");
    setCityQuery(value);
    if (selectedCity && !isNormalizedEqual(value, selectedCity.name)) {
      setSelectedCity(null);
      setPostalCodeField("");
    }
  };

  const handlePostalCodeChange = (value: string) => {
    if (!canEditPostalCode) return;
    markTouched("postalCode");
    setPostalCodeField(formatPostalCodeInput(value));
  };

  // ── Build address payload ────────────────────────────────────────────────
  const buildAddressPayload = useCallback(
    (opts?: { preserveExisting?: boolean }): Address | undefined => {
      if (!showAddress) {
        if (opts?.preserveExisting && initialCustomer?.address) return initialCustomer.address;
        return undefined;
      }
      const address: Address = {
        streetType: streetType || undefined,
        primaryNumber: mainNumber || undefined,
        secondaryNumber: secondaryNumber || undefined,
        complementaryNumber: complementaryNumber || undefined,
        department: stateQuery.trim() || undefined,
        city: cityQuery.trim() || undefined,
        additionalDetails: additionalDetails.trim() || undefined,
        postalCode: postalCodeField.trim() || undefined,
      };
      return Object.values(address).some(Boolean) ? address : undefined;
    },
    [
      showAddress,
      initialCustomer,
      streetType,
      mainNumber,
      secondaryNumber,
      complementaryNumber,
      stateQuery,
      cityQuery,
      additionalDetails,
      postalCodeField,
    ],
  );

  // ── Reset all state ──────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData({
      name: { firstName: "", firstSurname: "" },
      email: "",
      phone: "",
      documentType: "cc" as DocumentType,
      documentNumber: "",
    });
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
    setShowAddress(false);
    setTouched({});
    setFieldErrors({});
    setSubmitted(false);
  }, []);

  // ── Load from existing customer (edit mode) ──────────────────────────────
  const loadCustomer = useCallback(
    (customer: Customer) => {
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

      // Load address
      const addr = customer.address as LegacyCustomerAddress | undefined;
      if (!addr) {
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
        setShowAddress(false);
        return;
      }

      const parsed = asTrimmedString(addr.street)
        ? parseStreet(asTrimmedString(addr.street))
        : null;

      setStreetType(
        normalizeStreetTypeValue(asTrimmedString(addr.streetType) || parsed?.streetType || ""),
      );
      setMainNumber(asTrimmedString(addr.primaryNumber) || parsed?.mainNumber || "");
      setSecondaryNumber(asTrimmedString(addr.secondaryNumber) || parsed?.secondaryNumber || "");
      setComplementaryNumber(
        asTrimmedString(addr.complementaryNumber) || parsed?.complementaryNumber || "",
      );
      setAdditionalDetails(
        asTrimmedString(addr.additionalDetails) ||
          asTrimmedString(addr.additionalInfo) ||
          asTrimmedString(addr.details) ||
          parsed?.additionalDetails ||
          (!parsed ? asTrimmedString(addr.street) : ""),
      );

      const savedState =
        asTrimmedString(addr.department) ||
        asTrimmedString(addr.state) ||
        asTrimmedString(addr.province) ||
        asTrimmedString(addr.region);
      const savedCity =
        asTrimmedString(addr.city) ||
        asTrimmedString(addr.cityName) ||
        asTrimmedString(addr.municipality) ||
        asTrimmedString(addr.town);

      setStateQuery(savedState);
      setCityQuery(savedCity);
      setPostalCodeField(asTrimmedString(addr.postalCode));

      if (departments && savedState) {
        const found = departments.find((d) => isNormalizedEqual(d.name, savedState));
        setSelectedState(found ?? null);
      } else {
        setSelectedState(null);
      }
      setSelectedCity(null);

      setShowAddress(
        !!(
          addr.streetType ||
          addr.primaryNumber ||
          addr.secondaryNumber ||
          addr.complementaryNumber ||
          addr.department ||
          addr.state ||
          addr.province ||
          addr.region ||
          addr.city ||
          addr.cityName ||
          addr.municipality ||
          addr.town ||
          addr.postalCode ||
          addr.additionalDetails ||
          addr.additionalInfo ||
          addr.details ||
          addr.street
        ),
      );

      setTouched({});
      setFieldErrors({});
      setSubmitted(false);
    },
    [departments],
  );

  return {
    // Form data
    formData,
    setFormData,
    // Address fields
    streetType,
    setStreetType,
    mainNumber,
    setMainNumber,
    secondaryNumber,
    setSecondaryNumber,
    complementaryNumber,
    setComplementaryNumber,
    additionalDetails,
    setAdditionalDetails,
    stateQuery,
    cityQuery,
    postalCodeField,
    showAddress,
    setShowAddress,
    // Colombia API
    departments: departments ?? [],
    filteredDepartments,
    filteredCities,
    deptLoading,
    citiesLoading,
    selectedState,
    selectedCity,
    canEditPostalCode,
    // Actions
    handleStateQueryChange,
    handleCityQueryChange,
    handlePostalCodeChange,
    selectDepartment,
    selectCity,
    // Validation
    fieldErrors,
    submitted,
    setSubmitted,
    markTouched,
    blurField,
    runValidation,
    // Derived
    formattedStreet,
    // Lifecycle
    buildAddressPayload,
    resetForm,
    loadCustomer,
  };
}
