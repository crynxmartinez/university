import axios from 'axios'
import API_URL from './config'

export const createUser = async (data) => {
  const token = localStorage.getItem('token')
  const response = await axios.post(`${API_URL}/users/create`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}
