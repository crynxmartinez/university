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

// ============ EXAM SETTINGS APIS ============

export const updateExamSettings = async (examId, settings) => {
  const response = await axios.put(`${API_URL}/exams/${examId}/settings`, settings, getAuthHeader())
  return response.data
}

// ============ EXAM QUESTION APIS ============

export const getExamQuestions = async (examId) => {
  const response = await axios.get(`${API_URL}/exams/${examId}/questions`, getAuthHeader())
  return response.data
}

export const addQuestion = async (examId, data) => {
  const response = await axios.post(`${API_URL}/exams/${examId}/questions`, data, getAuthHeader())
  return response.data
}

export const updateQuestion = async (questionId, data) => {
  const response = await axios.put(`${API_URL}/exams/questions/${questionId}`, data, getAuthHeader())
  return response.data
}

export const deleteQuestion = async (questionId) => {
  const response = await axios.delete(`${API_URL}/exams/questions/${questionId}`, getAuthHeader())
  return response.data
}

export const reorderQuestions = async (examId, questionIds) => {
  const response = await axios.put(`${API_URL}/exams/${examId}/questions/reorder`, { questionIds }, getAuthHeader())
  return response.data
}

export const saveAllQuestions = async (examId, data) => {
  const response = await axios.put(`${API_URL}/exams/${examId}/questions/batch`, data, getAuthHeader())
  return response.data
}

// ============ STUDENT EXAM TAKING APIS ============

export const getAvailableExams = async (courseId) => {
  const response = await axios.get(`${API_URL}/exams/student/available/${courseId}`, getAuthHeader())
  return response.data
}

export const startExam = async (examId, sessionId = null) => {
  const response = await axios.post(`${API_URL}/exams/${examId}/start`, { sessionId }, getAuthHeader())
  return response.data
}

export const saveAnswer = async (attemptId, questionId, choiceId) => {
  const response = await axios.put(`${API_URL}/exams/attempt/${attemptId}/answer`, { questionId, choiceId }, getAuthHeader())
  return response.data
}

export const recordTabSwitch = async (attemptId) => {
  const response = await axios.put(`${API_URL}/exams/attempt/${attemptId}/tab-switch`, {}, getAuthHeader())
  return response.data
}

export const submitExam = async (attemptId) => {
  const response = await axios.post(`${API_URL}/exams/attempt/${attemptId}/submit`, {}, getAuthHeader())
  return response.data
}

export const getExamResult = async (attemptId) => {
  const response = await axios.get(`${API_URL}/exams/attempt/${attemptId}/result`, getAuthHeader())
  return response.data
}
