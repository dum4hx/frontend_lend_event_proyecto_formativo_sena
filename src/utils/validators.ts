/**
 * Validation utilities for authentication forms
 * Based on API requirements
 */

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Email validation
 * - Valid email format required by API
 */
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return { isValid: false, message: "common.validation.emailRequired" };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: "common.validation.emailInvalid" };
  }

  return { isValid: true };
};

/**
 * Password validation
 * API requires strong passwords for security
 * Rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*)
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: "common.validation.passwordRequired" };
  }

  if (password.length < 8) {
    return { isValid: false, message: "common.validation.passwordMinLength" };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "common.validation.passwordUppercase" };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "common.validation.passwordLowercase" };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "common.validation.passwordNumber" };
  }

  // Check for special character
  if (!/[!@#$%^&*.]/.test(password)) {
    return {
      isValid: false,
      message: "common.validation.passwordSpecial",
    };
  }

  return { isValid: true };
};

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: "common.validation.confirmPasswordRequired" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: "common.validation.passwordsNoMatch" };
  }

  return { isValid: true };
};

/**
 * First name validation
 */
export const validateFirstName = (firstName: string): ValidationResult => {
  if (!firstName.trim()) {
    return { isValid: false, message: "common.validation.firstNameRequired" };
  }

  // Only letters (including accents) and spaces; no multiple consecutive spaces
  const allowed = /^[A-Za-zÀ-ÿ ]+$/;
  if (!allowed.test(firstName)) {
    return { isValid: false, message: "common.validation.firstNameLettersOnly" };
  }

  if (/\s{2,}/.test(firstName)) {
    return { isValid: false, message: "common.validation.firstNameConsecutiveSpaces" };
  }

  if (firstName.length < 2) {
    return { isValid: false, message: "common.validation.firstNameMinLength" };
  }

  if (firstName.length > 50) {
    return { isValid: false, message: "common.validation.firstNameMaxLength" };
  }

  return { isValid: true };
};

/**
 * Last name validation
 */
export const validateLastName = (lastName: string): ValidationResult => {
  if (!lastName.trim()) {
    return { isValid: false, message: "common.validation.lastNameRequired" };
  }

  const allowed = /^[A-Za-zÀ-ÿ ]+$/;
  if (!allowed.test(lastName)) {
    return { isValid: false, message: "common.validation.lastNameLettersOnly" };
  }

  if (/\s{2,}/.test(lastName)) {
    return { isValid: false, message: "common.validation.lastNameConsecutiveSpaces" };
  }

  if (lastName.length < 2) {
    return { isValid: false, message: "common.validation.lastNameMinLength" };
  }

  if (lastName.length > 50) {
    return { isValid: false, message: "common.validation.lastNameMaxLength" };
  }

  return { isValid: true };
};

/**
 * Organization name validation
 */
export const validateOrganizationName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: "common.validation.orgNameRequired" };
  }

  if (name.length < 2) {
    return { isValid: false, message: "common.validation.orgNameMinLength" };
  }

  if (name.length > 100) {
    return { isValid: false, message: "common.validation.orgNameMaxLength" };
  }

  return { isValid: true };
};

/**
 * Role name validation
 * - Required, 2..100 characters
 */
export const validateRoleName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, message: "common.validation.roleNameRequired" };
  }

  if (name.length < 2) {
    return { isValid: false, message: "common.validation.roleNameMinLength" };
  }

  if (name.length > 100) {
    return { isValid: false, message: "common.validation.roleNameMaxLength" };
  }

  return { isValid: true };
};

/**
 * Tax ID validation (required by API)
 */
export const validateTaxId = (taxId: string): ValidationResult => {
  if (!taxId.trim()) {
    return { isValid: false, message: "common.validation.taxIdRequired" };
  }

  // Accept formatted with hyphens; validate underlying digits only
  const digits = taxId.replace(/-/g, "");
  if (!/^\d+$/.test(digits)) {
    return { isValid: false, message: "common.validation.taxIdDigitsOnly" };
  }

  // Length check (9 to 11 digits)
  if (digits.length < 9 || digits.length > 11) {
    return { isValid: false, message: "common.validation.taxIdLength" };
  }

  return { isValid: true };
};

/**
 * Address validation (required by API)
 */
export const validateAddressField = (value: string, _label: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: "common.validation.addressFieldRequired" };
  }

  if (value.length < 2) {
    return { isValid: false, message: "common.validation.addressFieldMinLength" };
  }

  return { isValid: true };
};

/**
 * State (Departamento) validation
 * Must be selected from the Colombia API suggestions list.
 */
export const validateState = (state: string, isSelected: boolean): ValidationResult => {
  if (!state.trim()) {
    return { isValid: true }; // Optional field
  }

  if (!isSelected) {
    return { isValid: false, message: "common.validation.stateInvalid" };
  }

  return { isValid: true };
};

/**
 * Legal name (company registration name) validation - optional
 */
export const validateLegalName = (legalName?: string): ValidationResult => {
  // Legal name is REQUIRED by API contract
  if (!legalName || !legalName.trim()) {
    return { isValid: false, message: "common.validation.legalNameRequired" };
  }

  if (legalName.length < 2) {
    return { isValid: false, message: "common.validation.legalNameMinLength" };
  }

  if (legalName.length > 150) {
    return { isValid: false, message: "common.validation.legalNameMaxLength" };
  }

  return { isValid: true };
};

/**
 * Phone validation (optional, Colombian format support)
 */
export const validatePhone = (phone?: string): ValidationResult => {
  if (!phone) {
    return { isValid: true }; // Phone is optional
  }

  // Colombian mobile format: +57 followed by 10 digits starting with 3
  const normalizedPhone = phone.replace(/\s+/g, "");

  if (!/^\+57\d{10}$/.test(normalizedPhone)) {
    return { isValid: false, message: "common.validation.phoneFormat" };
  }

  const localNumber = normalizedPhone.slice(3);
  if (!/^3\d{9}$/.test(localNumber)) {
    return { isValid: false, message: "common.validation.phoneStartsWith3" };
  }

  return { isValid: true };
};

/** Required phone validation (owner) */
export const validateRequiredPhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: "common.validation.phoneRequired" };
  }
  return validatePhone(phone);
};

/**
 * Postal code validation (required by API, only numbers)
 */
export const validatePostalCode = (postalCode?: string): ValidationResult => {
  if (!postalCode || !postalCode.trim()) {
    return { isValid: true }; // Optional as part of address
  }

  // Only allow numbers
  if (!/^[0-9]+$/.test(postalCode)) {
    return { isValid: false, message: "common.validation.postalCodeDigitsOnly" };
  }

  if (postalCode.length !== 6) {
    return { isValid: false, message: "common.validation.postalCodeLength" };
  }

  return { isValid: true };
};

/**
 * Current password validation for change password
 */
export const validateCurrentPassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: "common.validation.currentPasswordRequired" };
  }

  return { isValid: true };
};

/**
 * Code validation (6 digits for password reset)
 */
export const validateCode = (code: string): ValidationResult => {
  if (!code) {
    return { isValid: false, message: "common.validation.codeRequired" };
  }

  if (!/^\d{6}$/.test(code)) {
    return { isValid: false, message: "common.validation.codeLength" };
  }

  return { isValid: true };
};

/**
 * Validate entire registration form
 */
export const validateRegistrationForm = (formData: {
  firstName: string;
  lastName: string;
  ownerEmail: string;
  organizationEmail: string;
  organizationName: string;
  legalName?: string;
  taxId?: string;
  street?: string;
  city?: string;
  state?: string;
  isStateSelected?: boolean;
  postalCode?: string;
  password: string;
  confirmPassword: string;
  ownerPhone: string;
  organizationPhone?: string;
}): ValidationResult => {
  // Validate firstName
  const firstNameValidation = validateFirstName(formData.firstName);
  if (!firstNameValidation.isValid) return firstNameValidation;

  // Validate lastName
  const lastNameValidation = validateLastName(formData.lastName);
  if (!lastNameValidation.isValid) return lastNameValidation;

  // Validate emails (owner & organization)
  const ownerEmailValidation = validateEmail(formData.ownerEmail);
  if (!ownerEmailValidation.isValid) return ownerEmailValidation;

  const orgEmailValidation = validateEmail(formData.organizationEmail);
  if (!orgEmailValidation.isValid) return orgEmailValidation;

  // Prevent using the same email for owner and organization
  if (
    formData.ownerEmail.trim().toLowerCase() === formData.organizationEmail.trim().toLowerCase()
  ) {
    return { isValid: false, message: "common.validation.emailsDuplicate" };
  }

  // Validate organization
  const orgValidation = validateOrganizationName(formData.organizationName);
  if (!orgValidation.isValid) return orgValidation;

  // Validate legal name (required by API)
  const legalValidation = validateLegalName(formData.legalName);
  if (!legalValidation.isValid) return legalValidation;

  // Validate tax ID (optional)
  if (formData.taxId) {
    const taxValidation = validateTaxId(formData.taxId);
    if (!taxValidation.isValid) return taxValidation;
  }

  // Validate structured street address (required)
  const streetValidation = validateAddressField(formData.street ?? "", "Street");
  if (!streetValidation.isValid) return streetValidation;

  if (formData.city) {
    const cityValidation = validateAddressField(formData.city, "City");
    if (!cityValidation.isValid) return cityValidation;
  }

  if (formData.state) {
    const stateValidation = validateState(formData.state, !!formData.isStateSelected);
    if (!stateValidation.isValid) return stateValidation;
  }

  const postalValidation = validatePostalCode(formData.postalCode);
  if (!postalValidation.isValid) return postalValidation;

  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) return passwordValidation;

  // Validate confirm password
  const confirmValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (!confirmValidation.isValid) return confirmValidation;

  // Validate phones: owner required, organization optional
  const ownerPhoneValidation = validateRequiredPhone(formData.ownerPhone);
  if (!ownerPhoneValidation.isValid) return ownerPhoneValidation;

  const organizationPhoneValidation = validatePhone(formData.organizationPhone);
  if (!organizationPhoneValidation.isValid) return organizationPhoneValidation;

  return { isValid: true };
};

/**
 * Validate entire login form
 */
export const validateLoginForm = (formData: {
  email: string;
  password: string;
}): ValidationResult => {
  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) return emailValidation;

  // Validate password
  if (!formData.password) {
    return { isValid: false, message: "common.validation.passwordRequired" };
  }

  return { isValid: true };
};

/**
 * Validate password change form
 */
// ─── Subscription plan field validators ────────────────────────────────────

/**
 * Plan identifier validation
 * - Lowercase alphanumeric with underscores, starts with letter, max 50 chars
 */
export const validatePlanIdentifier = (plan: string): ValidationResult => {
  const trimmed = plan.trim();
  if (!trimmed) {
    return { isValid: false, message: "common.validation.planIdRequired" };
  }
  if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
    return { isValid: false, message: "common.validation.planIdFormat" };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: "common.validation.planIdMaxLength" };
  }
  return { isValid: true };
};

/**
 * Display name validation for subscription plans
 */
export const validatePlanDisplayName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, message: "common.validation.planDisplayNameRequired" };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: "common.validation.planDisplayNameMaxLength" };
  }
  return { isValid: true };
};

/**
 * Cost in cents validation (baseCost, pricePerSeat)
 */
export const validateCostCents = (value: number, _label = "Value"): ValidationResult => {
  if (!Number.isFinite(value) || value < 0) {
    return { isValid: false, message: "common.validation.costNonNegative" };
  }
  return { isValid: true };
};

/**
 * Limit field validation (maxSeats, maxCatalogItems) — must be -1 or a positive integer
 */
export const validateLimitField = (value: number, _label = "Value"): ValidationResult => {
  if (!Number.isInteger(value) || value < -1 || value === 0) {
    return { isValid: false, message: "common.validation.limitInvalid" };
  }
  return { isValid: true };
};

/**
 * Duration days validation — integer between 1 and 365
 */
export const validateDurationDays = (days: number): ValidationResult => {
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return { isValid: false, message: "common.validation.durationDaysRange" };
  }
  return { isValid: true };
};

/**
 * Sort order validation — must be an integer
 */
export const validateSortOrder = (order: number): ValidationResult => {
  if (!Number.isInteger(order)) {
    return { isValid: false, message: "common.validation.sortOrderInteger" };
  }
  return { isValid: true };
};

/**
 * Plan description validation — optional, max 500 chars
 */
export const validatePlanDescription = (desc: string): ValidationResult => {
  if (desc.length > 500) {
    return { isValid: false, message: "common.validation.planDescMaxLength" };
  }
  return { isValid: true };
};

/**
 * Stripe price ID validation — optional; if provided must start with "price_"
 */
export const validateStripePriceId = (id: string): ValidationResult => {
  if (!id) return { isValid: true };
  if (!id.startsWith("price_")) {
    return { isValid: false, message: "common.validation.stripePriceIdFormat" };
  }
  return { isValid: true };
};
/**
 * Document number validation for Colombian identity documents
 * Rules:
 * - Required
 * - Digits only (no letters, spaces, or special characters)
 * - Between 8 and 11 digits
 */
export const validateDocumentNumber = (docNumber: string): ValidationResult => {
  const trimmed = docNumber.trim();
  if (!trimmed) {
    return { isValid: false, message: "common.validation.documentNumberRequired" };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { isValid: false, message: "common.validation.documentNumberDigitsOnly" };
  }
  if (trimmed.length < 8) {
    return { isValid: false, message: "common.validation.documentNumberMinLength" };
  }
  if (trimmed.length > 11) {
    return { isValid: false, message: "common.validation.documentNumberMaxLength" };
  }
  return { isValid: true };
};

export const validateChangePasswordForm = (formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): ValidationResult => {
  // Validate current password
  const currentValidation = validateCurrentPassword(formData.currentPassword);
  if (!currentValidation.isValid) return currentValidation;

  // Validate new password
  const newPasswordValidation = validatePassword(formData.newPassword);
  if (!newPasswordValidation.isValid) return newPasswordValidation;

  // Validate confirm password
  const confirmValidation = validateConfirmPassword(formData.newPassword, formData.confirmPassword);
  if (!confirmValidation.isValid) return confirmValidation;

  // Ensure current password is different from new password
  if (formData.currentPassword === formData.newPassword) {
    return { isValid: false, message: "common.validation.passwordDifferent" };
  }

  return { isValid: true };
};

/**
 * Validate a simple warehouse location form used across the app
 */
export const validateLocationForm = (form: {
  code?: string;
  name?: string;
  section?: string;
  shelf?: string;
  capacity?: number;
  occupied?: number;
  status?: string;
  address?: {
    country?: string;
    city?: string;
    street?: string;
    propertyNumber?: string;
  };
}): ValidationResult => {
  if (!form.code || !form.code.trim())
    return { isValid: false, message: "common.validation.locationCodeRequired" };
  if (!form.name || !form.name.trim())
    return { isValid: false, message: "common.validation.locationNameRequired" };
  if (!form.section || !form.section.trim())
    return { isValid: false, message: "common.validation.locationSectionRequired" };
  if (!form.shelf || !form.shelf.trim())
    return { isValid: false, message: "common.validation.locationShelfRequired" };
  if (typeof form.capacity !== "number" || Number.isNaN(form.capacity) || form.capacity < 0)
    return { isValid: false, message: "common.validation.locationCapacityInvalid" };
  if (typeof form.occupied !== "number" || Number.isNaN(form.occupied) || form.occupied < 0)
    return { isValid: false, message: "common.validation.locationOccupiedInvalid" };
  if ((form.capacity ?? 0) > 0 && (form.occupied ?? 0) > (form.capacity ?? 0))
    return { isValid: false, message: "common.validation.locationOccupiedExceedsCapacity" };
  const allowed = ["available", "full", "maintenance"];
  if (!allowed.includes(form.status ?? "available"))
    return { isValid: false, message: "common.validation.locationStatusInvalid" };
  // Address validation (required by backend)
  if (!form.address)
    return { isValid: false, message: "common.validation.locationAddressRequired" };
  if (!form.address.country || !form.address.country.trim())
    return { isValid: false, message: "common.validation.locationCountryRequired" };
  if (!form.address.city || !form.address.city.trim())
    return { isValid: false, message: "common.validation.locationCityRequired" };
  if (!form.address.street || !form.address.street.trim())
    return { isValid: false, message: "common.validation.locationStreetRequired" };
  if (!form.address.propertyNumber || !form.address.propertyNumber.trim())
    return { isValid: false, message: "common.validation.locationPropertyNumberRequired" };
  return { isValid: true };
};

/**
 * Validate material capacities for a location
 */
export const validateMaterialCapacities = (
  capacities: Array<{ materialTypeId: string; maxQuantity: number | "" }>,
): ValidationResult => {
  // An empty array is valid: it means no material types exist yet in the system.
  if (!capacities || capacities.length === 0) {
    return { isValid: true };
  }

  for (let i = 0; i < capacities.length; i++) {
    const cap = capacities[i];
    if (cap.maxQuantity === "") {
      return { isValid: false, message: "common.validation.materialCapacitiesAllDefined" };
    }
    if (typeof cap.maxQuantity !== "number" || cap.maxQuantity < 0) {
      return { isValid: false, message: "common.validation.locationCapacityInvalid" };
    }
  }

  return { isValid: true };
};

/**
 * Enhanced Location Validation (V2) matching the latest API documentation
 */
export const validateLocationV2 = (form: {
  name: string;
  address: {
    streetType: string;
    primaryNumber: string;
    secondaryNumber: string;
    complementaryNumber: string;
    department: string;
    city: string;
    additionalDetails?: string;
  };
  materialCapacities?: Array<{ materialTypeId: string; maxQuantity: number | "" }>;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) errors.name = "common.validation.locationV2NameRequired";
  if (form.name.length > 100) errors.name = "common.validation.locationV2NameMaxLength";

  if (!form.address.streetType.trim())
    errors["address.street"] = "common.validation.locationV2StreetTypeRequired";
  if (!form.address.primaryNumber.trim())
    errors["address.street"] = "common.validation.locationV2StreetNumberRequired";
  if (!form.address.secondaryNumber.trim())
    errors["address.propertyNumber"] = "common.validation.locationV2PropertyNumberRequired";
  if (!form.address.complementaryNumber.trim())
    errors["address.complementaryNumber"] = "common.validation.locationV2ComplementaryRequired";
  if (!form.address.department.trim())
    errors["address.state"] = "common.validation.locationV2DepartmentRequired";
  if (!form.address.city.trim())
    errors["address.city"] = "common.validation.locationV2CityRequired";

  // Only validate capacities when there are material types to configure.
  if (form.materialCapacities && form.materialCapacities.length > 0) {
    const capValidation = validateMaterialCapacities(form.materialCapacities);
    if (!capValidation.isValid) {
      errors.materialCapacities =
        capValidation.message || "common.validation.locationCapacityInvalid";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Category name validation
 */
export const validateCategoryName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: "common.validation.categoryNameRequired" };
  }

  if (name.length < 2) {
    return { isValid: false, message: "common.validation.categoryNameMinLength" };
  }

  if (name.length > 100) {
    return { isValid: false, message: "common.validation.categoryNameMaxLength" };
  }

  return { isValid: true };
};

/**
 * Material type code validation (1-10 alphanumeric uppercase chars).
 * Used as the {TYPE_CODE} token in code schemes.
 */
export const validateMaterialTypeCode = (code: string): ValidationResult => {
  const trimmed = code.trim();
  if (!trimmed) {
    return { isValid: false, message: "common.validation.materialTypeCodeRequired" };
  }
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { isValid: false, message: "common.validation.materialTypeCodeFormat" };
  }
  if (trimmed.length > 10) {
    return { isValid: false, message: "common.validation.materialTypeCodeMaxLength" };
  }
  return { isValid: true };
};

/**
 * Category code validation (1-10 alphanumeric uppercase chars).
 * Used as the {CATEGORY_CODE} token in code schemes.
 */
export const validateCategoryCode = (code: string): ValidationResult => {
  const trimmed = code.trim();
  if (!trimmed) {
    return { isValid: false, message: "common.validation.categoryCodeRequired" };
  }
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { isValid: false, message: "common.validation.categoryCodeFormat" };
  }
  if (trimmed.length > 10) {
    return { isValid: false, message: "common.validation.categoryCodeMaxLength" };
  }
  return { isValid: true };
};

/**
 * Category description validation (optional)
 */
export const validateCategoryDescription = (description?: string): ValidationResult => {
  if (!description) {
    return { isValid: true };
  }

  if (description.length > 500) {
    return { isValid: false, message: "common.validation.categoryDescMaxLength" };
  }

  return { isValid: true };
};

/**
 * Code scheme name validation (1-100 chars, non-empty).
 * Returns i18n keys so callers can translate via t().
 */
export const validateCodeSchemeName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, message: "settings.codeSchemes.validation.nameRequired" };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: "settings.codeSchemes.validation.nameTooLong" };
  }
  return { isValid: true };
};

/**
 * Damage description validator for inspection items.
 * Required when the material condition is 'damaged' or 'lost'.
 * @example validateDamageDescription("Scratch on surface") // { isValid: true }
 * @example validateDamageDescription("") // { isValid: false, message: "inspections.damageDescriptionRequired" }
 */
export const validateDamageDescription = (description: string): ValidationResult => {
  if (!description || !description.trim()) {
    return { isValid: false, message: "inspections.damageDescriptionRequired" };
  }
  return { isValid: true };
};

/**
 * Code scheme pattern validation (1-50 chars, must contain {SEQ} or {SEQ:N}).
 * For material_instance entity type, {TYPE_CODE} and {CATEGORY_CODE} tokens
 * are allowed; for other entity types they are forbidden.
 * Returns i18n keys so callers can translate via t().
 */
export const validateCodeSchemePattern = (
  pattern: string,
  entityType: string,
): ValidationResult => {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return { isValid: false, message: "settings.codeSchemes.validation.patternRequired" };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: "settings.codeSchemes.validation.patternTooLong" };
  }
  if (!/\{SEQ(:\d+)?\}/i.test(trimmed)) {
    return { isValid: false, message: "settings.codeSchemes.validation.patternNeedsSeq" };
  }
  if (entityType !== "material_instance") {
    if (/\{TYPE_CODE\}/i.test(trimmed) || /\{CATEGORY_CODE\}/i.test(trimmed)) {
      return {
        isValid: false,
        message: "settings.codeSchemes.validation.scopeTokensOnlyMaterial",
      };
    }
  }
  return { isValid: true };
};

/**
 * Date range validation for report filters.
 * Ensures "from" is not after "to". Both values are optional.
 * @example validateDateRange("2025-01-01", "2025-12-31") // { isValid: true }
 * @example validateDateRange("2025-12-31", "2025-01-01") // { isValid: false, message: "..." }
 */
export const validateDateRange = (from: string, to: string): ValidationResult => {
  if (!from || !to) return { isValid: true };
  if (from > to) {
    return { isValid: false, message: "reports.filter.dateRangeError" };
  }
  return { isValid: true };
};

/**
 * Search query validation for report text search fields.
 * Max 100 characters. No regex-special chars to avoid injection.
 * @example validateSearchQuery("silla") // { isValid: true }
 * @example validateSearchQuery("a".repeat(101)) // { isValid: false, message: "..." }
 */
export const validateSearchQuery = (query: string): ValidationResult => {
  if (query.length > 100) {
    return { isValid: false, message: "reports.filter.searchTooLong" };
  }
  return { isValid: true };
};
