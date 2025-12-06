import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Get all programs for admin (includes all fields)
export const getPrograms = async () => {
  const response = await axios.get(`${API_URL}/programs`, getAuthHeaders())
  return response.data
}

// Get public programs (no price)
export const getPublicPrograms = async () => {
  const response = await axios.get(`${API_URL}/programs/public`)
  return response.data
}

// Get programs for students (includes price)
export const getStudentPrograms = async () => {
  const response = await axios.get(`${API_URL}/programs/student`, getAuthHeaders())
  return response.data
}

// Create a new program
export const createProgram = async (data) => {
  const response = await axios.post(`${API_URL}/programs`, data, getAuthHeaders())
  return response.data
}

// Update a program
export const updateProgram = async (id, data) => {
  const response = await axios.put(`${API_URL}/programs/${id}`, data, getAuthHeaders())
  return response.data
}

// Delete a program
export const deleteProgram = async (id) => {
  const response = await axios.delete(`${API_URL}/programs/${id}`, getAuthHeaders())
  return response.data
}
