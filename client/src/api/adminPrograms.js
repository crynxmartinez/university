import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ============ PROGRAM CRUD ============

export const getAdminPrograms = async () => {
  const res = await axios.get(`${API_URL}/admin/programs`, getAuthHeaders())
  return res.data
}

export const getAdminProgram = async (id) => {
  const res = await axios.get(`${API_URL}/admin/programs/${id}`, getAuthHeaders())
  return res.data
}

export const createAdminProgram = async (data) => {
  const res = await axios.post(`${API_URL}/admin/programs`, data, getAuthHeaders())
  return res.data
}

export const updateAdminProgram = async (id, data) => {
  const res = await axios.put(`${API_URL}/admin/programs/${id}`, data, getAuthHeaders())
  return res.data
}

export const deleteAdminProgram = async (id) => {
  const res = await axios.delete(`${API_URL}/admin/programs/${id}`, getAuthHeaders())
  return res.data
}

// ============ MODULE CRUD ============

export const createProgramModule = async (programId, data) => {
  const res = await axios.post(`${API_URL}/admin/programs/${programId}/modules`, data, getAuthHeaders())
  return res.data
}

export const updateProgramModule = async (moduleId, data) => {
  const res = await axios.put(`${API_URL}/admin/programs/modules/${moduleId}`, data, getAuthHeaders())
  return res.data
}

export const deleteProgramModule = async (moduleId) => {
  const res = await axios.delete(`${API_URL}/admin/programs/modules/${moduleId}`, getAuthHeaders())
  return res.data
}

export const reorderProgramModules = async (programId, moduleIds) => {
  const res = await axios.put(`${API_URL}/admin/programs/${programId}/modules/reorder`, { moduleIds }, getAuthHeaders())
  return res.data
}

// ============ LESSON CRUD ============

export const createProgramLesson = async (moduleId, data) => {
  const res = await axios.post(`${API_URL}/admin/programs/modules/${moduleId}/lessons`, data, getAuthHeaders())
  return res.data
}

export const updateProgramLesson = async (lessonId, data) => {
  const res = await axios.put(`${API_URL}/admin/programs/lessons/${lessonId}`, data, getAuthHeaders())
  return res.data
}

export const deleteProgramLesson = async (lessonId) => {
  const res = await axios.delete(`${API_URL}/admin/programs/lessons/${lessonId}`, getAuthHeaders())
  return res.data
}

export const reorderProgramLessons = async (moduleId, lessonIds) => {
  const res = await axios.put(`${API_URL}/admin/programs/modules/${moduleId}/lessons/reorder`, { lessonIds }, getAuthHeaders())
  return res.data
}

// ============ SESSION CRUD ============

export const getProgramSessions = async (programId) => {
  const res = await axios.get(`${API_URL}/admin/programs/${programId}/sessions`, getAuthHeaders())
  return res.data
}

export const createProgramSession = async (programId, data) => {
  const res = await axios.post(`${API_URL}/admin/programs/${programId}/sessions`, data, getAuthHeaders())
  return res.data
}

export const updateProgramSession = async (sessionId, data) => {
  const res = await axios.put(`${API_URL}/admin/programs/sessions/${sessionId}`, data, getAuthHeaders())
  return res.data
}

export const deleteProgramSession = async (sessionId) => {
  const res = await axios.delete(`${API_URL}/admin/programs/sessions/${sessionId}`, getAuthHeaders())
  return res.data
}

// ============ SESSION MATERIALS ============

export const addProgramSessionMaterial = async (sessionId, data) => {
  const res = await axios.post(`${API_URL}/admin/programs/sessions/${sessionId}/materials`, data, getAuthHeaders())
  return res.data
}

export const deleteProgramSessionMaterial = async (materialId) => {
  const res = await axios.delete(`${API_URL}/admin/programs/materials/${materialId}`, getAuthHeaders())
  return res.data
}

// ============ ATTENDANCE ============

export const getProgramAttendance = async (sessionId) => {
  const res = await axios.get(`${API_URL}/admin/programs/sessions/${sessionId}/attendance`, getAuthHeaders())
  return res.data
}

export const updateProgramAttendance = async (sessionId, attendance) => {
  const res = await axios.put(`${API_URL}/admin/programs/sessions/${sessionId}/attendance`, { attendance }, getAuthHeaders())
  return res.data
}

// ============ ENROLLED STUDENTS ============

export const getProgramStudents = async (programId) => {
  const res = await axios.get(`${API_URL}/admin/programs/${programId}/students`, getAuthHeaders())
  return res.data
}
