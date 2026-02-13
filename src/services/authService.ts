/**
 * Authentication service.
 *
 * All calls go through the typed fetch wrapper in `src/lib/api.ts`.
 * The backend uses HttpOnly cookies, so credentials are handled
 * transparently by the browser -- no manual token storage is needed.
 */

import { post, get, type ApiSuccessResponse } from "../lib/api";
import type {
  RegisterPayload,
  RegisterResponseData,
  LoginPayload,
  LoginResponseData,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  VerifyResetCodePayload,
  VerifyResetCodeResponseData,
  ResetPasswordPayload,
  MeResponseData,
  PaymentStatusData,
} from "../types/api";

// --- Register ---------------------------------------------------------------

/**
 * Register a new organization together with its owner account.
 * Emails are normalised to lowercase before being sent to the API.
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<ApiSuccessResponse<RegisterResponseData>> {
  const normalised: RegisterPayload = {
    ...payload,
    organization: {
      ...payload.organization,
      email: payload.organization.email?.toLowerCase(),
    },
    owner: {
      ...payload.owner,
      email: payload.owner.email.toLowerCase(),
    },
  };

  return post<RegisterResponseData, RegisterPayload>("/auth/register", normalised);
}

// --- Login ------------------------------------------------------------------

/**
 * Authenticate a user.  The backend responds with Set-Cookie headers
 * that the browser stores automatically.
 */
export async function loginUser(
  payload: LoginPayload,
): Promise<ApiSuccessResponse<LoginResponseData>> {
  const normalised: LoginPayload = {
    ...payload,
    email: payload.email.toLowerCase(),
  };

  return post<LoginResponseData, LoginPayload>("/auth/login", normalised);
}

// --- Change Password --------------------------------------------------------

/** Change the password of the currently authenticated user. */
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<ApiSuccessResponse<null>> {
  return post<null, ChangePasswordPayload>("/auth/change-password", payload);
}

// --- Forgot Password --------------------------------------------------------

/**
 * Initiate the password reset flow.
 * Sends a 6-digit verification code to the user's email.
 * Always returns success to prevent email enumeration.
 */
export async function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<ApiSuccessResponse<null>> {
  return post<null, ForgotPasswordPayload>("/auth/forgot-password", {
    email: payload.email.toLowerCase(),
  });
}

// --- Verify Reset Code ------------------------------------------------------

/**
 * Verify the 6-digit OTP code and obtain a reset token
 * required for the final password change.
 */
export async function verifyResetCode(
  payload: VerifyResetCodePayload,
): Promise<ApiSuccessResponse<VerifyResetCodeResponseData>> {
  return post<VerifyResetCodeResponseData, VerifyResetCodePayload>(
    "/auth/verify-reset-code",
    { email: payload.email.toLowerCase(), code: payload.code },
  );
}

// --- Reset Password ---------------------------------------------------------

/**
 * Reset the user's password using the verified reset token.
 * Password must meet strength requirements:
 * min 8 chars, uppercase, lowercase, digit, special char.
 */
export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ApiSuccessResponse<null>> {
  return post<null, ResetPasswordPayload>("/auth/reset-password", {
    email: payload.email.toLowerCase(),
    resetToken: payload.resetToken,
    newPassword: payload.newPassword,
  });
}

// --- Logout -----------------------------------------------------------------

/** Clear authentication cookies on the server. */
export async function logoutUser(): Promise<ApiSuccessResponse<null>> {
  return post<null>("/auth/logout");
}

// --- Current User -----------------------------------------------------------

/** Fetch the profile of the currently authenticated user. */
export async function getCurrentUser(): Promise<ApiSuccessResponse<MeResponseData>> {
  return get<MeResponseData>("/auth/me");
}

// --- Refresh Token ----------------------------------------------------------

/**
 * Manually trigger a token refresh.
 *
 * In most cases callers should NOT need this -- the fetch wrapper
 * handles 401 -> refresh automatically.  Exposed here in case the UI
 * wants to pro-actively refresh before a known expensive call.
 */
export async function refreshToken(): Promise<ApiSuccessResponse<null>> {
  return post<null>("/auth/refresh");
}

// --- Payment Status ---------------------------------------------------------

/**
 * Check if the authenticated owner's organization has an active subscription.
 * Only accessible by users with the "owner" role.
 */
export async function getPaymentStatus(): Promise<ApiSuccessResponse<PaymentStatusData>> {
  return get<PaymentStatusData>("/auth/payment-status");
}
