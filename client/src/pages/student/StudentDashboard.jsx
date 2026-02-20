import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Video, Radio, LayoutDashboard, GraduationCap, Calendar, Settings, Menu, Award, Folder, MapPin, Globe, ExternalLink, Search, ChevronDown, ChevronRight, CheckCircle, X, Clock, FileText, StickyNote, Edit3, Trash2, MessageSquare, Download, Shield } from 'lucide-react'
import { getMyCourses, selfEnrollInCourse } from '../../api/enrollments'
import { getStudentPrograms } from '../../api/programs'
import { getMyProgramEnrollments, enrollInProgram } from '../../api/programEnrollments'
import { getUpcomingSessions, getAllCourseSessions } from '../../api/sessions'
import { getUpcomingProgramSessions, getAllProgramSessions, joinProgramSession } from '../../api/studentPrograms'
import { getMyNotes, saveNote, deleteNote } from '../../api/notes'
import { markJoinAttendance } from '../../api/attendance'
import { getStudentGrades, calculateAllGrades } from '../../api/grades'
import { getMyCertificates } from '../../api/certificates'
import { useToast, ConfirmModal } from '../../components/Toast'
import SessionCalendar from '../../components/SessionCalendar'
import axios from 'axios'
import API_URL from '../../api/config'

export default function StudentDashboard() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [allPrograms, setAllPrograms] = useState([]) // All available programs
  const [allCourses, setAllCourses] = useState([]) // All available courses
  const [myProgramEnrollments, setMyProgramEnrollments] = useState([]) // Enrolled programs
  const [myCourseEnrollments, setMyCourseEnrollments] = useState([]) // Enrolled courses
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [browseTab, setBrowseTab] = useState('programs') // 'programs' or 'courses'
  const [enrollmentsTab, setEnrollmentsTab] = useState('programs') // 'programs' or 'courses'
  const [enrollmentsOpen, setEnrollmentsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [enrollingId, setEnrollingId] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState(null) // For browse modal
  const [selectedCourse, setSelectedCourse] = useState(null) // For course browse modal
  const [selectedEnrolledProgram, setSelectedEnrolledProgram] = useState(null) // For enrolled modal
  const [showCalendarModal, setShowCalendarModal] = useState(false) // For course schedule calendar
  const [upcomingSessions, setUpcomingSessions] = useState([]) // Upcoming sessions from enrolled courses
  const [allCourseSessions, setAllCourseSessions] = useState([]) // ALL sessions for calendar view
  const [showProgramCalendarModal, setShowProgramCalendarModal] = useState(false) // For program schedule calendar
  const [upcomingProgramSessions, setUpcomingProgramSessions] = useState([]) // Upcoming sessions from enrolled programs
  const [allProgramSessionsData, setAllProgramSessionsData] = useState([]) // ALL program sessions for calendar view
  const [selectedSession, setSelectedSession] = useState(null) // For viewing session materials
  const [myNotes, setMyNotes] = useState([]) // Student's personal notes
  const [notesSearchTerm, setNotesSearchTerm] = useState('')
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState(null)
  const [showTodayPopup, setShowTodayPopup] = useState(false)
  const [todaySessions, setTodaySessions] = useState([])
  const [gradesData, setGradesData] = useState(null)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [calculatingGrades, setCalculatingGrades] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [loadingCertificates, setLoadingCertificates] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/login')
      return
    }
    
    const userData = JSON.parse(storedUser)
    if (userData.role !== 'STUDENT') {
      navigate('/login')
      return
    }
    
    setUser(userData)
    fetchAllData()
  }, [navigate])

  const fetchAllData = async () => {
    try {
      // Fetch all available programs
      const programsRes = await getStudentPrograms()
      setAllPrograms(programsRes)
      
      // Fetch my program enrollments
      const myPrograms = await getMyProgramEnrollments()
      setMyProgramEnrollments(myPrograms)
      
      // Fetch my course enrollments
      const myCourses = await getMyCourses()
      setMyCourseEnrollments(myCourses)
      
      // Fetch all available courses (public/active only)
      try {
        const coursesRes = await axios.get(`${API_URL}/courses/public`)
        setAllCourses(coursesRes.data)
      } catch (e) {
        console.error('Failed to fetch courses:', e)
      }

      // Fetch upcoming sessions for enrolled courses
      try {
        const sessions = await getUpcomingSessions()
        setUpcomingSessions(sessions)
        
        // Show popup if there are classes today (only on first load)
        if (!sessionStorage.getItem('studentTodayPopupShown')) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayEnd = new Date(today)
          todayEnd.setHours(23, 59, 59, 999)
          
          const sessionsToday = sessions.filter(s => {
            const sessionDate = new Date(s.date)
            return sessionDate >= today && sessionDate <= todayEnd
          })
          
          if (sessionsToday.length > 0) {
            setTodaySessions(sessionsToday)
            setShowTodayPopup(true)
            sessionStorage.setItem('studentTodayPopupShown', 'true')
          }
        }
      } catch (e) {
        console.error('Failed to fetch sessions:', e)
      }

      // Fetch ALL course sessions for calendar view
      try {
        const allSessions = await getAllCourseSessions()
        setAllCourseSessions(allSessions)
      } catch (e) {
        console.error('Failed to fetch all course sessions:', e)
      }

      // Fetch upcoming program sessions for enrolled programs
      try {
        const programSessions = await getUpcomingProgramSessions()
        setUpcomingProgramSessions(programSessions)
      } catch (e) {
        console.error('Failed to fetch program sessions:', e)
      }

      // Fetch ALL program sessions for calendar view
      try {
        const allProgramSessions = await getAllProgramSessions()
        setAllProgramSessionsData(allProgramSessions)
      } catch (e) {
        console.error('Failed to fetch all program sessions:', e)
      }

      // Fetch student's notes
      try {
        const notes = await getMyNotes()
        setMyNotes(notes)
      } catch (e) {
        console.error('Failed to fetch notes:', e)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-load certificates when tab becomes active
  useEffect(() => {
    if (activeTab === 'certificates' && certificates.length === 0) {
      setLoadingCertificates(true)
      getMyCertificates()
        .then(certs => setCertificates(certs))
        .catch(err => console.error('Failed to load certificates:', err))
        .finally(() => setLoadingCertificates(false))
    }
  }, [activeTab])

  const handleDeleteNote = async () => {
    if (!deleteNoteConfirm) return
    try {
      await deleteNote(deleteNoteConfirm)
      setMyNotes(prev => prev.filter(n => n.id !== deleteNoteConfirm))
      toast.success('Note deleted')
    } catch (error) {
      toast.error('Failed to delete note')
    } finally {
      setDeleteNoteConfirm(null)
    }
  }

  const handleEnrollProgram = async (programId) => {
    setEnrollingId(programId)
    try {
      await enrollInProgram(programId)
      // Refresh enrollments
      const myPrograms = await getMyProgramEnrollments()
      setMyProgramEnrollments(myPrograms)
      toast.success('Successfully enrolled in program!')
    } catch (error) {
      console.error('Failed to enroll:', error)
      toast.error(error.response?.data?.error || 'Failed to enroll')
    } finally {
      setEnrollingId(null)
    }
  }

  const isEnrolledInProgram = (programId) => {
    return myProgramEnrollments.some(e => e.program?.id === programId)
  }

  const isEnrolledInCourse = (courseId) => {
    return myCourseEnrollments.some(c => c.id === courseId)
  }

  const handleEnrollCourse = async (courseId) => {
    setEnrollingId(courseId)
    try {
      await selfEnrollInCourse(courseId)
      // Refresh enrollments
      const myCourses = await getMyCourses()
      setMyCourseEnrollments(myCourses)
      toast.success('Successfully enrolled in course!')
    } catch (error) {
      console.error('Failed to enroll:', error)
      toast.error(error.response?.data?.error || 'Failed to enroll')
    } finally {
      setEnrollingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'browse', label: 'Browse', icon: Search },
    { id: 'enrollments', label: 'My Enrollments', icon: CheckCircle, hasDropdown: true },
    { id: 'notes', label: 'My Notes', icon: StickyNote },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'certificates', label: 'Certificates', icon: Shield },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Filter notes by search term
  const filteredNotes = myNotes.filter(note => {
    const search = notesSearchTerm.toLowerCase()
    return (
      note.content.toLowerCase().includes(search) ||
      note.session?.lesson?.name?.toLowerCase().includes(search) ||
      note.session?.course?.name?.toLowerCase().includes(search)
    )
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a5f] text-white flex flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Logo */}
        <div className="p-4 border-b border-[#2d5a87]">
          <div className="flex items-center gap-3">
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
              alt="ILM Learning Center" 
              className={`${sidebarOpen ? 'h-10' : 'h-8'} transition-all`}
            />
          </div>
          {sidebarOpen && (
            <p className="text-blue-200 text-xs mt-2">Student Portal</p>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                {item.hasDropdown ? (
                  // Dropdown menu for My Enrollments
                  <div>
                    <button
                      onClick={() => {
                        setEnrollmentsOpen(!enrollmentsOpen)
                        if (!enrollmentsOpen) setActiveTab('enrollments')
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                        activeTab === 'enrollments' 
                          ? 'bg-[#f7941d] text-white' 
                          : 'text-blue-200 hover:bg-[#2d5a87]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </div>
                      {sidebarOpen && (
                        enrollmentsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {enrollmentsOpen && sidebarOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        <button
                          onClick={() => { setActiveTab('enrollments'); setEnrollmentsTab('programs') }}
                          className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                            activeTab === 'enrollments' && enrollmentsTab === 'programs'
                              ? 'bg-[#2d5a87] text-white'
                              : 'text-blue-200 hover:bg-[#2d5a87]'
                          }`}
                        >
                          <Folder className="w-4 h-4" />
                          Programs
                        </button>
                        <button
                          onClick={() => { setActiveTab('enrollments'); setEnrollmentsTab('courses') }}
                          className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                            activeTab === 'enrollments' && enrollmentsTab === 'courses'
                              ? 'bg-[#2d5a87] text-white'
                              : 'text-blue-200 hover:bg-[#2d5a87]'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          Courses
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === item.id 
                        ? 'bg-[#f7941d] text-white' 
                        : 'text-blue-200 hover:bg-[#2d5a87]'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#2d5a87]">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-white font-medium text-sm">{user.profile?.firstName} {user.profile?.lastName}</p>
              <p className="text-blue-200 text-xs">Student</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-blue-200 hover:bg-[#2d5a87] rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm">
                Welcome, {user.profile?.firstName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#1e3a5f]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Folder className="w-6 h-6 text-[#1e3a5f]" />
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{myProgramEnrollments.length}</p>
                      )}
                      <p className="text-gray-600 text-sm">Enrolled Programs</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{myCourseEnrollments.length}</p>
                      )}
                      <p className="text-gray-600 text-sm">Enrolled Courses</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#f7941d]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#f7941d]" />
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{upcomingSessions.length}</p>
                      )}
                      <p className="text-gray-600 text-sm">Upcoming Classes</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      )}
                      <p className="text-gray-600 text-sm">Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActiveTab('courses')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">My Courses</p>
                      <p className="text-sm text-gray-500">View enrolled courses</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-[#f7941d] rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Schedule</p>
                      <p className="text-sm text-gray-500">View class schedule</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('grades')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Grades</p>
                      <p className="text-sm text-gray-500">View your grades</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Courses */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
                  <button 
                    onClick={() => setActiveTab('courses')}
                    className="text-[#f7941d] hover:text-[#e8850f] text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No courses yet</p>
                    <p className="text-gray-400 text-sm mt-1">Contact your teacher to get enrolled</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.slice(0, 3).map((course) => (
                      <Link
                        key={course.id}
                        to={`/student/courses/${course.slug || course.id}`}
                        className="border border-gray-200 rounded-lg p-4 hover:border-[#f7941d] hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{course.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            course.type === 'RECORDED' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {course.type === 'RECORDED' ? (
                              <><Video className="w-3 h-3" /> Recorded</>
                            ) : (
                              <><Radio className="w-3 h-3" /> Live</>
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                        <div className="mt-3 text-xs text-gray-400">
                          {course.modules?.length || 0} modules
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Browse Tab - Programs & Courses Toggle */}
          {activeTab === 'browse' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Toggle Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setBrowseTab('programs')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    browseTab === 'programs' 
                      ? 'bg-[#1e3a5f] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Folder className="w-4 h-4 inline mr-2" />
                  Programs
                </button>
                <button
                  onClick={() => setBrowseTab('courses')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    browseTab === 'courses' 
                      ? 'bg-[#1e3a5f] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Courses
                </button>
              </div>

              {/* Browse Programs */}
              {browseTab === 'programs' && (
                <>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                    </div>
                  ) : allPrograms.length === 0 ? (
                    <div className="text-center py-12">
                      <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No programs available</h3>
                      <p className="text-gray-500">Programs will appear here once they are created.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allPrograms.map((program) => (
                        <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex flex-col">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{program.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              program.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
                              program.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
                              program.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
                              program.programType === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {program.programType === 'WEBINAR' ? 'Webinar' :
                               program.programType === 'IN_PERSON' ? 'In-Person' :
                               program.programType === 'EVENT' ? 'Event' :
                               program.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
                            </span>
                          </div>
                          
                          {/* Program Status Badges */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {program.enrollmentEnd && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Enroll by {new Date(program.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                            {program.description?.replace(/<[^>]*>/g, '') || 'No description available'}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                            <span>{program.modules?.length || 0} modules</span>
                            <span className={`font-medium ${!program.price || program.price === 0 ? 'text-green-600' : 'text-[#1e3a5f]'}`}>
                              {!program.price || program.price === 0 ? 'FREE' : `₱${program.price?.toLocaleString()}`}
                            </span>
                          </div>
                          
                          {isEnrolledInProgram(program.id) ? (
                            <button 
                              disabled
                              className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-semibold mt-auto flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" /> Enrolled
                            </button>
                          ) : (
                            <button 
                              onClick={() => setSelectedProgram(program)}
                              className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition mt-auto"
                            >
                              Learn More
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Browse Courses */}
              {browseTab === 'courses' && (
                <>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                    </div>
                  ) : allCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                      <p className="text-gray-500">Courses will appear here once they are created.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allCourses.map((course) => (
                        <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex flex-col">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{course.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                              course.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {course.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                            </span>
                          </div>
                          
                          {/* Course Status Badges */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {course.isUpcoming && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                Starts {new Date(course.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
                              </span>
                            )}
                            {course.enrollmentEnd && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                course.enrollmentOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {course.enrollmentOpen 
                                  ? `Enroll by ${new Date(course.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}`
                                  : 'Enrollment Closed'
                                }
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{course.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                            <span>{course.modules?.length || 0} modules</span>
                            <span>By Sheikh {course.teacher?.user?.profile?.firstName} {course.teacher?.user?.profile?.lastName}</span>
                          </div>
                          {isEnrolledInCourse(course.id) ? (
                            <button 
                              disabled
                              className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-semibold mt-auto flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" /> Enrolled
                            </button>
                          ) : (
                            <button 
                              onClick={() => setSelectedCourse(course)}
                              className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition mt-auto"
                            >
                              Learn More
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* My Enrollments Tab */}
          {activeTab === 'enrollments' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* My Enrolled Programs */}
              {enrollmentsTab === 'programs' && (
                <>
                  {/* Calendar Button - Always visible */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setShowProgramCalendarModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
                    >
                      <Calendar className="w-4 h-4" />
                      View Schedule
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading your programs...</p>
                    </div>
                  ) : myProgramEnrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled programs</h3>
                      <p className="text-gray-500 mb-4">You haven't enrolled in any programs yet.</p>
                      <button 
                        onClick={() => { setActiveTab('browse'); setBrowseTab('programs') }}
                        className="text-[#f7941d] hover:underline font-medium"
                      >
                        Browse Programs →
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myProgramEnrollments.map((enrollment) => {
                        const program = enrollment.program
                        return (
                          <div 
                            key={enrollment.id} 
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#f7941d] transition flex flex-col"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-gray-900">{program.name}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                program.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
                                program.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
                                program.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
                                program.programType === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {program.programType === 'WEBINAR' ? 'Webinar' :
                                 program.programType === 'IN_PERSON' ? 'In-Person' :
                                 program.programType === 'EVENT' ? 'Event' :
                                 program.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
                              </span>
                            </div>
                            
                            {/* Enrolled Badge */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Enrolled
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                              {program.description?.replace(/<[^>]*>/g, '') || 'No description available'}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                              <span>{program.modules?.length || 0} modules</span>
                              {program.schedule && <span>{program.schedule}</span>}
                            </div>
                            
                            <div className="flex gap-2 mt-auto">
                              <button
                                onClick={() => navigate(`/student/programs/${program.id}`)}
                                className="flex-1 py-2 bg-[#f7941d] text-white text-sm rounded-lg hover:bg-[#e8850f] font-medium"
                              >
                                View Program
                              </button>
                              <button
                                onClick={() => setSelectedEnrolledProgram(program)}
                                className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                              >
                                Info
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* My Enrolled Courses */}
              {enrollmentsTab === 'courses' && (
                <>
                  {/* Calendar Button - Always visible */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setShowCalendarModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
                    >
                      <Calendar className="w-4 h-4" />
                      View Schedule
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading your courses...</p>
                    </div>
                  ) : myCourseEnrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
                      <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
                      <button 
                        onClick={() => { setActiveTab('browse'); setBrowseTab('courses') }}
                        className="text-[#f7941d] hover:underline font-medium"
                      >
                        Browse Courses →
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myCourseEnrollments.map((course) => (
                        <div 
                          key={course.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#f7941d] transition flex flex-col"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{course.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                              course.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {course.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                            </span>
                          </div>
                          
                          {/* Enrolled Badge */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Enrolled
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                            {course.description || 'No description available'}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                            <span>{course.modules?.length || 0} modules</span>
                            <span>By Sheikh {course.teacher?.user?.profile?.firstName} {course.teacher?.user?.profile?.lastName}</span>
                          </div>
                          
                          <div className="flex gap-2 mt-auto">
                            <Link
                              to={`/student/courses/${course.slug || course.id}`}
                              className="flex-1 py-2 bg-[#f7941d] text-white text-sm rounded-lg hover:bg-[#e8850f] font-medium text-center"
                            >
                              View Course
                            </Link>
                            <button
                              onClick={() => setSelectedCourse(course)}
                              className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                            >
                              Info
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Your personal notes from classes</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={notesSearchTerm}
                    onChange={(e) => setNotesSearchTerm(e.target.value)}
                    placeholder="Search notes..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none w-64"
                  />
                </div>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {notesSearchTerm ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="text-gray-500">
                    {notesSearchTerm 
                      ? 'Try a different search term' 
                      : 'Your notes from classes will appear here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotes.map(note => (
                    <div key={note.id} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-[#1e3a5f] font-medium">{note.session?.course?.name}</p>
                          <h3 className="font-semibold text-gray-900">{note.session?.lesson?.name || 'Untitled Class'}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {note.session?.date && new Date(note.session.date).toLocaleDateString('en-PH', { 
                              timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => setDeleteNoteConfirm(note.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Last updated: {new Date(note.updatedAt).toLocaleDateString('en-PH', { 
                          timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">My Grades</h2>
                  <p className="text-sm text-gray-500">View your academic performance</p>
                </div>
                <div className="flex items-center gap-3">
                  {gradesData && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Overall GPA</p>
                      <p className="text-2xl font-bold text-[#1e3a5f]">{gradesData.overallGPA.toFixed(2)}</p>
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      setCalculatingGrades(true)
                      try {
                        const studentData = JSON.parse(localStorage.getItem('user'))
                        const student = await axios.get(`${API_URL}/users/me`, {
                          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        })
                        await calculateAllGrades(student.data.student.id)
                        const grades = await getStudentGrades(student.data.student.id)
                        setGradesData(grades)
                        toast.success('Grades calculated successfully!')
                      } catch (error) {
                        console.error('Error calculating grades:', error)
                        toast.error('Failed to calculate grades')
                      } finally {
                        setCalculatingGrades(false)
                      }
                    }}
                    disabled={calculatingGrades}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {calculatingGrades ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        Calculate Grades
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loadingGrades ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading grades...</p>
                </div>
              ) : !gradesData ? (
                <div className="py-12 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No grades calculated yet</p>
                  <p className="text-sm text-gray-400">Click "Calculate Grades" to view your academic performance</p>
                </div>
              ) : gradesData.totalGrades === 0 ? (
                <div className="py-12 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No grades available</p>
                  <p className="text-sm text-gray-400">Complete exams and attend classes to earn grades</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {gradesData.courseGrades.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Course Grades</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gradesData.courseGrades.map(grade => (
                          <div key={grade.id} className="border rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{grade.course?.name || 'Unknown Course'}</h4>
                                <p className="text-sm text-gray-500">{grade.course?.type || 'N/A'}</p>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${
                                  grade.letterGrade === 'A' || grade.letterGrade === 'A-' ? 'text-green-600' :
                                  grade.letterGrade.startsWith('B') ? 'text-blue-600' :
                                  grade.letterGrade.startsWith('C') ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {grade.letterGrade}
                                </div>
                                <p className="text-sm text-gray-500">{grade.finalGrade.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">Exam Score</p>
                                <p className="font-medium text-gray-900">{grade.examScore.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Attendance</p>
                                <p className="font-medium text-gray-900">{grade.attendanceScore.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">GPA</span>
                                <span className="font-semibold text-[#1e3a5f]">{grade.gpa.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gradesData.programGrades.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Program Grades</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gradesData.programGrades.map(grade => (
                          <div key={grade.id} className="border rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{grade.program?.name || 'Unknown Program'}</h4>
                                <p className="text-sm text-gray-500">{grade.program?.programType || 'N/A'}</p>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${
                                  grade.letterGrade === 'A' || grade.letterGrade === 'A-' ? 'text-green-600' :
                                  grade.letterGrade.startsWith('B') ? 'text-blue-600' :
                                  grade.letterGrade.startsWith('C') ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {grade.letterGrade}
                                </div>
                                <p className="text-sm text-gray-500">{grade.finalGrade.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">Exam Score</p>
                                <p className="font-medium text-gray-900">{grade.examScore.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Attendance</p>
                                <p className="font-medium text-gray-900">{grade.attendanceScore.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">GPA</span>
                                <span className="font-semibold text-[#1e3a5f]">{grade.gpa.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">My Certificates</h2>
                  <p className="text-sm text-gray-500">View and download your earned certificates</p>
                </div>
                <button
                  onClick={async () => {
                    setLoadingCertificates(true)
                    try {
                      const certs = await getMyCertificates()
                      setCertificates(certs)
                    } catch (error) {
                      console.error('Error fetching certificates:', error)
                      toast.error('Failed to load certificates')
                    } finally {
                      setLoadingCertificates(false)
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
                >
                  <Shield className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {loadingCertificates ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading certificates...</p>
                </div>
              ) : certificates.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No certificates yet</p>
                  <p className="text-sm text-gray-400">Complete courses and programs to earn certificates</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map(cert => (
                    <div key={cert.id} className="border-2 border-[#f7941d] rounded-xl p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-[#f7941d]" />
                            <span className="text-xs font-semibold text-[#f7941d] uppercase tracking-wide">
                              Certificate
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {cert.courseOffering?.masterCourse?.title || cert.programOffering?.masterProgram?.title || 'Certificate'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {cert.courseOffering ? 'Course Certificate' : 'Program Certificate'}
                            {(cert.courseOffering?.semester || cert.programOffering?.semester) && (
                              <span className="ml-1 text-gray-400">· {(cert.courseOffering?.semester || cert.programOffering?.semester)?.name}</span>
                            )}
                          </p>
                        </div>
                        {cert.grade && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#1e3a5f]">{cert.grade}</div>
                            {cert.gpa && (
                              <div className="text-xs text-gray-500">GPA: {cert.gpa.toFixed(2)}</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Certificate No:</span>
                          <span className="font-mono font-semibold text-gray-900">{cert.certificateNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Issued:</span>
                          <span className="text-gray-900">
                            {new Date(cert.issuedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Completed:</span>
                          <span className="text-gray-900">
                            {new Date(cert.completionDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t flex items-center gap-3">
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
                        >
                          <Download className="w-4 h-4" />
                          Download / View
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cert.certificateNumber)
                            toast.success('Certificate number copied!')
                          }}
                          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition"
                        >
                          Copy #
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Messages</h2>
              <p className="text-gray-500 mb-4">Coming Soon</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                You'll be able to send and receive messages from your teachers and classmates here.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>
              <p className="text-gray-500">Settings coming soon...</p>
            </div>
          )}
        </main>
      </div>

      {/* Browse Program Modal - Learn More & Enroll */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-start justify-between flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProgram.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    selectedProgram.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
                    selectedProgram.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
                    selectedProgram.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
                    selectedProgram.programType === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedProgram.programType === 'WEBINAR' ? 'Webinar' :
                     selectedProgram.programType === 'IN_PERSON' ? 'In-Person' :
                     selectedProgram.programType === 'EVENT' ? 'Event' :
                     selectedProgram.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
                  </span>
                </div>
                <p className="text-gray-500">
                  {!selectedProgram.price || selectedProgram.price === 0 
                    ? <span className="text-green-600 font-medium">FREE</span>
                    : <span className="text-[#1e3a5f] font-medium">₱{selectedProgram.price?.toLocaleString()}{selectedProgram.priceType === 'MONTHLY' ? '/month' : selectedProgram.priceType === 'YEARLY' ? '/year' : ''}</span>
                  }
                </p>
              </div>
              <button 
                onClick={() => setSelectedProgram(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Program Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedProgram.enrollmentEnd && (
                  <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                    Enroll by {new Date(selectedProgram.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
                  </span>
                )}
              </div>

              {/* Program Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Folder className="w-4 h-4 text-[#1e3a5f]" />
                  <span>{selectedProgram.modules?.length || 0} modules</span>
                </div>
                {selectedProgram.startDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Starts: {new Date(selectedProgram.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</span>
                  </div>
                )}
                {selectedProgram.endDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Ends: {new Date(selectedProgram.endDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</span>
                  </div>
                )}
                {selectedProgram.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-[#1e3a5f]" />
                    <span>{selectedProgram.location}</span>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About this program</h3>
                <div 
                  className="text-gray-600"
                  dangerouslySetInnerHTML={{ __html: selectedProgram.description || 'No description available.' }}
                />
              </div>

              {/* Modules Preview */}
              {selectedProgram.modules && selectedProgram.modules.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Program Content</h3>
                  <div className="space-y-2">
                    {selectedProgram.modules.slice(0, 5).map((module, idx) => (
                      <div key={module.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-xs font-medium">{idx + 1}</span>
                        <span className="text-gray-700">{module.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{module.lessons?.length || 0} lessons</span>
                      </div>
                    ))}
                    {selectedProgram.modules.length > 5 && (
                      <p className="text-sm text-gray-500 text-center py-2">+ {selectedProgram.modules.length - 5} more modules</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button 
                onClick={() => setSelectedProgram(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button 
                onClick={async () => {
                  await handleEnrollProgram(selectedProgram.id)
                  setSelectedProgram(null)
                }}
                disabled={enrollingId === selectedProgram.id}
                className="flex-1 bg-[#f7941d] hover:bg-[#e8850f] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {enrollingId === selectedProgram.id ? 'Enrolling...' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Course Modal - Learn More & Enroll */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-start justify-between flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                    selectedCourse.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {selectedCourse.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                  </span>
                </div>
                {selectedCourse.teacher && (
                  <p className="text-gray-500">By Sheikh {selectedCourse.teacher?.user?.profile?.firstName} {selectedCourse.teacher?.user?.profile?.lastName}</p>
                )}
              </div>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Course Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCourse.isUpcoming && (
                  <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    Starts {new Date(selectedCourse.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
                  </span>
                )}
                {selectedCourse.enrollmentEnd && (
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    selectedCourse.enrollmentOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedCourse.enrollmentOpen 
                      ? `Enroll by ${new Date(selectedCourse.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}`
                      : 'Enrollment Closed'
                    }
                  </span>
                )}
              </div>

              {/* Course Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
                  <span>{selectedCourse.modules?.length || 0} modules</span>
                </div>
                {selectedCourse.startDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Starts: {new Date(selectedCourse.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</span>
                  </div>
                )}
                {selectedCourse.endDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Ends: {new Date(selectedCourse.endDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</span>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About this course</h3>
                <p className="text-gray-600">{selectedCourse.description || 'No description available.'}</p>
              </div>

              {/* Modules Preview */}
              {selectedCourse.modules && selectedCourse.modules.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Course Content</h3>
                  <div className="space-y-2">
                    {selectedCourse.modules.slice(0, 5).map((module, idx) => (
                      <div key={module.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-xs font-medium">{idx + 1}</span>
                        <span className="text-gray-700">{module.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{module.lessons?.length || 0} lessons</span>
                      </div>
                    ))}
                    {selectedCourse.modules.length > 5 && (
                      <p className="text-sm text-gray-500 text-center py-2">+ {selectedCourse.modules.length - 5} more modules</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button 
                onClick={() => setSelectedCourse(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Close
              </button>
              {!selectedCourse.enrollmentOpen ? (
                <button 
                  disabled
                  className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Enrollment Closed
                </button>
              ) : (
                <button 
                  onClick={async () => {
                    await handleEnrollCourse(selectedCourse.id)
                    setSelectedCourse(null)
                  }}
                  disabled={enrollingId === selectedCourse.id}
                  className="flex-1 bg-[#f7941d] hover:bg-[#e8850f] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {enrollingId === selectedCourse.id ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Program Modal - View Details */}
      {selectedEnrolledProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header with Image */}
            {selectedEnrolledProgram.image ? (
              <div className="h-48 relative flex-shrink-0">
                <img src={selectedEnrolledProgram.image} alt={selectedEnrolledProgram.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedEnrolledProgram(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center relative flex-shrink-0">
                <Folder className="w-20 h-20 text-white/50" />
                <button 
                  onClick={() => setSelectedEnrolledProgram(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEnrolledProgram.name}</h2>
                  <p className="text-green-600 text-sm font-medium flex items-center gap-1 mt-1">
                    <CheckCircle className="w-4 h-4" /> You are enrolled
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ${
                  selectedEnrolledProgram.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
                  selectedEnrolledProgram.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
                  selectedEnrolledProgram.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
                  selectedEnrolledProgram.programType === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedEnrolledProgram.programType === 'WEBINAR' ? 'Webinar' :
                   selectedEnrolledProgram.programType === 'IN_PERSON' ? 'In-Person' :
                   selectedEnrolledProgram.programType === 'EVENT' ? 'Event' :
                   selectedEnrolledProgram.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
                </span>
              </div>

              {/* Schedule, Location, Meeting Link */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                {selectedEnrolledProgram.schedule && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-[#1e3a5f]" />
                    <div>
                      <p className="text-xs text-gray-500">Schedule</p>
                      <p className="font-medium">{selectedEnrolledProgram.schedule}</p>
                    </div>
                  </div>
                )}
                {selectedEnrolledProgram.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-[#1e3a5f]" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium">{selectedEnrolledProgram.location}</p>
                    </div>
                  </div>
                )}
                {selectedEnrolledProgram.meetingLink && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <Video className="w-5 h-5 text-[#1e3a5f] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Meeting Link</p>
                      <a 
                        href={selectedEnrolledProgram.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1e3a5f] hover:underline font-medium break-all"
                      >
                        {selectedEnrolledProgram.meetingLink}
                      </a>
                    </div>
                  </div>
                )}
                {!selectedEnrolledProgram.schedule && !selectedEnrolledProgram.location && !selectedEnrolledProgram.meetingLink && (
                  <p className="text-gray-500 text-sm">No schedule or location details available yet.</p>
                )}
              </div>

              {/* Full Description */}
              <div 
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: selectedEnrolledProgram.description || 'No description available.' }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button 
                onClick={() => setSelectedEnrolledProgram(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Close
              </button>
              {selectedEnrolledProgram.meetingLink && (
                <a 
                  href={selectedEnrolledProgram.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Join Meeting
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Schedule Calendar */}
      <SessionCalendar
        sessions={allCourseSessions}
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title="Course Schedule"
        subtitle="All your course sessions"
        accentColor="purple"
        type="course"
        onJoinSession={async (session) => {
          try {
            await markJoinAttendance(session.id)
          } catch (error) {
            console.error('Failed to mark attendance:', error)
          }
          window.open(session.meetingLink, '_blank')
        }}
        onTakeExam={(session) => {
          navigate(`/student/courses/${session.course?.slug || session.course?.id}/exam/${session.examId}?sessionId=${session.id}`)
        }}
      />

      {/* Program Schedule Calendar */}
      <SessionCalendar
        sessions={allProgramSessionsData}
        isOpen={showProgramCalendarModal}
        onClose={() => setShowProgramCalendarModal(false)}
        title="Program Schedule"
        subtitle="All your program sessions"
        accentColor="green"
        type="program"
        onJoinSession={async (session) => {
          try {
            await joinProgramSession(session.id)
          } catch (error) {
            console.error('Failed to mark attendance:', error)
          }
          window.open(session.meetingLink, '_blank')
        }}
        onTakeExam={(session) => {
          navigate(`/student/programs/${session.program?.id}/exam/${session.examId}?sessionId=${session.id}`)
        }}
      />

      {/* Delete Note Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteNoteConfirm}
        onClose={() => setDeleteNoteConfirm(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
      />

      {/* Today's Classes Popup */}
      {showTodayPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">You have classes today!</h2>
              <p className="text-blue-200 mt-1">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} scheduled</p>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto">
              {todaySessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2 last:mb-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    session.course?.type === 'LIVE' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {session.course?.type === 'LIVE' ? (
                      <Radio className="w-5 h-5 text-red-600" />
                    ) : (
                      <Video className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{session.course?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      {session.lesson?.name && ` • ${session.lesson.name}`}
                    </p>
                  </div>
                  {session.meetingLink && (
                    <button
                      onClick={async () => {
                        try {
                          await markJoinAttendance(session.id)
                        } catch (e) {
                          console.error('Failed to mark attendance:', e)
                        }
                        window.open(session.meetingLink, '_blank')
                      }}
                      className="px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white text-sm rounded-lg font-medium transition"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => setShowTodayPopup(false)}
                className="w-full px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
