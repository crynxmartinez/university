import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getCourses = async () => {
  const response = await axios.get(`${API_URL}/courses`, getAuthHeader())
  return response.data
}

export const getCourse = async (id) => {
  const response = await axios.get(`${API_URL}/courses/${id}`, getAuthHeader())
  return response.data
}

export const createCourse = async (data) => {
  const response = await axios.post(`${API_URL}/courses`, data, getAuthHeader())
  return response.data
}

export const updateCourse = async (id, data) => {
  const response = await axios.put(`${API_URL}/courses/${id}`, data, getAuthHeader())
  return response.data
}

export const deleteCourse = async (id) => {
  const response = await axios.delete(`${API_URL}/courses/${id}`, getAuthHeader())
  return response.data
}

export const toggleCourseActive = async (id) => {
  const response = await axios.put(`${API_URL}/courses/${id}/toggle-active`, {}, getAuthHeader())
  return response.data
}
