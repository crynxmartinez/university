import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Get all users with optional filters
export const getUsers = async (params = {}) => {
  const { role, search, page, limit } = params
  const queryParams = new URLSearchParams()
  if (role) queryParams.append('role', role)
  if (search) queryParams.append('search', search)
  if (page) queryParams.append('page', page)
  if (limit) queryParams.append('limit', limit)
  
  const response = await axios.get(`${API_URL}/users?${queryParams}`, getAuthHeaders())
  return response.data
}

// Get single user by ID
export const getUser = async (id) => {
  const response = await axios.get(`${API_URL}/users/${id}`, getAuthHeaders())
  return response.data
}

// Create new user
export const createUser = async (data) => {
  const response = await axios.post(`${API_URL}/users/create`, data, getAuthHeaders())
  return response.data
}

// Update user
export const updateUser = async (id, data) => {
  const response = await axios.put(`${API_URL}/users/${id}`, data, getAuthHeaders())
  return response.data
}

// Reset user password
export const resetUserPassword = async (id) => {
  const response = await axios.post(`${API_URL}/users/${id}/reset-password`, {}, getAuthHeaders())
  return response.data
}

// Delete user
export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/users/${id}`, getAuthHeaders())
  return response.data
}
