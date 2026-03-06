import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Users, LayoutDashboard, GraduationCap, Settings, Menu, Calendar, MessageSquare, TrendingUp, X, Clock, Video, Radio, ExternalLink, AlertTriangle } from 'lucide-react'
// Legacy import removed in Phase 4 cleanup:
// import { getCourses } from '../../api/courses'
import { getTeacherAnalytics } from '../../api/enrollments'
import { getTeacherSchedule } from '../../api/sessions'
import { getCourseStudentGrades } from '../../api/grades'
import { getCourseOfferings } from '../../api/courseOfferings'
import { getProgramOfferings } from '../../api/programOfferings'

// Lazy load tab components for better performance
const DashboardTab = lazy(() => import('./tabs/DashboardTab'))
// Legacy tab removed in Phase 4 cleanup:
// const CoursesTab = lazy(() => import('./tabs/CoursesTab'))
const StudentsTab = lazy(() => import('./tabs/StudentsTab'))
const OfferingsTab = lazy(() => import('./tabs/OfferingsTab'))
const OneOnOneTab = lazy(() => import('./tabs/OneOnOneTab'))
const ScheduleTab = lazy(() => import('./tabs/ScheduleTab'))
const GradesTab = lazy(() => import('./tabs/GradesTab'))
const MessagesTab = lazy(() => import('./tabs/MessagesTab'))
const SettingsTab = lazy(() => import('./tabs/SettingsTab'))

// Loading spinner component
const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
  </div>
)

export default function TeacherDashboard() {
  const [user, setUser] = useState(null)
  // Legacy state removed in Phase 4 cleanup:
  // const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  // Offerings state
  const [offeringsView, setOfferingsView] = useState('list')
  const [courseOfferings, setCourseOfferings] = useState([])
  const [programOfferings, setProgramOfferings] = useState([])
  const [loadingOfferings, setLoadingOfferings] = useState(false)
  const [selectedOffering, setSelectedOffering] = useState(null)

  // One-on-one state
  const [oneOnOneRequests, setOneOnOneRequests] = useState([])
  const [loadingOneOnOne, setLoadingOneOnOne] = useState(false)

  // Analytics state
  const [analytics, setAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Schedule state
  const [schedule, setSchedule] = useState(null)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [showTodayPopup, setShowTodayPopup] = useState(false)
  const [todaySessions, setTodaySessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  // Grades state
  const [selectedGradeCourse, setSelectedGradeCourse] = useState(null)
  const [gradesData, setGradesData] = useState(null)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [issuingCertificate, setIssuingCertificate] = useState(null)

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
    // Legacy fetchCourses removed in Phase 4 cleanup
    fetchSchedule()
    setLoading(false)
  }, [navigate])

  // Fetch offerings when offerings tab is active
  useEffect(() => {
    if (activeTab === 'offerings' && offeringsView === 'list') {
      fetchOfferings()
    }
  }, [activeTab, offeringsView])

  const fetchOfferings = async () => {
    setLoadingOfferings(true)
    try {
      const [co, po] = await Promise.all([getCourseOfferings(), getProgramOfferings()])
      setCourseOfferings(co)
      setProgramOfferings(po)
    } catch (err) {
      console.error('Failed to fetch offerings:', err)
    } finally {
      setLoadingOfferings(false)
    }
  }

  // Fetch 1-on-1 requests when tab is active
  useEffect(() => {
    if (activeTab === 'one-on-one') {
      fetchOneOnOneRequests()
    }
  }, [activeTab])

  const fetchOneOnOneRequests = async () => {
    setLoadingOneOnOne(true)
    try {
      const { getIncomingOneOnOneRequests } = await import('../../api/oneOnOne')
      const requests = await getIncomingOneOnOneRequests()
      setOneOnOneRequests(requests)
    } catch (err) {
      console.error('Failed to load 1-on-1 requests:', err)
    } finally {
      setLoadingOneOnOne(false)
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

  const fetchSchedule = async () => {
    setLoadingSchedule(true)
    try {
      const data = await getTeacherSchedule()
      setSchedule(data.sessions)
      setTodayCount(data.todayCount)
      
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const pendingCount = oneOnOneRequests.filter(r => r.status === 'PENDING').length

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'offerings', label: 'My Offerings', icon: BookOpen },
    { id: 'one-on-one', label: '1-on-1 Requests', icon: Users, badge: pendingCount },
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab setActiveTab={setActiveTab} />
      case 'offerings':
        return (
          <OfferingsTab
            offeringsView={offeringsView}
            setOfferingsView={setOfferingsView}
            courseOfferings={courseOfferings}
            programOfferings={programOfferings}
            loadingOfferings={loadingOfferings}
            selectedOffering={selectedOffering}
            setSelectedOffering={setSelectedOffering}
          />
        )
      case 'one-on-one':
        return (
          <OneOnOneTab
            oneOnOneRequests={oneOnOneRequests}
            loadingOneOnOne={loadingOneOnOne}
            fetchOneOnOneRequests={fetchOneOnOneRequests}
          />
        )
      // Legacy courses tab removed in Phase 4 cleanup
      case 'students':
        return (
          <StudentsTab
            analytics={analytics}
            loadingAnalytics={loadingAnalytics}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
          />
        )
      case 'schedule':
        return (
          <ScheduleTab
            schedule={schedule}
            loadingSchedule={loadingSchedule}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            showCalendarModal={showCalendarModal}
            setShowCalendarModal={setShowCalendarModal}
          />
        )
      case 'grades':
        return (
          <GradesTab
            courses={courses}
            loading={loading}
            selectedGradeCourse={selectedGradeCourse}
            setSelectedGradeCourse={setSelectedGradeCourse}
            gradesData={gradesData}
            setGradesData={setGradesData}
            loadingGrades={loadingGrades}
            handleSelectGradeCourse={handleSelectGradeCourse}
            issuingCertificate={issuingCertificate}
            setIssuingCertificate={setIssuingCertificate}
          />
        )
      case 'messages':
        return <MessagesTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <DashboardTab setActiveTab={setActiveTab} />
    }
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
                  onClick={() => { setActiveTab(item.id); setOfferingsView('list') }}
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

        {/* Page Content with Suspense for lazy loading */}
        <main className="p-6">
          <Suspense fallback={<TabLoader />}>
            {renderActiveTab()}
          </Suspense>
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
    </div>
  )
}
