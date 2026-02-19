import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// Get user's conversations
export const getConversations = async () => {
  const response = await axios.get(`${API_URL}/messages/conversations`, getAuthHeaders())
  return response.data
}

// Create or get conversation
export const createConversation = async (participantIds) => {
  const response = await axios.post(
    `${API_URL}/messages/conversations`,
    { participantIds },
    getAuthHeaders()
  )
  return response.data
}

// Get messages in a conversation
export const getMessages = async (conversationId, limit = 50, before = null) => {
  const params = new URLSearchParams({ limit })
  if (before) params.append('before', before)
  const response = await axios.get(
    `${API_URL}/messages/conversations/${conversationId}/messages?${params.toString()}`,
    getAuthHeaders()
  )
  return response.data
}

// Send a message
export const sendMessage = async (conversationId, content) => {
  const response = await axios.post(
    `${API_URL}/messages/conversations/${conversationId}/messages`,
    { content },
    getAuthHeaders()
  )
  return response.data
}

// Mark message as read
export const markMessageAsRead = async (messageId) => {
  const response = await axios.put(
    `${API_URL}/messages/messages/${messageId}/read`,
    {},
    getAuthHeaders()
  )
  return response.data
}

// Mark all messages in conversation as read
export const markConversationAsRead = async (conversationId) => {
  const response = await axios.put(
    `${API_URL}/messages/conversations/${conversationId}/read`,
    {},
    getAuthHeaders()
  )
  return response.data
}

// Get announcements
export const getAnnouncements = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const response = await axios.get(`${API_URL}/announcements?${params}`, getAuthHeaders())
  return response.data
}

// Create announcement
export const createAnnouncement = async (data) => {
  const response = await axios.post(`${API_URL}/announcements`, data, getAuthHeaders())
  return response.data
}

// Update announcement
export const updateAnnouncement = async (id, data) => {
  const response = await axios.put(`${API_URL}/announcements/${id}`, data, getAuthHeaders())
  return response.data
}

// Delete announcement
export const deleteAnnouncement = async (id) => {
  const response = await axios.delete(`${API_URL}/announcements/${id}`, getAuthHeaders())
  return response.data
}
