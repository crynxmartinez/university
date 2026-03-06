import axios from 'axios'
import API_URL from './config'

export const login = async (userId, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { userId, password })
  // Phase 5.2: Store refresh token
  if (response.data.refreshToken) {
    localStorage.setItem('refreshToken', response.data.refreshToken)
  }
  return response.data
}

export const getMe = async (token) => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export const changePassword = async (newPassword) => {
  const token = localStorage.getItem('token')
  const response = await axios.post(`${API_URL}/auth/change-password`, { newPassword }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

// Phase 5.2: Logout - revoke refresh token
export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  try {
    await axios.post(`${API_URL}/auth/logout`, { refreshToken })
  } catch (error) {
    console.error('Logout error:', error)
  }
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

// Phase 5.2: Logout from all devices
export const logoutAll = async () => {
  const token = localStorage.getItem('token')
  try {
    await axios.post(`${API_URL}/auth/logout-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error('Logout all error:', error)
  }
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}
