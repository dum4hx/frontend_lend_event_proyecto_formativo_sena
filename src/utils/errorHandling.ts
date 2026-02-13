/**
 * Centralized error handling utilities for consistent error management
 * across the application. Provides type-safe error normalization and
 * user-friendly error messages.
 */

import { ApiError } from "../lib/api";

/** Normalized error shape for UI consumption. */
export interface NormalizedError {
  message: string;
  code?: string;
  statusCode?: number;
  isTemporary: boolean;
  canRetry: boolean;
  details?: Record<string, unknown>;
}

/** Error categories for different handling strategies. */
export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not_found'
  | 'rate_limit'
  | 'server'
  | 'unknown';

/**
 * Normalize any error into a consistent shape that the UI can handle.
 * Provides sensible defaults and categorizes errors for appropriate handling.
 */
export function normalizeError(error: unknown): NormalizedError {
  // Handle our custom ApiError from the fetch wrapper
  if (error instanceof ApiError) {
    const category = categorizeApiError(error);
    return {
      message: getUserFriendlyMessage(error.message, category),
      code: error.code,
      statusCode: error.statusCode,
      isTemporary: isTemporaryError(category),
      canRetry: canRetryError(category),
      details: error.details,
    };
  }

  // Handle network errors (fetch failures before reaching the API)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network connection failed. Please check your internet connection.',
      isTemporary: true,
      canRetry: true,
    };
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      isTemporary: false,
      canRetry: false,
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred. Please try again.',
    isTemporary: false,
    canRetry: true,
  };
}

/**
 * Categorize API errors based on status code and error code.
 */
function categorizeApiError(error: ApiError): ErrorCategory {
  const { statusCode, code } = error;

  if (statusCode === 401 || code === 'UNAUTHORIZED') return 'authentication';
  if (statusCode === 403 || code === 'FORBIDDEN') return 'authorization';
  if (statusCode === 404 || code === 'NOT_FOUND') return 'not_found';
  if (statusCode === 429 || code === 'RATE_LIMIT_EXCEEDED') return 'rate_limit';
  if (statusCode === 400 || code === 'BAD_REQUEST' || code === 'VALIDATION_ERROR') return 'validation';
  if (statusCode && statusCode >= 500) return 'server';
  if (statusCode && statusCode >= 400 && statusCode < 500) return 'validation';

  return 'unknown';
}

/**
 * Convert technical error messages into user-friendly ones.
 */
function getUserFriendlyMessage(message: string, category: ErrorCategory): string {
  // Use explicit messages for known categories
  switch (category) {
    case 'network':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'authentication':
      return 'Your session has expired. Please log in again.';
    case 'authorization':
      return 'You do not have permission to perform this action.';
    case 'not_found':
      return 'The requested resource was not found.';
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.';
    case 'server':
      return 'A server error occurred. Our team has been notified. Please try again later.';
    case 'validation':
      // For validation errors, the API message is usually clear enough
      return message;
    case 'unknown':
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Determine if an error is temporary and might resolve on its own.
 */
function isTemporaryError(category: ErrorCategory): boolean {
  return ['network', 'rate_limit', 'server'].includes(category);
}

/**
 * Determine if retrying the operation makes sense.
 */
function canRetryError(category: ErrorCategory): boolean {
  // Don't retry validation, auth, or authorization errors
  return !['validation', 'authentication', 'authorization', 'not_found'].includes(category);
}

/**
 * Extract validation errors from API error details into a field-keyed map.
 * Useful for form validation.
 */
export function extractValidationErrors(
  error: NormalizedError
): Record<string, string> {
  if (!error.details || !error.details.errors) return {};

  const errors: Record<string, string> = {};
  const apiErrors = error.details.errors;

  if (Array.isArray(apiErrors)) {
    // Handle array format: [{ field: 'email', message: '...' }]
    for (const err of apiErrors) {
      if (err && typeof err === 'object' && 'field' in err && 'message' in err) {
        errors[String(err.field)] = String(err.message);
      }
    }
  } else if (typeof apiErrors === 'object') {
    // Handle object format: { email: 'Invalid email', ... }
    for (const [field, message] of Object.entries(apiErrors)) {
      errors[field] = String(message);
    }
  }

  return errors;
}

/**
 * Retry wrapper with exponential backoff.
 * Useful for transient failures.
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = (err) => normalizeError(err).canRetry,
  } = options;

  let lastError: unknown;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or if shouldRetry returns false
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Log errors in development for debugging.
 * In production, this could send errors to a monitoring service.
 */
export function logError(error: unknown, context?: string): void {
  const normalized = normalizeError(error);

  if (import.meta.env.DEV) {
    console.group(`[Error${context ? `: ${context}` : ''}]`);
    console.error('Message:', normalized.message);
    if (normalized.code) console.error('Code:', normalized.code);
    if (normalized.statusCode) console.error('Status:', normalized.statusCode);
    if (normalized.details) console.error('Details:', normalized.details);
    console.error('Original:', error);
    console.groupEnd();
  }

  // In production, send to monitoring service (Sentry, LogRocket, etc.)
  // if (import.meta.env.PROD && window.Sentry) {
  //   window.Sentry.captureException(error, { contexts: { normalized, context } });
  // }
}
