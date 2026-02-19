import axios from 'axios'
import API_URL from './config'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export const getAdminSchedule = async (params = {}) => {
  const response = await axios.get(`${API_URL}/admin/schedule`, {
    params,
    headers: getAuthHeader()
  })
  return response.data
}
