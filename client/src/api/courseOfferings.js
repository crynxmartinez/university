import API_URL from './config'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const getCourseOfferings = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}/course-offerings${query ? `?${query}` : ''}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch course offerings')
  return res.json()
}

export const getCourseOffering = async (id) => {
  const res = await fetch(`${API_URL}/course-offerings/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch course offering')
  return res.json()
}

export const createCourseOffering = async (data) => {
  const res = await fetch(`${API_URL}/course-offerings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create course offering')
  }
  return res.json()
}

export const updateCourseOffering = async (id, data) => {
  const res = await fetch(`${API_URL}/course-offerings/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update course offering')
  }
  return res.json()
}

export const activateCourseOffering = async (id) => {
  const res = await fetch(`${API_URL}/course-offerings/${id}/activate`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to activate course offering')
  }
  return res.json()
}

export const completeCourseOffering = async (id) => {
  const res = await fetch(`${API_URL}/course-offerings/${id}/complete`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to complete course offering')
  }
  return res.json()
}

export const archiveCourseOffering = async (id) => {
  const res = await fetch(`${API_URL}/course-offerings/${id}/archive`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to archive course offering')
  }
  return res.json()
}

export const deleteCourseOffering = async (id) => {
  const res = await fetch(`${API_URL}/course-offerings/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete course offering')
  }
  return res.json()
}

export const enrollInCourseOffering = async (id, studentId) => {
  const res = await fetch(`${API_URL}/course-offerings/${id}/enroll`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ studentId })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to enroll')
  }
  return res.json()
}
