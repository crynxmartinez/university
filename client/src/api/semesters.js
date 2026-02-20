import API_URL from './config'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const getSemesters = async () => {
  const res = await fetch(`${API_URL}/semesters`, { headers: getHeaders() })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export const getSemester = async (id) => {
  const res = await fetch(`${API_URL}/semesters/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export const createSemester = async (data) => {
  const res = await fetch(`${API_URL}/semesters`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export const updateSemester = async (id, data) => {
  const res = await fetch(`${API_URL}/semesters/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export const deleteSemester = async (id) => {
  const res = await fetch(`${API_URL}/semesters/${id}`, {
    method: 'DELETE', headers: getHeaders()
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}
