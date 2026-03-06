// Phase 6.2: Payment screenshot upload API
import API_URL from './config'

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

// Upload payment screenshot
export const uploadPaymentScreenshot = async (file, enrollmentType, enrollmentId) => {
  const formData = new FormData()
  formData.append('screenshot', file)
  formData.append('enrollmentType', enrollmentType)
  formData.append('enrollmentId', enrollmentId)

  const response = await fetch(`${API_URL}/payments/upload`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload payment screenshot')
  }

  return response.json()
}

// Get my payment proofs
export const getMyPayments = async () => {
  const response = await fetch(`${API_URL}/payments/my`, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get payments')
  }

  return response.json()
}

// Get all payments (admin)
export const getAllPayments = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.enrollmentType) params.append('enrollmentType', filters.enrollmentType)

  const response = await fetch(`${API_URL}/payments?${params}`, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get payments')
  }

  return response.json()
}

// Get single payment
export const getPayment = async (id) => {
  const response = await fetch(`${API_URL}/payments/${id}`, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get payment')
  }

  return response.json()
}

// Review payment (approve/reject)
export const reviewPayment = async (id, status, notes = '') => {
  const response = await fetch(`${API_URL}/payments/${id}/review`, {
    method: 'PUT',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status, notes })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to review payment')
  }

  return response.json()
}

// Delete payment
export const deletePayment = async (id) => {
  const response = await fetch(`${API_URL}/payments/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete payment')
  }

  return response.json()
}
