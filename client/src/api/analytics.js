import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// Track analytics event
export const trackEvent = async (eventType, metadata = null) => {
  const response = await axios.post(
    `${API_URL}/analytics/track`,
    { eventType, metadata },
    getAuthHeaders()
  )
  return response.data
}

// Get system-wide analytics (Admin)
export const getSystemAnalytics = async (dateRange = null) => {
  const params = dateRange ? `?startDate=${dateRange.start}&endDate=${dateRange.end}` : ''
  const response = await axios.get(`${API_URL}/analytics/overview${params}`, getAuthHeaders())
  return response.data
}

// Get course analytics
export const getCourseAnalytics = async (courseId) => {
  const response = await axios.get(`${API_URL}/analytics/course/${courseId}`, getAuthHeaders())
  return response.data
}

// Get student analytics
export const getStudentAnalytics = async (studentId) => {
  const response = await axios.get(`${API_URL}/analytics/student/${studentId}`, getAuthHeaders())
  return response.data
}

// Get teacher analytics (Admin)
export const getTeacherAnalytics = async (teacherId) => {
  const response = await axios.get(`${API_URL}/analytics/teacher/${teacherId}`, getAuthHeaders())
  return response.data
}

// Export analytics data
export const exportAnalytics = async (format, type, dateRange = null) => {
  const params = new URLSearchParams({ format, type })
  if (dateRange) {
    params.append('startDate', dateRange.start)
    params.append('endDate', dateRange.end)
  }
  const response = await axios.get(`${API_URL}/analytics/export?${params.toString()}`, {
    ...getAuthHeaders(),
    responseType: 'blob'
  })
  return response.data
}
