import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Student marks their own attendance when clicking join
export const markJoinAttendance = async (sessionId) => {
  const response = await axios.post(`${API_URL}/attendance/mark-join`, { sessionId }, getAuthHeader())
  return response.data
}

// Teacher gets attendance for a session
export const getSessionAttendance = async (sessionId) => {
  const response = await axios.get(`${API_URL}/attendance/session/${sessionId}`, getAuthHeader())
  return response.data
}

// Teacher updates attendance for a session
export const updateSessionAttendance = async (sessionId, attendance) => {
  const response = await axios.put(`${API_URL}/attendance/session/${sessionId}`, { attendance }, getAuthHeader())
  return response.data
}

// Student gets their own attendance for a course
export const getStudentAttendance = async (courseId) => {
  const response = await axios.get(`${API_URL}/attendance/student/${courseId}`, getAuthHeader())
  return response.data
}
