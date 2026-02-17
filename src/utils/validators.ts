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

  if (taxId.length < 4) {
    return { isValid: false, message: 'Tax ID must be at least 4 characters' }
  }

  // Only allow numbers and hyphens
  if (!/^[0-9-]+$/.test(taxId)) {
    return { isValid: false, message: 'Tax ID may only contain numbers and hyphens' }
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
 * Legal name (company registration name) validation - optional
 */
export const validateLegalName = (legalName?: string): ValidationResult => {
  if (!legalName) return { isValid: true }

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

  // Only allow numbers and plus sign
  if (!/^\+?[0-9]+$/.test(phone)) {
    return { isValid: false, message: 'Phone number may only contain numbers and the + sign' }
  }

  // Basic validation: at least 7 digits
  const digitCount = phone.replace(/^\+/, '').length;
  if (digitCount < 7 || digitCount > 15) {
    return { isValid: false, message: 'Phone number must have between 7 and 15 digits' }
  }

  return { isValid: true }
}

/**
 * Postal code validation (required by API, only numbers)
 */
export const validatePostalCode = (postalCode: string): ValidationResult => {
  if (!postalCode.trim()) {
    return { isValid: false, message: 'Postal code is required' }
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
  email: string
  organizationName: string
  legalName?: string
  taxId: string
  street: string
  city: string
  country: string
  postalCode: string
  password: string
  confirmPassword: string
  phone?: string
}): ValidationResult => {
  // Validate firstName
  const firstNameValidation = validateFirstName(formData.firstName)
  if (!firstNameValidation.isValid) return firstNameValidation

  // Validate lastName
  const lastNameValidation = validateLastName(formData.lastName)
  if (!lastNameValidation.isValid) return lastNameValidation

  // Validate email
  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) return emailValidation

  // Validate organization
  const orgValidation = validateOrganizationName(formData.organizationName)
  if (!orgValidation.isValid) return orgValidation

  // Validate legal name (optional)
  const legalValidation = validateLegalName(formData.legalName)
  if (!legalValidation.isValid) return legalValidation

  // Validate tax ID
  const taxValidation = validateTaxId(formData.taxId)
  if (!taxValidation.isValid) return taxValidation

  // Validate address fields
  const streetValidation = validateAddressField(formData.street, 'Street')
  if (!streetValidation.isValid) return streetValidation

  const cityValidation = validateAddressField(formData.city, 'Ciudad')
  if (!cityValidation.isValid) return cityValidation

  const countryValidation = validateAddressField(formData.country, 'Country')
  if (!countryValidation.isValid) return countryValidation

  const postalValidation = validatePostalCode(formData.postalCode)
  if (!postalValidation.isValid) return postalValidation

  // Validate password
  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.isValid) return passwordValidation

  // Validate confirm password
  const confirmValidation = validateConfirmPassword(formData.password, formData.confirmPassword)
  if (!confirmValidation.isValid) return confirmValidation

  // Validate phone (optional)
  const phoneValidation = validatePhone(formData.phone)
  if (!phoneValidation.isValid) return phoneValidation

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
