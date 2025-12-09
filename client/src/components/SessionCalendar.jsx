import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, Video, FileText, ExternalLink, Calendar as CalendarIcon } from 'lucide-react'

export default function SessionCalendar({ 
  sessions = [], 
  isOpen, 
  onClose, 
  title = "Schedule",
  subtitle = "Your sessions",
  accentColor = "purple", // purple for courses, green for programs
  onJoinSession,
  onTakeExam,
  type = "course" // "course" or "program"
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'list'

  if (!isOpen) return null

  // Calendar helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date().toDateString())
  }

  // Get sessions for a specific date
  const getSessionsForDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
    return sessions.filter(s => new Date(s.date).toDateString() === dateStr)
  }

  // Get sessions for selected date
  const selectedDateSessions = selectedDate 
    ? sessions.filter(s => new Date(s.date).toDateString() === selectedDate)
    : []

  // Check if date has sessions
  const hasSessionsOnDate = (day) => {
    return getSessionsForDate(day).length > 0
  }

  // Check session status
  const getSessionStatus = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [startHour, startMin] = (session.startTime || '00:00').split(':').map(Number)
    const [endHour, endMin] = (session.endTime || '23:59').split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startHour, startMin, 0, 0)
    const sessionEnd = new Date(sessionDate)
    sessionEnd.setHours(endHour, endMin, 0, 0)
    
    if (now > sessionEnd) return 'past'
    if (now >= sessionStart && now <= sessionEnd) return 'ongoing'
    return 'upcoming'
  }

  // Check if join link should be visible (1 hour before to 1 hour after)
  const isJoinVisible = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [startHour, startMin] = (session.startTime || '00:00').split(':').map(Number)
    const [endHour, endMin] = (session.endTime || '23:59').split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startHour, startMin, 0, 0)
    const sessionEnd = new Date(sessionDate)
    sessionEnd.setHours(endHour, endMin, 0, 0)
    
    const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000)
    const oneHourAfter = new Date(sessionEnd.getTime() + 60 * 60 * 1000)
    
    return now >= oneHourBefore && now <= oneHourAfter
  }

  // Format time
  const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  // Get color classes based on accent
  const colorClasses = {
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      dot: 'bg-purple-500',
      selected: 'bg-purple-600 text-white',
      header: 'bg-purple-100',
      headerIcon: 'text-purple-600'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      dot: 'bg-green-500',
      selected: 'bg-green-600 text-white',
      header: 'bg-green-100',
      headerIcon: 'text-green-600'
    }
  }

  const colors = colorClasses[accentColor] || colorClasses.purple

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    const today = new Date()

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 md:h-16"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
      const isToday = today.toDateString() === dateStr
      const isSelected = selectedDate === dateStr
      const hasSessions = hasSessionsOnDate(day)
      const daySessions = getSessionsForDate(day)
      
      // Count session types
      const hasExam = daySessions.some(s => s.type === 'EXAM')
      const hasClass = daySessions.some(s => s.type === 'CLASS')
      const hasPast = daySessions.some(s => getSessionStatus(s) === 'past')
      const hasOngoing = daySessions.some(s => getSessionStatus(s) === 'ongoing')

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`h-12 md:h-16 rounded-lg flex flex-col items-center justify-center relative transition-all ${
            isSelected ? colors.selected :
            isToday ? 'bg-blue-50 border-2 border-blue-400' :
            hasSessions ? 'bg-gray-50 hover:bg-gray-100' :
            'hover:bg-gray-50'
          }`}
        >
          <span className={`text-sm font-medium ${
            isSelected ? 'text-white' :
            isToday ? 'text-blue-600' :
            'text-gray-700'
          }`}>
            {day}
          </span>
          
          {/* Session indicators */}
          {hasSessions && !isSelected && (
            <div className="flex gap-0.5 mt-1">
              {hasOngoing && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>}
              {hasClass && !hasOngoing && <div className={`w-1.5 h-1.5 rounded-full ${hasPast ? 'bg-gray-400' : colors.dot}`}></div>}
              {hasExam && <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>}
            </div>
          )}
          
          {/* Session count badge */}
          {daySessions.length > 1 && !isSelected && (
            <span className="absolute top-0.5 right-0.5 text-[10px] bg-gray-200 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">
              {daySessions.length}
            </span>
          )}
        </button>
      )
    }

    return days
  }

  // Render session card
  const renderSessionCard = (session) => {
    const status = getSessionStatus(session)
    const joinVisible = isJoinVisible(session)
    const sessionName = type === 'course' 
      ? session.course?.name 
      : session.program?.name
    const lessonName = session.lesson?.name || session.exam?.title || 'Session'

    return (
      <div 
        key={session.id}
        className={`border rounded-lg p-3 ${
          status === 'past' ? 'border-gray-200 bg-gray-50' :
          status === 'ongoing' ? 'border-green-400 bg-green-50' :
          session.type === 'EXAM' ? 'border-red-200 bg-red-50' :
          'border-blue-200 bg-blue-50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                status === 'past' ? 'bg-gray-400' :
                status === 'ongoing' ? 'bg-green-500' :
                session.type === 'EXAM' ? 'bg-red-500' :
                'bg-blue-500'
              }`}>
                {status === 'past' ? 'PAST' : status === 'ongoing' ? 'LIVE' : session.type}
              </span>
              {status === 'ongoing' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                  NOW
                </span>
              )}
            </div>
            
            {/* Name */}
            <p className="font-medium text-sm text-gray-900 truncate">{sessionName}</p>
            <p className="text-xs text-gray-600 truncate">{lessonName}</p>
            
            {/* Time */}
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </div>
          </div>
          
          {/* Action button */}
          <div className="flex-shrink-0">
            {status === 'past' ? (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Ended
              </span>
            ) : session.type === 'EXAM' ? (
              joinVisible ? (
                <button
                  onClick={() => onTakeExam?.(session)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium"
                >
                  <FileText className="w-3 h-3" />
                  Exam
                </button>
              ) : (
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Scheduled
                </span>
              )
            ) : session.meetingLink ? (
              joinVisible ? (
                <button
                  onClick={() => onJoinSession?.(session)}
                  className="flex items-center gap-1 px-2 py-1 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white text-xs rounded font-medium"
                >
                  <Video className="w-3 h-3" />
                  Join
                </button>
              ) : (
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded text-center">
                  1hr before
                </span>
              )
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  // Get all sessions sorted by date for list view
  const allSessionsSorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colors.header} rounded-lg flex items-center justify-center`}>
              <CalendarIcon className={`w-5 h-5 ${colors.headerIcon}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  viewMode === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                List
              </button>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {viewMode === 'calendar' ? (
            <>
              {/* Calendar */}
              <div className="flex-1 p-4 overflow-y-auto">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatMonthYear(currentDate)}
                    </h3>
                    <button
                      onClick={goToToday}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                    >
                      Today
                    </button>
                  </div>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="h-8 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-500">{day}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
                    <span>Class</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span>Exam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span>Live Now</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span>Past</span>
                  </div>
                </div>
              </div>

              {/* Selected date sessions */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-gray-50 p-4 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-3">
                  {selectedDate 
                    ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                    : 'Select a date'
                  }
                </h4>
                
                {selectedDate ? (
                  selectedDateSessions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateSessions.map(session => renderSessionCard(session))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No sessions on this date</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Click a date to see sessions</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* List view */
            <div className="flex-1 p-4 overflow-y-auto">
              {allSessionsSorted.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions</h3>
                  <p className="text-gray-500">No scheduled sessions found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group by date */}
                  {Object.entries(
                    allSessionsSorted.reduce((acc, session) => {
                      const dateKey = new Date(session.date).toDateString()
                      if (!acc[dateKey]) acc[dateKey] = []
                      acc[dateKey].push(session)
                      return acc
                    }, {})
                  ).map(([dateKey, dateSessions]) => (
                    <div key={dateKey}>
                      <h4 className="font-medium text-gray-700 mb-2 sticky top-0 bg-white py-1">
                        {new Date(dateKey).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        {new Date(dateKey).toDateString() === new Date().toDateString() && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Today</span>
                        )}
                      </h4>
                      <div className="space-y-2 pl-2">
                        {dateSessions.map(session => renderSessionCard(session))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex-shrink-0">
          <button 
            onClick={onClose}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
