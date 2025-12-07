import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, ChevronDown, ChevronRight, Video, Radio, FileText, 
  ExternalLink, Calendar, Menu, BookOpen, Clock, Play, Download,
  StickyNote, X, Save, Users, Loader2, TrendingUp, CheckCircle, XCircle
} from 'lucide-react'
import { getMyCourses } from '../../api/enrollments'
import { getCourseSessions } from '../../api/sessions'
import { getNoteForLesson, getNoteForSession, saveNoteForLesson, saveNoteForSession } from '../../api/notes'
import { markJoinAttendance } from '../../api/attendance'
import { getStudentGrade } from '../../api/exams'
import { useToast } from '../../components/Toast'

export default function StudentCourseView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState({})
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [activeTab, setActiveTab] = useState('content') // content, materials, notes
  const [viewMode, setViewMode] = useState('lessons') // lessons or sessions (for LIVE courses)
  
  // Notes state
  const [noteContent, setNoteContent] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState(null)
  
  // Download confirmation state
  const [downloadConfirm, setDownloadConfirm] = useState(null) // { url, name }

  // Grade state
  const [gradeData, setGradeData] = useState(null)
  const [loadingGrade, setLoadingGrade] = useState(false)

  const handleMaterialClick = (url, name) => {
    setDownloadConfirm({ url, name: name || 'this material' })
  }

  const confirmDownload = () => {
    if (downloadConfirm?.url) {
      window.open(downloadConfirm.url, '_blank')
    }
    setDownloadConfirm(null)
  }

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const courses = await getMyCourses()
      // Find by ID or slug
      const found = courses.find(c => c.id === id || c.slug === id)
      if (!found) {
        navigate('/student')
        return
      }
      setCourse(found)
      
      // For LIVE courses, fetch sessions
      if (found.type === 'LIVE') {
        try {
          const courseSessions = await getCourseSessions(found.id)
          setSessions(courseSessions)
          // Find next upcoming session
          const now = new Date()
          const upcoming = courseSessions.find(s => new Date(s.date) >= now)
          if (upcoming) {
            setSelectedSession(upcoming)
            setViewMode('sessions')
          }
        } catch (e) {
          console.error('Failed to fetch sessions:', e)
        }
      }
      
      // Expand first module by default
      if (found.modules?.[0]) {
        setExpandedModules({ [found.modules[0].id]: true })
      }
      // Select first lesson if available
      if (found.modules?.[0]?.lessons?.[0]) {
        setSelectedLesson(found.modules[0].lessons[0])
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      navigate('/student')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  // Fetch grade when course loads
  useEffect(() => {
    if (course?.id) {
      fetchGrade()
    }
  }, [course?.id])

  const fetchGrade = async () => {
    if (!course?.id) return
    setLoadingGrade(true)
    try {
      const data = await getStudentGrade(course.id)
      setGradeData(data)
    } catch (error) {
      console.error('Failed to fetch grade:', error)
    } finally {
      setLoadingGrade(false)
    }
  }

  // Fetch note when lesson or session changes
  useEffect(() => {
    const fetchNote = async () => {
      setNoteContent('')
      setCurrentNoteId(null)
      
      if (!course) return
      
      setNoteLoading(true)
      try {
        let note = null
        if (course.type === 'LIVE' && selectedSession) {
          note = await getNoteForSession(selectedSession.id)
        } else if (course.type === 'RECORDED' && selectedLesson) {
          note = await getNoteForLesson(selectedLesson.id)
        }
        
        if (note) {
          setNoteContent(note.content)
          setCurrentNoteId(note.id)
        }
      } catch (error) {
        console.error('Failed to fetch note:', error)
      } finally {
        setNoteLoading(false)
      }
    }
    
    fetchNote()
  }, [selectedLesson?.id, selectedSession?.id, course?.type])

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Please enter some notes')
      return
    }
    
    setNoteSaving(true)
    try {
      let savedNote
      if (course.type === 'LIVE' && selectedSession) {
        savedNote = await saveNoteForSession(selectedSession.id, noteContent)
      } else if (course.type === 'RECORDED' && selectedLesson) {
        savedNote = await saveNoteForLesson(selectedLesson.id, noteContent)
      }
      
      if (savedNote) {
        setCurrentNoteId(savedNote.id)
        toast.success('Notes saved!')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save notes')
    } finally {
      setNoteSaving(false)
    }
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
    return null
  }

  const getTotalLessons = () => {
    return course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  }

  const formatSessionDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-PH', { 
      timeZone: 'Asia/Manila',
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const isSessionLive = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sessDate = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate())
    
    if (sessDate.getTime() !== today.getTime()) return false
    
    const [startH, startM] = (session.startTime || '00:00').split(':').map(Number)
    const [endH, endM] = (session.endTime || '23:59').split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startH, startM, 0, 0)
    const sessionEnd = new Date(sessionDate)
    sessionEnd.setHours(endH, endM, 0, 0)
    
    // Link visible 1 hour before to 1 hour after
    const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000)
    const oneHourAfter = new Date(sessionEnd.getTime() + 60 * 60 * 1000)
    
    return now >= oneHourBefore && now <= oneHourAfter
  }

  const isSessionPast = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [endH, endM] = (session.endTime || '23:59').split(':').map(Number)
    sessionDate.setHours(endH, endM, 0, 0)
    return now > sessionDate
  }

  const getUpcomingSessions = () => {
    const now = new Date()
    return sessions.filter(s => new Date(s.date) >= new Date(now.toDateString()))
  }

  const getPastSessions = () => {
    const now = new Date()
    return sessions.filter(s => new Date(s.date) < new Date(now.toDateString())).reverse()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  if (!course) return null

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
            <h2 className="font-semibold text-lg leading-tight">{course.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                course.type === 'RECORDED' ? 'bg-blue-500/30 text-blue-200' : 'bg-purple-500/30 text-purple-200'
              }`}>
                {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
              </span>
              <span className="text-xs text-blue-200">
                {course.modules?.length || 0} modules • {getTotalLessons()} lessons
              </span>
            </div>
          </div>

          {/* Grade Display */}
          {gradeData && gradeData.examScores?.length > 0 && (
            <div className="p-4 border-b border-[#2d5a87]">
              <div className="bg-[#2d5a87] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-200" />
                  <span className="text-sm text-blue-200 font-medium">My Grade</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-3xl font-bold ${
                      gradeData.percentage >= 75 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {gradeData.percentage !== null ? `${gradeData.percentage}%` : '-'}
                    </span>
                    <p className="text-xs text-blue-200 mt-1">
                      {gradeData.totalEarned}/{gradeData.totalPossible} points
                    </p>
                  </div>
                  {gradeData.passed !== null && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      gradeData.passed 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {gradeData.passed ? (
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

          {/* View Mode Toggle for LIVE courses */}
          {course.type === 'LIVE' && (
            <div className="p-4 border-b border-[#2d5a87]">
              <div className="flex bg-[#2d5a87] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('sessions')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                    viewMode === 'sessions' ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Sessions
                </button>
                <button
                  onClick={() => setViewMode('lessons')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                    viewMode === 'lessons' ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Lessons
                </button>
              </div>
            </div>
          )}

          {/* Course Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Sessions View (LIVE courses) */}
            {course.type === 'LIVE' && viewMode === 'sessions' && (
              <div className="space-y-4">
                {/* Upcoming Sessions */}
                {getUpcomingSessions().length > 0 && (
                  <div>
                    <p className="text-xs text-blue-300 uppercase tracking-wide mb-2">Upcoming</p>
                    <div className="space-y-2">
                      {getUpcomingSessions().map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setSelectedSession(session)
                            setSelectedLesson(session.lesson)
                          }}
                          className={`w-full p-3 rounded-lg text-left transition ${
                            selectedSession?.id === session.id
                              ? 'bg-[#f7941d] text-white'
                              : 'bg-[#2d5a87] text-white hover:bg-[#3d6a97]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{session.lesson?.name || 'Session'}</span>
                            {isSessionLive(session) && (
                              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs opacity-80">
                            <Calendar className="w-3 h-3" />
                            <span>{formatSessionDate(session.date)}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{formatTime(session.startTime)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Sessions */}
                {getPastSessions().length > 0 && (
                  <div>
                    <p className="text-xs text-blue-300 uppercase tracking-wide mb-2">Past Sessions</p>
                    <div className="space-y-2">
                      {getPastSessions().map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setSelectedSession(session)
                            setSelectedLesson(session.lesson)
                          }}
                          className={`w-full p-3 rounded-lg text-left transition opacity-60 ${
                            selectedSession?.id === session.id
                              ? 'bg-[#f7941d] text-white opacity-100'
                              : 'bg-[#2d5a87]/50 text-blue-200 hover:opacity-80'
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">{session.lesson?.name || 'Session'}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span>{formatSessionDate(session.date)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sessions.length === 0 && (
                  <p className="text-blue-200 text-sm text-center py-8">No sessions scheduled yet.</p>
                )}
              </div>
            )}

            {/* Lessons View (both RECORDED and LIVE) */}
            {(course.type === 'RECORDED' || viewMode === 'lessons') && (
              <>
                {course.modules?.length === 0 ? (
                  <p className="text-blue-200 text-sm text-center py-8">No content available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {course.modules.map((module, index) => (
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
                                {course.type === 'RECORDED' && lesson.videoUrl && (
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
                <h1 className="font-semibold text-gray-900">{selectedSession.lesson?.name || 'Session'}</h1>
                <p className="text-sm text-gray-500">
                  {formatSessionDate(selectedSession.date)} • {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}
                </p>
              </div>
            ) : selectedLesson ? (
              <div>
                <h1 className="font-semibold text-gray-900">{selectedLesson.name}</h1>
                <p className="text-sm text-gray-500">
                  {course.modules?.find(m => m.lessons?.some(l => l.id === selectedLesson.id))?.name}
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {selectedSession && isSessionLive(selectedSession) && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-red-100 text-red-700 animate-pulse">
                <Radio className="w-3 h-3 inline mr-1" /> LIVE NOW
              </span>
            )}
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              course.type === 'RECORDED' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {course.type === 'RECORDED' ? (
                <><Video className="w-3 h-3 inline mr-1" /> Recorded</>
              ) : (
                <><Radio className="w-3 h-3 inline mr-1" /> Live</>
              )}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {(selectedLesson || selectedSession) ? (
            <div className="max-w-4xl mx-auto">
              {/* Video Player for RECORDED */}
              {course.type === 'RECORDED' && selectedLesson?.videoUrl && (
                <div className="bg-black rounded-xl overflow-hidden mb-6 shadow-lg">
                  <div className="aspect-video">
                    {getYouTubeEmbedUrl(selectedLesson.videoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(selectedLesson.videoUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <a
                          href={selectedLesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-6 py-3 rounded-lg font-medium transition"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Open Video
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Session Banner for LIVE courses */}
              {course.type === 'LIVE' && selectedSession && (
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
                          {formatSessionDate(selectedSession.date)} • {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}
                        </p>
                      </div>
                    </div>
                    {isSessionLive(selectedSession) && selectedSession.meetingLink ? (
                      <button
                        onClick={async () => {
                          try {
                            await markJoinAttendance(selectedSession.id)
                          } catch (error) {
                            console.error('Failed to mark attendance:', error)
                          }
                          window.open(selectedSession.meetingLink, '_blank')
                        }}
                        className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition shadow-lg"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Join Class Now
                      </button>
                    ) : isSessionPast(selectedSession) ? (
                      <span className="text-white/60 text-sm">This session has ended</span>
                    ) : (
                      <div className="text-right">
                        <p className="text-white/80 text-sm">Link available 1 hour before class</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No session selected - show general info */}
              {course.type === 'LIVE' && !selectedSession && (
                <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <Radio className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Live Class</h3>
                        <p className="text-purple-100 text-sm">
                          Select a session from the sidebar to view details
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
                      
                      {/* Session Notes */}
                      {selectedSession?.notes && (
                        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <h3 className="font-medium text-purple-900 mb-2">Session Notes</h3>
                          <p className="text-purple-800 text-sm whitespace-pre-wrap">{selectedSession.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Materials Tab */}
                  {activeTab === 'materials' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Materials</h2>
                      
                      {/* Session Materials */}
                      {selectedSession?.materials?.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Session Materials</h3>
                          <div className="space-y-3">
                            {selectedSession.materials.map((material) => (
                              <button
                                key={material.id}
                                onClick={() => handleMaterialClick(material.driveUrl, material.name)}
                                className="w-full flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition group text-left"
                              >
                                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Download className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700">
                                    {material.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{material.driveUrl}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lesson Materials */}
                      {(selectedSession?.lesson?.materials || selectedLesson?.materials) ? (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Lesson Materials</h3>
                          <div className="space-y-3">
                            {(selectedSession?.lesson?.materials || selectedLesson?.materials || '').split('\n').filter(link => link.trim()).map((link, i) => {
                              const fileName = link.trim().split('/').pop() || `Material ${i + 1}`
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleMaterialClick(link.trim(), fileName)}
                                  className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group text-left"
                                >
                                  <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Download className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#1e3a5f]">
                                      {fileName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{link.trim()}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#1e3a5f]" />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : !selectedSession?.materials?.length && (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No materials available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">My Notes</h2>
                        {currentNoteId && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            Saved
                          </span>
                        )}
                      </div>
                      
                      {noteLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-[#1e3a5f] animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <textarea
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                              placeholder={`Take notes for "${selectedSession?.lesson?.name || selectedLesson?.name || 'this lesson'}"...`}
                              rows={12}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              {noteContent.length} characters
                            </p>
                            <button
                              onClick={handleSaveNote}
                              disabled={noteSaving || !noteContent.trim()}
                              className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50"
                            >
                              {noteSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                              ) : (
                                <><Save className="w-4 h-4" /> Save Notes</>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400">
                            Your notes are private and only visible to you.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {course.type === 'LIVE' ? 'Select a session or lesson' : 'Select a lesson'}
                </h3>
                <p className="text-gray-500">
                  {course.type === 'LIVE' 
                    ? 'Choose from the sidebar to view content' 
                    : 'Choose a lesson from the sidebar to start learning'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Download Confirmation Modal */}
      {downloadConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Download Material</h3>
                <p className="text-sm text-gray-500">External link</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-2">
              You are about to open <span className="font-medium text-gray-900">"{downloadConfirm.name}"</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will open the material in a new tab. Would you like to proceed?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDownloadConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDownload}
                className="flex-1 px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
