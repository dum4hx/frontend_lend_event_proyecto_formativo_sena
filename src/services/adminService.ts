/**
 * Admin Service - CRUD operations for admin dashboard
 * Uses authenticated API endpoints with HTTP-only cookies
 */

const API_BASE_URL = 'http://api.test.local/api/v1'

interface ApiResponse<T> {
  status: 'success' | 'error'
  message?: string
  data?: T
  code?: string
}

// All requests automatically include HTTP-only cookies with credentials: 'include'

// Get organization details
export const getOrganization = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching organization',
    }
  }

}

// Customers
export const getCustomers = async (page = 1, limit = 50): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/customers?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching customers',
    }
  }
}

// Packages
export const getPackages = async (page = 1, limit = 50): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/packages?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching packages',
    }
  }
}

// Get all users in organization
export const getUsers = async (page = 1, limit = 20): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching users',
    }
  }

}

// Create request
export const createRequest = async (payload: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error creating request',
    }
  }
}

// Update request
export const updateRequest = async (requestId: string, updates: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error updating request',
    }
  }
}

// Cancel request
export const cancelRequest = async (requestId: string, reason: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error cancelling request',
    }
  }
}

// Get single user
export const getUser = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching user',
    }
  }
}

// Get current user
export const getCurrentUser = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching current user',
    }
  }
}

// Get loans (events/requests)
export const getLoans = async (page = 1, limit = 20): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/loans?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching loans',
    }
  }
}

// Get requests (can be called events)
export const getRequests = async (page = 1, limit = 20): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/requests?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching requests',
    }
  }
}

// Get invoices summary
export const getInvoicesSummary = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/summary`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching invoices summary',
    }
  }
}

// Get all invoices
export const getInvoices = async (page = 1, limit = 20): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/invoices?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    )

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching invoices',
    }
  }
}

// Get organization usage
export const getOrganizationUsage = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations/usage`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error fetching organization usage',
    }
  }
}

// Update user
export const updateUser = async (userId: string, updates: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error updating user',
    }
  }
}

// Update user role
export const updateUserRole = async (userId: string, role: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error updating user role',
    }
  }
}

// Deactivate user
export const deactivateUser = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error deactivating user',
    }
  }
}

// Reactivate user
export const reactivateUser = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error reactivating user',
    }
  }
}

// Invite new user to organization
export const inviteUser = async (payload: {
  email: string
  role: string
  profile: { firstName: string; lastName: string }
}): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error inviting user',
    }
  }
}

// Update organization details
export const updateOrganization = async (updates: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error updating organization',
    }
  }
}

// Create new loan/request
export const createLoan = async (loanData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(loanData),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error creating loan',
    }
  }
}

// Update loan/request
export const updateLoan = async (loanId: string, updates: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error updating loan',
    }
  }
}

// Delete loan/request
export const deleteLoan = async (loanId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data: ApiResponse<any> = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Error deleting loan',
    }
  }
}
