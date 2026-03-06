// Phase 6.7: Reports API client
import API_URL from './config'

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

// Download transcript PDF
export const downloadTranscript = async (studentId) => {
  const response = await fetch(`${API_URL}/reports/transcript/${studentId}`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to download transcript')
  }

  // Get the blob and create download link
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transcript-${studentId}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// Download grade report PDF
export const downloadGradeReport = async (studentId, semesterId = null) => {
  let url = `${API_URL}/reports/grade-report/${studentId}`
  if (semesterId) {
    url += `?semesterId=${semesterId}`
  }

  const response = await fetch(url, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to download grade report')
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `grade-report-${studentId}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}

// Download certificate PDF
export const downloadCertificate = async (certificateId) => {
  const response = await fetch(`${API_URL}/reports/certificate/${certificateId}`, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to download certificate')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `certificate-${certificateId}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// Get class roster (JSON)
export const getClassRoster = async (offeringId, type = 'course') => {
  const response = await fetch(`${API_URL}/reports/class-roster/${offeringId}?type=${type}`, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get class roster')
  }

  return response.json()
}
