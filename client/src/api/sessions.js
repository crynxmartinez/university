import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ============ SESSION APIS ============

export const getCourseSessions = async (courseId) => {
  const response = await axios.get(`${API_URL}/sessions/course/${courseId}`, getAuthHeader())
  return response.data
}

export const getSession = async (id) => {
  const response = await axios.get(`${API_URL}/sessions/${id}`, getAuthHeader())
  return response.data
}

export const createSession = async (data) => {
  const response = await axios.post(`${API_URL}/sessions`, data, getAuthHeader())
  return response.data
}

export const updateSession = async (id, data) => {
  const response = await axios.put(`${API_URL}/sessions/${id}`, data, getAuthHeader())
  return response.data
}

export const deleteSession = async (id) => {
  const response = await axios.delete(`${API_URL}/sessions/${id}`, getAuthHeader())
  return response.data
}

// ============ MATERIAL APIS ============

export const addMaterial = async (sessionId, data) => {
  const response = await axios.post(`${API_URL}/sessions/${sessionId}/materials`, data, getAuthHeader())
  return response.data
}

export const deleteMaterial = async (materialId) => {
  const response = await axios.delete(`${API_URL}/sessions/materials/${materialId}`, getAuthHeader())
  return response.data
}

// ============ STUDENT APIS ============

export const getUpcomingSessions = async () => {
  const response = await axios.get(`${API_URL}/sessions/student/upcoming`, getAuthHeader())
  return response.data
}

// ============ TEACHER APIS ============

export const getTeacherSchedule = async () => {
  const response = await axios.get(`${API_URL}/sessions/teacher/schedule`, getAuthHeader())
  return response.data
}
