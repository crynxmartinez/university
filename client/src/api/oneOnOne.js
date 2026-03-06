import API_URL from './config'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

// Student creates a 1-on-1 request
export const createOneOnOneRequest = async (data) => {
  const res = await fetch(`${API_URL}/one-on-one/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create request')
  }
  return res.json()
}

// Student gets their requests/sessions
export const getMyOneOnOneRequests = async (status) => {
  const query = status ? `?status=${status}` : ''
  const res = await fetch(`${API_URL}/one-on-one/my-requests${query}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch requests')
  return res.json()
}

// Student cancels request or session
export const cancelOneOnOneRequest = async (id, reason) => {
  const res = await fetch(`${API_URL}/one-on-one/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to cancel')
  }
  return res.json()
}

// Teacher gets incoming requests
export const getIncomingOneOnOneRequests = async (status) => {
  const query = status ? `?status=${status}` : ''
  const res = await fetch(`${API_URL}/one-on-one/incoming${query}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch requests')
  return res.json()
}

// Teacher responds to request (accept/decline/propose)
export const respondToOneOnOneRequest = async (id, data) => {
  const res = await fetch(`${API_URL}/one-on-one/${id}/respond`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to respond')
  }
  return res.json()
}

// Student accepts/declines teacher's proposal
export const respondToProposal = async (id, accept, meetingLink) => {
  const res = await fetch(`${API_URL}/one-on-one/${id}/proposal-response`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ accept, meetingLink })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to respond to proposal')
  }
  return res.json()
}

// Teacher cancels scheduled session
export const cancelOneOnOneSession = async (id, reason) => {
  const res = await fetch(`${API_URL}/one-on-one/${id}/cancel`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to cancel session')
  }
  return res.json()
}

// Mark session as completed
export const completeOneOnOneSession = async (id) => {
  const res = await fetch(`${API_URL}/one-on-one/${id}/complete`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to mark as completed')
  return res.json()
}

// Mark no-show
export const markNoShow = async (id, who) => {
  const res = await fetch(`${API_URL}/one-on-one/${id}/no-show`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ who })
  })
  if (!res.ok) throw new Error('Failed to mark no-show')
  return res.json()
}
