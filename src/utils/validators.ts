/**
 * Validation utilities for authentication forms
 * Based on API requirements
 */

interface ValidationResult {
  isValid: boolean
  message?: string
}

/**
 * Email validation
 * - Valid email format required by API
 */
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email.trim()) {
    return { isValid: false, message: 'Email is required' }
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Enter a valid email address' }
  }

  return { isValid: true }
}

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
    return { isValid: false, message: 'Password is required' }
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' }
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' }
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }

  // Check for special character
  if (!/[!@#$%^&*.]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*.)' }
  }

  return { isValid: true }
}

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: 'You must confirm your password' }
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' }
  }

  return { isValid: true }
}

/**
 * First name validation
 */
export const validateFirstName = (firstName: string): ValidationResult => {
  if (!firstName.trim()) {
    return { isValid: false, message: 'First name is required' }
  }

  // Only letters (including accents) and spaces; no multiple consecutive spaces
  const allowed = /^[A-Za-zÀ-ÿ ]+$/
  if (!allowed.test(firstName)) {
    return { isValid: false, message: 'First name can only contain letters and spaces' }
  }

  if (/\s{2,}/.test(firstName)) {
    return { isValid: false, message: 'First name must not contain multiple consecutive spaces' }
  }

  if (firstName.length < 2) {
    return { isValid: false, message: 'First name must be at least 2 characters' }
  }

  if (firstName.length > 50) {
    return { isValid: false, message: 'First name must not exceed 50 characters' }
  }

  return { isValid: true }
}

/**
 * Last name validation
 */
export const validateLastName = (lastName: string): ValidationResult => {
  if (!lastName.trim()) {
    return { isValid: false, message: 'Last name is required' }
  }

  const allowed = /^[A-Za-zÀ-ÿ ]+$/
  if (!allowed.test(lastName)) {
    return { isValid: false, message: 'Last name can only contain letters and spaces' }
  }

  if (/\s{2,}/.test(lastName)) {
    return { isValid: false, message: 'Last name must not contain multiple consecutive spaces' }
  }

  if (lastName.length < 2) {
    return { isValid: false, message: 'Last name must be at least 2 characters' }
  }

  if (lastName.length > 50) {
    return { isValid: false, message: 'Last name must not exceed 50 characters' }
  }

  return { isValid: true }
}

/**
 * Organization name validation
 */
export const validateOrganizationName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: 'Organization name is required' }
  }

  if (name.length < 2) {
    return { isValid: false, message: 'Organization name must be at least 2 characters' }
  }

  if (name.length > 100) {
    return { isValid: false, message: 'Organization name must not exceed 100 characters' }
  }

  return { isValid: true }
}

/**
 * Tax ID validation (required by API)
 */
export const validateTaxId = (taxId: string): ValidationResult => {
  if (!taxId.trim()) {
    return { isValid: false, message: 'Tax ID is required' }
  }

  // Accept formatted with hyphens; validate underlying digits only
  const digits = taxId.replace(/-/g, '')
  if (!/^\d+$/.test(digits)) {
    return { isValid: false, message: 'Tax ID must contain only numbers' }
  }

  // Must be grouped by 3 (e.g., 123-123-123)
  if (digits.length % 3 !== 0) {
    return { isValid: false, message: 'Tax ID must be groups of 3 digits (e.g., 123-123-123)' }
  }

  // Reasonable length check (6 to 12 digits, multiples of 3)
  if (digits.length < 6 || digits.length > 12) {
    return { isValid: false, message: 'Tax ID length must be 6 to 12 digits (in groups of 3)' }
  }

  return { isValid: true }
}

/**
 * Address validation (required by API)
 */
export const validateAddressField = (value: string, label: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: `${label} is required` }
  }

  if (value.length < 2) {
    return { isValid: false, message: `${label} must be at least 2 characters` }
  }

  return { isValid: true }
}

/**
 * State (Departamento) validation
 * Must be selected from the Colombia API suggestions list.
 */
export const validateState = (state: string, isSelected: boolean): ValidationResult => {
  if (!state.trim()) {
    return { isValid: true } // Optional field
  }

  if (!isSelected) {
    return { isValid: false, message: 'Please select a valid department from the list' }
  }

  return { isValid: true }
}

/**
 * Legal name (company registration name) validation - optional
 */
export const validateLegalName = (legalName?: string): ValidationResult => {
  // Legal name is REQUIRED by API contract
  if (!legalName || !legalName.trim()) {
    return { isValid: false, message: 'Legal name is required' }
  }

  if (legalName.length < 2) {
    return { isValid: false, message: 'Legal name must be at least 2 characters' }
  }

  if (legalName.length > 150) {
    return { isValid: false, message: 'Legal name must not exceed 150 characters' }
  }

  return { isValid: true }
}

/**
 * Phone validation (optional, Colombian format support)
 */
export const validatePhone = (phone?: string): ValidationResult => {
  if (!phone) {
    return { isValid: true } // Phone is optional
  }

  // Must start with a single '+' and contain only digits afterwards
  if (!phone.startsWith('+')) {
    return { isValid: false, message: 'Phone must start with + followed by digits' }
  }
  if ((phone.match(/\+/g) || []).length > 1) {
    return { isValid: false, message: 'The + symbol can only appear once and at the beginning' }
  }
  const digits = phone.slice(1)
  if (!/^\d+$/.test(digits)) {
    return { isValid: false, message: 'Phone may only contain numbers after the +' }
  }
  if (digits.length < 7 || digits.length > 15) {
    return { isValid: false, message: 'Phone number must have between 7 and 15 digits' }
  }
  return { isValid: true }
}

/** Required phone validation (owner) */
export const validateRequiredPhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: 'Phone is required' }
  }
  return validatePhone(phone)
}

/**
 * Postal code validation (required by API, only numbers)
 */
export const validatePostalCode = (postalCode?: string): ValidationResult => {
  if (!postalCode || !postalCode.trim()) {
    return { isValid: true } // Optional as part of address
  }

  // Only allow numbers
  if (!/^[0-9]+$/.test(postalCode)) {
    return { isValid: false, message: 'Postal code may only contain numbers' }
  }

  if (postalCode.length < 3) {
    return { isValid: false, message: 'Postal code must be at least 3 characters' }
  }

  return { isValid: true }
}

/**
 * Current password validation for change password
 */
export const validateCurrentPassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'You must enter your current password' }
  }

  return { isValid: true }
}

/**
 * Code validation (6 digits for password reset)
 */
export const validateCode = (code: string): ValidationResult => {
  if (!code) {
    return { isValid: false, message: 'Code is required' }
  }

  if (!/^\d{6}$/.test(code)) {
    return { isValid: false, message: 'Code must be exactly 6 digits' }
  }

  return { isValid: true }
}

/**
 * Validate entire registration form
 */
export const validateRegistrationForm = (formData: {
  firstName: string
  lastName: string
  ownerEmail: string
  organizationEmail: string
  organizationName: string
  legalName?: string
  taxId?: string
  street?: string
  city?: string
  state?: string
  isStateSelected?: boolean
  postalCode?: string
  password: string
  confirmPassword: string
  ownerPhone: string
  organizationPhone?: string
}): ValidationResult => {
  // Validate firstName
  const firstNameValidation = validateFirstName(formData.firstName)
  if (!firstNameValidation.isValid) return firstNameValidation

  // Validate lastName
  const lastNameValidation = validateLastName(formData.lastName)
  if (!lastNameValidation.isValid) return lastNameValidation

  // Validate emails (owner & organization)
  const ownerEmailValidation = validateEmail(formData.ownerEmail)
  if (!ownerEmailValidation.isValid) return ownerEmailValidation

  const orgEmailValidation = validateEmail(formData.organizationEmail)
  if (!orgEmailValidation.isValid) return orgEmailValidation

  // Prevent using the same email for owner and organization
  if (formData.ownerEmail.trim().toLowerCase() === formData.organizationEmail.trim().toLowerCase()) {
    return { isValid: false, message: 'Owner email must be different from organization email' }
  }

  // Validate organization
  const orgValidation = validateOrganizationName(formData.organizationName)
  if (!orgValidation.isValid) return orgValidation

  // Validate legal name (required by API)
  const legalValidation = validateLegalName(formData.legalName)
  if (!legalValidation.isValid) return legalValidation

  // Validate tax ID (optional)
  if (formData.taxId) {
    const taxValidation = validateTaxId(formData.taxId)
    if (!taxValidation.isValid) return taxValidation
  }

  // Validate address fields (optional overall; validate only if provided)
  if (formData.street) {
    const streetValidation = validateAddressField(formData.street, 'Street')
    if (!streetValidation.isValid) return streetValidation
  }

  if (formData.city) {
    const cityValidation = validateAddressField(formData.city, 'City')
    if (!cityValidation.isValid) return cityValidation
  }

  if (formData.state) {
    const stateValidation = validateState(formData.state, !!formData.isStateSelected)
    if (!stateValidation.isValid) return stateValidation
  }

  const postalValidation = validatePostalCode(formData.postalCode)
  if (!postalValidation.isValid) return postalValidation

  // Validate password
  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.isValid) return passwordValidation

  // Validate confirm password
  const confirmValidation = validateConfirmPassword(formData.password, formData.confirmPassword)
  if (!confirmValidation.isValid) return confirmValidation

  // Validate phones: owner required, organization optional
  const ownerPhoneValidation = validateRequiredPhone(formData.ownerPhone)
  if (!ownerPhoneValidation.isValid) return ownerPhoneValidation

  const organizationPhoneValidation = validatePhone(formData.organizationPhone)
  if (!organizationPhoneValidation.isValid) return organizationPhoneValidation

  return { isValid: true }
}

/**
 * Validate entire login form
 */
export const validateLoginForm = (formData: {
  email: string
  password: string
}): ValidationResult => {
  // Validate email
  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) return emailValidation

  // Validate password
  if (!formData.password) {
    return { isValid: false, message: 'Password is required' }
  }

  return { isValid: true }
}

/**
 * Validate password change form
 */
export const validateChangePasswordForm = (formData: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): ValidationResult => {
  // Validate current password
  const currentValidation = validateCurrentPassword(formData.currentPassword)
  if (!currentValidation.isValid) return currentValidation

  // Validate new password
  const newPasswordValidation = validatePassword(formData.newPassword)
  if (!newPasswordValidation.isValid) return newPasswordValidation

  // Validate confirm password
  const confirmValidation = validateConfirmPassword(formData.newPassword, formData.confirmPassword)
  if (!confirmValidation.isValid) return confirmValidation

  // Ensure current password is different from new password
  if (formData.currentPassword === formData.newPassword) {
    return { isValid: false, message: 'New password must be different from the current password' }
  }

  return { isValid: true }
}