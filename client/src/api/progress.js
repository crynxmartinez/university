// Phase 6.8: Student Progress API client
import API_URL from './config'

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
})

// Get progress overview
export const getProgressOverview = async () => {
  const response = await fetch(`${API_URL}/progress/overview`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get progress overview')
  }

  return response.json()
}

// Get course progress details
export const getCourseProgress = async () => {
  const response = await fetch(`${API_URL}/progress/courses`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get course progress')
  }

  return response.json()
}

// Get recent activity
export const getRecentActivity = async (days = 30) => {
  const response = await fetch(`${API_URL}/progress/activity?days=${days}`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get activity')
  }

  return response.json()
}

// Get performance trends
export const getPerformanceTrends = async () => {
  const response = await fetch(`${API_URL}/progress/trends`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get trends')
  }

  return response.json()
}
