import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import SessionCalendar from '../../../components/SessionCalendar'

export default function ScheduleTab({
  schedule,
  loadingSchedule,
  selectedSession,
  setSelectedSession,
  showCalendarModal,
  setShowCalendarModal
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarView, setCalendarView] = useState('list')

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  const formatDateStr = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getSessionsForDay = (date) => {
    if (!date || !schedule) return []
    const dateStr = formatDateStr(date)
    return schedule.filter(s => {
      const sessionDate = new Date(s.date)
      const sessionDateStr = formatDateStr(sessionDate)
      return sessionDateStr === dateStr
    })
  }

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const calendarDays = getDaysInMonth(currentMonth)

  if (loadingSchedule) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading schedule...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header with View Toggle */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#1e3a5f]" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Teaching Schedule</h2>
            <p className="text-sm text-gray-500">{schedule?.length || 0} upcoming sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setCalendarView('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                calendarView === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition text-gray-500 hover:text-gray-900"
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition">
            Today
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const daySessions = date ? getSessionsForDay(date) : []
            const hasNoLinkSession = daySessions.some(s => !s.meetingLink)
            
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border rounded-lg ${
                  !date ? 'bg-gray-50 border-transparent' :
                  isToday(date) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {date && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>
                        {date.getDate()}
                      </span>
                      {hasNoLinkSession && (
                        <div className="group relative">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              No meeting link
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {daySessions.slice(0, 3).map(session => {
                        const formatTime = (time) => {
                          if (!time) return 'No time'
                          const [h, m] = time.split(':')
                          const hour = parseInt(h)
                          const ampm = hour >= 12 ? 'PM' : 'AM'
                          const hour12 = hour % 12 || 12
                          return `${hour12}:${m} ${ampm}`
                        }
                        return (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`w-full text-left text-xs p-1 rounded truncate transition ${
                              !session.meetingLink 
                                ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200' 
                                : session.course?.type === 'LIVE'
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            {formatTime(session.startTime)}
                          </button>
                        )
                      })}
                      {daySessions.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">+{daySessions.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* SessionCalendar Modal */}
      <SessionCalendar
        sessions={schedule || []}
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title="Teaching Schedule"
        subtitle="Your upcoming sessions"
        accentColor="purple"
        type="course"
        onJoinSession={(session) => {
          if (session.meetingLink) {
            window.open(session.meetingLink, '_blank')
          }
        }}
      />
    </div>
  )
}
