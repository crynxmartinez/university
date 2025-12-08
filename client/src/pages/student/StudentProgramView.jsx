import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, BookOpen, Calendar, FileText, Video, Play, 
  ChevronDown, ChevronRight, Clock, Link as LinkIcon, 
  CheckCircle, Award, ExternalLink, Menu, Users, Folder
} from 'lucide-react'
import { 
  getStudentProgram, getProgramSessions, getAvailableProgramExams, 
  getProgramGrade, joinProgramSession 
} from '../../api/studentPrograms'
import { useToast } from '../../components/Toast'

export default function StudentProgramView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Content state
  const [expandedModules, setExpandedModules] = useState({})
  const [selectedLesson, setSelectedLesson] = useState(null)
  
  // Sessions state
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  
  // Exams state
  const [exams, setExams] = useState([])
  const [examConfirmModal, setExamConfirmModal] = useState(null)
  
  // Grade state
  const [grade, setGrade] = useState(null)

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
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchExams = async () => {
    try {
      const data = await getAvailableProgramExams(program.id)
      setExams(data)
    } catch (error) {
      console.error('Failed to fetch exams:', error)
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime12h = (time24) => {
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
    const [startH, startM] = session.startTime.split(':').map(Number)
    const [endH, endM] = session.endTime.split(':').map(Number)
    
    const start = new Date(sessionDate)
    start.setHours(startH, startM, 0)
    
    const end = new Date(sessionDate)
    end.setHours(endH, endM, 0)
    
    return now >= start && now <= end
  }

  const isSessionPast = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const [endH, endM] = session.endTime.split(':').map(Number)
    
    const end = new Date(sessionDate)
    end.setHours(endH, endM, 0)
    
    return now > end
  }

  const getUpcomingSessions = () => {
    const now = new Date()
    return sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= new Date(now.toDateString())
    }).slice(0, 5)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Program not found</h2>
          <button onClick={() => navigate('/student')} className="mt-4 text-[#f7941d] hover:underline">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#1e3a5f] text-white transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-4">
          <Link to="/student" className="flex items-center gap-2 text-blue-200 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="mb-6">
            <h2 className="text-lg font-bold truncate">{program.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${
              program.programType === 'WEBINAR' ? 'bg-purple-500' :
              program.programType === 'IN_PERSON' ? 'bg-green-500' :
              'bg-blue-500'
            }`}>
              {program.programType}
            </span>
          </div>

          {/* Grade Summary */}
          {grade && grade.percentage !== null && (
            <div className={`mb-6 p-4 rounded-lg ${grade.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <p className="text-sm text-blue-200">My Grade</p>
              <p className="text-2xl font-bold">{Math.round(grade.percentage)}%</p>
              <p className="text-xs">{grade.totalEarned}/{grade.totalPossible} points</p>
              <span className={`text-xs px-2 py-0.5 rounded ${grade.passed ? 'bg-green-500' : 'bg-red-500'}`}>
                {grade.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          )}

          <nav className="space-y-2">
            {[
              { id: 'content', icon: BookOpen, label: 'Content' },
              { id: 'sessions', icon: Calendar, label: 'Sessions' },
              { id: 'exams', icon: FileText, label: 'Exams' },
              { id: 'grades', icon: Award, label: 'Grades' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === tab.id ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:bg-[#2d5a87]'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === 'content' && 'Program Content'}
              {activeTab === 'sessions' && 'Scheduled Sessions'}
              {activeTab === 'exams' && 'Exams'}
              {activeTab === 'grades' && 'My Grades'}
            </h1>
          </div>
        </div>

        <div className="p-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Modules List */}
              <div className="lg:col-span-1 space-y-4">
                {program.modules?.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No content available yet</p>
                  </div>
                ) : (
                  program.modules?.map((module, idx) => (
                    <div key={module.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          {expandedModules[module.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          <span className="font-semibold text-gray-900">Module {idx + 1}: {module.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{module.lessons?.length || 0} lessons</span>
                      </button>
                      
                      {expandedModules[module.id] && (
                        <div className="border-t divide-y">
                          {module.lessons?.map(lesson => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLesson(lesson)}
                              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 text-left ${
                                selectedLesson?.id === lesson.id ? 'bg-orange-50 border-l-4 border-[#f7941d]' : ''
                              }`}
                            >
                              {lesson.videoUrl ? (
                                <Play className="w-4 h-4 text-purple-600" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
                              )}
                              <span className="text-gray-900">{lesson.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Lesson Content */}
              <div className="lg:col-span-2">
                {selectedLesson ? (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedLesson.name}</h2>
                    
                    {selectedLesson.description && (
                      <p className="text-gray-600 mb-6">{selectedLesson.description}</p>
                    )}

                    {selectedLesson.videoUrl && (
                      <div className="mb-6">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <iframe
                            src={selectedLesson.videoUrl.replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {selectedLesson.materials && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Materials</h3>
                        <a
                          href={selectedLesson.materials}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#f7941d] hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Materials
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a lesson</h3>
                    <p className="text-gray-500">Choose a lesson from the left to view its content</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
                
                {getUpcomingSessions().length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming sessions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getUpcomingSessions().map(session => (
                      <div
                        key={session.id}
                        className={`border rounded-lg p-4 ${
                          isSessionOngoing(session) ? 'border-green-500 bg-green-50' :
                          session.type === 'EXAM' ? 'border-red-200 bg-red-50' :
                          'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                session.type === 'EXAM' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                              }`}>
                                {session.type}
                              </span>
                              {isSessionOngoing(session) && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500 text-white animate-pulse">
                                  LIVE NOW
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-gray-900">
                              {session.lesson?.name || session.exam?.title || 'Session'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(session.date)} • {formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}
                            </p>
                          </div>
                          
                          {isSessionOngoing(session) && session.meetingLink && (
                            <button
                              onClick={() => handleJoinSession(session)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Join Now
                            </button>
                          )}
                          
                          {session.type === 'EXAM' && isSessionOngoing(session) && (
                            <button
                              onClick={() => navigate(`/student/programs/${id}/exam/${session.examId}?sessionId=${session.id}`)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Take Exam
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Sessions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">All Sessions ({sessions.length})</h3>
                
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No sessions scheduled</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Time</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Topic</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sessions.map(session => (
                          <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{formatDate(session.date)}</td>
                            <td className="px-4 py-3 text-sm">{formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                session.type === 'EXAM' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {session.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{session.lesson?.name || session.exam?.title || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              {isSessionOngoing(session) ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Ongoing</span>
                              ) : isSessionPast(session) ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Completed</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Upcoming</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              {exams.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
                  <p className="text-gray-500">Exams will appear here when they are published</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map(exam => {
                    const isCompleted = exam.attempt?.status === 'SUBMITTED'
                    return (
                      <div key={exam.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className={`p-4 ${isCompleted ? 'bg-blue-600' : 'bg-[#1e3a5f]'}`}>
                          <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                          <p className="text-white/80 text-sm">{exam.totalPoints} points</p>
                        </div>
                        <div className="p-4">
                          {exam.description && (
                            <p className="text-gray-600 text-sm mb-4">{exam.description}</p>
                          )}
                          
                          {exam.timeLimit && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                              <Clock className="w-4 h-4" />
                              {exam.timeLimit} minutes
                            </div>
                          )}

                          {isCompleted ? (
                            <div className="space-y-3">
                              <div className={`p-3 rounded-lg ${
                                (exam.latestScore / exam.totalPoints) >= 0.75 ? 'bg-green-50' : 'bg-red-50'
                              }`}>
                                <p className="text-sm text-gray-600">Your Score</p>
                                <p className={`text-2xl font-bold ${
                                  (exam.latestScore / exam.totalPoints) >= 0.75 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {exam.latestScore}/{exam.totalPoints}
                                </p>
                              </div>
                              <button
                                onClick={() => navigate(`/student/programs/${id}/exam/${exam.id}?attemptId=${exam.attempt.id}`)}
                                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                View Results
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => navigate(`/student/programs/${id}/exam/${exam.id}`)}
                              className="w-full py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f]"
                            >
                              Take Exam
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="space-y-6">
              {/* Overall Grade */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Overall Grade</h3>
                
                {grade ? (
                  <div className="flex items-center gap-8">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                      grade.passed ? 'bg-green-100' : grade.percentage !== null ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <div className="text-center">
                        <p className={`text-3xl font-bold ${
                          grade.passed ? 'text-green-600' : grade.percentage !== null ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {grade.percentage !== null ? `${Math.round(grade.percentage)}%` : '-'}
                        </p>
                        {grade.percentage !== null && (
                          <p className={`text-sm ${grade.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {grade.passed ? 'Passed' : 'Failed'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Points Earned</p>
                      <p className="text-2xl font-bold text-gray-900">{grade.totalEarned} / {grade.totalPossible}</p>
                      <p className="text-sm text-gray-500 mt-2">Passing grade: 75%</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No grades available yet</p>
                )}
              </div>

              {/* Exam Scores */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Exam Scores</h3>
                
                {grade?.examScores?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Exam</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Score</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Total</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Percentage</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {grade.examScores.map(exam => {
                          const pct = exam.score !== null ? (exam.score / exam.totalPoints) * 100 : null
                          const passed = pct !== null && pct >= 75
                          return (
                            <tr key={exam.examId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{exam.examTitle}</td>
                              <td className="px-4 py-3 text-center">
                                {exam.score !== null ? exam.score : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">{exam.totalPoints}</td>
                              <td className="px-4 py-3 text-center">
                                {pct !== null ? `${Math.round(pct)}%` : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {exam.score !== null ? (
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {passed ? 'Passed' : 'Failed'}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                    Not taken
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No exam scores yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
