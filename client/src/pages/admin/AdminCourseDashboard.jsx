import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, BookOpen, Calendar, Users, Settings, Menu, 
  Plus, Video, Radio, ChevronDown, ChevronRight, Play,
  ToggleLeft, ToggleRight, Trash2, Edit3, Save, X,
  ChevronLeft, Clock, Link as LinkIcon, FileText, Copy, 
  GripVertical, CheckSquare, AlertTriangle, Folder, Award, User
} from 'lucide-react'
import { 
  getAdminCourse, updateAdminCourse, toggleAdminCourseActive, deleteAdminCourse, getTeachers,
  createCourseModule, updateCourseModule, deleteCourseModule, reorderCourseModules,
  createCourseLesson, updateCourseLesson, deleteCourseLesson, reorderCourseLessons,
  getCourseSessions, createCourseSession, updateCourseSession, deleteCourseSession,
  addCourseSessionMaterial, deleteCourseSessionMaterial,
  getCourseAttendance, updateCourseAttendance,
  getCourseStudents, enrollCourseStudent, removeCourseStudent
} from '../../api/adminCourses'
import { 
  getCourseExams, createCourseExam, updateCourseExam, deleteCourseExam,
  getCourseGrades
} from '../../api/adminCourseExams'
import { useToast, ConfirmModal } from '../../components/Toast'

export default function AdminCourseDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('class')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Module/Lesson state
  const [expandedModules, setExpandedModules] = useState({})
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [moduleForm, setModuleForm] = useState({ name: '' })
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonForm, setLessonForm] = useState({ name: '', description: '', materials: '', videoUrl: '' })
  const [selectedModuleId, setSelectedModuleId] = useState(null)
  
  // Exam state
  const [exams, setExams] = useState([])
  const [showExamModal, setShowExamModal] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [examForm, setExamForm] = useState({ title: '', description: '', totalPoints: 100 })
  
  // Session state
  const [sessions, setSessions] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [sessionForm, setSessionForm] = useState({
    type: 'CLASS',
    lessonId: '',
    examId: '',
    startTime: '19:00',
    endTime: '21:00',
    meetingLink: '',
    notes: ''
  })
  
  // Students state
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  
  // Settings state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [teachers, setTeachers] = useState([])
  
  // Attendance state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceSession, setAttendanceSession] = useState(null)
  const [attendanceList, setAttendanceList] = useState([])
  
  // Confirm modals
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState(null)
  const [deleteLessonConfirm, setDeleteLessonConfirm] = useState(null)
  const [deleteExamConfirm, setDeleteExamConfirm] = useState(null)
  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState(null)
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false)
  
  // Loading states
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCourse()
    fetchTeachers()
  }, [id])

  useEffect(() => {
    if (course?.type === 'LIVE') {
      fetchSessions()
    }
  }, [course?.id])

  useEffect(() => {
    if (activeTab === 'students' && course?.id) {
      fetchStudents()
    }
    if (activeTab === 'exam' && course?.id) {
      fetchExams()
    }
  }, [activeTab, course?.id])

  const fetchCourse = async () => {
    try {
      const data = await getAdminCourse(id)
      setCourse(data)
      setEditForm({
        name: data.name,
        description: data.description || '',
        type: data.type,
        teacherId: data.teacherId || '',
        price: data.price || 0,
        priceType: data.priceType || 'ONE_TIME',
        isActive: data.isActive
      })
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers()
      setTeachers(data)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const fetchSessions = async () => {
    if (!course?.id) return
    try {
      const data = await getCourseSessions(course.id)
      setSessions(data)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchExams = async () => {
    if (!course?.id) return
    try {
      const data = await getCourseExams(course.id)
      setExams(data)
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    }
  }

  const fetchStudents = async () => {
    if (!course?.id) return
    setLoadingStudents(true)
    try {
      const data = await getCourseStudents(course.id)
      setStudents(data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  // Module handlers
  const handleSaveModule = async () => {
    setSaving(true)
    try {
      if (editingModule) {
        await updateCourseModule(editingModule.id, moduleForm)
        toast.success('Module updated')
      } else {
        await createCourseModule(course.id, moduleForm)
        toast.success('Module created')
      }
      setShowModuleModal(false)
      setEditingModule(null)
      setModuleForm({ name: '' })
      fetchCourse()
    } catch (error) {
      toast.error('Failed to save module')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModule = async () => {
    try {
      await deleteCourseModule(deleteModuleConfirm)
      toast.success('Module deleted')
      setDeleteModuleConfirm(null)
      fetchCourse()
    } catch (error) {
      toast.error('Failed to delete module')
    }
  }

  // Lesson handlers
  const handleSaveLesson = async () => {
    setSaving(true)
    try {
      if (editingLesson) {
        await updateCourseLesson(editingLesson.id, lessonForm)
        toast.success('Lesson updated')
      } else {
        await createCourseLesson(selectedModuleId, lessonForm)
        toast.success('Lesson created')
      }
      setShowLessonModal(false)
      setEditingLesson(null)
      setLessonForm({ name: '', description: '', materials: '', videoUrl: '' })
      fetchCourse()
    } catch (error) {
      toast.error('Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLesson = async () => {
    try {
      await deleteCourseLesson(deleteLessonConfirm)
      toast.success('Lesson deleted')
      setDeleteLessonConfirm(null)
      fetchCourse()
    } catch (error) {
      toast.error('Failed to delete lesson')
    }
  }

  // Exam handlers
  const handleSaveExam = async () => {
    setSaving(true)
    try {
      if (editingExam) {
        await updateCourseExam(editingExam.id, examForm)
        toast.success('Exam updated')
      } else {
        await createCourseExam(course.id, examForm)
        toast.success('Exam created')
      }
      setShowExamModal(false)
      setEditingExam(null)
      setExamForm({ title: '', description: '', totalPoints: 100 })
      fetchExams()
    } catch (error) {
      toast.error('Failed to save exam')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExam = async () => {
    try {
      await deleteCourseExam(deleteExamConfirm)
      toast.success('Exam deleted')
      setDeleteExamConfirm(null)
      fetchExams()
    } catch (error) {
      toast.error('Failed to delete exam')
    }
  }

  // Session handlers
  const handleSaveSession = async () => {
    setSaving(true)
    try {
      const sessionData = {
        ...sessionForm,
        date: selectedDate
      }
      if (editingSession) {
        await updateCourseSession(editingSession.id, sessionData)
        toast.success('Session updated')
      } else {
        await createCourseSession(course.id, sessionData)
        toast.success('Session created')
      }
      setShowSessionModal(false)
      setEditingSession(null)
      setSessionForm({ type: 'CLASS', lessonId: '', examId: '', startTime: '19:00', endTime: '21:00', meetingLink: '', notes: '' })
      fetchSessions()
    } catch (error) {
      toast.error('Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async () => {
    try {
      await deleteCourseSession(deleteSessionConfirm)
      toast.success('Session deleted')
      setDeleteSessionConfirm(null)
      fetchSessions()
    } catch (error) {
      toast.error('Failed to delete session')
    }
  }

  // Settings handlers
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await updateAdminCourse(course.id, editForm)
      toast.success('Course updated')
      setEditing(false)
      fetchCourse()
    } catch (error) {
      toast.error('Failed to update course')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      await toggleAdminCourseActive(course.id)
      toast.success(course.isActive ? 'Course deactivated' : 'Course activated')
      fetchCourse()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to toggle status')
    }
  }

  const handleDeleteCourse = async () => {
    try {
      await deleteAdminCourse(course.id)
      toast.success('Course deleted')
      navigate('/admin')
    } catch (error) {
      toast.error('Failed to delete course')
    }
  }

  // Attendance handlers
  const openAttendance = async (session) => {
    setAttendanceSession(session)
    setShowAttendanceModal(true)
    try {
      const data = await getCourseAttendance(session.id)
      setAttendanceList(data)
    } catch (error) {
      toast.error('Failed to load attendance')
    }
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    try {
      await updateCourseAttendance(attendanceSession.id, attendanceList)
      toast.success('Attendance saved')
      setShowAttendanceModal(false)
    } catch (error) {
      toast.error('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const getSessionsForDate = (date) => {
    if (!date) return []
    return sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate.toDateString() === date.toDateString()
    })
  }

  const tabs = [
    { id: 'class', label: 'Content', icon: BookOpen },
    { id: 'exam', label: 'Exams', icon: Award },
    ...(course?.type === 'LIVE' ? [{ id: 'schedule', label: 'Schedule', icon: Calendar }] : []),
    { id: 'students', label: 'Students', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
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
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h2>
          <Link to="/admin" className="text-[#f7941d] hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a5f] text-white flex flex-col transition-all duration-300 fixed h-full z-40`}>
        <div className="p-4 border-b border-[#2d5a87]">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2 text-blue-200 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              {sidebarOpen && <span>Back</span>}
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-blue-200 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {sidebarOpen && (
          <div className="p-4 border-b border-[#2d5a87]">
            <h2 className="font-semibold text-lg truncate">{course.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                course.type === 'LIVE' ? 'bg-purple-500' : 'bg-blue-500'
              }`}>
                {course.type}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                course.isActive ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {course.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                activeTab === tab.id
                  ? 'bg-[#f7941d] text-white'
                  : 'text-blue-200 hover:bg-[#2d5a87]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <div className="p-6">
          {/* Content Tab */}
          {activeTab === 'class' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Course Content</h1>
                <button
                  onClick={() => { setShowModuleModal(true); setEditingModule(null); setModuleForm({ name: '' }) }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f]"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </button>
              </div>

              {course.modules?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                  <p className="text-gray-500 mb-4">Start by creating your first module</p>
                  <button
                    onClick={() => setShowModuleModal(true)}
                    className="text-[#f7941d] hover:underline"
                  >
                    + Add Module
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-[#1e3a5f] text-white rounded-lg flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => setExpandedModules(prev => ({ ...prev, [module.id]: !prev[module.id] }))}
                            className="flex items-center gap-2"
                          >
                            <span className="font-medium text-gray-900">{module.name}</span>
                            <span className="text-sm text-gray-500">({module.lessons?.length || 0} lessons)</span>
                            {expandedModules[module.id] ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingModule(module); setModuleForm({ name: module.name }); setShowModuleModal(true) }}
                            className="p-2 text-gray-400 hover:text-[#1e3a5f]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModuleConfirm(module.id)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {expandedModules[module.id] && (
                        <div className="border-t">
                          {module.lessons?.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between p-4 pl-16 hover:bg-gray-50 border-b last:border-b-0">
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
                                <div>
                                  <span className="text-gray-900">{lesson.name}</span>
                                  {lesson.description && (
                                    <p className="text-sm text-gray-500">{lesson.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.videoUrl && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Video</span>
                                )}
                                {lesson.materials && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Materials</span>
                                )}
                                <button
                                  onClick={() => { setEditingLesson(lesson); setLessonForm({ name: lesson.name, description: lesson.description || '', materials: lesson.materials || '', videoUrl: lesson.videoUrl || '' }); setShowLessonModal(true) }}
                                  className="p-2 text-gray-400 hover:text-[#1e3a5f]"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteLessonConfirm(lesson.id)}
                                  className="p-2 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="p-4 pl-16">
                            <button
                              onClick={() => { setSelectedModuleId(module.id); setEditingLesson(null); setLessonForm({ name: '', description: '', materials: '', videoUrl: '' }); setShowLessonModal(true) }}
                              className="text-[#f7941d] hover:underline text-sm"
                            >
                              + Add Lesson
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exam' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
                <button
                  onClick={() => { setShowExamModal(true); setEditingExam(null); setExamForm({ title: '', description: '', totalPoints: 100 }) }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f]"
                >
                  <Plus className="w-4 h-4" />
                  Create Exam
                </button>
              </div>

              {exams.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
                  <p className="text-gray-500 mb-4">Create your first exam</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.map((exam) => (
                    <div key={exam.id} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                          <p className="text-sm text-gray-500">{exam.questions?.length || 0} questions</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {exam.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/courses/${course.id}/exam/${exam.id}`}
                          className="flex-1 text-center py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87] text-sm"
                        >
                          Edit Questions
                        </Link>
                        <button
                          onClick={() => setDeleteExamConfirm(exam.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab (LIVE courses only) */}
          {activeTab === 'schedule' && course.type === 'LIVE' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-semibold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const daySessions = date ? getSessionsForDate(date) : []
                    const isToday = date?.toDateString() === new Date().toDateString()
                    
                    return (
                      <div
                        key={index}
                        onClick={() => date && setSelectedDate(date.toISOString().split('T')[0])}
                        className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition ${
                          date ? 'hover:bg-gray-50' : 'bg-gray-50'
                        } ${isToday ? 'border-[#f7941d]' : 'border-gray-200'}`}
                      >
                        {date && (
                          <>
                            <span className={`text-sm ${isToday ? 'font-bold text-[#f7941d]' : 'text-gray-700'}`}>
                              {date.getDate()}
                            </span>
                            {daySessions.map(session => (
                              <div
                                key={session.id}
                                className={`mt-1 text-xs p-1 rounded truncate ${
                                  session.type === 'EXAM' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {session.startTime} - {session.type}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Add Session Button */}
                {selectedDate && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        <p className="text-sm text-gray-500">{getSessionsForDate(new Date(selectedDate)).length} sessions</p>
                      </div>
                      <button
                        onClick={() => { setShowSessionModal(true); setEditingSession(null) }}
                        className="px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f]"
                      >
                        Add Session
                      </button>
                    </div>
                    
                    {/* Sessions for selected date */}
                    <div className="mt-4 space-y-2">
                      {getSessionsForDate(new Date(selectedDate)).map(session => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              session.type === 'EXAM' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {session.type}
                            </span>
                            <span className="ml-2 text-sm">{session.startTime} - {session.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openAttendance(session)}
                              className="text-sm text-[#1e3a5f] hover:underline"
                            >
                              Attendance
                            </button>
                            <button
                              onClick={() => { setEditingSession(session); setSessionForm({ type: session.type, lessonId: session.lessonId || '', examId: session.examId || '', startTime: session.startTime, endTime: session.endTime, meetingLink: session.meetingLink || '', notes: session.notes || '' }); setShowSessionModal(true) }}
                              className="p-1 text-gray-400 hover:text-[#1e3a5f]"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteSessionConfirm(session.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Enrolled Students</h1>
                <span className="text-gray-500">{students.length} students</span>
              </div>

              {loadingStudents ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                  <p className="text-gray-500">Students will appear here once they enroll</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Student</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Email</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Enrolled</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-medium">
                                {enrollment.student?.user?.profile?.firstName?.charAt(0) || 'S'}
                              </div>
                              <span className="font-medium text-gray-900">
                                {enrollment.student?.user?.profile ? `${enrollment.student.user.profile.firstName} ${enrollment.student.user.profile.lastName}` : 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {enrollment.student?.user?.email}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(enrollment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeCourseStudent(course.id, enrollment.student.id).then(() => { toast.success('Student removed'); fetchStudents() })}
                              className="text-red-500 hover:underline text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Course Settings</h1>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87]"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                {/* Course Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{course.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  {editing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{course.description || 'No description'}</p>
                  )}
                </div>

                {/* Assigned Teacher */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Teacher</label>
                  {editing ? (
                    <select
                      value={editForm.teacherId}
                      onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                    >
                      <option value="">-- No Teacher --</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.user?.profile ? `${teacher.user.profile.firstName} ${teacher.user.profile.lastName}` : teacher.user?.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {course.teacher?.user?.profile ? `${course.teacher.user.profile.firstName} ${course.teacher.user.profile.lastName}` : 'No teacher assigned'}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                    {editing ? (
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                      />
                    ) : (
                      <p className="text-gray-900">₱{course.price?.toLocaleString() || '0'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                    {editing ? (
                      <select
                        value={editForm.priceType}
                        onChange={(e) => setEditForm({ ...editForm, priceType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                      >
                        <option value="ONE_TIME">One-Time</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{course.priceType}</p>
                    )}
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Course Status</h3>
                      <p className="text-sm text-gray-500">
                        {course.isActive ? 'Course is visible to students' : 'Course is hidden from students'}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleActive}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        course.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        course.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Delete Course */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Deleting this course will remove all modules, lessons, exams, and student data.
                  </p>
                  <button
                    onClick={() => setShowDeleteCourseModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Course
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{editingModule ? 'Edit Module' : 'Add Module'}</h2>
            <input
              type="text"
              value={moduleForm.name}
              onChange={(e) => setModuleForm({ name: e.target.value })}
              placeholder="Module name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-[#1e3a5f] outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowModuleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModule}
                disabled={saving || !moduleForm.name}
                className="flex-1 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={lessonForm.name}
                onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                placeholder="Lesson name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
              <textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
              {course.type === 'RECORDED' && (
                <input
                  type="url"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="YouTube video URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                />
              )}
              <input
                type="url"
                value={lessonForm.materials}
                onChange={(e) => setLessonForm({ ...lessonForm, materials: e.target.value })}
                placeholder="Materials link (Google Drive)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowLessonModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={saving || !lessonForm.name}
                className="flex-1 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{editingExam ? 'Edit Exam' : 'Create Exam'}</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                placeholder="Exam title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
              <textarea
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowExamModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExam}
                disabled={saving || !examForm.title}
                className="flex-1 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{editingSession ? 'Edit Session' : 'Add Session'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={sessionForm.type}
                  onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                >
                  <option value="CLASS">Class</option>
                  <option value="EXAM">Exam</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                  />
                </div>
              </div>
              <input
                type="url"
                value={sessionForm.meetingLink}
                onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                placeholder="Meeting link (Zoom/Meet)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
              <textarea
                value={sessionForm.notes}
                onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Attendance</h2>
            <div className="max-h-96 overflow-y-auto">
              {attendanceList.map((student, index) => (
                <div key={student.studentId} className="flex items-center justify-between py-3 border-b">
                  <span>{student.name}</span>
                  <select
                    value={student.status}
                    onChange={(e) => {
                      const updated = [...attendanceList]
                      updated[index].status = e.target.value
                      setAttendanceList(updated)
                    }}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      student.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                      student.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                      student.status === 'EXCUSED' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!deleteModuleConfirm}
        title="Delete Module"
        message="Are you sure you want to delete this module? All lessons inside will also be deleted."
        onConfirm={handleDeleteModule}
        onCancel={() => setDeleteModuleConfirm(null)}
      />
      <ConfirmModal
        isOpen={!!deleteLessonConfirm}
        title="Delete Lesson"
        message="Are you sure you want to delete this lesson?"
        onConfirm={handleDeleteLesson}
        onCancel={() => setDeleteLessonConfirm(null)}
      />
      <ConfirmModal
        isOpen={!!deleteExamConfirm}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? All questions and student attempts will be lost."
        onConfirm={handleDeleteExam}
        onCancel={() => setDeleteExamConfirm(null)}
      />
      <ConfirmModal
        isOpen={!!deleteSessionConfirm}
        title="Delete Session"
        message="Are you sure you want to delete this session?"
        onConfirm={handleDeleteSession}
        onCancel={() => setDeleteSessionConfirm(null)}
      />
      <ConfirmModal
        isOpen={showDeleteCourseModal}
        title="Delete Course"
        message="Are you sure you want to delete this course? All data will be permanently lost."
        onConfirm={handleDeleteCourse}
        onCancel={() => setShowDeleteCourseModal(false)}
      />
    </div>
  )
}
