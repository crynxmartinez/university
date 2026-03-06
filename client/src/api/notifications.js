// Phase 6.3: Notifications API client
import API_URL from './config'

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
})

// Get notifications
export const getNotifications = async (options = {}) => {
  const params = new URLSearchParams()
  if (options.unreadOnly) params.append('unreadOnly', 'true')
  if (options.limit) params.append('limit', options.limit)
  if (options.offset) params.append('offset', options.offset)

  const response = await fetch(`${API_URL}/notifications?${params}`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get notifications')
  }

  return response.json()
}

// Get unread count (for polling)
export const getUnreadCount = async () => {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get unread count')
  }

  return response.json()
}

// Mark notification as read
export const markAsRead = async (id) => {
  const response = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mark as read')
  }

  return response.json()
}

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mark all as read')
  }

  return response.json()
}

// Delete notification
export const deleteNotification = async (id) => {
  const response = await fetch(`${API_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete notification')
  }

  return response.json()
}

// Delete all read notifications
export const deleteAllRead = async () => {
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'DELETE',
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete notifications')
  }

  return response.json()
}
