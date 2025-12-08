import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, BookOpen, Calendar, Users, Settings, Menu, 
  Plus, Video, Radio, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Trash2, Edit3, Save, X,
  ChevronLeft, Clock, Link as LinkIcon, FileText, Copy, Clipboard,
  GripVertical, CheckSquare, AlertTriangle
} from 'lucide-react'
import { 
  getAdminCourse, updateAdminCourse, toggleAdminCourseActive, deleteAdminCourse, getTeachers,
  createCourseModule, updateCourseModule, deleteCourseModule, reorderCourseModules,
  createCourseLesson, updateCourseLesson, deleteCourseLesson, reorderCourseLessons,
  getCourseSessions, createCourseSession, updateCourseSession, deleteCourseSession,
  addCourseSessionMaterial, deleteCourseSessionMaterial,
  getCourseAttendance, updateCourseAttendance,
  getCourseStudents, removeCourseStudent
} from '../../api/adminCourses'
import { 
  getCourseExams, createCourseExam, updateCourseExam, deleteCourseExam,
  saveCourseExamScores
} from '../../api/adminCourseExams'
import { useToast, ConfirmModal } from '../../components/Toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Lesson Component
function SortableLesson({ lesson, onEdit, onDelete, courseType }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 touch-none">
          <GripVertical className="w-4 h-4" />
        </button>
        <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
        <div>
          <span className="text-gray-900 font-medium">{lesson.name}</span>
          {lesson.description && (
            <p className="text-sm text-gray-500 mt-0.5">{lesson.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {lesson.materials && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Materials</span>
        )}
        {courseType === 'RECORDED' && lesson.videoUrl && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Video</span>
        )}
        <button
          onClick={() => onEdit(lesson)}
          className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded transition opacity-0 group-hover:opacity-100"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(lesson.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Sortable Module Component
function SortableModule({ module, index, expanded, onToggle, onEdit, onDelete, onAddLesson, onEditLesson, onDeleteLesson, onLessonDragEnd, sensors, courseType }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition group">
        <div className="flex items-center gap-3 flex-1">
          <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 touch-none">
            <GripVertical className="w-5 h-5" />
          </button>
          <span className="w-8 h-8 bg-[#1e3a5f] text-white rounded-lg flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
          <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
            <span className="font-medium text-gray-900">{module.name}</span>
            <span className="text-sm text-gray-500">({module.lessons?.length || 0} lessons)</span>
            {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded transition opacity-0 group-hover:opacity-100">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t bg-gray-50">
          {module.lessons?.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd}>
              <SortableContext items={module.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y">
                  {module.lessons.map((lesson) => (
                    <SortableLesson key={lesson.id} lesson={lesson} onEdit={onEditLesson} onDelete={onDeleteLesson} courseType={courseType} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">No lessons yet</div>
          )}
          <div className="p-3 border-t">
            <button onClick={onAddLesson} className="text-[#f7941d] hover:underline text-sm font-medium">+ Add Lesson</button>
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [loadingExams, setLoadingExams] = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [examForm, setExamForm] = useState({ title: '', description: '', totalPoints: 100 })
  const [examSaving, setExamSaving] = useState(false)
  const [deletingExam, setDeletingExam] = useState(false)
  
  // Score entry state
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [scoringExam, setScoringExam] = useState(null)
  const [scoreEntries, setScoreEntries] = useState([])
  const [scoreSaving, setScoreSaving] = useState(false)
  
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
  const [sessionSaving, setSessionSaving] = useState(false)
  const [deletingSession, setDeletingSession] = useState(false)
  const [copiedSession, setCopiedSession] = useState(null)
  
  // Material state
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialSessionId, setMaterialSessionId] = useState(null)
  const [materialForm, setMaterialForm] = useState({ name: '', driveUrl: '' })
  const [materialSaving, setMaterialSaving] = useState(false)
  
  // Students state
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [removingStudent, setRemovingStudent] = useState(false)
  
  // Settings state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editEnrollmentEnd, setEditEnrollmentEnd] = useState('')
  const [editTeacherId, setEditTeacherId] = useState('')
  const [editPrice, setEditPrice] = useState(0)
  const [editPriceType, setEditPriceType] = useState('ONE_TIME')
  const [teachers, setTeachers] = useState([])
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Attendance state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceSession, setAttendanceSession] = useState(null)
  const [attendanceList, setAttendanceList] = useState([])
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  
  // Confirm modals
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState(null)
  const [deleteLessonConfirm, setDeleteLessonConfirm] = useState(null)
  const [deleteExamConfirm, setDeleteExamConfirm] = useState(null)
  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState(null)
  const [deleteMaterialConfirm, setDeleteMaterialConfirm] = useState(null)
  const [removeStudentConfirm, setRemoveStudentConfirm] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Loading states
  const [saving, setSaving] = useState(false)
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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
      // Initialize edit form values
      setEditName(data.name)
      setEditDescription(data.description || '')
      setEditStartDate(data.startDate ? data.startDate.split('T')[0] : '')
      setEditEndDate(data.endDate ? data.endDate.split('T')[0] : '')
      setEditEnrollmentEnd(data.enrollmentEnd ? data.enrollmentEnd.split('T')[0] : '')
      setEditTeacherId(data.teacherId || '')
      setEditPrice(data.price || 0)
      setEditPriceType(data.priceType || 'ONE_TIME')
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
    setLoadingExams(true)
    try {
      const data = await getCourseExams(course.id)
      setExams(data)
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoadingExams(false)
    }
  }

  const fetchStudents = async () => {
    if (!course?.id) return
    setLoadingStudents(true)
    try {
      const data = await getCourseStudents(course.id)
      setEnrolledStudents(data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  // Module handlers
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const openEditModule = (module) => {
    setEditingModule(module)
    setModuleForm({ name: module.name })
    setShowModuleModal(true)
  }

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

  const handleModuleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = course.modules.findIndex(m => m.id === active.id)
    const newIndex = course.modules.findIndex(m => m.id === over.id)
    const newModules = arrayMove(course.modules, oldIndex, newIndex)
    setCourse(prev => ({ ...prev, modules: newModules }))
    try {
      await reorderCourseModules(course.id, newModules.map(m => m.id))
    } catch (error) {
      toast.error('Failed to reorder modules')
      fetchCourse()
    }
  }

  // Lesson handlers
  const openEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setLessonForm({ name: lesson.name, description: lesson.description || '', materials: lesson.materials || '', videoUrl: lesson.videoUrl || '' })
    setShowLessonModal(true)
  }

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

  const handleLessonDragEnd = async (moduleId, event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const module = course.modules.find(m => m.id === moduleId)
    if (!module) return
    const oldIndex = module.lessons.findIndex(l => l.id === active.id)
    const newIndex = module.lessons.findIndex(l => l.id === over.id)
    const newLessons = arrayMove(module.lessons, oldIndex, newIndex)
    setCourse(prev => ({ ...prev, modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: newLessons } : m) }))
    try {
      await reorderCourseLessons(moduleId, newLessons.map(l => l.id))
    } catch (error) {
      toast.error('Failed to reorder lessons')
      fetchCourse()
    }
  }

  // Exam handlers
  const handleOpenExamModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam)
      setExamForm({ title: exam.title, description: exam.description || '', totalPoints: exam.totalPoints })
    } else {
      setEditingExam(null)
      setExamForm({ title: '', description: '', totalPoints: 100 })
    }
    setShowExamModal(true)
  }

  const handleSaveExam = async () => {
    setExamSaving(true)
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
      fetchExams()
    } catch (error) {
      toast.error('Failed to save exam')
    } finally {
      setExamSaving(false)
    }
  }

  const handleDeleteExam = async () => {
    setDeletingExam(true)
    try {
      await deleteCourseExam(deleteExamConfirm)
      toast.success('Exam deleted')
      setDeleteExamConfirm(null)
      fetchExams()
    } catch (error) {
      toast.error('Failed to delete exam')
    } finally {
      setDeletingExam(false)
    }
  }

  // Score entry handlers
  const handleOpenScoreModal = (exam) => {
    setScoringExam(exam)
    const entries = enrolledStudents.map(enrollment => {
      const existingScore = exam.scores?.find(s => s.studentId === enrollment.student?.id)
      const profile = enrollment.student?.user?.profile
      return {
        studentId: enrollment.student?.id,
        studentName: profile ? `${profile.firstName} ${profile.lastName}` : enrollment.student?.user?.email,
        email: enrollment.student?.user?.email,
        score: existingScore?.score ?? '',
        notes: existingScore?.notes || ''
      }
    })
    setScoreEntries(entries)
    setShowScoreModal(true)
  }

  const handleScoreChange = (studentId, value) => {
    setScoreEntries(prev => prev.map(entry => entry.studentId === studentId ? { ...entry, score: value } : entry))
  }

  const handleSaveScores = async () => {
    setScoreSaving(true)
    try {
      const scores = scoreEntries.filter(e => e.score !== '').map(e => ({ studentId: e.studentId, score: parseFloat(e.score), notes: e.notes }))
      await saveCourseExamScores(scoringExam.id, scores)
      toast.success('Scores saved')
      setShowScoreModal(false)
      fetchExams()
    } catch (error) {
      toast.error('Failed to save scores')
    } finally {
      setScoreSaving(false)
    }
  }

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getSessionsForDate = (date) => {
    if (!date) return []
    const dateStr = formatDate(date)
    return sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return formatDate(sessionDate) === dateStr
    })
  }

  const getSessionTypeColor = (type) => {
    switch (type) {
      case 'CLASS': return 'bg-blue-500'
      case 'EXAM': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSessionTypeBgColor = (type) => {
    switch (type) {
      case 'CLASS': return 'bg-blue-50 border-blue-200'
      case 'EXAM': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTime12h = (time) => {
    if (!time) return 'No time'
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${m} ${ampm}`
  }

  const getAllLessons = () => {
    if (!course?.modules) return []
    return course.modules.flatMap(module => (module.lessons || []).map(lesson => ({ ...lesson, moduleName: module.name })))
  }

  // Session handlers
  const handleDateClick = (date) => {
    if (!date) return
    setSelectedDate(date)
    const existingSessions = getSessionsForDate(date)
    if (existingSessions.length === 0) {
      setEditingSession(null)
      setSessionForm({ type: 'CLASS', lessonId: '', examId: '', startTime: '19:00', endTime: '21:00', meetingLink: '', notes: '' })
      setShowSessionModal(true)
    }
  }

  const handleEditSession = (session) => {
    setEditingSession(session)
    setSelectedDate(new Date(session.date))
    setSessionForm({ type: session.type, lessonId: session.lessonId || '', examId: session.examId || '', startTime: session.startTime, endTime: session.endTime || '', meetingLink: session.meetingLink || '', notes: session.notes || '' })
    setShowSessionModal(true)
  }

  const handleSaveSession = async () => {
    if (!selectedDate) return
    setSessionSaving(true)
    try {
      if (editingSession) {
        const updated = await updateCourseSession(editingSession.id, { date: formatDate(selectedDate), ...sessionForm })
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const created = await createCourseSession(course.id, { date: formatDate(selectedDate), ...sessionForm })
        setSessions(prev => [...prev, created])
      }
      setShowSessionModal(false)
      setEditingSession(null)
      toast.success(editingSession ? 'Session updated' : 'Session created')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save session')
    } finally {
      setSessionSaving(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!deleteSessionConfirm) return
    setDeletingSession(true)
    try {
      await deleteCourseSession(deleteSessionConfirm)
      setSessions(prev => prev.filter(s => s.id !== deleteSessionConfirm))
      setShowSessionModal(false)
      toast.success('Session deleted')
    } catch (error) {
      toast.error('Failed to delete session')
    } finally {
      setDeletingSession(false)
      setDeleteSessionConfirm(null)
    }
  }

  const handleCopySession = (session) => {
    setCopiedSession({ type: session.type, lessonId: session.lessonId, examId: session.examId, startTime: session.startTime, endTime: session.endTime, meetingLink: session.meetingLink, notes: session.notes })
    toast.success('Session copied! Right-click on a date to paste')
  }

  const handlePasteSession = async (date) => {
    if (!copiedSession) return
    try {
      const created = await createCourseSession(course.id, { date: formatDate(date), ...copiedSession })
      setSessions(prev => [...prev, created])
      toast.success('Session pasted')
    } catch (error) {
      toast.error('Failed to paste session')
    }
  }

  // Material handlers
  const handleAddMaterial = (sessionId) => {
    setMaterialSessionId(sessionId)
    setMaterialForm({ name: '', driveUrl: '' })
    setShowMaterialModal(true)
  }

  const handleSaveMaterial = async () => {
    setMaterialSaving(true)
    try {
      const updated = await addCourseSessionMaterial(materialSessionId, materialForm)
      setSessions(prev => prev.map(s => s.id === materialSessionId ? updated : s))
      setShowMaterialModal(false)
      toast.success('Material added')
    } catch (error) {
      toast.error('Failed to add material')
    } finally {
      setMaterialSaving(false)
    }
  }

  const handleDeleteMaterial = async () => {
    if (!deleteMaterialConfirm) return
    try {
      await deleteCourseSessionMaterial(deleteMaterialConfirm.sessionId, deleteMaterialConfirm.materialId)
      setSessions(prev => prev.map(s => s.id === deleteMaterialConfirm.sessionId ? { ...s, materials: s.materials.filter(m => m.id !== deleteMaterialConfirm.materialId) } : s))
      toast.success('Material deleted')
    } catch (error) {
      toast.error('Failed to delete material')
    } finally {
      setDeleteMaterialConfirm(null)
    }
  }

  // Attendance handlers
  const openAttendanceModal = async (session) => {
    setAttendanceSession(session)
    try {
      const data = await getCourseAttendance(session.id)
      setAttendanceList(data)
      setShowAttendanceModal(true)
    } catch (error) {
      toast.error('Failed to load attendance')
    }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceList(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a))
  }

  const handleSaveAttendance = async () => {
    setAttendanceSaving(true)
    try {
      await updateCourseAttendance(attendanceSession.id, attendanceList)
      toast.success('Attendance saved')
      setShowAttendanceModal(false)
    } catch (error) {
      toast.error('Failed to save attendance')
    } finally {
      setAttendanceSaving(false)
    }
  }

  // Student handlers
  const handleRemoveStudent = async () => {
    if (!removeStudentConfirm) return
    setRemovingStudent(true)
    try {
      await removeCourseStudent(course.id, removeStudentConfirm.id)
      setEnrolledStudents(prev => prev.filter(e => e.student?.id !== removeStudentConfirm.id))
      setRemoveStudentConfirm(null)
      toast.success('Student removed from course')
    } catch (error) {
      toast.error('Failed to remove student')
    } finally {
      setRemovingStudent(false)
    }
  }

  const filteredStudents = enrolledStudents.filter(enrollment => {
    const profile = enrollment.student?.user?.profile
    const name = profile ? `${profile.firstName} ${profile.lastName}` : (enrollment.student?.user?.email || '')
    const email = enrollment.student?.user?.email || ''
    const search = studentSearchTerm.toLowerCase()
    return name.toLowerCase().includes(search) || email.toLowerCase().includes(search)
  })

  // Settings handlers
  const handleToggleActive = async () => {
    setToggling(true)
    try {
      const updated = await toggleAdminCourseActive(course.id)
      setCourse(updated)
      toast.success(updated.isActive ? 'Course activated' : 'Course deactivated')
    } catch (error) {
      toast.error('Failed to toggle course status')
    } finally {
      setToggling(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const updated = await updateAdminCourse(course.id, {
        name: editName,
        description: editDescription,
        startDate: editStartDate || null,
        endDate: editEndDate || null,
        enrollmentEnd: editEnrollmentEnd || null,
        teacherId: editTeacherId || null,
        price: parseFloat(editPrice) || 0,
        priceType: editPriceType
      })
      setCourse(updated)
      setEditing(false)
      toast.success('Course updated')
    } catch (error) {
      toast.error('Failed to update course')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async () => {
    setDeleting(true)
    try {
      await deleteAdminCourse(course.id)
      toast.success('Course deleted')
      navigate('/admin')
    } catch (error) {
      toast.error('Failed to delete course')
    } finally {
      setDeleting(false)
    }
  }

  // Menu items
  const menuItems = [
    { id: 'class', label: 'Class', icon: BookOpen },
    { id: 'exam', label: 'Exam', icon: FileText },
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
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#1e3a5f] text-white transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2 text-blue-200 hover:text-white transition text-sm">
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
            if (item.liveOnly && course.type !== 'LIVE') return null
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  activeTab === item.id ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5 hover:text-white'
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
              {activeTab === 'class' && 'Course Content'}
              {activeTab === 'exam' && 'Exams'}
              {activeTab === 'schedule' && 'Schedule'}
              {activeTab === 'students' && 'Enrolled Students'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Class Tab */}
          {activeTab === 'class' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Manage course modules and lessons</p>
                <button
                  onClick={() => { setShowModuleModal(true); setEditingModule(null); setModuleForm({ name: '' }) }}
                  className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </button>
              </div>

              {course.modules?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                  <p className="text-gray-500 mb-4">Create modules and lessons for this course</p>
                  <button
                    onClick={() => setShowModuleModal(true)}
                    className="inline-flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-6 py-3 rounded-lg font-medium transition"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Module
                  </button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
                  <SortableContext items={course.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {course.modules.map((module, index) => (
                        <SortableModule 
                          key={module.id} 
                          module={module} 
                          index={index}
                          expanded={expandedModules[module.id]}
                          onToggle={() => toggleModule(module.id)}
                          onEdit={() => openEditModule(module)}
                          onDelete={() => setDeleteModuleConfirm(module.id)}
                          onAddLesson={() => { setSelectedModuleId(module.id); setEditingLesson(null); setLessonForm({ name: '', description: '', materials: '', videoUrl: '' }); setShowLessonModal(true) }}
                          onEditLesson={openEditLesson}
                          onDeleteLesson={(lessonId) => setDeleteLessonConfirm(lessonId)}
                          onLessonDragEnd={(event) => handleLessonDragEnd(module.id, event)}
                          sensors={sensors}
                          courseType={course.type}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* Exam Tab */}
          {activeTab === 'exam' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Create and manage exams</p>
                <button
                  onClick={() => handleOpenExamModal()}
                  className="inline-flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-5 h-5" />
                  Add Exam
                </button>
              </div>

              {loadingExams ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading exams...</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Yet</h3>
                  <p className="text-gray-500 mb-6">Create your first exam</p>
                  <button
                    onClick={() => handleOpenExamModal()}
                    className="inline-flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-6 py-3 rounded-lg font-medium transition"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Exam
                  </button>
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
                          <td className="px-6 py-4"><span className="font-medium text-gray-900">{exam.title}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-500">{exam.description || <span className="text-gray-400 italic">No description</span>}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{exam.totalPoints} pts</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {exam.isPublished ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Draft</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/admin/courses/${course.id}/exam/${exam.id}`} className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition flex items-center gap-1">
                                <FileText className="w-4 h-4" />Questions
                              </Link>
                              <button onClick={() => handleOpenScoreModal(exam)} className="px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition flex items-center gap-1">
                                <CheckSquare className="w-4 h-4" />Scores
                              </button>
                              <button onClick={() => handleOpenExamModal(exam)} className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg transition">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteExamConfirm(exam.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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

          {/* Schedule Tab (LIVE courses only) */}
          {activeTab === 'schedule' && course.type === 'LIVE' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => setCurrentMonth(new Date())} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition">Today</button>
                  </div>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const daySessions = date ? getSessionsForDate(date) : []
                    const isToday = date?.toDateString() === new Date().toDateString()
                    const isSelected = date && selectedDate && formatDate(date) === formatDate(selectedDate)
                    
                    return (
                      <div
                        key={index}
                        onClick={() => date && handleDateClick(date)}
                        onContextMenu={(e) => { e.preventDefault(); if (date && copiedSession) handlePasteSession(date) }}
                        className={`min-h-[70px] p-1.5 border rounded-lg cursor-pointer transition text-center ${
                          !date ? 'bg-gray-50 cursor-default' : 'hover:bg-gray-50'
                        } ${isToday ? 'border-[#f7941d] border-2' : 'border-gray-200'} ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
                      >
                        {date && (
                          <>
                            <span className={`text-sm ${isToday ? 'font-bold text-[#f7941d]' : 'text-gray-700'}`}>{date.getDate()}</span>
                            <div className="mt-1 space-y-0.5">
                              {daySessions.slice(0, 2).map(session => (
                                <div key={session.id} className={`w-full h-1.5 rounded-full ${getSessionTypeColor(session.type)}`}></div>
                              ))}
                              {daySessions.length > 2 && <div className="text-xs text-gray-400">+{daySessions.length - 2}</div>}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Class</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Exam</div>
                  {copiedSession && <div className="flex items-center gap-1 ml-auto text-green-600"><Clipboard className="w-3 h-3" /> Right-click to paste</div>}
                </div>
              </div>

              {/* Session Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {selectedDate ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                        <p className="text-sm text-gray-500">{getSessionsForDate(selectedDate).length} session(s)</p>
                      </div>
                      <button onClick={() => { setEditingSession(null); setSessionForm({ type: 'CLASS', lessonId: '', examId: '', startTime: '19:00', endTime: '21:00', meetingLink: '', notes: '' }); setShowSessionModal(true) }} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition">
                        <Plus className="w-4 h-4" />Add Session
                      </button>
                    </div>

                    {getSessionsForDate(selectedDate).length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No sessions scheduled</p>
                        <p className="text-sm text-gray-400">Click "Add Session" to create one</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getSessionsForDate(selectedDate).map(session => (
                          <div key={session.id} className={`border rounded-xl p-4 ${getSessionTypeBgColor(session.type)}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${session.type === 'EXAM' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>{session.type}</span>
                                  <span className="text-sm text-gray-600">{formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}</span>
                                </div>
                                {session.lesson && <p className="text-sm font-medium text-gray-900">{session.lesson.name}</p>}
                                {session.exam && <p className="text-sm font-medium text-gray-900">{session.exam.title}</p>}
                                {session.meetingLink ? (
                                  <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                    <LinkIcon className="w-3 h-3" />{session.meetingLink.includes('zoom') ? 'Zoom Meeting' : session.meetingLink.includes('meet') ? 'Google Meet' : 'Meeting Link'}
                                  </a>
                                ) : (
                                  <p className="text-sm text-amber-600 flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3" />No meeting link</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleCopySession(session)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition" title="Copy session"><Copy className="w-4 h-4" /></button>
                                <button onClick={() => handleEditSession(session)} className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-white rounded transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteSessionConfirm(session.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>

                            {/* Materials */}
                            {session.materials?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-2">Materials</p>
                                <div className="space-y-1">
                                  {session.materials.map(material => (
                                    <div key={material.id} className="flex items-center justify-between text-sm">
                                      <a href={material.driveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                        <FileText className="w-3 h-3" />{material.name}
                                      </a>
                                      <button onClick={() => setDeleteMaterialConfirm({ sessionId: session.id, materialId: material.id })} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                              <button onClick={() => handleAddMaterial(session.id)} className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Material</button>
                              <button onClick={() => openAttendanceModal(session)} className="text-xs text-green-600 hover:underline flex items-center gap-1 ml-auto"><CheckSquare className="w-3 h-3" />Attendance</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
                    <p className="text-gray-500">Click on a date in the calendar to view or add sessions</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <p className="text-gray-600">Manage enrolled students</p>
                  <span className="px-3 py-1 bg-[#1e3a5f] text-white text-sm font-medium rounded-full">{enrolledStudents.length} students</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none w-64"
                  />
                </div>
              </div>

              {loadingStudents ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h3>
                  <p className="text-gray-500">Students will appear here once they enroll in this course</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results</h3>
                  <p className="text-gray-500">No students match your search</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map((enrollment) => {
                    const profile = enrollment.student?.user?.profile
                    const user = enrollment.student?.user
                    const fullName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] || 'Unknown')
                    const initials = profile ? `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}` : 'S'

                    return (
                      <div key={enrollment.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{fullName}</h4>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Enrolled {new Date(enrollment.createdAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex items-center justify-end">
                          <button
                            onClick={() => setRemoveStudentConfirm({ id: enrollment.student?.id, name: fullName })}
                            className="text-sm text-red-600 hover:text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                    <p className="font-medium text-gray-900">{course.isActive ? 'Course is Active' : 'Course is Inactive'}</p>
                    <p className="text-sm text-gray-500">{course.isActive ? 'Students can see and enroll in this course' : 'Course is hidden from students'}</p>
                  </div>
                  <button
                    onClick={handleToggleActive}
                    disabled={toggling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
                      course.isActive ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {toggling ? (
                      <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> {course.isActive ? 'Deactivating...' : 'Activating...'}</>
                    ) : course.isActive ? (
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
                    <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-[#1e3a5f] hover:underline font-medium">
                      <Edit3 className="w-4 h-4" />Edit
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <p className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600">{course.type === 'LIVE' ? 'Live Class' : 'Recorded Video'}<span className="text-xs text-gray-400 ml-2">(cannot be changed)</span></p>
                    </div>
                    
                    {/* Admin-specific: Assigned Teacher */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Teacher</label>
                      <select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none">
                        <option value="">-- No Teacher --</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>{teacher.user?.profile ? `${teacher.user.profile.firstName} ${teacher.user.profile.lastName}` : teacher.user?.email}</option>
                        ))}
                      </select>
                    </div>

                    {/* Course Duration */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Course Duration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} min={editStartDate} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* Enrollment Period */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Enrollment Period</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Deadline</label>
                        <input type="date" value={editEnrollmentEnd} onChange={(e) => setEditEnrollmentEnd(e.target.value)} max={editEndDate} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none" />
                      </div>
                    </div>

                    {/* Admin-specific: Price */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Pricing</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                          <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                          <select value={editPriceType} onChange={(e) => setEditPriceType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none">
                            <option value="ONE_TIME">One-Time</option>
                            <option value="MONTHLY">Monthly</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => { setEditing(false); setEditName(course.name); setEditDescription(course.description || ''); setEditStartDate(course.startDate ? course.startDate.split('T')[0] : ''); setEditEndDate(course.endDate ? course.endDate.split('T')[0] : ''); setEditEnrollmentEnd(course.enrollmentEnd ? course.enrollmentEnd.split('T')[0] : ''); setEditTeacherId(course.teacherId || ''); setEditPrice(course.price || 0); setEditPriceType(course.priceType || 'ONE_TIME'); }} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        <X className="w-4 h-4" />Cancel
                      </button>
                      <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50">
                        <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
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
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium text-gray-900">{course.createdBy?.profile ? `${course.createdBy.profile.firstName} ${course.createdBy.profile.lastName}` : (course.createdBy?.role === 'SUPER_ADMIN' ? 'Admin' : 'Unknown')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned Teacher</p>
                      <p className="font-medium text-gray-900">{course.teacher?.user?.profile ? `${course.teacher.user.profile.firstName} ${course.teacher.user.profile.lastName}` : 'No teacher assigned'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium text-gray-900">{course.startDate ? new Date(course.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium text-gray-900">{course.endDate ? new Date(course.endDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'Not set'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Enrollment Deadline</p>
                      <p className="font-medium text-gray-900">{course.enrollmentEnd ? new Date(course.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'No deadline'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium text-gray-900">₱{course.price?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price Type</p>
                        <p className="font-medium text-gray-900">{course.priceType === 'MONTHLY' ? 'Monthly' : 'One-Time'}</p>
                      </div>
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
                  <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
                    <Trash2 className="w-4 h-4" />Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : (editingSession ? 'Edit Session' : 'Add Session')}
              </h2>
              <button onClick={() => setShowSessionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Session Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setSessionForm({ ...sessionForm, type: 'CLASS', examId: '' })}
                    className={`flex-1 py-2.5 text-sm font-medium transition ${
                      sessionForm.type === 'CLASS' ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    CLASS
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionForm({ ...sessionForm, type: 'EXAM', lessonId: '' })}
                    className={`flex-1 py-2.5 text-sm font-medium transition ${
                      sessionForm.type === 'EXAM' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    EXAM
                  </button>
                </div>
              </div>

              {/* Class Template / Exam Selection */}
              {sessionForm.type === 'CLASS' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Template *</label>
                  <select
                    value={sessionForm.lessonId}
                    onChange={(e) => setSessionForm({ ...sessionForm, lessonId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  >
                    <option value="">Select a class template...</option>
                    {getAllLessons().map(lesson => (
                      <option key={lesson.id} value={lesson.id}>{lesson.moduleName} - {lesson.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam *</label>
                  <select
                    value={sessionForm.examId}
                    onChange={(e) => setSessionForm({ ...sessionForm, examId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  >
                    <option value="">Select an exam...</option>
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.title}</option>
                    ))}
                  </select>
                  {sessionForm.examId && exams.find(e => e.id === sessionForm.examId) && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Students who already took this exam won't be able to retake it
                    </p>
                  )}
                </div>
              )}

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={sessionForm.meetingLink}
                  onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  placeholder="Instructions or notes for students..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowSessionModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                disabled={sessionSaving}
                className="px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {sessionSaving ? 'Saving...' : (editingSession ? 'Update' : 'Create')}
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

      {/* Score Entry Modal */}
      {showScoreModal && scoringExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Enter Scores - {scoringExam.title}</h2>
              <p className="text-sm text-gray-500 mt-1">Total Points: {scoringExam.totalPoints}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {scoreEntries.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No students enrolled in this course</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 text-sm font-semibold text-gray-900">Student</th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-900 w-32">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {scoreEntries.map((entry) => (
                      <tr key={entry.studentId}>
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{entry.studentName}</p>
                          <p className="text-sm text-gray-500">{entry.email}</p>
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            min="0"
                            max={scoringExam.totalPoints}
                            value={entry.score}
                            onChange={(e) => handleScoreChange(entry.studentId, e.target.value)}
                            placeholder="--"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button onClick={() => setShowScoreModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition">Cancel</button>
              <button onClick={handleSaveScores} disabled={scoreSaving} className="flex-1 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50">
                {scoreSaving ? 'Saving...' : 'Save Scores'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Material</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="e.g., Lecture Slides"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive URL</label>
                <input
                  type="url"
                  value={materialForm.driveUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, driveUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMaterialModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSaveMaterial} disabled={materialSaving || !materialForm.name || !materialForm.driveUrl} className="flex-1 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50">
                {materialSaving ? 'Adding...' : 'Add Material'}
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
        isOpen={showDeleteModal}
        title="Delete Course"
        message="Are you sure you want to delete this course? All data will be permanently lost."
        onConfirm={handleDeleteCourse}
        onCancel={() => setShowDeleteModal(false)}
      />
      <ConfirmModal
        isOpen={!!removeStudentConfirm}
        title="Remove Student"
        message={`Are you sure you want to remove ${removeStudentConfirm?.name || 'this student'} from this course?`}
        onConfirm={handleRemoveStudent}
        onCancel={() => setRemoveStudentConfirm(null)}
      />
      <ConfirmModal
        isOpen={!!deleteMaterialConfirm}
        title="Delete Material"
        message="Are you sure you want to delete this material?"
        onConfirm={handleDeleteMaterial}
        onCancel={() => setDeleteMaterialConfirm(null)}
      />
    </div>
  )
}
