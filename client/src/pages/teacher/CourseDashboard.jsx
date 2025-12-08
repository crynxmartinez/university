import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  // Icons 
  ArrowLeft, BookOpen, Calendar, Users, Settings, Menu, 
  Plus, Video, Radio, ChevronDown, ChevronRight, Play,
  ToggleLeft, ToggleRight, Trash2, Edit3, Save, X,
  ChevronLeft, Clock, Link as LinkIcon, FileText, Copy, Clipboard, GripVertical, CheckSquare, AlertTriangle
} from 'lucide-react'
import { getCourse, updateCourse, toggleCourseActive, deleteCourse } from '../../api/courses'
import { getCourseSessions, createSession, updateSession, deleteSession, addMaterial, deleteMaterial } from '../../api/sessions'
import { updateModule, deleteModule, getModuleDeleteInfo, reorderModules } from '../../api/modules'
import { updateLesson, deleteLesson, getLessonDeleteInfo, reorderLessons } from '../../api/lessons'
import { getEnrolledStudents, removeEnrollment } from '../../api/enrollments'
import { getSessionAttendance, updateSessionAttendance } from '../../api/attendance'
import { getCourseExams, createExam, updateExam, deleteExam, saveExamScores } from '../../api/exams'
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
          title="Edit class"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(lesson.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
          title="Delete class"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Sortable Module Component
function SortableModule({ module, index, courseId, courseSlug, expanded, onToggle, onEdit, onDelete, onEditLesson, onDeleteLesson, onLessonDragEnd, sensors, courseType }) {
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
            <span className="text-sm text-gray-500">({module.lessons?.length || 0} classes)</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded transition opacity-0 group-hover:opacity-100"
            title="Edit module"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
            title="Delete module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onToggle} className="p-1">
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t">
          {module.lessons?.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm mb-3">No classes in this module</p>
              <Link
                to={`/teacher/courses/${courseSlug || courseId}/modules/${module.id}/lessons/create`}
                className="text-[#f7941d] hover:underline text-sm font-medium"
              >
                + Add Class
              </Link>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd}>
              <SortableContext items={module.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y">
                  {module.lessons.map((lesson) => (
                    <SortableLesson 
                      key={lesson.id} 
                      lesson={lesson} 
                      onEdit={onEditLesson}
                      onDelete={onDeleteLesson}
                      courseType={courseType}
                    />
                  ))}
                  <div className="p-4">
                    <Link
                      to={`/teacher/courses/${courseSlug || courseId}/modules/${module.id}/lessons/create`}
                      className="text-[#f7941d] hover:underline text-sm font-medium"
                    >
                      + Add Class
                    </Link>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  )
}

export default function CourseDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('class')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState({})
  
  // Settings state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editEnrollmentEnd, setEditEnrollmentEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState(null)
  const [deleteMaterialConfirm, setDeleteMaterialConfirm] = useState(null)

  // Module/Lesson edit state
  const [editModuleModal, setEditModuleModal] = useState(null) // { id, name }
  const [editLessonModal, setEditLessonModal] = useState(null) // { id, name, description, materials, videoUrl }
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState(null) // { id, info }
  const [deleteLessonConfirm, setDeleteLessonConfirm] = useState(null) // { id, info }
  const [lessonMaterialUrls, setLessonMaterialUrls] = useState([''])
  const [savingModule, setSavingModule] = useState(false)
  const [deletingModule, setDeletingModule] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [deletingLesson, setDeletingLesson] = useState(false)

  // Enrolled students state
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [removeStudentConfirm, setRemoveStudentConfirm] = useState(null)
  const [removingStudent, setRemovingStudent] = useState(false)

  // Attendance state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceSession, setAttendanceSession] = useState(null)
  const [attendanceList, setAttendanceList] = useState([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)

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
    lessonId: '',
    examId: '',
    startTime: '19:00',
    endTime: '21:00',
    meetingLink: '',
    notes: ''
  })
  const [sessionSaving, setSessionSaving] = useState(false)
  const [deletingSession, setDeletingSession] = useState(false)
  
  // Material modal state
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialSessionId, setMaterialSessionId] = useState(null)
  const [materialForm, setMaterialForm] = useState({ name: '', driveUrl: '' })
  const [materialSaving, setMaterialSaving] = useState(false)

  // Exam state
  const [exams, setExams] = useState([])
  const [loadingExams, setLoadingExams] = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [examForm, setExamForm] = useState({ title: '', description: '', totalPoints: 100 })
  const [examSaving, setExamSaving] = useState(false)
  const [deleteExamConfirm, setDeleteExamConfirm] = useState(null)
  const [deletingExam, setDeletingExam] = useState(false)
  
  // Score entry state
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [scoringExam, setScoringExam] = useState(null)
  const [scoreEntries, setScoreEntries] = useState([])
  const [savingScores, setSavingScores] = useState(false)

  useEffect(() => {
    fetchCourse()
  }, [id])

  useEffect(() => {
    if (course?.type === 'LIVE') {
      fetchSessions()
    }
  }, [course?.id])

  useEffect(() => {
    if (activeTab === 'students' && course?.id) {
      fetchEnrolledStudents()
    }
  }, [activeTab, course?.id])

  useEffect(() => {
    if (activeTab === 'exam' && course?.id) {
      fetchExams()
      // Also fetch enrolled students for score entry
      if (enrolledStudents.length === 0) {
        fetchEnrolledStudents()
      }
    }
  }, [activeTab, course?.id])

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

  const fetchEnrolledStudents = async () => {
    if (!course?.id) return
    setLoadingStudents(true)
    try {
      const data = await getEnrolledStudents(course.id)
      setEnrolledStudents(data)
    } catch (error) {
      console.error('Failed to fetch enrolled students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleRemoveStudent = async () => {
    if (!removeStudentConfirm) return
    setRemovingStudent(true)
    try {
      await removeEnrollment(removeStudentConfirm.id)
      setEnrolledStudents(prev => prev.filter(e => e.id !== removeStudentConfirm.id))
      setRemoveStudentConfirm(null)
      toast.success('Student removed from course')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove student')
    } finally {
      setRemovingStudent(false)
    }
  }

  const filteredStudents = enrolledStudents.filter(enrollment => {
    const name = enrollment.student?.user?.profile?.fullName || enrollment.student?.user?.email || ''
    const email = enrollment.student?.user?.email || ''
    const search = studentSearchTerm.toLowerCase()
    return name.toLowerCase().includes(search) || email.toLowerCase().includes(search)
  })

  const fetchSessions = async () => {
    if (!course?.id) return
    try {
      const data = await getCourseSessions(course.id)
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
      setEditStartDate(data.startDate ? data.startDate.split('T')[0] : '')
      setEditEndDate(data.endDate ? data.endDate.split('T')[0] : '')
      setEditEnrollmentEnd(data.enrollmentEnd ? data.enrollmentEnd.split('T')[0] : '')
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
    setToggling(true)
    try {
      const updated = await toggleCourseActive(id)
      setCourse(updated)
      toast.success(updated.isActive ? 'Course activated' : 'Course deactivated')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to toggle course status')
    } finally {
      setToggling(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const updated = await updateCourse(id, {
        name: editName,
        description: editDescription,
        startDate: editStartDate || null,
        endDate: editEndDate || null,
        enrollmentEnd: editEnrollmentEnd || null
      })
      setCourse(updated)
      setEditing(false)
      toast.success('Course updated successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async () => {
    setDeleting(true)
    try {
      await deleteCourse(id)
      toast.success('Course deleted')
      navigate('/teacher')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete course')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Module handlers
  const openEditModule = (module) => {
    setEditModuleModal({ id: module.id, name: module.name })
  }

  const handleSaveModule = async () => {
    if (!editModuleModal) return
    setSavingModule(true)
    try {
      await updateModule(editModuleModal.id, { name: editModuleModal.name })
      await fetchCourse()
      setEditModuleModal(null)
      toast.success('Module updated')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update module')
    } finally {
      setSavingModule(false)
    }
  }

  const openDeleteModule = async (moduleId) => {
    try {
      const info = await getModuleDeleteInfo(moduleId)
      setDeleteModuleConfirm({ id: moduleId, info })
    } catch (error) {
      toast.error('Failed to get module info')
    }
  }

  const handleDeleteModule = async () => {
    if (!deleteModuleConfirm) return
    setDeletingModule(true)
    try {
      await deleteModule(deleteModuleConfirm.id)
      await fetchCourse()
      setDeleteModuleConfirm(null)
      toast.success('Module deleted')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete module')
    } finally {
      setDeletingModule(false)
    }
  }

  const handleModuleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = course.modules.findIndex(m => m.id === active.id)
    const newIndex = course.modules.findIndex(m => m.id === over.id)
    
    const newModules = arrayMove(course.modules, oldIndex, newIndex)
    setCourse({ ...course, modules: newModules })

    try {
      await reorderModules(course.id, newModules.map(m => m.id))
    } catch (error) {
      toast.error('Failed to reorder modules')
      fetchCourse()
    }
  }

  // Lesson handlers
  const openEditLesson = (lesson) => {
    const urls = lesson.materials ? lesson.materials.split('\n').filter(u => u.trim()) : ['']
    setLessonMaterialUrls(urls.length > 0 ? urls : [''])
    setEditLessonModal({
      id: lesson.id,
      name: lesson.name,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || ''
    })
  }

  const handleSaveLesson = async () => {
    if (!editLessonModal) return
    setSavingLesson(true)
    const materials = lessonMaterialUrls.filter(u => u.trim()).join('\n')
    try {
      await updateLesson(editLessonModal.id, {
        name: editLessonModal.name,
        description: editLessonModal.description,
        materials,
        videoUrl: editLessonModal.videoUrl || null
      })
      await fetchCourse()
      setEditLessonModal(null)
      toast.success('Class updated')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update class')
    } finally {
      setSavingLesson(false)
    }
  }

  const openDeleteLesson = async (lessonId) => {
    try {
      const info = await getLessonDeleteInfo(lessonId)
      setDeleteLessonConfirm({ id: lessonId, info })
    } catch (error) {
      toast.error('Failed to get class info')
    }
  }

  const handleDeleteLesson = async () => {
    if (!deleteLessonConfirm) return
    setDeletingLesson(true)
    try {
      await deleteLesson(deleteLessonConfirm.id)
      await fetchCourse()
      setDeleteLessonConfirm(null)
      toast.success('Class deleted')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete class')
    } finally {
      setDeletingLesson(false)
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
    const newModules = course.modules.map(m => 
      m.id === moduleId ? { ...m, lessons: newLessons } : m
    )
    setCourse({ ...course, modules: newModules })

    try {
      await reorderLessons(moduleId, newLessons.map(l => l.id))
    } catch (error) {
      toast.error('Failed to reorder classes')
      fetchCourse()
    }
  }

  const addLessonMaterialUrl = () => setLessonMaterialUrls([...lessonMaterialUrls, ''])
  const removeLessonMaterialUrl = (index) => setLessonMaterialUrls(lessonMaterialUrls.filter((_, i) => i !== index))
  const updateLessonMaterialUrl = (index, value) => {
    const updated = [...lessonMaterialUrls]
    updated[index] = value
    setLessonMaterialUrls(updated)
  }

  // Attendance handlers
  const openAttendanceModal = async (session) => {
    setAttendanceSession(session)
    setShowAttendanceModal(true)
    setLoadingAttendance(true)
    try {
      const data = await getSessionAttendance(session.id)
      setAttendanceList(data)
    } catch (error) {
      toast.error('Failed to load attendance')
      setShowAttendanceModal(false)
    } finally {
      setLoadingAttendance(false)
    }
  }

  const toggleAttendance = (studentId) => {
    setAttendanceList(prev => prev.map(item => 
      item.studentId === studentId 
        ? { ...item, status: item.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
        : item
    ))
  }

  const markAllPresent = () => {
    setAttendanceList(prev => prev.map(item => ({ ...item, status: 'PRESENT' })))
  }

  const markAllAbsent = () => {
    setAttendanceList(prev => prev.map(item => ({ ...item, status: 'ABSENT' })))
  }

  const handleSaveAttendance = async () => {
    setSavingAttendance(true)
    try {
      const attendance = attendanceList.map(item => ({
        studentId: item.studentId,
        status: item.status
      }))
      await updateSessionAttendance(attendanceSession.id, attendance)
      toast.success('Attendance saved')
      setShowAttendanceModal(false)
    } catch (error) {
      toast.error('Failed to save attendance')
    } finally {
      setSavingAttendance(false)
    }
  }

  // Exam handlers
  const handleOpenExamModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam)
      setExamForm({
        title: exam.title,
        description: exam.description || '',
        totalPoints: exam.totalPoints
      })
    } else {
      setEditingExam(null)
      setExamForm({ title: '', description: '', totalPoints: 100 })
    }
    setShowExamModal(true)
  }

  const handleSaveExam = async () => {
    if (!examForm.title.trim()) {
      toast.error('Please enter an exam title')
      return
    }
    setExamSaving(true)
    try {
      if (editingExam) {
        const updated = await updateExam(editingExam.id, examForm)
        setExams(prev => prev.map(e => e.id === updated.id ? updated : e))
        toast.success('Exam updated')
      } else {
        const created = await createExam({ courseId: course.id, ...examForm })
        setExams(prev => [...prev, created])
        toast.success('Exam created')
      }
      setShowExamModal(false)
      setEditingExam(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save exam')
    } finally {
      setExamSaving(false)
    }
  }

  const handleDeleteExam = async () => {
    if (!deleteExamConfirm) return
    setDeletingExam(true)
    try {
      await deleteExam(deleteExamConfirm)
      setExams(prev => prev.filter(e => e.id !== deleteExamConfirm))
      toast.success('Exam deleted')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete exam')
    } finally {
      setDeletingExam(false)
      setDeleteExamConfirm(null)
    }
  }

  // Score entry handlers
  const handleOpenScoreModal = (exam) => {
    setScoringExam(exam)
    // Initialize score entries from enrolled students
    const entries = enrolledStudents.map(enrollment => {
      // Find existing score for this student
      const existingScore = exam.scores?.find(s => s.studentId === enrollment.student.id)
      return {
        studentId: enrollment.student.id,
        studentName: enrollment.student.user.profile?.fullName || enrollment.student.user.email,
        email: enrollment.student.user.email,
        score: existingScore?.score ?? '',
        notes: existingScore?.notes || ''
      }
    })
    setScoreEntries(entries)
    setShowScoreModal(true)
  }

  const handleScoreChange = (studentId, value) => {
    setScoreEntries(prev => prev.map(entry => 
      entry.studentId === studentId 
        ? { ...entry, score: value === '' ? '' : parseFloat(value) || 0 }
        : entry
    ))
  }

  const handleSaveScores = async () => {
    if (!scoringExam) return
    setSavingScores(true)
    try {
      // Filter out empty scores and format for API
      const scores = scoreEntries
        .filter(entry => entry.score !== '' && entry.score !== null)
        .map(entry => ({
          studentId: entry.studentId,
          score: parseFloat(entry.score),
          notes: entry.notes
        }))
      
      await saveExamScores(scoringExam.id, scores)
      
      // Refresh exams to get updated scores
      await fetchExams()
      
      setShowScoreModal(false)
      setScoringExam(null)
      toast.success('Scores saved successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save scores')
    } finally {
      setSavingScores(false)
    }
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
    // Format as YYYY-MM-DD in LOCAL timezone (PH), not UTC
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getSessionsForDate = (date) => {
    if (!date) return []
    const dateStr = formatDate(date)
    return sessions.filter(s => {
      // Parse session date and format in local timezone
      const sessionDate = new Date(s.date)
      const sessionDateStr = formatDate(sessionDate)
      return sessionDateStr === dateStr
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

  // Format 24-hour time (e.g., "19:00") to 12-hour format (e.g., "7:00 PM")
  const formatTime12h = (time) => {
    if (!time) return 'No time'
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${m} ${ampm}`
  }

  // Get all lessons (class templates) from all modules
  const getAllLessons = () => {
    if (!course?.modules) return []
    return course.modules.flatMap(module => 
      (module.lessons || []).map(lesson => ({
        ...lesson,
        moduleName: module.name
      }))
    )
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
        lessonId: '',
        examId: '',
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
      lessonId: session.lessonId || '',
      examId: session.examId || '',
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
          courseId: course.id,
          date: formatDate(selectedDate),
          ...sessionForm
        })
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
      await deleteSession(deleteSessionConfirm)
      setSessions(prev => prev.filter(s => s.id !== deleteSessionConfirm))
      setShowSessionModal(false)
      toast.success('Session deleted')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete session')
    } finally {
      setDeletingSession(false)
      setDeleteSessionConfirm(null)
    }
  }

  const handleCopySession = (session) => {
    setCopiedSession({
      type: session.type,
      lessonId: session.lessonId,
      startTime: session.startTime,
      endTime: session.endTime,
      meetingLink: session.meetingLink,
      notes: session.notes
    })
    toast.success('Session copied')
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
      toast.warning('Please fill in all fields')
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
      toast.success('Material added')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add material')
    } finally {
      setMaterialSaving(false)
    }
  }

  const handleDeleteMaterial = async () => {
    if (!deleteMaterialConfirm) return
    try {
      await deleteMaterial(deleteMaterialConfirm.materialId)
      setSessions(prev => prev.map(s => {
        if (s.id === deleteMaterialConfirm.sessionId) {
          return { ...s, materials: s.materials.filter(m => m.id !== deleteMaterialConfirm.materialId) }
        }
        return s
      }))
      toast.success('Material deleted')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete material')
    } finally {
      setDeleteMaterialConfirm(null)
    }
  }

  const menuItems = [
    { id: 'class', label: 'Class', icon: BookOpen },
    { id: 'exam', label: 'Exam', icon: FileText, liveOnly: true },
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
              {activeTab === 'class' && 'Class Templates'}
              {activeTab === 'exam' && 'Exam Templates'}
              {activeTab === 'schedule' && 'Schedule'}
              {activeTab === 'students' && 'Enrolled Students'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Class Tab - Class Templates */}
          {activeTab === 'class' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Create class templates that can be scheduled on the calendar</p>
                <Link
                  to={`/teacher/courses/${course?.slug || id}/modules/create`}
                  className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </Link>
              </div>

              {course.modules?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No class templates yet</h3>
                  <p className="text-gray-500 mb-4">Create modules and lessons to use as class templates</p>
                  <Link
                    to={`/teacher/courses/${course?.slug || id}/modules/create`}
                    className="inline-flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-6 py-3 rounded-lg font-medium transition"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Module
                  </Link>
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
                          courseId={id}
                          courseSlug={course.slug}
                          expanded={expandedModules[module.id]}
                          onToggle={() => toggleModule(module.id)}
                          onEdit={() => openEditModule(module)}
                          onDelete={() => openDeleteModule(module.id)}
                          onEditLesson={openEditLesson}
                          onDeleteLesson={openDeleteLesson}
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
                <p className="text-gray-600">Create exams to grade your students</p>
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
                  <p className="text-gray-500 mb-6">Create your first exam to start grading students</p>
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
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">{exam.title}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {exam.description || <span className="text-gray-400 italic">No description</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {exam.totalPoints} pts
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {exam.isPublished ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/teacher/courses/${id}/exam/${exam.id}`)}
                                className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition flex items-center gap-1"
                                title="Edit questions"
                              >
                                <FileText className="w-4 h-4" />
                                Questions
                              </button>
                              <button
                                onClick={() => handleOpenScoreModal(exam)}
                                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition flex items-center gap-1"
                                title="Enter scores"
                              >
                                <CheckSquare className="w-4 h-4" />
                                Scores
                              </button>
                              <button
                                onClick={() => handleOpenExamModal(exam)}
                                className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg transition"
                                title="Edit exam"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteExamConfirm(exam.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete exam"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' })}
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
                    const hasNoLinkSession = dateSessions.some(s => !s.meetingLink)
                    
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
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${isToday ? 'text-[#f7941d]' : 'text-gray-700'}`}>
                                {date.getDate()}
                              </span>
                              {hasNoLinkSession && (
                                <div className="group relative">
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10">
                                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                      No meeting link
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              {dateSessions.slice(0, 2).map(session => (
                                <div
                                  key={session.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditSession(session)
                                  }}
                                  className={`text-xs px-1 py-0.5 rounded truncate ${
                                    !session.meetingLink 
                                      ? 'bg-red-100 text-red-700 border border-red-300' 
                                      : `${getSessionTypeColor(session.type)} text-white`
                                  }`}
                                >
                                  {formatTime12h(session.startTime)}
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
                    ? selectedDate.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric' })
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
                              lessonId: '',
                              examId: '',
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
                          <div key={session.id} className={`border rounded-lg p-3 ${!session.meetingLink ? 'border-red-300 bg-red-50' : getSessionTypeBgColor(session.type)}`}>
                            {/* No meeting link warning */}
                            {!session.meetingLink && (
                              <div className="flex items-center gap-2 text-amber-600 text-xs mb-2 bg-amber-50 px-2 py-1 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                <span>No meeting link</span>
                              </div>
                            )}
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getSessionTypeColor(session.type)} text-white`}>
                                  {session.type}
                                </span>
                                <p className="font-medium text-gray-900 mt-1">
                                  {session.type === 'EXAM' 
                                    ? session.exam?.title || 'Untitled Exam'
                                    : session.lesson?.name || 'Untitled'}
                                </p>
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
                              {formatTime12h(session.startTime)}{session.endTime && ` - ${formatTime12h(session.endTime)}`}
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
                                        onClick={() => setDeleteMaterialConfirm({ sessionId: session.id, materialId: material.id })}
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

                            {/* Attendance Button */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => openAttendanceModal(session)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg text-sm font-medium transition"
                              >
                                <CheckSquare className="w-4 h-4" />
                                View/Edit Attendance
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            setEditingSession(null)
                            setSessionForm({
                              type: 'CLASS',
                              lessonId: '',
                              examId: '',
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
                <div className="flex items-center gap-4">
                  <span className="bg-[#1e3a5f] text-white px-3 py-1 rounded-full text-sm font-medium">
                    {enrolledStudents.length} Student{enrolledStudents.length !== 1 ? 's' : ''}
                  </span>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none w-64"
                  />
                </div>
                <Link
                  to={`/teacher/courses/${course?.slug || id}/students`}
                  className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Enroll Students
                </Link>
              </div>

              {loadingStudents ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                  <p className="text-gray-500 mb-4">Enroll students to give them access to this course</p>
                  <Link
                    to={`/teacher/courses/${course?.slug || id}/students`}
                    className="inline-flex items-center gap-2 text-[#f7941d] hover:underline font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Enroll Students
                  </Link>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-500">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((enrollment) => {
                    const student = enrollment.student
                    const user = student?.user
                    const profile = user?.profile
                    const fullName = profile?.fullName || user?.email?.split('@')[0] || 'Unknown'
                    const email = user?.email || ''
                    const enrolledDate = new Date(enrollment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })

                    const stats = enrollment.attendanceStats || { attended: 0, total: 0, percentage: 0 }

                    return (
                      <div key={enrollment.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{fullName}</h4>
                              <p className="text-sm text-gray-500">{email}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Enrolled: {enrolledDate}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setRemoveStudentConfirm({ id: enrollment.id, name: fullName })}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="Remove student"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Attendance Progress */}
                        {course?.type === 'LIVE' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Attendance</span>
                              <span className={`font-medium ${
                                stats.percentage >= 80 ? 'text-green-600' : 
                                stats.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {stats.percentage}% ({stats.attended}/{stats.total} sessions)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  stats.percentage >= 80 ? 'bg-green-500' : 
                                  stats.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${stats.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
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
                    disabled={toggling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
                      course.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <p className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600">
                        {course.type === 'LIVE' ? 'Live Class' : 'Recorded Video'}
                        <span className="text-xs text-gray-400 ml-2">(cannot be changed)</span>
                      </p>
                    </div>
                    
                    {/* Course Duration */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Course Duration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            min={editStartDate}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Course will auto-deactivate after end date</p>
                    </div>

                    {/* Enrollment Period */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Enrollment Period</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Deadline</label>
                        <input
                          type="date"
                          value={editEnrollmentEnd}
                          onChange={(e) => setEditEnrollmentEnd(e.target.value)}
                          max={editEndDate}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Students can't enroll after this date</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setEditing(false)
                          setEditName(course.name)
                          setEditDescription(course.description || '')
                          setEditStartDate(course.startDate ? course.startDate.split('T')[0] : '')
                          setEditEndDate(course.endDate ? course.endDate.split('T')[0] : '')
                          setEditEnrollmentEnd(course.enrollmentEnd ? course.enrollmentEnd.split('T')[0] : '')
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
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium text-gray-900">
                          {course.startDate ? new Date(course.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium text-gray-900">
                          {course.endDate ? new Date(course.endDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Enrollment Deadline</p>
                      <p className="font-medium text-gray-900">
                        {course.enrollmentEnd ? new Date(course.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'No deadline'}
                      </p>
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
                    onClick={() => setShowDeleteModal(true)}
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
                {selectedDate?.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric' })}
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
                  <button
                    onClick={() => setSessionForm(prev => ({ ...prev, type: 'CLASS', lessonId: '', examId: '' }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      sessionForm.type === 'CLASS'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    CLASS
                  </button>
                  <button
                    onClick={() => setSessionForm(prev => ({ ...prev, type: 'EXAM', lessonId: '', examId: '' }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      sessionForm.type === 'EXAM'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    EXAM
                  </button>
                </div>
              </div>

              {/* Class Template Dropdown */}
              {sessionForm.type === 'CLASS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Template *</label>
                  {getAllLessons().length === 0 ? (
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      No class templates available. Create classes in the "Class" tab first.
                    </div>
                  ) : (
                    <select
                      value={sessionForm.lessonId}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, lessonId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                      required
                    >
                      <option value="">Select a class template...</option>
                      {getAllLessons().map(lesson => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.moduleName} → {lesson.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Exam Dropdown */}
              {sessionForm.type === 'EXAM' && (() => {
                // Check if selected exam is already scheduled
                const selectedExamId = sessionForm.examId
                const existingExamSessions = sessions.filter(s => s.examId === selectedExamId)
                const isRetakeSession = selectedExamId && existingExamSessions.length > 0
                
                return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam *</label>
                  {exams.filter(e => e.isPublished).length === 0 ? (
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      No published exams available. Create and publish exams in the "Exam" tab first.
                    </div>
                  ) : (
                    <>
                      <select
                        value={sessionForm.examId}
                        onChange={(e) => setSessionForm(prev => ({ ...prev, examId: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                        required
                      >
                        <option value="">Select an exam...</option>
                        {exams.filter(e => e.isPublished).map(exam => {
                          const scheduledCount = sessions.filter(s => s.examId === exam.id).length
                          return (
                            <option key={exam.id} value={exam.id}>
                              {exam.title} ({exam.totalPoints} pts){scheduledCount > 0 ? ` - ${scheduledCount} session(s)` : ''}
                            </option>
                          )
                        })}
                      </select>
                      
                      {/* Retake Warning */}
                      {isRetakeSession && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-orange-800">Retake Session</p>
                              <p className="text-xs text-orange-700 mt-1">
                                This exam has been scheduled {existingExamSessions.length} time(s) before. 
                                Creating this session will allow students to <strong>retake the exam</strong>. 
                                Their latest score will be used for grading.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                )
              })()}

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
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
                    onClick={() => setDeleteSessionConfirm(editingSession.id)}
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
                  disabled={sessionSaving || !sessionForm.startTime || !sessionForm.endTime || (sessionForm.type === 'CLASS' && !sessionForm.lessonId) || (sessionForm.type === 'EXAM' && !sessionForm.examId)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Course</h3>
              <p className="text-gray-500 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{course?.name}"</span>? 
                This action cannot be undone and all content will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Delete Course</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteSessionConfirm}
        onClose={() => !deletingSession && setDeleteSessionConfirm(null)}
        onConfirm={handleDeleteSession}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
        loading={deletingSession}
      />

      {/* Delete Material Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteMaterialConfirm}
        onClose={() => setDeleteMaterialConfirm(null)}
        onConfirm={handleDeleteMaterial}
        title="Delete Material"
        message="Are you sure you want to delete this material?"
        confirmText="Delete"
        confirmStyle="danger"
      />

      {/* Delete Exam Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteExamConfirm}
        onClose={() => !deletingExam && setDeleteExamConfirm(null)}
        onConfirm={handleDeleteExam}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? All student scores for this exam will also be deleted."
        confirmText="Delete"
        confirmStyle="danger"
        loading={deletingExam}
      />

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingExam ? 'Edit Exam' : 'Create Exam'}
              </h3>
              <button onClick={() => setShowExamModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title *</label>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  placeholder="e.g., Quiz 1, Midterm, Final Exam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  rows={3}
                  placeholder="Optional description for this exam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Points *</label>
                <input
                  type="number"
                  value={examForm.totalPoints}
                  onChange={(e) => setExamForm(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  min="1"
                  placeholder="100"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowExamModal(false)}
                disabled={examSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExam}
                disabled={examSaving}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {examSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {examSaving ? 'Saving...' : (editingExam ? 'Update Exam' : 'Create Exam')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Entry Modal */}
      {showScoreModal && scoringExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enter Scores</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {scoringExam.title} • Max: {scoringExam.totalPoints} points
                </p>
              </div>
              <button onClick={() => setShowScoreModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {scoreEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students enrolled in this course</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scoreEntries.map((entry) => (
                    <div
                      key={entry.studentId}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {entry.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{entry.studentName}</p>
                        <p className="text-xs text-gray-500 truncate">{entry.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={entry.score}
                          onChange={(e) => handleScoreChange(entry.studentId, e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                          placeholder="0"
                          min="0"
                          max={scoringExam.totalPoints}
                        />
                        <span className="text-sm text-gray-500">/ {scoringExam.totalPoints}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowScoreModal(false)}
                disabled={savingScores}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScores}
                disabled={savingScores || scoreEntries.length === 0}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {savingScores && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {savingScores ? 'Saving...' : 'Save Scores'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {editModuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Module</h3>
              <button onClick={() => setEditModuleModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Module Name *</label>
              <input
                type="text"
                value={editModuleModal.name}
                onChange={(e) => setEditModuleModal({ ...editModuleModal, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
              />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditModuleModal(null)}
                disabled={savingModule}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModule}
                disabled={!editModuleModal.name.trim() || savingModule}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {savingModule && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {savingModule ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editLessonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
              <button onClick={() => setEditLessonModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  value={editLessonModal.name}
                  onChange={(e) => setEditLessonModal({ ...editLessonModal, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editLessonModal.description}
                  onChange={(e) => setEditLessonModal({ ...editLessonModal, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Materials (URLs)</label>
                <div className="space-y-2">
                  {lessonMaterialUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateLessonMaterialUrl(index, e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                      />
                      {lessonMaterialUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLessonMaterialUrl(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addLessonMaterialUrl}
                  className="mt-2 flex items-center gap-1 text-sm text-[#1e3a5f] hover:text-[#2d5a87] font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Material
                </button>
              </div>
              {course?.type === 'RECORDED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      Video URL (YouTube)
                    </div>
                  </label>
                  <input
                    type="url"
                    value={editLessonModal.videoUrl}
                    onChange={(e) => setEditLessonModal({ ...editLessonModal, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditLessonModal(null)}
                disabled={savingLesson}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={!editLessonModal.name.trim() || savingLesson}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {savingLesson && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {savingLesson ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Module Confirmation Modal */}
      {deleteModuleConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Module</h3>
              <p className="text-gray-500 text-center mb-4">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{deleteModuleConfirm.info.moduleName}"</span>?
              </p>
              {deleteModuleConfirm.info.lessonCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    This module contains <strong>{deleteModuleConfirm.info.lessonCount}</strong> class(es).
                    {deleteModuleConfirm.info.totalSessions > 0 && (
                      <> <strong>{deleteModuleConfirm.info.totalSessions}</strong> scheduled session(s) will also be deleted.</>
                    )}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModuleConfirm(null)}
                  disabled={deletingModule}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteModule}
                  disabled={deletingModule}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingModule ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Confirmation Modal */}
      {deleteLessonConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Class</h3>
              <p className="text-gray-500 text-center mb-4">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{deleteLessonConfirm.info.lessonName}"</span>?
              </p>
              {deleteLessonConfirm.info.sessionCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This class is linked to <strong>{deleteLessonConfirm.info.sessionCount}</strong> scheduled session(s). 
                    Deleting it will also remove those sessions from the calendar.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteLessonConfirm(null)}
                  disabled={deletingLesson}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLesson}
                  disabled={deletingLesson}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingLesson ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Confirmation Modal */}
      {removeStudentConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Remove Student</h3>
              <p className="text-gray-500 text-center mb-6">
                Are you sure you want to remove <span className="font-medium text-gray-900">"{removeStudentConfirm.name}"</span> from this course?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRemoveStudentConfirm(null)}
                  disabled={removingStudent}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveStudent}
                  disabled={removingStudent}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {removingStudent ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Removing...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Remove</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Session Attendance</h3>
                {attendanceSession && (
                  <p className="text-sm text-gray-500 mt-1">
                    {attendanceSession.lesson?.name} • {new Date(attendanceSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <button onClick={() => setShowAttendanceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingAttendance ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading attendance...</p>
                </div>
              ) : attendanceList.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students enrolled in this course</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {attendanceList.filter(a => a.status === 'PRESENT').length} / {attendanceList.length} present
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={markAllPresent}
                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
                      >
                        Mark All Present
                      </button>
                      <button
                        onClick={markAllAbsent}
                        className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
                      >
                        Mark All Absent
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {attendanceList.map((item) => (
                      <div
                        key={item.studentId}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                          item.status === 'PRESENT' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                        onClick={() => toggleAttendance(item.studentId)}
                      >
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${
                          item.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-400'
                        }`}>
                          {(item.studentName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.studentName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 truncate">{item.email}</p>
                          {item.joinedAt && (
                            <p className="text-xs text-green-600 mt-0.5">
                              Joined at {new Date(item.joinedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'PRESENT' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-400 text-white'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAttendanceModal(false)}
                disabled={savingAttendance}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={savingAttendance || loadingAttendance}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {savingAttendance && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {savingAttendance ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
