import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export const getStudentGrades = async (studentId) => {
  const response = await axios.get(`${API_URL}/grades/student/${studentId}`, {
    headers: getAuthHeader()
  })
  return response.data
}

export const calculateCourseGrade = async (courseId, studentId) => {
  const response = await axios.post(`${API_URL}/grades/calculate/course/${courseId}`, 
    { studentId },
    { headers: getAuthHeader() }
  )
  return response.data
}

export const calculateProgramGrade = async (programId, studentId) => {
  const response = await axios.post(`${API_URL}/grades/calculate/program/${programId}`, 
    { studentId },
    { headers: getAuthHeader() }
  )
  return response.data
}

export const calculateAllGrades = async (studentId) => {
  const response = await axios.post(`${API_URL}/grades/calculate/all/${studentId}`, 
    {},
    { headers: getAuthHeader() }
  )
  return response.data
}

export const getCourseStudentGrades = async (courseId) => {
  const response = await axios.get(`${API_URL}/grades/course/${courseId}/students`, {
    headers: getAuthHeader()
  })
  return response.data
}

export const getProgramStudentGrades = async (programId) => {
  const response = await axios.get(`${API_URL}/grades/program/${programId}/students`, {
    headers: getAuthHeader()
  })
  return response.data
}
