import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ============ EXAM CRUD ============

export const getProgramExams = async (programId) => {
  const res = await axios.get(`${API_URL}/admin/program-exams/${programId}`, getAuthHeaders())
  return res.data
}

export const getProgramExam = async (examId) => {
  const res = await axios.get(`${API_URL}/admin/program-exams/exam/${examId}`, getAuthHeaders())
  return res.data
}

export const createProgramExam = async (programId, data) => {
  const res = await axios.post(`${API_URL}/admin/program-exams/${programId}`, data, getAuthHeaders())
  return res.data
}

export const updateProgramExam = async (examId, data) => {
  const res = await axios.put(`${API_URL}/admin/program-exams/exam/${examId}`, data, getAuthHeaders())
  return res.data
}

export const deleteProgramExam = async (examId) => {
  const res = await axios.delete(`${API_URL}/admin/program-exams/exam/${examId}`, getAuthHeaders())
  return res.data
}

export const toggleProgramExamPublish = async (examId) => {
  const res = await axios.put(`${API_URL}/admin/program-exams/exam/${examId}/publish`, {}, getAuthHeaders())
  return res.data
}

// ============ QUESTION CRUD ============

export const addProgramExamQuestion = async (examId, data) => {
  const res = await axios.post(`${API_URL}/admin/program-exams/exam/${examId}/questions`, data, getAuthHeaders())
  return res.data
}

export const updateProgramExamQuestion = async (questionId, data) => {
  const res = await axios.put(`${API_URL}/admin/program-exams/questions/${questionId}`, data, getAuthHeaders())
  return res.data
}

export const deleteProgramExamQuestion = async (questionId) => {
  const res = await axios.delete(`${API_URL}/admin/program-exams/questions/${questionId}`, getAuthHeaders())
  return res.data
}

export const reorderProgramExamQuestions = async (examId, questionIds) => {
  const res = await axios.put(`${API_URL}/admin/program-exams/exam/${examId}/questions/reorder`, { questionIds }, getAuthHeaders())
  return res.data
}

// ============ GRADES / SCORES ============

export const getProgramGrades = async (programId) => {
  const res = await axios.get(`${API_URL}/admin/program-exams/${programId}/grades`, getAuthHeaders())
  return res.data
}

export const saveProgramExamScores = async (examId, scores) => {
  const res = await axios.post(`${API_URL}/admin/program-exams/exam/${examId}/scores`, { scores }, getAuthHeaders())
  return res.data
}

export const saveAllProgramExamQuestions = async (examId, data) => {
  const res = await axios.put(`${API_URL}/admin/program-exams/exam/${examId}/questions/batch`, data, getAuthHeaders())
  return res.data
}
