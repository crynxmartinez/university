// Date utilities for Philippine Time (Asia/Manila, UTC+8)

const PH_TIMEZONE = 'Asia/Manila'

// Format date to PH locale string
export const formatDatePH = (date, options = {}) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-PH', { timeZone: PH_TIMEZONE, ...options })
}

// Format time to PH locale string
export const formatTimePH = (date, options = {}) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('en-PH', { timeZone: PH_TIMEZONE, ...options })
}

// Format date and time to PH locale string
export const formatDateTimePH = (date, options = {}) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('en-PH', { timeZone: PH_TIMEZONE, ...options })
}

// Get current date in PH timezone
export const getNowPH = () => {
  return new Date().toLocaleString('en-US', { timeZone: PH_TIMEZONE })
}

// Format date for display (e.g., "December 7, 2025")
export const formatLongDate = (date) => {
  return formatDatePH(date, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Format date with weekday (e.g., "Saturday, December 7, 2025")
export const formatFullDate = (date) => {
  return formatDatePH(date, { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Format short date (e.g., "12/7/2025")
export const formatShortDate = (date) => {
  return formatDatePH(date, { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  })
}

// Format time (e.g., "7:00 PM")
export const formatTime = (timeString) => {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return date.toLocaleTimeString('en-PH', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

// Check if a date is today in PH timezone
export const isTodayPH = (date) => {
  if (!date) return false
  const d = new Date(date)
  const today = new Date()
  const dPH = d.toLocaleDateString('en-PH', { timeZone: PH_TIMEZONE })
  const todayPH = today.toLocaleDateString('en-PH', { timeZone: PH_TIMEZONE })
  return dPH === todayPH
}

// Check if a date is in the past in PH timezone
export const isPastPH = (date) => {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d < now
}

// Check if a date is in the future in PH timezone
export const isFuturePH = (date) => {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d > now
}
