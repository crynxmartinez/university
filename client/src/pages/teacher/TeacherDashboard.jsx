import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Users, Plus, LayoutDashboard, GraduationCap, Settings, Menu, Calendar, Video, Radio, ExternalLink, MessageSquare, TrendingUp, AlertTriangle, Search, ChevronDown, ChevronLeft, ChevronRight, X, Clock, Info, Shield, Award } from 'lucide-react'
import { getCourses } from '../../api/courses'
import { getTeacherAnalytics } from '../../api/enrollments'
import { getTeacherSchedule } from '../../api/sessions'
import { getCourseGrades } from '../../api/exams'
import { getCourseStudentGrades } from '../../api/grades'
import { issueCertificate } from '../../api/certificates'
import { useToast } from '../../components/Toast'
import SessionCalendar from '../../components/SessionCalendar'

export default function TeacherDashboard() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  // Analytics state
  const [analytics, setAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Schedule state
  const [schedule, setSchedule] = useState(null)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [showTodayPopup, setShowTodayPopup] = useState(false)
  const [todaySessions, setTodaySessions] = useState([])
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState(null)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendarView, setCalendarView] = useState('list') // 'list' or 'calendar'

  // Grades state
  const [selectedGradeCourse, setSelectedGradeCourse] = useState(null)
  const [gradesData, setGradesData] = useState(null)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [issuingCertificate, setIssuingCertificate] = useState(null)
  const toast = useToast()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/login')
      return
    }
    
    const userData = JSON.parse(storedUser)
    if (userData.role !== 'TEACHER') {
      navigate('/login')
      return
    }
    
    setUser(userData)
    fetchCourses()
  }, [navigate])

  const fetchCourses = async () => {
    try {
      const data = await getCourses()
      setCourses(data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch analytics when students tab is active
  useEffect(() => {
    if (activeTab === 'students' && !analytics) {
      fetchAnalytics()
    }
  }, [activeTab])

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const data = await getTeacherAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Filter students based on search and filters
  const filteredStudents = analytics?.students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    const matchesCourse = courseFilter === 'all' || student.courses.some(c => c.id === courseFilter)
    return matchesSearch && matchesStatus && matchesCourse
  }) || []

  // Fetch schedule on mount (for badge) and when schedule tab is active
  useEffect(() => {
    fetchSchedule()
  }, [])

  useEffect(() => {
    if (activeTab === 'schedule' && !schedule) {
      fetchSchedule()
    }
  }, [activeTab])

  // Fetch grades when a course is selected
  const handleSelectGradeCourse = async (course) => {
    setSelectedGradeCourse(course)
    setLoadingGrades(true)
    try {
      const students = await getCourseStudentGrades(course.id)
      setGradesData({ students })
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoadingGrades(false)
    }
  }

  const fetchSchedule = async () => {
    setLoadingSchedule(true)
    try {
      const data = await getTeacherSchedule()
      setSchedule(data.sessions)
      setTodayCount(data.todayCount)
      
      // Show popup if there are classes today (only on first load)
      if (data.todayCount > 0 && !sessionStorage.getItem('teacherTodayPopupShown')) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        
        const sessionsToday = data.sessions.filter(s => {
          const sessionDate = new Date(s.date)
          return sessionDate >= today && sessionDate <= todayEnd
        })
        
        setTodaySessions(sessionsToday)
        setShowTodayPopup(true)
        sessionStorage.setItem('teacherTodayPopupShown', 'true')
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    } finally {
      setLoadingSchedule(false)
    }
  }

  // Group sessions by date
  const groupSessionsByDate = (sessions) => {
    if (!sessions) return {}
    
    const groups = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.date)
      sessionDate.setHours(0, 0, 0, 0)
      
      let label
      if (sessionDate.getTime() === today.getTime()) {
        label = 'Today'
      } else if (sessionDate.getTime() === tomorrow.getTime()) {
        label = 'Tomorrow'
      } else {
        label = sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      }
      
      if (!groups[label]) {
        groups[label] = []
      }
      groups[label].push(session)
    })
    
    return groups
  }

  const groupedSessions = groupSessionsByDate(schedule)

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() // 0 = Sunday
    
    const days = []
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const formatDateStr = (date) => {
    // Format as YYYY-MM-DD in local timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getSessionsForDay = (date) => {
    if (!date || !schedule) return []
    const dateStr = formatDateStr(date)
    
    return schedule.filter(s => {
      // Parse session date and format in local timezone
      const sessionDate = new Date(s.date)
      const sessionDateStr = formatDateStr(sessionDate)
      return sessionDateStr === dateStr
    })
  }

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const calendarDays = getDaysInMonth(currentMonth)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar, badge: todayCount },
    { id: 'grades', label: 'Grades', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

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
            <p className="text-blue-200 text-xs mt-2">Teacher Portal</p>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === item.id 
                      ? 'bg-[#f7941d] text-white' 
                      : 'text-blue-200 hover:bg-[#2d5a87]'
                  }`}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.badge > 0 && !sidebarOpen && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  {sidebarOpen && (
                    <span className="flex-1 flex items-center justify-between">
                      {item.label}
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#2d5a87]">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-white font-medium text-sm">{user.profile?.firstName} {user.profile?.lastName}</p>
              <p className="text-blue-200 text-xs">Teacher</p>
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
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#1e3a5f]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-[#1e3a5f]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                      <p className="text-gray-600 text-sm">My Courses</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#f7941d]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-[#f7941d]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-gray-600 text-sm">Total Students</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-gray-600 text-sm">Upcoming Classes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <Link 
                    to="/teacher/courses/create"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition"
                  >
                    <div className="w-10 h-10 bg-[#f7941d] rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create Course</p>
                      <p className="text-sm text-gray-500">Add new course</p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => setActiveTab('courses')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">View Courses</p>
                      <p className="text-sm text-gray-500">Manage courses</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('students')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">View Students</p>
                      <p className="text-sm text-gray-500">Enrolled students</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Courses */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
                  <button 
                    onClick={() => setActiveTab('courses')}
                    className="text-[#f7941d] hover:text-[#e8850f] text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No courses yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.slice(0, 3).map((course) => (
                      <Link
                        key={course.id}
                        to={`/teacher/courses/${course.slug || course.id}/dashboard`}
                        className="border border-gray-200 rounded-lg p-4 hover:border-[#f7941d] hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{course.name}</h3>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              course.type === 'RECORDED' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              course.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {course.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{course.description || 'No description'}</p>
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

          {activeTab === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
                <Link
                  to="/teacher/courses/create"
                  className="flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-4 py-2 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </Link>
              </div>

              {loading ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-500 mb-4">Create your first course to get started</p>
                  <Link
                    to="/teacher/courses/create"
                    className="inline-flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-6 py-3 rounded-lg transition"
                  >
                    <Plus className="w-5 h-5" />
                    Create Course
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col"
                    >
                      {/* Course Header */}
                      <div className={`h-2 ${course.type === 'LIVE' ? 'bg-purple-500' : 'bg-[#1e3a5f]'}`}></div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        {/* Type & Status Badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            course.type === 'RECORDED' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {course.type === 'RECORDED' ? <Video className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                            {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            course.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {course.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Course Name */}
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">{course.name}</h3>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                          {course.description || 'No description'}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span>{course.modules?.length || 0} modules</span>
                          {course.type === 'LIVE' && (
                            <span>{course.sessions?.length || 0} sessions</span>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="pt-4 border-t mt-auto">
                          <Link
                            to={`/teacher/courses/${course.slug || course.id}/dashboard`}
                            className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-2 px-3 rounded-lg text-sm font-medium transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Dashboard
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              {loadingAnalytics ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Students</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalStudents}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Enrollments</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalEnrollments}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Avg Attendance</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.summary.avgAttendance}%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">At-Risk Students</p>
                          <p className="text-3xl font-bold text-red-600">{analytics.summary.atRiskCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                          />
                        </div>
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="good">Good (≥80%)</option>
                        <option value="warning">Warning (50-79%)</option>
                        <option value="at_risk">At Risk (&lt;50%)</option>
                      </select>
                      <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                      >
                        <option value="all">All Courses</option>
                        {analytics.courses.map(course => (
                          <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Students Table */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {filteredStudents.length === 0 ? (
                      <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No students found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-bold">
                                      {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{student.name}</p>
                                      <p className="text-sm text-gray-500">{student.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-gray-900">{student.totalEnrollments} course{student.totalEnrollments !== 1 ? 's' : ''}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          student.overallAttendance >= 80 ? 'bg-green-500' : 
                                          student.overallAttendance >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${student.overallAttendance}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{student.overallAttendance}%</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    student.status === 'good' ? 'bg-green-100 text-green-700' :
                                    student.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {student.status === 'good' ? 'Good' : student.status === 'warning' ? 'Warning' : 'At Risk'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setSelectedStudent(student)}
                                    className="text-[#1e3a5f] hover:text-[#2d5a87] font-medium text-sm"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {loadingSchedule ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading schedule...</p>
                </div>
              ) : (
                <>
                  {/* Header with View Toggle */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-[#1e3a5f]" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Teaching Schedule</h2>
                        <p className="text-sm text-gray-500">{schedule?.length || 0} upcoming sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setCalendarView('list')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                            calendarView === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          List View
                        </button>
                        <button
                          onClick={() => setShowCalendarModal(true)}
                          className="px-3 py-1.5 text-sm font-medium rounded-md transition text-gray-500 hover:text-gray-900"
                        >
                          Calendar View
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List View */}
                  <div className="p-4 border-b flex items-center justify-between" style={{display: 'none'}}>
                    <div className="flex items-center gap-2">
                      <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h2>
                      <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition">
                      Today
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="p-4">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((date, index) => {
                        const daySessions = date ? getSessionsForDay(date) : []
                        const hasNoLinkSession = daySessions.some(s => !s.meetingLink)
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-[100px] p-2 border rounded-lg ${
                              !date ? 'bg-gray-50 border-transparent' :
                              isToday(date) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {date && (
                              <>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm font-medium ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {date.getDate()}
                                  </span>
                                  {hasNoLinkSession && (
                                    <div className="group relative">
                                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                                      <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10">
                                        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                          No meeting link
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {daySessions.slice(0, 3).map(session => {
                                    // Format startTime (e.g., "19:00") to 12-hour format
                                    const formatTime = (time) => {
                                      if (!time) return 'No time'
                                      const [h, m] = time.split(':')
                                      const hour = parseInt(h)
                                      const ampm = hour >= 12 ? 'PM' : 'AM'
                                      const hour12 = hour % 12 || 12
                                      return `${hour12}:${m} ${ampm}`
                                    }
                                    return (
                                      <button
                                        key={session.id}
                                        onClick={() => setSelectedSession(session)}
                                        className={`w-full text-left text-xs p-1 rounded truncate transition ${
                                          !session.meetingLink 
                                            ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200' 
                                            : session.course?.type === 'LIVE'
                                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                      >
                                        {formatTime(session.startTime)}
                                      </button>
                                    )
                                  })}
                                  {daySessions.length > 3 && (
                                    <p className="text-xs text-gray-500 text-center">+{daySessions.length - 3} more</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Messages</h2>
              <p className="text-gray-500 mb-4">Coming Soon</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                You'll be able to send and receive messages from your students here.
              </p>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div>
              {!selectedGradeCourse ? (
                // Course Selection View
                <div>
                  <p className="text-gray-600 mb-6">Select a course to view student grades</p>
                  
                  {loading ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                      <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading courses...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Yet</h3>
                      <p className="text-gray-500">Create a course first to manage grades</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courses.map(course => (
                        <button
                          key={course.id}
                          onClick={() => handleSelectGradeCourse(course)}
                          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              course.type === 'LIVE' ? 'bg-purple-100' : 'bg-blue-100'
                            }`}>
                              {course.type === 'LIVE' ? (
                                <Radio className="w-6 h-6 text-purple-600" />
                              ) : (
                                <Video className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1e3a5f] transition" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{course.name}</h3>
                          <p className="text-sm text-gray-500">
                            {course.enrollments?.length || 0} students enrolled
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Gradebook View
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => {
                        setSelectedGradeCourse(null)
                        setGradesData(null)
                      }}
                      className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back to Courses
                    </button>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">{selectedGradeCourse.name}</h2>
                      <p className="text-sm text-gray-500">Gradebook</p>
                    </div>
                  </div>

                  {loadingGrades ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                      <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading grades...</p>
                    </div>
                  ) : !gradesData || gradesData.students?.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h3>
                      <p className="text-gray-500">Students need to enroll in this course first</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Student</th>
                              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Exam Score</th>
                              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Attendance</th>
                              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Final Grade</th>
                              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Letter</th>
                              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">GPA</th>
                              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {gradesData.students.map(student => (
                              <tr key={student.studentId} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {student.name?.charAt(0).toUpperCase() || 'S'}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{student.name || 'Unknown'}</p>
                                      <p className="text-xs text-gray-500">{student.email || 'N/A'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {student.grade ? (
                                    <span className="font-medium text-gray-900">{student.grade.examScore.toFixed(1)}%</span>
                                  ) : (
                                    <span className="text-gray-400">Not calculated</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {student.grade ? (
                                    <span className="font-medium text-gray-900">{student.grade.attendanceScore.toFixed(1)}%</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {student.grade ? (
                                    <span className={`text-lg font-bold ${
                                      student.grade.finalGrade >= 90 ? 'text-green-600' :
                                      student.grade.finalGrade >= 80 ? 'text-blue-600' :
                                      student.grade.finalGrade >= 70 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {student.grade.finalGrade.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {student.grade ? (
                                    <span className={`text-xl font-bold ${
                                      student.grade.letterGrade === 'A' || student.grade.letterGrade === 'A-' ? 'text-green-600' :
                                      student.grade.letterGrade.startsWith('B') ? 'text-blue-600' :
                                      student.grade.letterGrade.startsWith('C') ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {student.grade.letterGrade}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {student.grade ? (
                                    <span className="font-semibold text-[#1e3a5f]">{student.grade.gpa.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {student.grade && student.grade.finalGrade >= 70 ? (
                                    <button
                                      onClick={async () => {
                                        const certificateUrl = prompt('Enter the certificate download URL (e.g., Google Drive link, Dropbox link, etc.):')
                                        if (!certificateUrl) {
                                          toast.error('Certificate URL is required')
                                          return
                                        }
                                        
                                        setIssuingCertificate(student.studentId)
                                        try {
                                          await issueCertificate({
                                            studentId: student.studentId,
                                            courseId: selectedGradeCourse.id,
                                            completionDate: new Date().toISOString(),
                                            grade: student.grade.letterGrade,
                                            gpa: student.grade.gpa,
                                            certificateUrl
                                          })
                                          toast.success('Certificate issued successfully!')
                                        } catch (error) {
                                          console.error('Error issuing certificate:', error)
                                          if (error.response?.data?.error?.includes('already issued')) {
                                            toast.error('Certificate already issued')
                                          } else {
                                            toast.error('Failed to issue certificate')
                                          }
                                        } finally {
                                          setIssuingCertificate(null)
                                        }
                                      }}
                                      disabled={issuingCertificate === student.studentId}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f7941d] hover:bg-[#e88a1a] text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                                    >
                                      {issuingCertificate === student.studentId ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          Issuing...
                                        </>
                                      ) : (
                                        <>
                                          <Shield className="w-4 h-4" />
                                          Issue Certificate
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      {student.grade ? 'Below passing grade' : 'No grade'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Summary */}
                      <div className="p-4 bg-gray-50 border-t flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Total Students: <span className="font-semibold">{gradesData.students.length}</span>
                        </span>
                        <span className="text-gray-600">
                          Graded: <span className="font-semibold">{gradesData.students.filter(s => s.grade).length}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedStudent.totalEnrollments}</p>
                  <p className="text-sm text-gray-500">Courses</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className={`text-2xl font-bold ${
                    selectedStudent.overallAttendance >= 80 ? 'text-green-600' :
                    selectedStudent.overallAttendance >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{selectedStudent.overallAttendance}%</p>
                  <p className="text-sm text-gray-500">Overall Attendance</p>
                </div>
              </div>

              {/* Courses Breakdown */}
              <h4 className="font-medium text-gray-900 mb-3">Course Breakdown</h4>
              <div className="space-y-3">
                {selectedStudent.courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {course.type === 'LIVE' ? (
                          <Radio className="w-4 h-4 text-red-500" />
                        ) : (
                          <Video className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="font-medium text-gray-900">{course.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        course.percentage >= 80 ? 'bg-green-100 text-green-700' :
                        course.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {course.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            course.percentage >= 80 ? 'bg-green-500' : 
                            course.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${course.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{course.attended}/{course.total} sessions</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Enrolled: {new Date(course.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t">
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                      {session.startTime ? (() => {
                        const [h, m] = session.startTime.split(':')
                        const hour = parseInt(h)
                        const ampm = hour >= 12 ? 'PM' : 'AM'
                        const hour12 = hour % 12 || 12
                        return `${hour12}:${m} ${ampm}`
                      })() : 'No time'}
                      {session.lesson?.name && ` • ${session.lesson.name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowTodayPopup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowTodayPopup(false)
                  setActiveTab('schedule')
                }}
                className="flex-1 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
              >
                View Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedSession.course?.type === 'LIVE' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {selectedSession.course?.type === 'LIVE' ? (
                      <Radio className="w-6 h-6 text-red-600" />
                    ) : (
                      <Video className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedSession.course?.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedSession.course?.type === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {selectedSession.course?.type}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-lg font-medium text-gray-900 mb-4">
                {selectedSession.lesson?.name || 'Untitled Session'}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>{new Date(selectedSession.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>
                    {selectedSession.startTime ? (() => {
                      const [h, m] = selectedSession.startTime.split(':')
                      const hour = parseInt(h)
                      const ampm = hour >= 12 ? 'PM' : 'AM'
                      const hour12 = hour % 12 || 12
                      return `${hour12}:${m} ${ampm}`
                    })() : 'No time'}
                    {selectedSession.endTime && (() => {
                      const [h, m] = selectedSession.endTime.split(':')
                      const hour = parseInt(h)
                      const ampm = hour >= 12 ? 'PM' : 'AM'
                      const hour12 = hour % 12 || 12
                      return ` - ${hour12}:${m} ${ampm}`
                    })()}
                  </span>
                </div>
              </div>

              {selectedSession.meetingLink ? (
                <a
                  href={selectedSession.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition mb-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  Join Class
                </a>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">No meeting link</p>
                      <p className="text-sm text-amber-600 mt-1">
                        Add one in{' '}
                        <Link
                          to={`/teacher/courses/${selectedSession.course?.slug || selectedSession.course?.id}/dashboard`}
                          onClick={() => setSelectedSession(null)}
                          className="underline hover:text-amber-800"
                        >
                          Course Schedule →
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Link
                to={`/teacher/courses/${selectedSession.course?.slug || selectedSession.course?.id}/dashboard`}
                onClick={() => setSelectedSession(null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition"
              >
                View Course
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SessionCalendar Modal */}
      <SessionCalendar
        sessions={schedule || []}
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title="Teaching Schedule"
        subtitle="Your upcoming sessions"
        accentColor="purple"
        type="course"
        onJoinSession={(session) => {
          if (session.meetingLink) {
            window.open(session.meetingLink, '_blank')
          }
        }}
      />
    </div>
  )
}
