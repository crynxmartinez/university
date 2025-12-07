import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Video, Radio, LayoutDashboard, GraduationCap, Calendar, Settings, Menu, Award, Folder, MapPin, Globe, ExternalLink, Search, ChevronDown, ChevronRight, CheckCircle, X, Clock, FileText, StickyNote, Edit3, Trash2 } from 'lucide-react'
import { getMyCourses, selfEnrollInCourse } from '../../api/enrollments'
import { getStudentPrograms } from '../../api/programs'
import { getMyProgramEnrollments, enrollInProgram } from '../../api/programEnrollments'
import { getUpcomingSessions } from '../../api/sessions'
import { getMyNotes, saveNote, deleteNote } from '../../api/notes'
import { markJoinAttendance } from '../../api/attendance'
import { useToast, ConfirmModal } from '../../components/Toast'
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
  const [selectedEnrolledProgram, setSelectedEnrolledProgram] = useState(null) // For enrolled modal
  const [showCalendarModal, setShowCalendarModal] = useState(false) // For course schedule calendar
  const [upcomingSessions, setUpcomingSessions] = useState([]) // Upcoming sessions from enrolled courses
  const [selectedSession, setSelectedSession] = useState(null) // For viewing session materials
  const [myNotes, setMyNotes] = useState([]) // Student's personal notes
  const [notesSearchTerm, setNotesSearchTerm] = useState('')
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState(null)
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
      } catch (e) {
        console.error('Failed to fetch sessions:', e)
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
      // Remove from browse list
      setAllCourses(prev => prev.filter(c => c.id !== courseId))
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
                      <p className="text-2xl font-bold text-gray-900">{myProgramEnrollments.length}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{myCourseEnrollments.length}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{myProgramEnrollments.filter(e => e.program?.schedule).length}</p>
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
                      <p className="text-2xl font-bold text-gray-900">0</p>
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
                        to={`/student/courses/${course.id}`}
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allPrograms.map((program) => (
                        <div key={program.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group flex flex-col">
                          {program.image ? (
                            <div className="h-40 overflow-hidden flex-shrink-0">
                              <img src={program.image} alt={program.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            </div>
                          ) : (
                            <div className="h-40 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center flex-shrink-0">
                              <Folder className="w-16 h-16 text-white/50" />
                            </div>
                          )}
                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{program.name}</h3>
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
                            
                            {(program.schedule || program.location) && (
                              <div className="text-xs text-gray-500 mb-3 space-y-1">
                                {program.schedule && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{program.schedule}</span>
                                  </div>
                                )}
                                {program.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{program.location}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                              {program.description?.replace(/<[^>]*>/g, '') || 'No description available'}
                            </p>
                            
                            <div className="mt-auto">
                              <div className={`rounded-lg p-3 mb-4 ${!program.price || program.price === 0 ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                                <p className={`text-xs font-medium ${!program.price || program.price === 0 ? 'text-green-600' : 'text-[#1e3a5f]'}`}>Program Fee</p>
                                {!program.price || program.price === 0 ? (
                                  <p className="text-2xl font-bold text-green-600">FREE</p>
                                ) : (
                                  <p className="text-2xl font-bold text-[#1e3a5f]">
                                    ₱{program.price?.toLocaleString()}
                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                      {program.priceType === 'MONTHLY' ? '/month' : program.priceType === 'YEARLY' ? '/year' : ''}
                                    </span>
                                  </p>
                                )}
                              </div>
                              
                              {isEnrolledInProgram(program.id) ? (
                                <button disabled className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Enrolled
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setSelectedProgram(program)}
                                  className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition"
                                >
                                  Learn More
                                </button>
                              )}
                            </div>
                          </div>
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
                          ) : !course.enrollmentOpen ? (
                            <button 
                              disabled
                              className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg font-semibold mt-auto cursor-not-allowed"
                            >
                              Enrollment Closed
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleEnrollCourse(course.id)}
                              disabled={enrollingId === course.id}
                              className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition mt-auto disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {enrollingId === course.id ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Enrolling...</>
                              ) : (
                                'Enroll Now'
                              )}
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
                  {myProgramEnrollments.length === 0 ? (
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myProgramEnrollments.map((enrollment) => {
                        const program = enrollment.program
                        return (
                          <div 
                            key={enrollment.id} 
                            onClick={() => setSelectedEnrolledProgram(program)}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#f7941d] transition group cursor-pointer flex flex-col"
                          >
                            {program.image ? (
                              <div className="h-40 overflow-hidden flex-shrink-0">
                                <img src={program.image} alt={program.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                              </div>
                            ) : (
                              <div className="h-40 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center flex-shrink-0">
                                <Folder className="w-16 h-16 text-white/50" />
                              </div>
                            )}
                            <div className="p-5 flex flex-col flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{program.name}</h3>
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
                              
                              <div className="flex-1">
                                {(program.schedule || program.location) && (
                                  <div className="text-xs text-gray-500 space-y-1">
                                    {program.schedule && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{program.schedule}</span>
                                      </div>
                                    )}
                                    {program.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{program.location}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-sm text-[#f7941d] font-medium mt-3">Click to view details →</p>
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

                  {myCourseEnrollments.length === 0 ? (
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myCourseEnrollments.map((course) => {
                        const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
                        return (
                          <Link
                            key={course.id}
                            to={`/student/courses/${course.id}`}
                            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group"
                          >
                            {/* Card Header with Gradient */}
                            <div className={`h-24 relative ${
                              course.type === 'LIVE' 
                                ? 'bg-gradient-to-r from-purple-600 to-purple-400' 
                                : 'bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87]'
                            }`}>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                                  {course.type === 'RECORDED' ? (
                                    <Video className="w-7 h-7 text-white" />
                                  ) : (
                                    <Radio className="w-7 h-7 text-white" />
                                  )}
                                </div>
                              </div>
                              {/* Type Badge */}
                              <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-medium ${
                                course.type === 'RECORDED' 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-white/20 text-white'
                              }`}>
                                {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
                              </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                              <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-[#f7941d] transition">
                                {course.name}
                              </h3>
                              
                              {/* Teacher */}
                              <p className="text-sm text-gray-500 mb-3">
                                By Sheikh {course.teacher?.user?.profile?.firstName} {course.teacher?.user?.profile?.lastName}
                              </p>

                              {/* Description */}
                              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                {course.description || 'No description'}
                              </p>

                              {/* Stats */}
                              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                                <span className="flex items-center gap-1">
                                  <Folder className="w-4 h-4" />
                                  {course.modules?.length || 0} modules
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {totalLessons} lessons
                                </span>
                              </div>

                              {/* Continue Button */}
                              <div className="mt-4">
                                <span className="w-full flex items-center justify-center gap-2 bg-[#f7941d] group-hover:bg-[#e8850f] text-white py-2.5 rounded-lg font-medium transition">
                                  <ExternalLink className="w-4 h-4" />
                                  Continue Learning
                                </span>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-6">My Grades</h2>
              <p className="text-gray-500">Grades coming soon...</p>
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
            {/* Modal Header with Image */}
            {selectedProgram.image ? (
              <div className="h-48 relative flex-shrink-0">
                <img src={selectedProgram.image} alt={selectedProgram.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center relative flex-shrink-0">
                <Folder className="w-20 h-20 text-white/50" />
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProgram.name}</h2>
                <span className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ${
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

              {/* Schedule & Location */}
              {(selectedProgram.schedule || selectedProgram.location) && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  {selectedProgram.schedule && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-[#1e3a5f]" />
                      <span>{selectedProgram.schedule}</span>
                    </div>
                  )}
                  {selectedProgram.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-[#1e3a5f]" />
                      <span>{selectedProgram.location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Full Description */}
              <div 
                className="prose prose-sm max-w-none text-gray-600 mb-6"
                dangerouslySetInnerHTML={{ __html: selectedProgram.description || 'No description available.' }}
              />

              {/* Price */}
              <div className={`rounded-lg p-4 mb-6 ${!selectedProgram.price || selectedProgram.price === 0 ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm font-medium ${!selectedProgram.price || selectedProgram.price === 0 ? 'text-green-600' : 'text-[#1e3a5f]'}`}>Program Fee</p>
                {!selectedProgram.price || selectedProgram.price === 0 ? (
                  <p className="text-3xl font-bold text-green-600">FREE</p>
                ) : (
                  <p className="text-3xl font-bold text-[#1e3a5f]">
                    ₱{selectedProgram.price?.toLocaleString()}
                    <span className="text-base font-normal text-gray-500 ml-1">
                      {selectedProgram.priceType === 'MONTHLY' ? '/month' : selectedProgram.priceType === 'YEARLY' ? '/year' : ''}
                    </span>
                  </p>
                )}
              </div>
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

      {/* Course Schedule Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Course Schedule</h2>
                  <p className="text-sm text-gray-500">Your upcoming LIVE sessions</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                  <p className="text-gray-500">You don't have any scheduled LIVE sessions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => {
                    const sessionDate = new Date(session.date)
                    const isToday = sessionDate.toDateString() === new Date().toDateString()
                    const isTomorrow = sessionDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
                    
                    // Link visibility logic: 1 hour before start → 1 hour after end
                    const now = new Date()
                    const [startHour, startMin] = (session.startTime || '00:00').split(':').map(Number)
                    const [endHour, endMin] = (session.endTime || '23:59').split(':').map(Number)
                    
                    const sessionStart = new Date(sessionDate)
                    sessionStart.setHours(startHour, startMin, 0, 0)
                    const sessionEnd = new Date(sessionDate)
                    sessionEnd.setHours(endHour, endMin, 0, 0)
                    
                    const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000)
                    const oneHourAfter = new Date(sessionEnd.getTime() + 60 * 60 * 1000)
                    
                    const isLinkVisible = now >= oneHourBefore && now <= oneHourAfter
                    const isClassEnded = now > oneHourAfter
                    
                    return (
                      <div 
                        key={session.id} 
                        className={`border rounded-lg p-4 ${
                          isClassEnded ? 'border-gray-200 bg-gray-50' :
                          session.type === 'EXAM' ? 'border-red-200 bg-red-50' :
                          'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Course Name & Session Type */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                                isClassEnded ? 'bg-gray-400' :
                                session.type === 'EXAM' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}>
                                {isClassEnded ? 'ENDED' : session.type}
                              </span>
                              {!isClassEnded && isToday && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">TODAY</span>}
                              {!isClassEnded && isTomorrow && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500 text-white">TOMORROW</span>}
                            </div>
                            
                            <h3 className="font-semibold text-gray-900">{session.course?.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {session.lesson?.name || 'Untitled'}
                            </p>
                            
                            {/* Date & Time */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {sessionDate.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {session.startTime}{session.endTime && ` - ${session.endTime}`}
                              </div>
                            </div>
                            
                            {/* Notes */}
                            {session.notes && (
                              <p className="text-sm text-gray-500 mt-2 italic">{session.notes}</p>
                            )}
                            
                            {/* Lesson Materials (from template) */}
                            {session.lesson?.materials && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-2">Lesson Materials</p>
                                <p className="text-xs text-gray-600">{session.lesson.materials}</p>
                              </div>
                            )}
                            
                            {/* Session Materials (date-specific) */}
                            {session.materials?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-2">Session Materials ({session.materials.length})</p>
                                <div className="flex flex-wrap gap-2">
                                  {session.materials.map(material => (
                                    <a
                                      key={material.id}
                                      href={material.driveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50 text-gray-700"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {material.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Join Button - with visibility logic */}
                          <div className="ml-4 flex-shrink-0">
                            {isClassEnded ? (
                              <span className="text-xs text-gray-500 bg-gray-200 px-3 py-2 rounded-lg">
                                Class ended
                              </span>
                            ) : session.meetingLink ? (
                              isLinkVisible ? (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await markJoinAttendance(session.id)
                                    } catch (error) {
                                      console.error('Failed to mark attendance:', error)
                                    }
                                    window.open(session.meetingLink, '_blank')
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white text-sm rounded-lg font-medium transition"
                                >
                                  <Video className="w-4 h-4" />
                                  Join
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg block text-center">
                                  Link available<br/>1hr before class
                                </span>
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex-shrink-0">
              <button 
                onClick={() => setShowCalendarModal(false)}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
