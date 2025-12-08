import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ============ EXAM CRUD ============

export const getCourseExams = async (courseId) => {
  const res = await axios.get(`${API_URL}/admin/course-exams/${courseId}`, getAuthHeaders())
  return res.data
}

export const getCourseExam = async (examId) => {
  const res = await axios.get(`${API_URL}/admin/course-exams/exam/${examId}`, getAuthHeaders())
  return res.data
}

export const createCourseExam = async (courseId, data) => {
  const res = await axios.post(`${API_URL}/admin/course-exams/${courseId}`, data, getAuthHeaders())
  return res.data
}

export const updateCourseExam = async (examId, data) => {
  const res = await axios.put(`${API_URL}/admin/course-exams/exam/${examId}`, data, getAuthHeaders())
  return res.data
}

export const deleteCourseExam = async (examId) => {
  const res = await axios.delete(`${API_URL}/admin/course-exams/exam/${examId}`, getAuthHeaders())
  return res.data
}

export const toggleCourseExamPublish = async (examId) => {
  const res = await axios.put(`${API_URL}/admin/course-exams/exam/${examId}/publish`, {}, getAuthHeaders())
  return res.data
}

// ============ QUESTION CRUD ============

export const addCourseExamQuestion = async (examId, data) => {
  const res = await axios.post(`${API_URL}/admin/course-exams/exam/${examId}/questions`, data, getAuthHeaders())
  return res.data
}

export const updateCourseExamQuestion = async (questionId, data) => {
  const res = await axios.put(`${API_URL}/admin/course-exams/questions/${questionId}`, data, getAuthHeaders())
  return res.data
}

export const deleteCourseExamQuestion = async (questionId) => {
  const res = await axios.delete(`${API_URL}/admin/course-exams/questions/${questionId}`, getAuthHeaders())
  return res.data
}

export const reorderCourseExamQuestions = async (examId, questionIds) => {
  const res = await axios.put(`${API_URL}/admin/course-exams/exam/${examId}/questions/reorder`, { questionIds }, getAuthHeaders())
  return res.data
}

// ============ GRADES / SCORES ============

export const getCourseGrades = async (courseId) => {
  const res = await axios.get(`${API_URL}/admin/course-exams/${courseId}/grades`, getAuthHeaders())
  return res.data
}

export const saveCourseExamScores = async (examId, scores) => {
  const res = await axios.post(`${API_URL}/admin/course-exams/exam/${examId}/scores`, { scores }, getAuthHeaders())
  return res.data
}

export const getAllGrades = async () => {
  const res = await axios.get(`${API_URL}/admin/course-exams/all-grades`, getAuthHeaders())
  return res.data
}
