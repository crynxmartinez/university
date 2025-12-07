import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getMyCourses = async () => {
  const response = await axios.get(`${API_URL}/enrollments/my-courses`, getAuthHeader())
  return response.data
}

export const getEnrolledStudents = async (courseId) => {
  const response = await axios.get(`${API_URL}/enrollments/course/${courseId}/students`, getAuthHeader())
  return response.data
}

export const getAllStudents = async () => {
  const response = await axios.get(`${API_URL}/enrollments/students`, getAuthHeader())
  return response.data
}

export const enrollStudent = async (studentId, courseId) => {
  const response = await axios.post(`${API_URL}/enrollments`, { studentId, courseId }, getAuthHeader())
  return response.data
}

export const removeEnrollment = async (id) => {
  const response = await axios.delete(`${API_URL}/enrollments/${id}`, getAuthHeader())
  return response.data
}

export const selfEnrollInCourse = async (courseId) => {
  const response = await axios.post(`${API_URL}/enrollments/self`, { courseId }, getAuthHeader())
  return response.data
}

export const getTeacherAnalytics = async () => {
  const response = await axios.get(`${API_URL}/enrollments/teacher/analytics`, getAuthHeader())
  return response.data
}
