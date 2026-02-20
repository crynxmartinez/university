import API_URL from './config'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

// Issue a certificate (teacher/admin)
// data: { studentId, courseOfferingId?, programOfferingId?, certificateUrl, completionDate? }
export const issueCertificate = async (data) => {
  const res = await fetch(`${API_URL}/certificates/issue`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

// Get my certificates (student)
export const getMyCertificates = async () => {
  const res = await fetch(`${API_URL}/certificates/mine`, { headers: getHeaders() })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

// Get certificates for an offering (teacher)
export const getOfferingCertificates = async (offeringId, type = 'course') => {
  const res = await fetch(`${API_URL}/certificates/offering/${offeringId}?type=${type}`, { headers: getHeaders() })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

// Get student's certificates by studentId (admin/teacher)
export const getStudentCertificates = async (studentId) => {
  const res = await fetch(`${API_URL}/certificates/student/${studentId}`, { headers: getHeaders() })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

// Revoke certificate
export const revokeCertificate = async (id, reason) => {
  const res = await fetch(`${API_URL}/certificates/${id}`, {
    method: 'DELETE', headers: getHeaders(), body: JSON.stringify({ reason })
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

