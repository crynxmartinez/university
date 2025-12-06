import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

// Enroll in a program
export const enrollInProgram = async (programId) => {
  const response = await axios.post(
    `${API_URL}/program-enrollments`,
    { programId },
    { headers: getAuthHeader() }
  )
  return response.data
}

// Get my enrolled programs
export const getMyProgramEnrollments = async () => {
  const response = await axios.get(
    `${API_URL}/program-enrollments/my`,
    { headers: getAuthHeader() }
  )
  return response.data
}

// Check if enrolled in a program
export const checkProgramEnrollment = async (programId) => {
  const response = await axios.get(
    `${API_URL}/program-enrollments/check/${programId}`,
    { headers: getAuthHeader() }
  )
  return response.data
}

// Unenroll from a program
export const unenrollFromProgram = async (programId) => {
  const response = await axios.delete(
    `${API_URL}/program-enrollments/${programId}`,
    { headers: getAuthHeader() }
  )
  return response.data
}
