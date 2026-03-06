import API_URL from './config'

/**
 * Shared API client with consistent error handling, auth, retry logic, and refresh tokens
 * Phase 5.2: Added automatic token refresh on 401
 */

const MAX_RETRIES = 1
const RETRY_DELAY = 1500 // 1.5 seconds
let isRefreshing = false
let refreshPromise = null

/**
 * Get auth headers with token from localStorage
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

/**
 * Phase 5.2: Refresh the access token using refresh token
 */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      // Refresh token invalid or expired
      return false
    }

    const data = await response.json()
    localStorage.setItem('token', data.token)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

/**
 * Sleep helper for retry delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable (network errors, cold starts, server busy)
 */
function isRetryableError(error, response) {
  // Network errors (server down, no internet)
  if (!response && error.message === 'Failed to fetch') {
    return true
  }
  // Server busy or timeout (cold start)
  if (response && [502, 503, 504].includes(response.status)) {
    return true
  }
  return false
}

/**
 * Handle 401 Unauthorized - try refresh first, then redirect to login
 * Phase 5.2: Added token refresh attempt before logout
 */
function handleUnauthorized() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login'
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

/**
 * Main API request function with error handling and retry logic
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(endpoint, options = {}, retryCount = 0) {
  const url = `${API_URL}${endpoint}`
  
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  }

  let response
  try {
    response = await fetch(url, config)
  } catch (error) {
    // Network error (server down, no internet)
    if (retryCount < MAX_RETRIES && isRetryableError(error, null)) {
      console.log(`Request failed, retrying in ${RETRY_DELAY}ms...`)
      await sleep(RETRY_DELAY)
      return apiRequest(endpoint, options, retryCount + 1)
    }
    throw new ApiError(
      'Cannot connect to server. Please check your internet connection.',
      0,
      'NETWORK_ERROR'
    )
  }

  // Handle retryable server errors (cold starts, timeouts)
  if (isRetryableError(null, response) && retryCount < MAX_RETRIES) {
    console.log(`Server busy (${response.status}), retrying in ${RETRY_DELAY}ms...`)
    await sleep(RETRY_DELAY)
    return apiRequest(endpoint, options, retryCount + 1)
  }

  // Handle 401 Unauthorized - Phase 5.2: Try refresh token first
  if (response.status === 401) {
    // Avoid multiple simultaneous refresh attempts
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshAccessToken()
    }
    
    const refreshed = await refreshPromise
    isRefreshing = false
    
    if (refreshed) {
      // Retry the original request with new token
      return apiRequest(endpoint, options, retryCount)
    }
    
    // Refresh failed, logout
    handleUnauthorized()
    throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED')
  }

  // Parse response body
  let data
  try {
    data = await response.json()
  } catch {
    // Response is not JSON
    if (!response.ok) {
      throw new ApiError('Server error', response.status, 'SERVER_ERROR')
    }
    return null
  }

  // Handle error responses
  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || 'Request failed',
      response.status,
      data.code || 'ERROR'
    )
  }

  return data
}

/**
 * GET request
 */
export async function get(endpoint) {
  return apiRequest(endpoint, { method: 'GET' })
}

/**
 * POST request
 */
export async function post(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * PUT request
 */
export async function put(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

/**
 * DELETE request
 */
export async function del(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {})
  })
}

/**
 * PATCH request
 */
export async function patch(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export default { get, post, put, del, patch, ApiError }
