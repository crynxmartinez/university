import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Video, Radio, LayoutDashboard, GraduationCap, Calendar, Settings, Menu, Award, Folder, MapPin, Globe, ExternalLink, Search, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react'
import { getMyCourses } from '../../api/enrollments'
import { getStudentPrograms } from '../../api/programs'
import { getMyProgramEnrollments, enrollInProgram } from '../../api/programEnrollments'
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
  const navigate = useNavigate()

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
      
      // Fetch all available courses
      try {
        const token = localStorage.getItem('token')
        const coursesRes = await axios.get(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setAllCourses(coursesRes.data)
      } catch (e) {
        console.error('Failed to fetch courses:', e)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollProgram = async (programId) => {
    setEnrollingId(programId)
    try {
      await enrollInProgram(programId)
      // Refresh enrollments
      const myPrograms = await getMyProgramEnrollments()
      setMyProgramEnrollments(myPrograms)
    } catch (error) {
      console.error('Failed to enroll:', error)
      alert(error.response?.data?.error || 'Failed to enroll')
    } finally {
      setEnrollingId(null)
    }
  }

  const isEnrolledInProgram = (programId) => {
    return myProgramEnrollments.some(e => e.program?.id === programId)
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
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'grades', label: 'Grades', icon: Award },
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
                            
                            <div className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1"
                              dangerouslySetInnerHTML={{ __html: program.description || 'No description available' }}
                            />
                            
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
                                  onClick={() => handleEnrollProgram(program.id)}
                                  disabled={enrollingId === program.id}
                                  className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                                >
                                  {enrollingId === program.id ? 'Enrolling...' : 'Enroll Now'}
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
                        <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{course.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                              course.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {course.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                            <span>{course.modules?.length || 0} modules</span>
                            <span>By {course.teacher?.user?.profile?.firstName} {course.teacher?.user?.profile?.lastName}</span>
                          </div>
                          <button className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition">
                            Enroll Now
                          </button>
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
              {/* Toggle Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setEnrollmentsTab('programs')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    enrollmentsTab === 'programs' 
                      ? 'bg-[#1e3a5f] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Folder className="w-4 h-4 inline mr-2" />
                  Programs ({myProgramEnrollments.length})
                </button>
                <button
                  onClick={() => setEnrollmentsTab('courses')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    enrollmentsTab === 'courses' 
                      ? 'bg-[#1e3a5f] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Courses ({myCourseEnrollments.length})
                </button>
              </div>

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
                          <div key={enrollment.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group">
                            {program.image ? (
                              <div className="h-40 overflow-hidden">
                                <img src={program.image} alt={program.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-40 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center">
                                <Folder className="w-16 h-16 text-white/50" />
                              </div>
                            )}
                            <div className="p-5">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{program.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
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
                              
                              {program.meetingLink && (
                                <a 
                                  href={program.meetingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-2 rounded-lg font-semibold transition"
                                >
                                  <Video className="w-4 h-4" />
                                  Join Meeting
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myCourseEnrollments.map((course) => (
                        <Link
                          key={course.id}
                          to={`/student/courses/${course.id}`}
                          className="border border-gray-200 rounded-lg p-4 hover:border-[#f7941d] hover:shadow-md transition"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{course.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                              course.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {course.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                          <div className="text-xs text-gray-400">
                            {course.modules?.length || 0} modules
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Class Schedule</h2>
              <p className="text-gray-500">Schedule coming soon...</p>
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
    </div>
  )
}
