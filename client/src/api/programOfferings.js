import API_URL from './config'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const getProgramOfferings = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}/program-offerings${query ? `?${query}` : ''}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch program offerings')
  return res.json()
}

export const getProgramOffering = async (id) => {
  const res = await fetch(`${API_URL}/program-offerings/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch program offering')
  return res.json()
}

export const createProgramOffering = async (data) => {
  const res = await fetch(`${API_URL}/program-offerings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create program offering')
  }
  return res.json()
}

export const updateProgramOffering = async (id, data) => {
  const res = await fetch(`${API_URL}/program-offerings/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update program offering')
  }
  return res.json()
}

export const activateProgramOffering = async (id) => {
  const res = await fetch(`${API_URL}/program-offerings/${id}/activate`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to activate program offering')
  }
  return res.json()
}

export const completeProgramOffering = async (id) => {
  const res = await fetch(`${API_URL}/program-offerings/${id}/complete`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to complete program offering')
  }
  return res.json()
}

export const archiveProgramOffering = async (id) => {
  const res = await fetch(`${API_URL}/program-offerings/${id}/archive`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to archive program offering')
  }
  return res.json()
}

export const deleteProgramOffering = async (id) => {
  const res = await fetch(`${API_URL}/program-offerings/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete program offering')
  }
  return res.json()
}

export const enrollInProgramOffering = async (id, studentId) => {
  const res = await fetch(`${API_URL}/program-offerings/${id}/enroll`, {
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
