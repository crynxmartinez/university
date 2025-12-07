import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Get all notes for the logged-in student
export const getMyNotes = async () => {
  const response = await axios.get(`${API_URL}/notes`, getAuthHeader())
  return response.data
}

// Get note for a specific session
export const getNoteForSession = async (sessionId) => {
  const response = await axios.get(`${API_URL}/notes/session/${sessionId}`, getAuthHeader())
  return response.data
}

// Create or update a note
export const saveNote = async (sessionId, content) => {
  const response = await axios.post(`${API_URL}/notes`, { sessionId, content }, getAuthHeader())
  return response.data
}

// Delete a note
export const deleteNote = async (noteId) => {
  const response = await axios.delete(`${API_URL}/notes/${noteId}`, getAuthHeader())
  return response.data
}
