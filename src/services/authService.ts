/**
 * Auth Service - Handles all authentication API calls
 * Base URL: http://api.test.local/api/v1
 */

const API_BASE_URL = 'http://api.test.local/api/v1'

// Register payload follows API documentation: organization and owner objects
interface RegisterPayload {
  organization: {
    name: string
    legalName?: string
    email?: string
    phone?: string
    taxId?: string
    address?: any
  }
  owner: {
    email: string
    password: string
    phone?: string
    name: {
      firstName: string
      secondName?: string
      firstSurname?: string
      secondSurname?: string
    }
  }
}

interface LoginPayload {
  email: string
  password: string
}

interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

interface ApiResponse<T> {
  status: 'success' | 'error'
  message?: string
  data?: T
  code?: string
  details?: any
}

// Register - Create new organization and owner
export const registerUser = async (payload: RegisterPayload): Promise<ApiResponse<any>> => {
  try {
    const normalizedPayload: RegisterPayload = {
      ...payload,
      organization: {
        ...payload.organization,
        email: payload.organization.email?.toLowerCase(),
      },
      owner: {
        ...payload.owner,
        email: payload.owner.email.toLowerCase(),
      },
    }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(normalizedPayload),
    })

    const data: ApiResponse<any> = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error en registro')
    }

    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error de conexión con el servidor',
    }
  }
}

// Login
export const loginUser = async (payload: LoginPayload): Promise<ApiResponse<any>> => {
  try {
    const normalizedPayload: LoginPayload = {
      ...payload,
      email: payload.email.toLowerCase(),
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(normalizedPayload),
    })

    const data: ApiResponse<any> = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error en inicio de sesión')
    }

    // Backend sets HTTP-only cookies automatically (access_token, refresh_token)
    // No need to manually store tokens
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error de conexión con el servidor',
    }
  }
}

// Change Password
export const changePassword = async (
  payload: ChangePasswordPayload
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(payload),
    })

    const data: ApiResponse<any> = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al cambiar contraseña')
    }
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error de conexión con el servidor',
    }
  }
}

// Logout
export const logoutUser = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al cerrar sesión')
    }

    // Clear HTTP-only cookies by calling backend logout
    // Cookies are cleared automatically by the backend
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error de conexión con el servidor',
    }
  }
}

// Get Current User
export const getCurrentUser = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Sends HTTP-only cookies automatically
    })

    const data: ApiResponse<any> = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al obtener usuario actual')
    }

    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error de conexión con el servidor',
    }
  }
}

// Refresh Token
export const refreshToken = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al refrescar token')
    }

    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error de conexión con el servidor',
    }
  }
}
