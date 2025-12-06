import axios from 'axios'
import API_URL from './config'

export const login = async (userId, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { userId, password })
  return response.data
}

export const getMe = async (token) => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}
