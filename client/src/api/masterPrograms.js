import API_URL from './config'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const getMasterPrograms = async () => {
  const res = await fetch(`${API_URL}/master-programs`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch master programs')
  return res.json()
}

export const getMasterProgram = async (id) => {
  const res = await fetch(`${API_URL}/master-programs/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch master program')
  return res.json()
}

export const createMasterProgram = async (data) => {
  const res = await fetch(`${API_URL}/master-programs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create master program')
  }
  return res.json()
}

export const updateMasterProgram = async (id, data) => {
  const res = await fetch(`${API_URL}/master-programs/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update master program')
  }
  return res.json()
}

export const deleteMasterProgram = async (id) => {
  const res = await fetch(`${API_URL}/master-programs/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete master program')
  }
  return res.json()
}
