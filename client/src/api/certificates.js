import axios from 'axios'
import API_URL from './config'

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// Issue a certificate
export const issueCertificate = async (data) => {
  const response = await axios.post(`${API_URL}/certificates/issue`, data, getAuthHeaders())
  return response.data
}

// Get student's certificates
export const getStudentCertificates = async (studentId) => {
  const response = await axios.get(`${API_URL}/certificates/student/${studentId}`, getAuthHeaders())
  return response.data
}

// Get specific certificate
export const getCertificate = async (certificateId) => {
  const response = await axios.get(`${API_URL}/certificates/${certificateId}`, getAuthHeaders())
  return response.data
}

// Verify certificate (public)
export const verifyCertificate = async (certificateNumber) => {
  const response = await axios.get(`${API_URL}/certificates/verify/${certificateNumber}`)
  return response.data
}

// Revoke certificate
export const revokeCertificate = async (certificateId, reason) => {
  const response = await axios.put(
    `${API_URL}/certificates/${certificateId}/revoke`,
    { reason },
    getAuthHeaders()
  )
  return response.data
}

// Get all certificates (Admin)
export const getAllCertificates = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const response = await axios.get(`${API_URL}/certificates?${params}`, getAuthHeaders())
  return response.data
}

// Download certificate PDF
export const getCertificateDownloadUrl = (certificateUrl) => {
  return `${API_URL.replace('/api', '')}${certificateUrl}`
}
