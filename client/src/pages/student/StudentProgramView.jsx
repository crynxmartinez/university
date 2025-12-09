import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, BookOpen, Calendar, FileText, Video, Play, 
  ChevronDown, ChevronRight, Clock, Link as LinkIcon, 
  CheckCircle, XCircle, Award, ExternalLink, Menu, Users, Folder,
  Radio, TrendingUp, Download, StickyNote, X, Save, Loader2
} from 'lucide-react'
import { 
  getStudentProgram, getProgramSessions, getAvailableProgramExams, 
  getProgramGrade, joinProgramSession 
} from '../../api/studentPrograms'
import { getNoteForLesson, getNoteForSession, saveNoteForLesson, saveNoteForSession } from '../../api/notes'
import { useToast } from '../../components/Toast'

export default function StudentProgramView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState('sessions') // sessions, lessons, exams
  const [activeTab, setActiveTab] = useState('content') // content, materials, notes
  
  // Content state
  const [expandedModules, setExpandedModules] = useState({})
  const [selectedLesson, setSelectedLesson] = useState(null)
  
  // Sessions state
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  
  // Collapsible sections state
  const [ongoingExpanded, setOngoingExpanded] = useState(true)
  const [upcomingExpanded, setUpcomingExpanded] = useState(true)
  const [pastExpanded, setPastExpanded] = useState(false)
  
  // Exams state
  const [exams, setExams] = useState([])
  const [loadingExams, setLoadingExams] = useState(false)
  const [examConfirmModal, setExamConfirmModal] = useState(null)
  
  // Grade state
  const [grade, setGrade] = useState(null)
  
  // Notes state
  const [noteContent, setNoteContent] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState(null)

  useEffect(() => {
    fetchProgram()
  }, [id])

  useEffect(() => {
    if (program) {
      fetchSessions()
      fetchExams()
      fetchGrade()
    }
  }, [program?.id])

  const fetchProgram = async () => {
    try {
      const data = await getStudentProgram(id)
      setProgram(data)
      // Expand first module
      if (data.modules?.length > 0) {
        setExpandedModules({ [data.modules[0].id]: true })
      }
    } catch (error) {
      console.error('Failed to fetch program:', error)
      toast.error('Failed to load program')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const data = await getProgramSessions(program.id)
      setSessions(data)
      // Select first upcoming session
      const now = new Date()
      const upcoming = data.find(s => new Date(s.date) >= now)
      if (upcoming) {
        setSelectedSession(upcoming)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchExams = async () => {
    setLoadingExams(true)
    try {
      const data = await getAvailableProgramExams(program.id)
      setExams(data)
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoadingExams(false)
    }
  }

  const fetchGrade = async () => {
    try {
      const data = await getProgramGrade(program.id)
      setGrade(data)
    } catch (error) {
      console.error('Failed to fetch grade:', error)
    }
  }

  const handleJoinSession = async (session) => {
    try {
      await joinProgramSession(session.id)
      toast.success('Attendance marked!')
      if (session.meetingLink) {
        window.open(session.meetingLink, '_blank')
      }
    } catch (error) {
      toast.error('Failed to join session')
    }
  }

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }
  
  const getTotalLessons = () => {
    return program?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  }

  const formatSessionDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time24) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  const isSessionOngoing = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [startH, startM] = (session.startTime || '00:00').split(':').map(Number)
    const [endH, endM] = (session.endTime || '23:59').split(':').map(Number)
    
    const start = new Date(sessionDate)
    start.setHours(startH, startM, 0)
    
    const end = new Date(sessionDate)
    end.setHours(endH, endM, 0)
    
    return now >= start && now <= end
  }
  
  const isSessionLive = isSessionOngoing

  const isSessionPast = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [endH, endM] = (session.endTime || '23:59').split(':').map(Number)
    
    const end = new Date(sessionDate)
    end.setHours(endH, endM, 0)
    
    return now > end
  }
  
  const isSessionStartingSoon = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [startH, startM] = (session.startTime || '00:00').split(':').map(Number)
    sessionDate.setHours(startH, startM, 0, 0)
    
    const diff = sessionDate.getTime() - now.getTime()
    return diff > 0 && diff <= 60 * 60 * 1000 // Within 1 hour
  }
  
  const getTimeUntilEnd = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [endH, endM] = (session.endTime || '23:59').split(':').map(Number)
    sessionDate.setHours(endH, endM, 0, 0)
    
    const diff = sessionDate.getTime() - now.getTime()
    if (diff <= 0) return null
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }
  
  const getTimeUntilStart = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [startH, startM] = (session.startTime || '00:00').split(':').map(Number)
    sessionDate.setHours(startH, startM, 0, 0)
    
    const diff = sessionDate.getTime() - now.getTime()
    if (diff <= 0) return null
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }
  
  const isExamSession = (session) => session?.type === 'EXAM'
  
  const getSessionName = (session) => {
    if (session.type === 'EXAM') {
      return session.exam?.title || 'Exam'
    }
    return session.lesson?.name || 'Session'
  }
  
  // Get ONGOING sessions
  const getOngoingSessions = () => {
    return sessions.filter(s => isSessionOngoing(s))
  }
  
  // Get UPCOMING sessions
  const getUpcomingSessions = () => {
    const now = new Date()
    return sessions.filter(s => {
      const sessionDate = new Date(s.date)
      const [startH, startM] = (s.startTime || '00:00').split(':').map(Number)
      sessionDate.setHours(startH, startM, 0, 0)
      return sessionDate > now
    }).sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA - dateB
    })
  }
  
  // Get PAST sessions
  const getPastSessions = () => {
    const now = new Date()
    return sessions.filter(s => {
      const sessionDate = new Date(s.date)
      const [endH, endM] = (s.endTime || '23:59').split(':').map(Number)
      sessionDate.setHours(endH, endM, 0, 0)
      return sessionDate < now
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }
  
  // Get exam schedule
  const getExamSchedule = (examId) => {
    return sessions.find(s => s.type === 'EXAM' && s.examId === examId)
  }
  
  // Format exam schedule
  const formatExamSchedule = (examId) => {
    const schedule = getExamSchedule(examId)
    if (!schedule) return null
    return `${formatSessionDate(schedule.date)} • ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`
  }
  
  // Get exam status
  const getExamStatus = (exam) => {
    const schedule = getExamSchedule(exam.id)
    
    if (exam.attempt?.status === 'SUBMITTED') {
      return { status: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-300' }
    }
    if (exam.attempt?.status === 'IN_PROGRESS') {
      return { status: 'in_progress', label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-300' }
    }
    if (!schedule) {
      return { status: 'not_scheduled', label: 'Not Scheduled', color: 'bg-gray-500/20 text-gray-300' }
    }
    
    const now = new Date()
    const sessionDate = new Date(schedule.date)
    const [startH, startM] = (schedule.startTime || '00:00').split(':').map(Number)
    const [endH, endM] = (schedule.endTime || '23:59').split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startH, startM, 0, 0)
    const sessionEnd = new Date(sessionDate)
    sessionEnd.setHours(endH, endM, 0, 0)
    
    if (now > sessionEnd) {
      return { status: 'closed', label: 'Closed', color: 'bg-red-500/20 text-red-300' }
    }
    if (now >= sessionStart && now <= sessionEnd) {
      return { status: 'open', label: 'Open Now', color: 'bg-green-500/20 text-green-300' }
    }
    
    return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-500/20 text-blue-300' }
  }
  
  // Notes functions
  const fetchNote = async () => {
    if (!selectedLesson && !selectedSession) return
    
    setNoteLoading(true)
    try {
      let note
      if (selectedSession) {
        note = await getNoteForSession(selectedSession.id)
      } else if (selectedLesson) {
        note = await getNoteForLesson(selectedLesson.id)
      }
      setNoteContent(note?.content || '')
      setCurrentNoteId(note?.id || null)
    } catch (error) {
      console.error('Failed to fetch note:', error)
    } finally {
      setNoteLoading(false)
    }
  }
  
  const saveNote = async () => {
    if (!selectedLesson && !selectedSession) return
    
    setNoteSaving(true)
    try {
      if (selectedSession) {
        await saveNoteForSession(selectedSession.id, noteContent)
      } else if (selectedLesson) {
        await saveNoteForLesson(selectedLesson.id, noteContent)
      }
      toast.success('Note saved!')
    } catch (error) {
      toast.error('Failed to save note')
    } finally {
      setNoteSaving(false)
    }
  }
  
  useEffect(() => {
    if (activeTab === 'notes') {
      fetchNote()
    }
  }, [selectedLesson?.id, selectedSession?.id, activeTab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  if (!program) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-[#1e3a5f] text-white transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="w-80 h-screen flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#2d5a87]">
            <Link to="/student" className="flex items-center gap-2 text-blue-200 hover:text-white transition mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h2 className="font-semibold text-lg leading-tight">{program.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                program.programType === 'WEBINAR' ? 'bg-purple-500/30 text-purple-200' :
                program.programType === 'IN_PERSON' ? 'bg-green-500/30 text-green-200' :
                program.programType === 'EVENT' ? 'bg-orange-500/30 text-orange-200' :
                'bg-blue-500/30 text-blue-200'
              }`}>
                {program.programType === 'WEBINAR' ? 'Webinar' :
                 program.programType === 'IN_PERSON' ? 'In-Person' :
                 program.programType === 'EVENT' ? 'Event' :
                 program.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
              </span>
              <span className="text-xs text-blue-200">
                {program.modules?.length || 0} modules • {getTotalLessons()} lessons
              </span>
            </div>
          </div>

          {/* Grade Display */}
          {grade && grade.examScores?.length > 0 && (
            <div className="p-4 border-b border-[#2d5a87]">
              <div className="bg-[#2d5a87] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-200" />
                  <span className="text-sm text-blue-200 font-medium">My Grade</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-3xl font-bold ${
                      grade.percentage >= 75 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {grade.percentage !== null ? `${Math.round(grade.percentage)}%` : '-'}
                    </span>
                    <p className="text-xs text-blue-200 mt-1">
                      {grade.totalEarned}/{grade.totalPossible} points
                    </p>
                  </div>
                  {grade.passed !== null && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      grade.passed 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {grade.passed ? (
                        <><CheckCircle className="w-4 h-4" /> Passed</>
                      ) : (
                        <><XCircle className="w-4 h-4" /> Failed</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="p-4 border-b border-[#2d5a87]">
            <div className="flex bg-[#2d5a87] rounded-lg p-1">
              <button
                onClick={() => setViewMode('sessions')}
                className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'sessions' ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Sessions
              </button>
              <button
                onClick={() => setViewMode('lessons')}
                className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'lessons' ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-1" />
                Lessons
              </button>
              <button
                onClick={() => setViewMode('exams')}
                className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'exams' ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Exams
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Sessions View */}
            {viewMode === 'sessions' && (
              <div className="space-y-3">
                {/* ONGOING Sessions */}
                {getOngoingSessions().length > 0 && (
                  <div>
                    <button
                      onClick={() => setOngoingExpanded(!ongoingExpanded)}
                      className="w-full flex items-center justify-between text-xs text-red-300 uppercase tracking-wide mb-2 hover:text-red-200"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Ongoing ({getOngoingSessions().length})
                      </span>
                      {ongoingExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {ongoingExpanded && (
                      <div className="space-y-2">
                        {getOngoingSessions().map((session) => (
                          <button
                            key={session.id}
                            onClick={() => {
                              setSelectedSession(session)
                              if (isExamSession(session)) {
                                setSelectedLesson(null)
                              } else {
                                setSelectedLesson(session.lesson)
                              }
                            }}
                            className={`w-full p-3 rounded-lg text-left transition border-2 ${
                              selectedSession?.id === session.id
                                ? 'bg-[#f7941d] text-white border-[#f7941d]'
                                : 'bg-red-500/20 text-white hover:bg-red-500/30 border-red-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {isExamSession(session) ? (
                                  <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">EXAM</span>
                                ) : (
                                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">CLASS</span>
                                )}
                                <span className="text-sm font-medium truncate">{getSessionName(session)}</span>
                              </div>
                              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">LIVE</span>
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-80">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                              </div>
                              <span className="text-red-200">Ends in {getTimeUntilEnd(session)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* UPCOMING Sessions */}
                {getUpcomingSessions().length > 0 && (
                  <div>
                    <button
                      onClick={() => setUpcomingExpanded(!upcomingExpanded)}
                      className="w-full flex items-center justify-between text-xs text-blue-300 uppercase tracking-wide mb-2 hover:text-blue-200"
                    >
                      <span>Upcoming ({getUpcomingSessions().length})</span>
                      {upcomingExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {upcomingExpanded && (
                      <div className="space-y-2">
                        {getUpcomingSessions().map((session) => (
                          <button
                            key={session.id}
                            onClick={() => {
                              setSelectedSession(session)
                              if (isExamSession(session)) {
                                setSelectedLesson(null)
                              } else {
                                setSelectedLesson(session.lesson)
                              }
                            }}
                            className={`w-full p-3 rounded-lg text-left transition ${
                              selectedSession?.id === session.id
                                ? 'bg-[#f7941d] text-white'
                                : 'bg-[#2d5a87] text-white hover:bg-[#3d6a97]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {isExamSession(session) ? (
                                  <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">EXAM</span>
                                ) : (
                                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">CLASS</span>
                                )}
                                <span className="text-sm font-medium truncate">{getSessionName(session)}</span>
                              </div>
                              {isSessionStartingSoon(session) && (
                                <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full flex-shrink-0">Soon</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-80">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>{formatSessionDate(session.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(session.startTime)}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PAST Sessions */}
                {getPastSessions().length > 0 && (
                  <div>
                    <button
                      onClick={() => setPastExpanded(!pastExpanded)}
                      className="w-full flex items-center justify-between text-xs text-gray-400 uppercase tracking-wide mb-2 hover:text-gray-300"
                    >
                      <span>Past ({getPastSessions().length})</span>
                      {pastExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {pastExpanded && (
                      <div className="space-y-2">
                        {getPastSessions().map((session) => (
                          <button
                            key={session.id}
                            onClick={() => {
                              setSelectedSession(session)
                              if (!isExamSession(session)) {
                                setSelectedLesson(session.lesson)
                              }
                            }}
                            className={`w-full p-3 rounded-lg text-left transition opacity-60 ${
                              selectedSession?.id === session.id
                                ? 'bg-[#f7941d] text-white opacity-100'
                                : 'bg-[#2d5a87]/50 text-white hover:opacity-80'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isExamSession(session) ? (
                                <span className="text-xs bg-red-600/50 text-white px-1.5 py-0.5 rounded font-medium">EXAM</span>
                              ) : (
                                <span className="text-xs bg-blue-600/50 text-blue-200 px-1.5 py-0.5 rounded font-medium">CLASS</span>
                              )}
                              <span className="text-sm font-medium truncate">{getSessionName(session)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3" />
                              <span>{formatSessionDate(session.date)}</span>
                              <Clock className="w-3 h-3 ml-1" />
                              <span>{formatTime(session.startTime)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {sessions.length === 0 && (
                  <p className="text-blue-200 text-sm text-center py-8">No sessions scheduled yet.</p>
                )}
              </div>
            )}

            {/* Lessons View */}
            {viewMode === 'lessons' && (
              <>
                {program.modules?.length === 0 ? (
                  <p className="text-blue-200 text-sm text-center py-8">No content available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {program.modules.map((module, index) => (
                      <div key={module.id}>
                        {/* Module Header */}
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-[#2d5a87] transition text-left"
                        >
                          {expandedModules[module.id] ? (
                            <ChevronDown className="w-4 h-4 text-blue-300 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-blue-300 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-xs text-blue-300 uppercase tracking-wide">Module {index + 1}</p>
                            <p className="text-sm font-medium">{module.name}</p>
                          </div>
                        </button>

                        {/* Lessons */}
                        {expandedModules[module.id] && module.lessons?.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <button
                                key={lesson.id}
                                onClick={() => {
                                  setSelectedLesson(lesson)
                                  setSelectedSession(null)
                                  setActiveTab('content')
                                }}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition text-sm ${
                                  selectedLesson?.id === lesson.id && !selectedSession
                                    ? 'bg-[#f7941d] text-white'
                                    : 'text-blue-200 hover:bg-[#2d5a87] hover:text-white'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                  selectedLesson?.id === lesson.id && !selectedSession
                                    ? 'bg-white/20'
                                    : 'bg-[#2d5a87]'
                                }`}>
                                  {lessonIndex + 1}
                                </span>
                                <span className="truncate flex-1">{lesson.name}</span>
                                {lesson.videoUrl && (
                                  <Play className="w-3 h-3 flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Exams View */}
            {viewMode === 'exams' && (
              <div className="space-y-3">
                {loadingExams ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-300" />
                  </div>
                ) : exams.length === 0 ? (
                  <p className="text-blue-200 text-sm text-center py-8">No exams available yet.</p>
                ) : (
                  exams.map((exam) => {
                    const examStatus = getExamStatus(exam)
                    const schedule = formatExamSchedule(exam.id)
                    
                    return (
                      <div
                        key={exam.id}
                        className={`p-4 rounded-lg text-left transition ${
                          examStatus.status === 'open'
                            ? 'bg-green-600/20 border border-green-500'
                            : 'bg-[#2d5a87]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-white">{exam.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${examStatus.color}`}>
                            {examStatus.label}
                          </span>
                        </div>
                        
                        {schedule && (
                          <div className="flex items-center gap-2 text-xs text-blue-300 mb-2 bg-[#1e3a5f]/50 px-2 py-1 rounded">
                            <Calendar className="w-3 h-3" />
                            <span>{schedule}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-blue-300 mb-3">
                          <span>{exam.totalPoints} pts</span>
                          {exam.timeLimit && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exam.timeLimit} min
                            </span>
                          )}
                        </div>
                        
                        {/* Score Display */}
                        {exam.attempt?.status === 'SUBMITTED' && exam.latestScore !== null && (
                          <div className="mb-3 p-2 bg-[#1e3a5f]/50 rounded">
                            <span className={`text-sm font-medium ${
                              (exam.latestScore / exam.totalPoints) >= 0.75 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              Score: {exam.latestScore}/{exam.totalPoints} ({Math.round((exam.latestScore / exam.totalPoints) * 100)}%)
                            </span>
                          </div>
                        )}
                        
                        {/* Action Button */}
                        <div className="pt-2 border-t border-[#3d6a97]">
                          {examStatus.status === 'completed' ? (
                            <button
                              onClick={() => navigate(`/student/programs/${id}/exam/${exam.id}?attemptId=${exam.attempt?.id}`)}
                              className="w-full py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg text-sm font-medium transition"
                            >
                              View Results
                            </button>
                          ) : examStatus.status === 'in_progress' ? (
                            <button
                              onClick={() => navigate(`/student/programs/${id}/exam/${exam.id}`)}
                              className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 rounded-lg text-sm font-medium transition"
                            >
                              Resume Exam
                            </button>
                          ) : examStatus.status === 'open' ? (
                            <button
                              onClick={() => {
                                const examSession = getExamSchedule(exam.id)
                                setExamConfirmModal({ exam, schedule, sessionId: examSession?.id })
                              }}
                              className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
                            >
                              Take Exam Now
                            </button>
                          ) : examStatus.status === 'scheduled' ? (
                            <button
                              disabled
                              className="w-full py-2 bg-blue-500/30 text-blue-300 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Opens {schedule?.split('•')[0]?.trim()}
                            </button>
                          ) : examStatus.status === 'closed' ? (
                            <button
                              disabled
                              className="w-full py-2 bg-red-500/30 text-red-300 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Exam Closed
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 bg-gray-500/30 text-gray-300 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Not Scheduled Yet
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            {selectedSession ? (
              <div>
                <h1 className="font-semibold text-gray-900">{getSessionName(selectedSession)}</h1>
                <p className="text-sm text-gray-500">
                  {formatSessionDate(selectedSession.date)} • {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}
                </p>
              </div>
            ) : selectedLesson ? (
              <div>
                <h1 className="font-semibold text-gray-900">{selectedLesson.name}</h1>
                <p className="text-sm text-gray-500">
                  {program.modules?.find(m => m.lessons?.some(l => l.id === selectedLesson.id))?.name}
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {selectedSession && isSessionOngoing(selectedSession) && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-red-100 text-red-700 animate-pulse">
                <Radio className="w-3 h-3 inline mr-1" /> LIVE NOW
              </span>
            )}
            {selectedSession && isExamSession(selectedSession) && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-red-100 text-red-700">
                <FileText className="w-3 h-3 inline mr-1" /> Exam
              </span>
            )}
            <button
              onClick={() => setViewMode('sessions')}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white text-sm rounded-lg font-medium transition"
            >
              <Calendar className="w-4 h-4" />
              View Schedule
            </button>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              program.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
              program.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
              program.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {program.programType === 'WEBINAR' ? 'Webinar' :
               program.programType === 'IN_PERSON' ? 'In-Person' :
               program.programType === 'EVENT' ? 'Event' :
               program.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {(selectedLesson || selectedSession) ? (
            <div className="max-w-4xl mx-auto">
              {/* Video Player for lessons with video */}
              {selectedLesson?.videoUrl && !selectedSession && (
                <div className="bg-black rounded-xl overflow-hidden mb-6 shadow-lg">
                  <div className="aspect-video">
                    <iframe
                      src={selectedLesson.videoUrl.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Session Banner for CLASS type */}
              {selectedSession && !isExamSession(selectedSession) && (
                <div className={`rounded-xl p-6 mb-6 text-white ${
                  isSessionLive(selectedSession) 
                    ? 'bg-gradient-to-r from-red-600 to-red-400' 
                    : isSessionPast(selectedSession)
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400'
                      : 'bg-gradient-to-r from-purple-600 to-purple-400'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        {isSessionLive(selectedSession) ? (
                          <Radio className="w-7 h-7 animate-pulse" />
                        ) : (
                          <Calendar className="w-7 h-7" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {isSessionLive(selectedSession) ? 'Live Now!' : isSessionPast(selectedSession) ? 'Session Ended' : 'Upcoming Session'}
                        </h3>
                        <p className="text-white/80 text-sm">
                          Select a session from the sidebar to view details
                        </p>
                      </div>
                    </div>
                    {isSessionLive(selectedSession) ? (
                      selectedSession.meetingLink ? (
                        <button
                          onClick={() => handleJoinSession(selectedSession)}
                          className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition shadow-lg"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Join Class Now
                        </button>
                      ) : (
                        <span className="text-white/80 text-sm">No meeting link set</span>
                      )
                    ) : isSessionPast(selectedSession) ? (
                      <span className="text-white/60 text-sm">This session has ended</span>
                    ) : (
                      <button
                        onClick={() => setViewMode('sessions')}
                        className="flex items-center gap-2 bg-white text-purple-600 px-5 py-2.5 rounded-lg font-medium hover:bg-purple-50 transition"
                      >
                        <Calendar className="w-4 h-4" />
                        View Sessions
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Session Banner for EXAM type */}
              {selectedSession && isExamSession(selectedSession) && (() => {
                const examId = selectedSession.examId
                const examData = exams.find(e => e.id === examId)
                const completed = examData?.attempt?.status === 'SUBMITTED'
                const inProgress = examData?.attempt?.status === 'IN_PROGRESS'
                
                return (
                  <div className={`rounded-xl p-6 mb-6 text-white ${
                    completed
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                      : isSessionOngoing(selectedSession) 
                        ? 'bg-gradient-to-r from-green-600 to-green-400' 
                        : isSessionPast(selectedSession)
                          ? 'bg-gradient-to-r from-gray-600 to-gray-400'
                          : 'bg-gradient-to-r from-red-600 to-red-400'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                          {completed ? <CheckCircle className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {completed 
                              ? 'Exam Completed' 
                              : inProgress 
                                ? 'Exam In Progress'
                                : isSessionOngoing(selectedSession) 
                                  ? 'Exam Open Now!' 
                                  : isSessionPast(selectedSession) 
                                    ? 'Exam Closed' 
                                    : 'Upcoming Exam'}
                          </h3>
                          <p className="text-white/80 text-sm">{selectedSession.exam?.title || 'Exam'}</p>
                          <p className="text-white/60 text-xs mt-1">
                            {formatSessionDate(selectedSession.date)} • {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}
                          </p>
                        </div>
                      </div>
                      {completed ? (
                        <button
                          onClick={() => navigate(`/student/programs/${id}/exam/${examId}?attemptId=${examData?.attempt?.id}`)}
                          className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition shadow-lg"
                        >
                          <CheckCircle className="w-5 h-5" />
                          View Results
                        </button>
                      ) : inProgress ? (
                        <button
                          onClick={() => navigate(`/student/programs/${id}/exam/${examId}?sessionId=${selectedSession.id}`)}
                          className="flex items-center gap-2 bg-white text-yellow-600 px-6 py-3 rounded-lg font-medium hover:bg-yellow-50 transition shadow-lg"
                        >
                          <FileText className="w-5 h-5" />
                          Resume Exam
                        </button>
                      ) : isSessionOngoing(selectedSession) ? (
                        <button
                          onClick={() => setExamConfirmModal({ 
                            exam: selectedSession.exam, 
                            schedule: formatExamSchedule(selectedSession.examId),
                            sessionId: selectedSession.id
                          })}
                          className="flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition shadow-lg"
                        >
                          <FileText className="w-5 h-5" />
                          Take Exam Now
                        </button>
                      ) : isSessionPast(selectedSession) ? (
                        <span className="text-white/60 text-sm">This exam has ended</span>
                      ) : (
                        <div className="text-right">
                          <p className="text-white/80 text-sm">Exam opens at scheduled time</p>
                          {getTimeUntilStart(selectedSession) && (
                            <p className="text-white/60 text-xs mt-1">Starts in {getTimeUntilStart(selectedSession)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Exam Details */}
                    <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-white/60 text-xs">Questions</p>
                        <p className="text-white font-medium">{selectedSession.exam?._count?.questions || selectedSession.exam?.questions?.length || selectedSession.exam?.questionCount || '?'}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Total Points</p>
                        <p className="text-white font-medium">{selectedSession.exam?.totalPoints || '?'}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Time Limit</p>
                        <p className="text-white font-medium">{selectedSession.exam?.timeLimit ? `${selectedSession.exam.timeLimit} min` : 'No limit'}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Tab Switches</p>
                        <p className="text-white font-medium">{selectedSession.exam?.maxTabSwitch || 3} allowed</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* No session selected - show general info */}
              {!selectedSession && !selectedLesson && (
                <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <Folder className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Program Content</h3>
                        <p className="text-purple-100 text-sm">
                          Select a session or lesson from the sidebar to view details
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewMode('sessions')}
                      className="flex items-center gap-2 bg-white text-purple-600 px-5 py-2.5 rounded-lg font-medium hover:bg-purple-50 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      View Sessions
                    </button>
                  </div>
                </div>
              )}

              {/* Content Tabs */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Tab Headers */}
                <div className="border-b flex">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-6 py-4 font-medium text-sm transition ${
                      activeTab === 'content'
                        ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`px-6 py-4 font-medium text-sm transition ${
                      activeTab === 'materials'
                        ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-6 py-4 font-medium text-sm transition ${
                      activeTab === 'notes'
                        ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <StickyNote className="w-4 h-4 inline mr-2" />
                    My Notes
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'content' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {selectedSession?.lesson?.name || selectedLesson?.name || 'Overview'}
                      </h2>
                      {(selectedSession?.lesson?.description || selectedLesson?.description) ? (
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-600 whitespace-pre-wrap">
                            {selectedSession?.lesson?.description || selectedLesson?.description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No description available.</p>
                      )}
                    </div>
                  )}

                  {/* Materials Tab */}
                  {activeTab === 'materials' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Materials</h2>
                      {(selectedSession?.lesson?.materials || selectedLesson?.materials) ? (
                        <a
                          href={selectedSession?.lesson?.materials || selectedLesson?.materials}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Download className="w-5 h-5 text-[#1e3a5f]" />
                          <div>
                            <p className="font-medium text-gray-900">Download Materials</p>
                            <p className="text-sm text-gray-500">Click to open in new tab</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                        </a>
                      ) : (
                        <p className="text-gray-500 italic">No materials available for this lesson.</p>
                      )}
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">My Notes</h2>
                        <button
                          onClick={saveNote}
                          disabled={noteSaving}
                          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87] transition disabled:opacity-50"
                        >
                          {noteSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save
                        </button>
                      </div>
                      {noteLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Write your notes here..."
                          className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <Folder className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Program Content</h3>
                      <p className="text-purple-100 text-sm">
                        Select a session or lesson from the sidebar to view details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewMode('sessions')}
                    className="flex items-center gap-2 bg-white text-purple-600 px-5 py-2.5 rounded-lg font-medium hover:bg-purple-50 transition"
                  >
                    <Calendar className="w-4 h-4" />
                    View Sessions
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Exam Confirmation Modal */}
      {examConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Start Exam</h3>
            <p className="text-gray-600 mb-4">
              You are about to start <strong>{examConfirmModal.exam?.title}</strong>
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Time Limit:</span>
                <span className="font-medium">{examConfirmModal.exam?.timeLimit ? `${examConfirmModal.exam.timeLimit} minutes` : 'No limit'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Points:</span>
                <span className="font-medium">{examConfirmModal.exam?.totalPoints || '?'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tab Switches Allowed:</span>
                <span className="font-medium">{examConfirmModal.exam?.maxTabSwitch || 3}</span>
              </div>
            </div>
            <p className="text-sm text-red-600 mb-4">
              ⚠️ Once started, the timer cannot be paused. Switching tabs may be flagged.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setExamConfirmModal(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const examId = examConfirmModal.exam?.id
                  const sessionId = examConfirmModal.sessionId
                  setExamConfirmModal(null)
                  navigate(`/student/programs/${id}/exam/${examId}${sessionId ? `?sessionId=${sessionId}` : ''}`)
                }}
                className="flex-1 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f]"
              >
                Start Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
