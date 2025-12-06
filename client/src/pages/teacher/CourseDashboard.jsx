import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, BookOpen, Calendar, Users, Settings, Menu, 
  Plus, Video, Radio, ChevronDown, ChevronRight, Play,
  ToggleLeft, ToggleRight, Trash2, Edit3, Save, X,
  ChevronLeft, Clock, Link as LinkIcon, FileText, Copy, Clipboard
} from 'lucide-react'
import { getCourse, updateCourse, toggleCourseActive, deleteCourse } from '../../api/courses'
import { getCourseSessions, createSession, updateSession, deleteSession, addMaterial, deleteMaterial } from '../../api/sessions'

export default function CourseDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState({})
  
  // Settings state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Schedule state
  const [sessions, setSessions] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [copiedSession, setCopiedSession] = useState(null)
  
  // Session form state
  const [sessionForm, setSessionForm] = useState({
    type: 'CLASS',
    title: '',
    startTime: '19:00',
    endTime: '21:00',
    meetingLink: '',
    notes: ''
  })
  const [sessionSaving, setSessionSaving] = useState(false)
  
  // Material modal state
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialSessionId, setMaterialSessionId] = useState(null)
  const [materialForm, setMaterialForm] = useState({ name: '', driveUrl: '' })
  const [materialSaving, setMaterialSaving] = useState(false)

  useEffect(() => {
    fetchCourse()
  }, [id])

  useEffect(() => {
    if (course?.type === 'LIVE') {
      fetchSessions()
    }
  }, [course?.id])

  const fetchSessions = async () => {
    try {
      const data = await getCourseSessions(id)
      setSessions(data)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchCourse = async () => {
    try {
      const data = await getCourse(id)
      setCourse(data)
      setEditName(data.name)
      setEditDescription(data.description || '')
      // Expand all modules by default
      const expanded = {}
      data.modules?.forEach(m => { expanded[m.id] = true })
      setExpandedModules(expanded)
    } catch (error) {
      console.error('Failed to fetch course:', error)
      navigate('/teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      const updated = await toggleCourseActive(id)
      setCourse(updated)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to toggle course status')
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const updated = await updateCourse(id, {
        name: editName,
        description: editDescription
      })
      setCourse(updated)
      setEditing(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }
    try {
      await deleteCourse(id)
      navigate('/teacher')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete course')
    }
  }

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const getSessionsForDate = (date) => {
    if (!date) return []
    const dateStr = formatDate(date)
    return sessions.filter(s => {
      const sessionDate = new Date(s.date).toISOString().split('T')[0]
      return sessionDate === dateStr
    })
  }

  const getSessionTypeColor = (type) => {
    switch (type) {
      case 'CLASS': return 'bg-blue-500'
      case 'EXAM': return 'bg-red-500'
      case 'REVIEW': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getSessionTypeBgColor = (type) => {
    switch (type) {
      case 'CLASS': return 'bg-blue-50 border-blue-200'
      case 'EXAM': return 'bg-red-50 border-red-200'
      case 'REVIEW': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  // Session handlers
  const handleDateClick = (date) => {
    if (!date) return
    setSelectedDate(date)
    const existingSessions = getSessionsForDate(date)
    if (existingSessions.length === 0) {
      // Open modal to create new session
      setEditingSession(null)
      setSessionForm({
        type: 'CLASS',
        title: '',
        startTime: '19:00',
        endTime: '21:00',
        meetingLink: '',
        notes: ''
      })
      setShowSessionModal(true)
    }
  }

  const handleEditSession = (session) => {
    setEditingSession(session)
    setSelectedDate(new Date(session.date))
    setSessionForm({
      type: session.type,
      title: session.title || '',
      startTime: session.startTime,
      endTime: session.endTime || '',
      meetingLink: session.meetingLink || '',
      notes: session.notes || ''
    })
    setShowSessionModal(true)
  }

  const handleSaveSession = async () => {
    if (!selectedDate) return
    setSessionSaving(true)
    try {
      if (editingSession) {
        // Update existing session
        const updated = await updateSession(editingSession.id, {
          date: formatDate(selectedDate),
          ...sessionForm
        })
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        // Create new session
        const created = await createSession({
          courseId: id,
          date: formatDate(selectedDate),
          ...sessionForm
        })
        setSessions(prev => [...prev, created])
      }
      setShowSessionModal(false)
      setEditingSession(null)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save session')
    } finally {
      setSessionSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    try {
      await deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      setShowSessionModal(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete session')
    }
  }

  const handleCopySession = (session) => {
    setCopiedSession({
      type: session.type,
      title: session.title,
      startTime: session.startTime,
      endTime: session.endTime,
      meetingLink: session.meetingLink,
      notes: session.notes
    })
  }

  const handlePasteSession = (date) => {
    if (!copiedSession) return
    setSelectedDate(date)
    setEditingSession(null)
    setSessionForm(copiedSession)
    setShowSessionModal(true)
  }

  // Material handlers
  const handleAddMaterial = (sessionId) => {
    setMaterialSessionId(sessionId)
    setMaterialForm({ name: '', driveUrl: '' })
    setShowMaterialModal(true)
  }

  const handleSaveMaterial = async () => {
    if (!materialForm.name || !materialForm.driveUrl) {
      alert('Please fill in all fields')
      return
    }
    setMaterialSaving(true)
    try {
      const material = await addMaterial(materialSessionId, materialForm)
      setSessions(prev => prev.map(s => {
        if (s.id === materialSessionId) {
          return { ...s, materials: [...(s.materials || []), material] }
        }
        return s
      }))
      setShowMaterialModal(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add material')
    } finally {
      setMaterialSaving(false)
    }
  }

  const handleDeleteMaterial = async (sessionId, materialId) => {
    if (!confirm('Delete this material?')) return
    try {
      await deleteMaterial(materialId)
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, materials: s.materials.filter(m => m.id !== materialId) }
        }
        return s
      }))
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete material')
    }
  }

  const menuItems = [
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar, liveOnly: true },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Course not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#1e3a5f] text-white transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-white/10">
          <Link to="/teacher" className="flex items-center gap-2 text-blue-200 hover:text-white transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-lg truncate">{course.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              course.type === 'LIVE' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {course.type === 'LIVE' ? <><Radio className="w-3 h-3 inline mr-1" />Live</> : <><Video className="w-3 h-3 inline mr-1" />Recorded</>}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              course.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
            }`}>
              {course.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            // Hide schedule tab for recorded courses
            if (item.liveOnly && course.type !== 'LIVE') return null
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  activeTab === item.id
                    ? 'bg-white/10 text-white'
                    : 'text-blue-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === 'content' && 'Course Content'}
              {activeTab === 'schedule' && 'Schedule'}
              {activeTab === 'students' && 'Enrolled Students'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Manage your course modules and lessons</p>
                <Link
                  to={`/teacher/courses/${id}/modules/create`}
                  className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </Link>
              </div>

              {course.modules?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                  <p className="text-gray-500 mb-4">Start building your course by adding modules</p>
                  <Link
                    to={`/teacher/courses/${id}/modules/create`}
                    className="inline-flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-6 py-3 rounded-lg font-medium transition"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Module
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-[#1e3a5f] text-white rounded-lg flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{module.name}</span>
                          <span className="text-sm text-gray-500">({module.lessons?.length || 0} lessons)</span>
                        </div>
                        {expandedModules[module.id] ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {expandedModules[module.id] && (
                        <div className="border-t">
                          {module.lessons?.length === 0 ? (
                            <div className="p-4 text-center">
                              <p className="text-gray-500 text-sm mb-3">No lessons in this module</p>
                              <Link
                                to={`/teacher/courses/${id}/modules/${module.id}/lessons/create`}
                                className="text-[#f7941d] hover:underline text-sm font-medium"
                              >
                                + Add Lesson
                              </Link>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <Play className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{lesson.name}</span>
                                  </div>
                                  {lesson.videoUrl && (
                                    <a 
                                      href={lesson.videoUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-[#1e3a5f] hover:underline"
                                    >
                                      View Video
                                    </a>
                                  )}
                                </div>
                              ))}
                              <div className="p-4">
                                <Link
                                  to={`/teacher/courses/${id}/modules/${module.id}/lessons/create`}
                                  className="text-[#f7941d] hover:underline text-sm font-medium"
                                >
                                  + Add Lesson
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex items-center gap-2">
                    {copiedSession && (
                      <div className="relative group">
                        <span className="text-sm text-green-600 flex items-center gap-1 cursor-help">
                          <Clipboard className="w-4 h-4" />
                          Session copied
                          <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">i</span>
                        </span>
                        {/* Tooltip */}
                        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                          <p className="font-semibold mb-1">How to paste:</p>
                          <p className="text-gray-300">Right-click on any empty date to paste this session with the same time, type, and meeting link.</p>
                          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const dateSessions = date ? getSessionsForDate(date) : []
                    const isToday = date && formatDate(date) === formatDate(new Date())
                    const isSelected = date && selectedDate && formatDate(date) === formatDate(selectedDate)
                    
                    return (
                      <div
                        key={index}
                        onClick={() => date && handleDateClick(date)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          if (date && copiedSession) handlePasteSession(date)
                        }}
                        className={`min-h-[80px] p-1 border rounded-lg cursor-pointer transition ${
                          !date ? 'bg-gray-50 cursor-default' :
                          isSelected ? 'border-[#1e3a5f] bg-blue-50' :
                          isToday ? 'border-[#f7941d] bg-orange-50' :
                          'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#f7941d]' : 'text-gray-700'}`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dateSessions.slice(0, 2).map(session => (
                                <div
                                  key={session.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditSession(session)
                                  }}
                                  className={`text-xs px-1 py-0.5 rounded truncate ${getSessionTypeColor(session.type)} text-white`}
                                >
                                  {session.startTime}
                                </div>
                              ))}
                              {dateSessions.length > 2 && (
                                <div className="text-xs text-gray-500">+{dateSessions.length - 2} more</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">Legend:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Class</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-sm text-gray-600">Exam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span className="text-sm text-gray-600">Review</span>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedDate 
                    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    : 'Select a date'}
                </h3>
                
                {selectedDate ? (
                  <>
                    {getSessionsForDate(selectedDate).length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-3">No sessions scheduled</p>
                        <button
                          onClick={() => {
                            setEditingSession(null)
                            setSessionForm({
                              type: 'CLASS',
                              title: '',
                              startTime: '19:00',
                              endTime: '21:00',
                              meetingLink: '',
                              notes: ''
                            })
                            setShowSessionModal(true)
                          }}
                          className="text-[#f7941d] hover:underline font-medium"
                        >
                          + Add Session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getSessionsForDate(selectedDate).map(session => (
                          <div key={session.id} className={`border rounded-lg p-3 ${getSessionTypeBgColor(session.type)}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getSessionTypeColor(session.type)} text-white`}>
                                  {session.type}
                                </span>
                                {session.title && (
                                  <p className="font-medium text-gray-900 mt-1">{session.title}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopySession(session)}
                                  className="p-1 hover:bg-white/50 rounded"
                                  title="Copy session"
                                >
                                  <Copy className="w-4 h-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => handleEditSession(session)}
                                  className="p-1 hover:bg-white/50 rounded"
                                  title="Edit session"
                                >
                                  <Edit3 className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Clock className="w-4 h-4" />
                              {session.startTime}{session.endTime && ` - ${session.endTime}`}
                            </div>
                            
                            {session.meetingLink && (
                              <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                                <LinkIcon className="w-4 h-4" />
                                <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                                  Meeting Link
                                </a>
                              </div>
                            )}
                            
                            {session.notes && (
                              <p className="text-sm text-gray-600 mb-2">{session.notes}</p>
                            )}
                            
                            {/* Materials */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Materials</span>
                                <button
                                  onClick={() => handleAddMaterial(session.id)}
                                  className="text-xs text-[#f7941d] hover:underline"
                                >
                                  + Add
                                </button>
                              </div>
                              {session.materials?.length > 0 ? (
                                <div className="space-y-1">
                                  {session.materials.map(material => (
                                    <div key={material.id} className="flex items-center justify-between text-sm">
                                      <a
                                        href={material.driveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-gray-600 hover:text-[#1e3a5f]"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {material.name}
                                      </a>
                                      <button
                                        onClick={() => handleDeleteMaterial(session.id, material.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400">No materials</p>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            setEditingSession(null)
                            setSessionForm({
                              type: 'CLASS',
                              title: '',
                              startTime: '19:00',
                              endTime: '21:00',
                              meetingLink: '',
                              notes: ''
                            })
                            setShowSessionModal(true)
                          }}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition"
                        >
                          + Add Another Session
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Click on a date to view or add sessions</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Manage enrolled students</p>
                <Link
                  to={`/teacher/courses/${id}/students`}
                  className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Enroll Students
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                {course.enrollments?.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                    <p className="text-gray-500 mb-4">Enroll students to give them access to this course</p>
                    <Link
                      to={`/teacher/courses/${id}/students`}
                      className="inline-flex items-center gap-2 text-[#f7941d] hover:underline font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Enroll Students
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">{course.enrollments.length} student(s) enrolled</p>
                    {/* TODO: List students */}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              {/* Course Status */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Status</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {course.isActive ? 'Course is Active' : 'Course is Inactive'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {course.isActive 
                        ? 'Students can see and enroll in this course' 
                        : 'Course is hidden from students'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleActive}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      course.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {course.isActive ? (
                      <><ToggleRight className="w-5 h-5" /> Deactivate</>
                    ) : (
                      <><ToggleLeft className="w-5 h-5" /> Activate</>
                    )}
                  </button>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Course Details</h3>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 text-[#1e3a5f] hover:underline font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditing(false)
                          setEditName(course.name)
                          setEditDescription(course.description || '')
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{course.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-900">{course.description || 'No description'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium text-gray-900">{course.type === 'LIVE' ? 'Live Class' : 'Recorded Video'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Delete Course</p>
                    <p className="text-sm text-gray-500">Permanently delete this course and all its content</p>
                  </div>
                  <button
                    onClick={handleDeleteCourse}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                <div className="flex gap-2">
                  {['CLASS', 'EXAM', 'REVIEW'].map(type => (
                    <button
                      key={type}
                      onClick={() => setSessionForm(prev => ({ ...prev, type }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        sessionForm.type === type
                          ? type === 'CLASS' ? 'bg-blue-500 text-white' :
                            type === 'EXAM' ? 'bg-red-500 text-white' :
                            'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Chapter 5 Discussion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={sessionForm.meetingLink}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Instructions or notes for students..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-between">
              <div>
                {editingSession && (
                  <button
                    onClick={() => handleDeleteSession(editingSession.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete Session
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSession}
                  disabled={sessionSaving}
                  className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {sessionSaving ? 'Saving...' : editingSession ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Material</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Chapter 5 Notes.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Link *</label>
                <input
                  type="url"
                  value={materialForm.driveUrl}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, driveUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use "Get Link" in Google Drive and set sharing to "Anyone with the link can view"
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowMaterialModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMaterial}
                disabled={materialSaving}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {materialSaving ? 'Adding...' : 'Add Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
