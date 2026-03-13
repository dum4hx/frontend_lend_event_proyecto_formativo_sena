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
    return { isValid: false, message: "Email is required" };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Enter a valid email address" };
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
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters" };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }

  // Check for special character
  if (!/[!@#$%^&*.]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character (!@#$%^&*.)",
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
    return { isValid: false, message: "You must confirm your password" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: "Passwords do not match" };
  }

  return { isValid: true };
};

/**
 * First name validation
 */
export const validateFirstName = (firstName: string): ValidationResult => {
  if (!firstName.trim()) {
    return { isValid: false, message: "First name is required" };
  }

  // Only letters (including accents) and spaces; no multiple consecutive spaces
  const allowed = /^[A-Za-zÀ-ÿ ]+$/;
  if (!allowed.test(firstName)) {
    return { isValid: false, message: "First name can only contain letters and spaces" };
  }

  if (/\s{2,}/.test(firstName)) {
    return { isValid: false, message: "First name must not contain multiple consecutive spaces" };
  }

  if (firstName.length < 2) {
    return { isValid: false, message: "First name must be at least 2 characters" };
  }

  if (firstName.length > 50) {
    return { isValid: false, message: "First name must not exceed 50 characters" };
  }

  return { isValid: true };
};

/**
 * Last name validation
 */
export const validateLastName = (lastName: string): ValidationResult => {
  if (!lastName.trim()) {
    return { isValid: false, message: "Last name is required" };
  }

  const allowed = /^[A-Za-zÀ-ÿ ]+$/;
  if (!allowed.test(lastName)) {
    return { isValid: false, message: "Last name can only contain letters and spaces" };
  }

  if (/\s{2,}/.test(lastName)) {
    return { isValid: false, message: "Last name must not contain multiple consecutive spaces" };
  }

  if (lastName.length < 2) {
    return { isValid: false, message: "Last name must be at least 2 characters" };
  }

  if (lastName.length > 50) {
    return { isValid: false, message: "Last name must not exceed 50 characters" };
  }

  return { isValid: true };
};

/**
 * Organization name validation
 */
export const validateOrganizationName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: "Organization name is required" };
  }

  if (name.length < 2) {
    return { isValid: false, message: "Organization name must be at least 2 characters" };
  }

  if (name.length > 100) {
    return { isValid: false, message: "Organization name must not exceed 100 characters" };
  }

  return { isValid: true };
};

/**
 * Role name validation
 * - Required, 2..100 characters
 */
export const validateRoleName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, message: "Role name is required" };
  }

  if (name.length < 2) {
    return { isValid: false, message: "Role name must be at least 2 characters" };
  }

  if (name.length > 100) {
    return { isValid: false, message: "Role name must not exceed 100 characters" };
  }

  return { isValid: true };
};

/**
 * Tax ID validation (required by API)
 */
export const validateTaxId = (taxId: string): ValidationResult => {
  if (!taxId.trim()) {
    return { isValid: false, message: "Tax ID is required" };
  }

  // Accept formatted with hyphens; validate underlying digits only
  const digits = taxId.replace(/-/g, "");
  if (!/^\d+$/.test(digits)) {
    return { isValid: false, message: "Tax ID must contain only numbers" };
  }

  // Length check (9 to 11 digits)
  if (digits.length < 9 || digits.length > 11) {
    return { isValid: false, message: "Tax ID length must be 9 to 11 digits" };
  }

  return { isValid: true };
};

/**
 * Address validation (required by API)
 */
export const validateAddressField = (value: string, label: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: `${label} is required` };
  }

  if (value.length < 2) {
    return { isValid: false, message: `${label} must be at least 2 characters` };
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
    return { isValid: false, message: "Please select a valid department from the list" };
  }

  return { isValid: true };
};

/**
 * Legal name (company registration name) validation - optional
 */
export const validateLegalName = (legalName?: string): ValidationResult => {
  // Legal name is REQUIRED by API contract
  if (!legalName || !legalName.trim()) {
    return { isValid: false, message: "Legal name is required" };
  }

  if (legalName.length < 2) {
    return { isValid: false, message: "Legal name must be at least 2 characters" };
  }

  if (legalName.length > 150) {
    return { isValid: false, message: "Legal name must not exceed 150 characters" };
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
    return { isValid: false, message: "Phone must have Colombian format: +57 3XXXXXXXXX" };
  }

  const localNumber = normalizedPhone.slice(3);
  if (!/^3\d{9}$/.test(localNumber)) {
    return { isValid: false, message: "Enter a valid Colombian mobile number (starts with 3)" };
  }

  return { isValid: true };
};

/** Required phone validation (owner) */
export const validateRequiredPhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: "Phone is required" };
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
    return { isValid: false, message: "Postal code may only contain numbers" };
  }

  if (postalCode.length !== 6) {
    return { isValid: false, message: "Postal code must be exactly 6 digits" };
  }

  return { isValid: true };
};

/**
 * Current password validation for change password
 */
export const validateCurrentPassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: "You must enter your current password" };
  }

  return { isValid: true };
};

/**
 * Code validation (6 digits for password reset)
 */
export const validateCode = (code: string): ValidationResult => {
  if (!code) {
    return { isValid: false, message: "Code is required" };
  }

  if (!/^\d{6}$/.test(code)) {
    return { isValid: false, message: "Code must be exactly 6 digits" };
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
    return { isValid: false, message: "Owner email must be different from organization email" };
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
    return { isValid: false, message: "Password is required" };
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
    return { isValid: false, message: "Plan identifier is required." };
  }
  if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
    return { isValid: false, message: "Must be lowercase alphanumeric with underscores." };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: "Max 50 characters." };
  }
  return { isValid: true };
};

/**
 * Display name validation for subscription plans
 */
export const validatePlanDisplayName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, message: "Display name is required." };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: "Max 100 characters." };
  }
  return { isValid: true };
};

/**
 * Cost in cents validation (baseCost, pricePerSeat)
 */
export const validateCostCents = (value: number, label = "Value"): ValidationResult => {
  if (!Number.isFinite(value) || value < 0) {
    return { isValid: false, message: `${label} must be a non-negative number (in cents).` };
  }
  return { isValid: true };
};

/**
 * Limit field validation (maxSeats, maxCatalogItems) — must be -1 or a positive integer
 */
export const validateLimitField = (value: number, label = "Value"): ValidationResult => {
  if (!Number.isInteger(value) || value < -1 || value === 0) {
    return { isValid: false, message: `${label} must be -1 (unlimited) or a positive integer.` };
  }
  return { isValid: true };
};

/**
 * Duration days validation — integer between 1 and 365
 */
export const validateDurationDays = (days: number): ValidationResult => {
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return { isValid: false, message: "Must be an integer between 1 and 365." };
  }
  return { isValid: true };
};

/**
 * Sort order validation — must be an integer
 */
export const validateSortOrder = (order: number): ValidationResult => {
  if (!Number.isInteger(order)) {
    return { isValid: false, message: "Must be an integer." };
  }
  return { isValid: true };
};

/**
 * Plan description validation — optional, max 500 chars
 */
export const validatePlanDescription = (desc: string): ValidationResult => {
  if (desc.length > 500) {
    return { isValid: false, message: "Max 500 characters." };
  }
  return { isValid: true };
};

/**
 * Stripe price ID validation — optional; if provided must start with "price_"
 */
export const validateStripePriceId = (id: string): ValidationResult => {
  if (!id) return { isValid: true };
  if (!id.startsWith("price_")) {
    return { isValid: false, message: 'Stripe price IDs must start with "price_".' };
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
    return { isValid: false, message: "New password must be different from the current password" };
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
  if (!form.code || !form.code.trim()) return { isValid: false, message: "Code is required" };
  if (!form.name || !form.name.trim()) return { isValid: false, message: "Name is required" };
  if (!form.section || !form.section.trim())
    return { isValid: false, message: "Section is required" };
  if (!form.shelf || !form.shelf.trim()) return { isValid: false, message: "Shelf is required" };
  if (typeof form.capacity !== "number" || Number.isNaN(form.capacity) || form.capacity < 0)
    return { isValid: false, message: "Capacity must be a non-negative number" };
  if (typeof form.occupied !== "number" || Number.isNaN(form.occupied) || form.occupied < 0)
    return { isValid: false, message: "Occupied must be a non-negative number" };
  if ((form.capacity ?? 0) > 0 && (form.occupied ?? 0) > (form.capacity ?? 0))
    return { isValid: false, message: "Occupied cannot be greater than capacity" };
  const allowed = ["available", "full", "maintenance"];
  if (!allowed.includes(form.status ?? "available"))
    return { isValid: false, message: "Invalid status" };
  // Address validation (required by backend)
  if (!form.address) return { isValid: false, message: "Address is required" };
  if (!form.address.country || !form.address.country.trim())
    return { isValid: false, message: "Country is required" };
  if (!form.address.city || !form.address.city.trim())
    return { isValid: false, message: "City is required" };
  if (!form.address.street || !form.address.street.trim())
    return { isValid: false, message: "Street is required" };
  if (!form.address.propertyNumber || !form.address.propertyNumber.trim())
    return { isValid: false, message: "Property number is required" };
  return { isValid: true };
};

/**
 * Validate material capacities for a location
 */
export const validateMaterialCapacities = (
  capacities: Array<{ materialTypeId: string; maxQuantity: number | "" }>,
): ValidationResult => {
  if (!capacities || capacities.length === 0) {
    return { isValid: false, message: "At least one material capacity must be defined" };
  }

  for (let i = 0; i < capacities.length; i++) {
    const cap = capacities[i];
    if (cap.maxQuantity === "") {
      return { isValid: false, message: "All material types must have a defined capacity" };
    }
    if (typeof cap.maxQuantity !== "number" || cap.maxQuantity < 0) {
      return { isValid: false, message: "Capacity must be a non-negative number" };
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
    country: string;
    state?: string;
    city: string;
    street: string;
    propertyNumber: string;
    additionalInfo?: string;
  };
  materialCapacities?: Array<{ materialTypeId: string; maxQuantity: number | "" }>;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) errors.name = "Name is required";
  if (form.name.length > 100) errors.name = "Name must not exceed 100 characters";

  if (!form.address.country.trim()) errors["address.country"] = "Country is required";
  if (!form.address.city.trim()) errors["address.city"] = "City is required";
  if (!form.address.street.trim()) errors["address.street"] = "Street is required";
  if (!form.address.propertyNumber.trim())
    errors["address.propertyNumber"] = "Property number is required";

  if (form.materialCapacities) {
    const capValidation = validateMaterialCapacities(form.materialCapacities);
    if (!capValidation.isValid) {
      errors.materialCapacities = capValidation.message || "Invalid capacities";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
