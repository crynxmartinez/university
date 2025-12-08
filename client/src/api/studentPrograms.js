import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Get enrolled programs
export const getEnrolledPrograms = async () => {
  const res = await axios.get(`${API_URL}/student-programs/enrolled`, getAuthHeaders())
  return res.data
}

// Get program details
export const getStudentProgram = async (programId) => {
  const res = await axios.get(`${API_URL}/student-programs/${programId}`, getAuthHeaders())
  return res.data
}

// Get program sessions
export const getProgramSessions = async (programId) => {
  const res = await axios.get(`${API_URL}/student-programs/${programId}/sessions`, getAuthHeaders())
  return res.data
}

// Get available exams
export const getAvailableProgramExams = async (programId) => {
  const res = await axios.get(`${API_URL}/student-programs/${programId}/exams/available`, getAuthHeaders())
  return res.data
}

// Start exam
export const startProgramExam = async (examId, sessionId = null) => {
  const res = await axios.post(`${API_URL}/student-programs/exams/${examId}/start`, { sessionId }, getAuthHeaders())
  return res.data
}

// Save answer
export const saveProgramExamAnswer = async (attemptId, questionId, choiceId) => {
  const res = await axios.post(`${API_URL}/student-programs/exams/attempt/${attemptId}/answer`, { questionId, choiceId }, getAuthHeaders())
  return res.data
}

// Submit exam
export const submitProgramExam = async (attemptId) => {
  const res = await axios.post(`${API_URL}/student-programs/exams/attempt/${attemptId}/submit`, {}, getAuthHeaders())
  return res.data
}

// Record tab switch
export const recordProgramTabSwitch = async (attemptId) => {
  const res = await axios.post(`${API_URL}/student-programs/exams/attempt/${attemptId}/tab-switch`, {}, getAuthHeaders())
  return res.data
}

// Get exam result
export const getProgramExamResult = async (attemptId) => {
  const res = await axios.get(`${API_URL}/student-programs/exams/attempt/${attemptId}/result`, getAuthHeaders())
  return res.data
}

// Get program grade
export const getProgramGrade = async (programId) => {
  const res = await axios.get(`${API_URL}/student-programs/${programId}/grade`, getAuthHeaders())
  return res.data
}

// Join session (mark attendance)
export const joinProgramSession = async (sessionId) => {
  const res = await axios.post(`${API_URL}/student-programs/sessions/${sessionId}/join`, {}, getAuthHeaders())
  return res.data
}
