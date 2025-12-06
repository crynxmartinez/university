import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const createModule = async (data) => {
  const response = await axios.post(`${API_URL}/modules`, data, getAuthHeader())
  return response.data
}

export const updateModule = async (id, data) => {
  const response = await axios.put(`${API_URL}/modules/${id}`, data, getAuthHeader())
  return response.data
}

export const deleteModule = async (id) => {
  const response = await axios.delete(`${API_URL}/modules/${id}`, getAuthHeader())
  return response.data
}
