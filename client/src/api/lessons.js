import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getLesson = async (id) => {
  const response = await axios.get(`${API_URL}/lessons/${id}`, getAuthHeader())
  return response.data
}

export const createLesson = async (data) => {
  const response = await axios.post(`${API_URL}/lessons`, data, getAuthHeader())
  return response.data
}

export const updateLesson = async (id, data) => {
  const response = await axios.put(`${API_URL}/lessons/${id}`, data, getAuthHeader())
  return response.data
}

export const deleteLesson = async (id) => {
  const response = await axios.delete(`${API_URL}/lessons/${id}`, getAuthHeader())
  return response.data
}
