import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, BookOpen, Calendar, Users, Settings, Menu, 
  Plus, Video, Radio, ChevronDown, ChevronRight, Play,
  ToggleLeft, ToggleRight, Trash2, Edit3, Save, X,
  ChevronLeft, Clock, Link as LinkIcon, FileText, Copy, 
  GripVertical, CheckSquare, AlertTriangle, Folder, Award
} from 'lucide-react'
import { 
  getAdminProgram, updateAdminProgram, toggleAdminProgramActive, deleteAdminProgram,
  createProgramModule, updateProgramModule, deleteProgramModule, reorderProgramModules,
  createProgramLesson, updateProgramLesson, deleteProgramLesson, reorderProgramLessons,
  getProgramSessions, createProgramSession, updateProgramSession, deleteProgramSession,
  addProgramSessionMaterial, deleteProgramSessionMaterial,
  getProgramAttendance, updateProgramAttendance,
  getProgramStudents, enrollProgramStudent, removeProgramStudent
} from '../../api/adminPrograms'
import { 
  getProgramExams, createProgramExam, updateProgramExam, deleteProgramExam,
  getProgramGrades
} from '../../api/adminProgramExams'
import { useToast, ConfirmModal } from '../../components/Toast'

export default function AdminProgramDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [program, setProgram] = useState(null)
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
  const [grades, setGrades] = useState([])
  
  // Delete confirmations
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState(null)
  const [deleteLessonConfirm, setDeleteLessonConfirm] = useState(null)
  const [deleteExamConfirm, setDeleteExamConfirm] = useState(null)
  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState(null)
  
  // Settings state
  const [settingsForm, setSettingsForm] = useState({})
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    fetchProgram()
  }, [id])

  useEffect(() => {
    if (program) {
      fetchExams()
      fetchSessions()
      fetchStudents()
    }
  }, [program?.id])

  const fetchProgram = async () => {
    try {
      const data = await getAdminProgram(id)
      setProgram(data)
      setSettingsForm({
        name: data.name,
        description: data.description || '',
        programType: data.programType,
        price: data.price || 0,
        priceType: data.priceType || 'ONE_TIME',
        schedule: data.schedule || '',
        location: data.location || '',
        meetingLink: data.meetingLink || '',
        image: data.image || '',
        isActive: data.isActive
      })
      // Expand first module by default
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

  const fetchExams = async () => {
    try {
      const data = await getProgramExams(program.id)
      setExams(data)
    } catch (error) {
      console.error('Failed to fetch exams:', error)
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

  const fetchStudents = async () => {
    try {
      const data = await getProgramStudents(program.id)
      setStudents(data)
      // Also fetch grades
      const gradesData = await getProgramGrades(program.id)
      setGrades(gradesData)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  // Module handlers
  const handleSaveModule = async () => {
    try {
      if (editingModule) {
        await updateProgramModule(editingModule.id, moduleForm)
        toast.success('Module updated')
      } else {
        await createProgramModule(program.id, moduleForm)
        toast.success('Module created')
      }
      fetchProgram()
      setShowModuleModal(false)
      setEditingModule(null)
      setModuleForm({ name: '' })
    } catch (error) {
      toast.error('Failed to save module')
    }
  }

  const handleDeleteModule = async () => {
    try {
      await deleteProgramModule(deleteModuleConfirm)
      toast.success('Module deleted')
      fetchProgram()
    } catch (error) {
      toast.error('Failed to delete module')
    } finally {
      setDeleteModuleConfirm(null)
    }
  }

  // Lesson handlers
  const handleSaveLesson = async () => {
    try {
      if (editingLesson) {
        await updateProgramLesson(editingLesson.id, lessonForm)
        toast.success('Lesson updated')
      } else {
        await createProgramLesson(selectedModuleId, lessonForm)
        toast.success('Lesson created')
      }
      fetchProgram()
      setShowLessonModal(false)
      setEditingLesson(null)
      setLessonForm({ name: '', description: '', materials: '', videoUrl: '' })
    } catch (error) {
      toast.error('Failed to save lesson')
    }
  }

  const handleDeleteLesson = async () => {
    try {
      await deleteProgramLesson(deleteLessonConfirm)
      toast.success('Lesson deleted')
      fetchProgram()
    } catch (error) {
      toast.error('Failed to delete lesson')
    } finally {
      setDeleteLessonConfirm(null)
    }
  }

  // Exam handlers
  const handleSaveExam = async () => {
    try {
      if (editingExam) {
        await updateProgramExam(editingExam.id, examForm)
        toast.success('Exam updated')
      } else {
        await createProgramExam(program.id, examForm)
        toast.success('Exam created')
      }
      fetchExams()
      setShowExamModal(false)
      setEditingExam(null)
      setExamForm({ title: '', description: '', totalPoints: 100 })
    } catch (error) {
      toast.error('Failed to save exam')
    }
  }

  const handleDeleteExam = async () => {
    try {
      await deleteProgramExam(deleteExamConfirm)
      toast.success('Exam deleted')
      fetchExams()
    } catch (error) {
      toast.error('Failed to delete exam')
    } finally {
      setDeleteExamConfirm(null)
    }
  }

  // Session handlers
  const handleSaveSession = async () => {
    if (!selectedDate) return
    try {
      const sessionData = {
        date: formatDate(selectedDate),
        ...sessionForm
      }
      if (editingSession) {
        await updateProgramSession(editingSession.id, sessionData)
        toast.success('Session updated')
      } else {
        await createProgramSession(program.id, sessionData)
        toast.success('Session created')
      }
      fetchSessions()
      setShowSessionModal(false)
      setEditingSession(null)
    } catch (error) {
      toast.error('Failed to save session')
    }
  }

  const handleDeleteSession = async () => {
    try {
      await deleteProgramSession(deleteSessionConfirm)
      toast.success('Session deleted')
      fetchSessions()
    } catch (error) {
      toast.error('Failed to delete session')
    } finally {
      setDeleteSessionConfirm(null)
      setShowSessionModal(false)
    }
  }

  // Settings handlers
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await updateAdminProgram(program.id, settingsForm)
      toast.success('Settings saved')
      fetchProgram()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // Helper functions
  const formatDate = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime12h = (time24) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    // Add empty cells for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    
    // Add all days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const getSessionsForDate = (date) => {
    if (!date) return []
    const dateStr = formatDate(date)
    return sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return formatDate(sessionDate) === dateStr
    })
  }

  const getAllLessons = () => {
    return program?.modules?.flatMap(m => 
      m.lessons?.map(l => ({ ...l, moduleName: m.name })) || []
    ) || []
  }

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
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
          <button onClick={() => navigate('/admin')} className="mt-4 text-[#f7941d] hover:underline">
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
          <Link to="/admin" className="flex items-center gap-2 text-blue-200 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="mb-6">
            <h2 className="text-lg font-bold truncate">{program.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${program.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
              {program.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'class', icon: BookOpen, label: 'Content' },
              { id: 'exam', icon: FileText, label: 'Exams' },
              { id: 'schedule', icon: Calendar, label: 'Schedule' },
              { id: 'students', icon: Users, label: 'Students' },
              { id: 'settings', icon: Settings, label: 'Settings' }
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
              {activeTab === 'class' && 'Program Content'}
              {activeTab === 'exam' && 'Exam Templates'}
              {activeTab === 'schedule' && 'Schedule'}
              {activeTab === 'students' && 'Enrolled Students'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
        </div>

        <div className="p-6">
          {/* Content Tab */}
          {activeTab === 'class' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Organize your program content into modules and lessons</p>
                <button
                  onClick={() => { setEditingModule(null); setModuleForm({ name: '' }); setShowModuleModal(true) }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87]"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </button>
              </div>

              {program.modules?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                  <p className="text-gray-500 mb-4">Create your first module to start adding content</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {program.modules?.map((module, idx) => (
                    <div key={module.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedModules[module.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          <span className="font-semibold text-gray-900">Module {idx + 1}: {module.name}</span>
                          <span className="text-sm text-gray-500">({module.lessons?.length || 0} lessons)</span>
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelectedModuleId(module.id); setEditingLesson(null); setLessonForm({ name: '', description: '', materials: '', videoUrl: '' }); setShowLessonModal(true) }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Add Lesson"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingModule(module); setModuleForm({ name: module.name }); setShowModuleModal(true) }}
                            className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModuleConfirm(module.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {expandedModules[module.id] && (
                        <div className="border-t divide-y">
                          {module.lessons?.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No lessons yet. Click + to add one.
                            </div>
                          ) : (
                            module.lessons?.map(lesson => (
                              <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
                                  <div>
                                    <span className="text-gray-900 font-medium">{lesson.name}</span>
                                    {lesson.description && <p className="text-sm text-gray-500">{lesson.description}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lesson.materials && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Materials</span>}
                                  {lesson.videoUrl && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Video</span>}
                                  <button
                                    onClick={() => { setEditingLesson(lesson); setLessonForm({ name: lesson.name, description: lesson.description || '', materials: lesson.materials || '', videoUrl: lesson.videoUrl || '' }); setShowLessonModal(true) }}
                                    className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteLessonConfirm(lesson.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exam Tab */}
          {activeTab === 'exam' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Create exams to grade your students</p>
                <button
                  onClick={() => { setEditingExam(null); setExamForm({ title: '', description: '', totalPoints: 100 }); setShowExamModal(true) }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87]"
                >
                  <Plus className="w-4 h-4" />
                  Add Exam
                </button>
              </div>

              {exams.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
                  <p className="text-gray-500">Create your first exam to start grading</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">#</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Exam Title</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Description</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Total Points</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {exams.map((exam, index) => (
                        <tr key={exam.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{exam.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{exam.description || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{exam.totalPoints} pts</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {exam.isPublished ? (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Published</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">Draft</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/admin/programs/${id}/exam/${exam.id}`)}
                                className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg"
                              >
                                Questions
                              </button>
                              <button
                                onClick={() => { setEditingExam(exam); setExamForm({ title: exam.title, description: exam.description || '', totalPoints: exam.totalPoints }); setShowExamModal(true) }}
                                className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteExamConfirm(exam.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Today</button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const dateSessions = date ? getSessionsForDate(date) : []
                    const isToday = date && formatDate(date) === formatDate(new Date())
                    const isSelected = date && selectedDate && formatDate(date) === formatDate(selectedDate)
                    
                    return (
                      <div
                        key={index}
                        onClick={() => date && setSelectedDate(date)}
                        className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition ${
                          !date ? 'bg-gray-50' :
                          isSelected ? 'border-[#f7941d] bg-orange-50' :
                          isToday ? 'border-blue-500 bg-blue-50' :
                          'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                              {date.getDate()}
                            </div>
                            {dateSessions.slice(0, 2).map(session => (
                              <div key={session.id} className={`text-xs px-1 py-0.5 rounded mt-1 truncate ${
                                session.type === 'EXAM' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {formatTime12h(session.startTime)}
                              </div>
                            ))}
                            {dateSessions.length > 2 && (
                              <div className="text-xs text-gray-500">+{dateSessions.length - 2} more</div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sessions List */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate ? formatDate(selectedDate) : 'Select a date'}
                </h3>
                
                {selectedDate && (
                  <>
                    {getSessionsForDate(selectedDate).length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-3">No sessions scheduled</p>
                        <button
                          onClick={() => { setEditingSession(null); setShowSessionModal(true) }}
                          className="text-[#f7941d] hover:underline"
                        >
                          + Add Session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getSessionsForDate(selectedDate).map(session => (
                          <div key={session.id} className={`border rounded-lg p-3 ${session.type === 'EXAM' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded ${session.type === 'EXAM' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                                  {session.type}
                                </span>
                                <p className="font-medium mt-1">{session.lesson?.name || session.exam?.title || 'Session'}</p>
                                <p className="text-sm text-gray-600">{formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => { setEditingSession(session); setSessionForm({ type: session.type, lessonId: session.lessonId || '', examId: session.examId || '', startTime: session.startTime, endTime: session.endTime, meetingLink: session.meetingLink || '', notes: session.notes || '' }); setShowSessionModal(true) }} className="p-1 hover:bg-white rounded">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteSessionConfirm(session.id)} className="p-1 hover:bg-white rounded text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => { setEditingSession(null); setShowSessionModal(true) }}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#f7941d] hover:text-[#f7941d]"
                        >
                          + Add Another Session
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Enrolled Students ({students.length})</h3>
                
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Student</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Enrolled</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Grade</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {students.map(enrollment => {
                          const studentGrade = grades.find(g => g.odId === enrollment.studentId)
                          return (
                            <tr key={enrollment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium">{enrollment.student?.user?.profile?.fullName || 'Unknown'}</div>
                                <div className="text-sm text-gray-500">{enrollment.student?.user?.email}</div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-500">
                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {studentGrade?.percentage !== null ? (
                                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    studentGrade.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {Math.round(studentGrade.percentage)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                  enrollment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {enrollment.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                  <input
                    type="text"
                    value={settingsForm.name || ''}
                    onChange={e => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={settingsForm.description || ''}
                    onChange={e => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                    <select
                      value={settingsForm.programType || 'ONLINE'}
                      onChange={e => setSettingsForm(prev => ({ ...prev, programType: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                    >
                      <option value="ONLINE">Online</option>
                      <option value="WEBINAR">Webinar</option>
                      <option value="IN_PERSON">In-Person</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="EVENT">Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={settingsForm.isActive ? 'active' : 'inactive'}
                      onChange={e => setSettingsForm(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <input
                    type="text"
                    value={settingsForm.schedule || ''}
                    onChange={e => setSettingsForm(prev => ({ ...prev, schedule: e.target.value }))}
                    placeholder="e.g., Every Tuesday, 7:00 PM"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (for in-person)</label>
                  <input
                    type="text"
                    value={settingsForm.location || ''}
                    onChange={e => setSettingsForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (for webinars)</label>
                  <input
                    type="url"
                    value={settingsForm.meetingLink || ''}
                    onChange={e => setSettingsForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87] disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editingModule ? 'Edit Module' : 'Add Module'}</h3>
            <input
              type="text"
              value={moduleForm.name}
              onChange={e => setModuleForm({ name: e.target.value })}
              placeholder="Module name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModuleModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSaveModule} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg">{editingModule ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={lessonForm.name}
                onChange={e => setLessonForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Lesson name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                value={lessonForm.description}
                onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="url"
                value={lessonForm.videoUrl}
                onChange={e => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="Video URL (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                value={lessonForm.materials}
                onChange={e => setLessonForm(prev => ({ ...prev, materials: e.target.value }))}
                placeholder="Materials link (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowLessonModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSaveLesson} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg">{editingLesson ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editingExam ? 'Edit Exam' : 'Add Exam'}</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={examForm.title}
                onChange={e => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Exam title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                value={examForm.description}
                onChange={e => setExamForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={examForm.totalPoints}
                onChange={e => setExamForm(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 100 }))}
                placeholder="Total points"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowExamModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSaveExam} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg">{editingExam ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">{editingSession ? 'Edit Session' : 'Add Session'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Session Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSessionForm(prev => ({ ...prev, type: 'CLASS', examId: '' }))}
                    className={`flex-1 py-2 rounded-lg ${sessionForm.type === 'CLASS' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100'}`}
                  >
                    CLASS
                  </button>
                  <button
                    onClick={() => setSessionForm(prev => ({ ...prev, type: 'EXAM', lessonId: '' }))}
                    className={`flex-1 py-2 rounded-lg ${sessionForm.type === 'EXAM' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                  >
                    EXAM
                  </button>
                </div>
              </div>

              {sessionForm.type === 'CLASS' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Lesson (optional)</label>
                  <select
                    value={sessionForm.lessonId}
                    onChange={e => setSessionForm(prev => ({ ...prev, lessonId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select a lesson...</option>
                    {getAllLessons().map(lesson => (
                      <option key={lesson.id} value={lesson.id}>{lesson.moduleName} → {lesson.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {sessionForm.type === 'EXAM' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Exam</label>
                  <select
                    value={sessionForm.examId}
                    onChange={e => setSessionForm(prev => ({ ...prev, examId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select an exam...</option>
                    {exams.filter(e => e.isPublished).map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.title} ({exam.totalPoints} pts)</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={e => setSessionForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={e => setSessionForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={sessionForm.meetingLink}
                  onChange={e => setSessionForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={sessionForm.notes}
                  onChange={e => setSessionForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowSessionModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSaveSession} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg">{editingSession ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmations */}
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
    </div>
  )
}
