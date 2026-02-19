import API_URL from './config'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const getMasterCourses = async () => {
  const res = await fetch(`${API_URL}/master-courses`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch master courses')
  return res.json()
}

export const getMasterCourse = async (id) => {
  const res = await fetch(`${API_URL}/master-courses/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch master course')
  return res.json()
}

export const createMasterCourse = async (data) => {
  const res = await fetch(`${API_URL}/master-courses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create master course')
  }
  return res.json()
}

export const updateMasterCourse = async (id, data) => {
  const res = await fetch(`${API_URL}/master-courses/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update master course')
  }
  return res.json()
}

export const deleteMasterCourse = async (id) => {
  const res = await fetch(`${API_URL}/master-courses/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete master course')
  }
  return res.json()
}
