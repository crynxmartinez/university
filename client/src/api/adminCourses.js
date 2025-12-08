import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ============ COURSE CRUD ============

export const getAdminCourses = async () => {
  const res = await axios.get(`${API_URL}/admin/courses`, getAuthHeaders())
  return res.data
}

export const getAdminCourse = async (id) => {
  const res = await axios.get(`${API_URL}/admin/courses/${id}`, getAuthHeaders())
  return res.data
}

export const getTeachers = async () => {
  const res = await axios.get(`${API_URL}/admin/courses/teachers`, getAuthHeaders())
  return res.data
}

export const createAdminCourse = async (data) => {
  const res = await axios.post(`${API_URL}/admin/courses`, data, getAuthHeaders())
  return res.data
}

export const updateAdminCourse = async (id, data) => {
  const res = await axios.put(`${API_URL}/admin/courses/${id}`, data, getAuthHeaders())
  return res.data
}

export const toggleAdminCourseActive = async (id) => {
  const res = await axios.put(`${API_URL}/admin/courses/${id}/toggle-active`, {}, getAuthHeaders())
  return res.data
}

export const deleteAdminCourse = async (id) => {
  const res = await axios.delete(`${API_URL}/admin/courses/${id}`, getAuthHeaders())
  return res.data
}

// ============ MODULE CRUD ============

export const createCourseModule = async (courseId, data) => {
  const res = await axios.post(`${API_URL}/admin/courses/${courseId}/modules`, data, getAuthHeaders())
  return res.data
}

export const updateCourseModule = async (moduleId, data) => {
  const res = await axios.put(`${API_URL}/admin/courses/modules/${moduleId}`, data, getAuthHeaders())
  return res.data
}

export const deleteCourseModule = async (moduleId) => {
  const res = await axios.delete(`${API_URL}/admin/courses/modules/${moduleId}`, getAuthHeaders())
  return res.data
}

export const reorderCourseModules = async (courseId, moduleIds) => {
  const res = await axios.put(`${API_URL}/admin/courses/${courseId}/modules/reorder`, { moduleIds }, getAuthHeaders())
  return res.data
}

// ============ LESSON CRUD ============

export const createCourseLesson = async (moduleId, data) => {
  const res = await axios.post(`${API_URL}/admin/courses/modules/${moduleId}/lessons`, data, getAuthHeaders())
  return res.data
}

export const updateCourseLesson = async (lessonId, data) => {
  const res = await axios.put(`${API_URL}/admin/courses/lessons/${lessonId}`, data, getAuthHeaders())
  return res.data
}

export const deleteCourseLesson = async (lessonId) => {
  const res = await axios.delete(`${API_URL}/admin/courses/lessons/${lessonId}`, getAuthHeaders())
  return res.data
}

export const reorderCourseLessons = async (moduleId, lessonIds) => {
  const res = await axios.put(`${API_URL}/admin/courses/modules/${moduleId}/lessons/reorder`, { lessonIds }, getAuthHeaders())
  return res.data
}

// ============ SESSION CRUD ============

export const getCourseSessions = async (courseId) => {
  const res = await axios.get(`${API_URL}/admin/courses/${courseId}/sessions`, getAuthHeaders())
  return res.data
}

export const createCourseSession = async (courseId, data) => {
  const res = await axios.post(`${API_URL}/admin/courses/${courseId}/sessions`, data, getAuthHeaders())
  return res.data
}

export const updateCourseSession = async (sessionId, data) => {
  const res = await axios.put(`${API_URL}/admin/courses/sessions/${sessionId}`, data, getAuthHeaders())
  return res.data
}

export const deleteCourseSession = async (sessionId) => {
  const res = await axios.delete(`${API_URL}/admin/courses/sessions/${sessionId}`, getAuthHeaders())
  return res.data
}

// ============ SESSION MATERIALS ============

export const addCourseSessionMaterial = async (sessionId, data) => {
  const res = await axios.post(`${API_URL}/admin/courses/sessions/${sessionId}/materials`, data, getAuthHeaders())
  return res.data
}

export const deleteCourseSessionMaterial = async (materialId) => {
  const res = await axios.delete(`${API_URL}/admin/courses/materials/${materialId}`, getAuthHeaders())
  return res.data
}

// ============ ATTENDANCE ============

export const getCourseAttendance = async (sessionId) => {
  const res = await axios.get(`${API_URL}/admin/courses/sessions/${sessionId}/attendance`, getAuthHeaders())
  return res.data
}

export const updateCourseAttendance = async (sessionId, attendance) => {
  const res = await axios.put(`${API_URL}/admin/courses/sessions/${sessionId}/attendance`, { attendance }, getAuthHeaders())
  return res.data
}

// ============ ENROLLED STUDENTS ============

export const getCourseStudents = async (courseId) => {
  const res = await axios.get(`${API_URL}/admin/courses/${courseId}/students`, getAuthHeaders())
  return res.data
}

export const enrollCourseStudent = async (courseId, studentId) => {
  const res = await axios.post(`${API_URL}/admin/courses/${courseId}/students`, { studentId }, getAuthHeaders())
  return res.data
}

export const removeCourseStudent = async (courseId, studentId) => {
  const res = await axios.delete(`${API_URL}/admin/courses/${courseId}/students/${studentId}`, getAuthHeaders())
  return res.data
}

// ============ ALL STUDENTS (for admin dashboard) ============

export const getAllStudents = async () => {
  const res = await axios.get(`${API_URL}/admin/courses/all-students`, getAuthHeaders())
  return res.data
}

// ============ ALL SESSIONS (for admin schedule) ============

export const getAllSessions = async () => {
  const res = await axios.get(`${API_URL}/admin/courses/all-sessions`, getAuthHeaders())
  return res.data
}
