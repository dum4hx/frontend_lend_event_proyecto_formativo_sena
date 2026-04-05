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
  LoginPendingOtpResponseData,
  VerifyLoginOtpPayload,
  VerifyLoginOtpResponseData,
  VerifyBackupCodePayload,
  VerifyBackupCodeResponseData,
  ResendLoginOtpPayload,
  ResendLoginOtpResponseData,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  VerifyResetCodePayload,
  VerifyResetCodeResponseData,
  ResetPasswordPayload,
  AcceptInvitePayload,
  AcceptInviteResponseData,
  VerifyEmailPayload,
  VerifyEmailResponseData,
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

// --- Verify Email (Post-Registration OTP) -----------------------------------

/**
 * Verify the 6-digit OTP sent after registration.
 * On success the account is activated and auth cookies are set.
 */
export async function verifyEmail(
  payload: VerifyEmailPayload,
): Promise<ApiSuccessResponse<VerifyEmailResponseData>> {
  return post<VerifyEmailResponseData, VerifyEmailPayload>("/auth/verify-email", {
    email: payload.email.toLowerCase(),
    code: payload.code,
  });
}

// --- Login ------------------------------------------------------------------

/**
 * Authenticate a user.  The backend sends an OTP to the user's email and
 * responds with `{ pendingOtp: true, email }`.  No auth cookies are issued
 * at this step.  The client must call `verifyLoginOtp` or `verifyBackupCode`
 * to complete the flow.
 */
export async function loginUser(
  payload: LoginPayload,
): Promise<ApiSuccessResponse<LoginPendingOtpResponseData>> {
  const normalised: LoginPayload = {
    ...payload,
    email: payload.email.toLowerCase(),
  };

  return post<LoginPendingOtpResponseData, LoginPayload>("/auth/login", normalised);
}

// --- Verify Login OTP -------------------------------------------------------

/**
 * Complete the 2FA login by verifying the 6-digit OTP sent to the user's email.
 * On success, auth cookies are set.  The first 2FA login also returns
 * 10 single-use backup codes in `data.backupCodes`.
 */
export async function verifyLoginOtp(
  payload: VerifyLoginOtpPayload,
): Promise<ApiSuccessResponse<VerifyLoginOtpResponseData>> {
  return post<VerifyLoginOtpResponseData, VerifyLoginOtpPayload>("/auth/verify-login-otp", {
    email: payload.email.toLowerCase(),
    code: payload.code,
  });
}

// --- Verify Backup Code -----------------------------------------------------

/**
 * Complete login using a single-use backup code instead of the email OTP.
 * Issues auth cookies on success.
 */
export async function verifyBackupCode(
  payload: VerifyBackupCodePayload,
): Promise<ApiSuccessResponse<VerifyBackupCodeResponseData>> {
  return post<VerifyBackupCodeResponseData, VerifyBackupCodePayload>("/auth/verify-backup-code", {
    email: payload.email.toLowerCase(),
    backupCode: payload.backupCode,
  });
}

// --- Resend Login OTP -------------------------------------------------------

/**
 * Re-validate credentials and send a new OTP to the user's email.
 * Use when the original OTP was not received or has expired.
 */
export async function resendLoginOtp(
  payload: ResendLoginOtpPayload,
): Promise<ApiSuccessResponse<ResendLoginOtpResponseData>> {
  return post<ResendLoginOtpResponseData, ResendLoginOtpPayload>("/auth/resend-login-otp", {
    email: payload.email.toLowerCase(),
    password: payload.password,
  });
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
  return post<VerifyResetCodeResponseData, VerifyResetCodePayload>("/auth/verify-reset-code", {
    email: payload.email.toLowerCase(),
    code: payload.code,
  });
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

// --- Accept Invite ----------------------------------------------------------

/**
 * Accept an organization invitation and set password.
 * Activates the invited user account.
 * No authentication required - uses token from invite URL.
 */
export async function acceptInvite(
  payload: AcceptInvitePayload,
): Promise<ApiSuccessResponse<AcceptInviteResponseData>> {
  return post<AcceptInviteResponseData, AcceptInvitePayload>("/auth/accept-invite", {
    email: payload.email.toLowerCase(),
    token: payload.token,
    password: payload.password,
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
