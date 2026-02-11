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
    return { isValid: false, message: 'El correo es requerido' }
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Ingresa un correo válido' }
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
    return { isValid: false, message: 'La contraseña es requerida' }
  }

  if (password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' }
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos una mayúscula' }
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un número' }
  }

  // Check for special character
  if (!/[!@#$%^&*]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)' }
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
    return { isValid: false, message: 'Debes confirmar tu contraseña' }
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: 'Las contraseñas no coinciden' }
  }

  return { isValid: true }
}

/**
 * First name validation
 */
export const validateFirstName = (firstName: string): ValidationResult => {
  if (!firstName.trim()) {
    return { isValid: false, message: 'El nombre es requerido' }
  }

  if (firstName.length < 2) {
    return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres' }
  }

  if (firstName.length > 50) {
    return { isValid: false, message: 'El nombre no debe exceder 50 caracteres' }
  }

  return { isValid: true }
}

/**
 * Last name validation
 */
export const validateLastName = (lastName: string): ValidationResult => {
  if (!lastName.trim()) {
    return { isValid: false, message: 'El apellido es requerido' }
  }

  if (lastName.length < 2) {
    return { isValid: false, message: 'El apellido debe tener al menos 2 caracteres' }
  }

  if (lastName.length > 50) {
    return { isValid: false, message: 'El apellido no debe exceder 50 caracteres' }
  }

  return { isValid: true }
}

/**
 * Organization name validation
 */
export const validateOrganizationName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: 'El nombre de la empresa es requerido' }
  }

  if (name.length < 2) {
    return { isValid: false, message: 'El nombre de la empresa debe tener al menos 2 caracteres' }
  }

  if (name.length > 100) {
    return { isValid: false, message: 'El nombre de la empresa no debe exceder 100 caracteres' }
  }

  return { isValid: true }
}

/**
 * Tax ID validation (required by API)
 */
export const validateTaxId = (taxId: string): ValidationResult => {
  if (!taxId.trim()) {
    return { isValid: false, message: 'El NIT/Tax ID es requerido' }
  }

  if (taxId.length < 4) {
    return { isValid: false, message: 'El NIT/Tax ID debe tener al menos 4 caracteres' }
  }

  return { isValid: true }
}

/**
 * Address validation (required by API)
 */
export const validateAddressField = (value: string, label: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: `${label} es requerido` }
  }

  if (value.length < 2) {
    return { isValid: false, message: `${label} debe tener al menos 2 caracteres` }
  }

  return { isValid: true }
}

/**
 * Legal name (razón social) validation - optional
 */
export const validateLegalName = (legalName?: string): ValidationResult => {
  if (!legalName) return { isValid: true }

  if (legalName.length < 2) {
    return { isValid: false, message: 'La razón social debe tener al menos 2 caracteres' }
  }

  if (legalName.length > 150) {
    return { isValid: false, message: 'La razón social no debe exceder 150 caracteres' }
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

  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // Basic validation: at least 7 digits
  if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
    return { isValid: false, message: 'Ingresa un número de teléfono válido' }
  }

  return { isValid: true }
}

/**
 * Current password validation for change password
 */
export const validateCurrentPassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Debes ingresar tu contraseña actual' }
  }

  return { isValid: true }
}

/**
 * Code validation (6 digits for password reset)
 */
export const validateCode = (code: string): ValidationResult => {
  if (!code) {
    return { isValid: false, message: 'El código es requerido' }
  }

  if (!/^\d{6}$/.test(code)) {
    return { isValid: false, message: 'El código debe tener exactamente 6 dígitos' }
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
  const streetValidation = validateAddressField(formData.street, 'Dirección')
  if (!streetValidation.isValid) return streetValidation

  const cityValidation = validateAddressField(formData.city, 'Ciudad')
  if (!cityValidation.isValid) return cityValidation

  const countryValidation = validateAddressField(formData.country, 'País')
  if (!countryValidation.isValid) return countryValidation

  const postalValidation = validateAddressField(formData.postalCode, 'Código postal')
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
    return { isValid: false, message: 'La contraseña es requerida' }
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
    return { isValid: false, message: 'La nueva contraseña debe ser diferente a la actual' }
  }

  return { isValid: true }
}
