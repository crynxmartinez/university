import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ============ EXAM TEMPLATE APIS ============

export const getCourseExams = async (courseId) => {
  const response = await axios.get(`${API_URL}/exams/course/${courseId}`, getAuthHeader())
  return response.data
}

export const createExam = async (data) => {
  const response = await axios.post(`${API_URL}/exams`, data, getAuthHeader())
  return response.data
}

export const updateExam = async (id, data) => {
  const response = await axios.put(`${API_URL}/exams/${id}`, data, getAuthHeader())
  return response.data
}

export const deleteExam = async (id) => {
  const response = await axios.delete(`${API_URL}/exams/${id}`, getAuthHeader())
  return response.data
}

export const reorderExams = async (courseId, examIds) => {
  const response = await axios.put(`${API_URL}/exams/reorder`, { courseId, examIds }, getAuthHeader())
  return response.data
}

// ============ EXAM SCORE APIS ============

export const saveExamScores = async (examId, scores) => {
  const response = await axios.post(`${API_URL}/exams/${examId}/scores`, { scores }, getAuthHeader())
  return response.data
}

// ============ GRADE APIS ============

export const getCourseGrades = async (courseId) => {
  const response = await axios.get(`${API_URL}/exams/grades/${courseId}`, getAuthHeader())
  return response.data
}

export const getStudentGrade = async (courseId) => {
  const response = await axios.get(`${API_URL}/exams/student-grade/${courseId}`, getAuthHeader())
  return response.data
}
