import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Users, Plus, LayoutDashboard, GraduationCap, Settings, Menu, Calendar, Video, Radio, ToggleLeft, ToggleRight, Edit3, ExternalLink } from 'lucide-react'
import { getCourses, toggleCourseActive } from '../../api/courses'

export default function TeacherDashboard() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

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

  const handleToggleActive = async (courseId, e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const updated = await toggleCourseActive(courseId)
      setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to toggle course status')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
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
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
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
                        to={`/teacher/courses/${course.id}/dashboard`}
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

              {courses.length === 0 ? (
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
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition"
                    >
                      {/* Course Header */}
                      <div className={`h-2 ${course.type === 'LIVE' ? 'bg-purple-500' : 'bg-[#1e3a5f]'}`}></div>
                      
                      <div className="p-5">
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
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                          {course.description || 'No description'}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span>{course.modules?.length || 0} modules</span>
                          {course.type === 'LIVE' && (
                            <span>{course.sessions?.length || 0} sessions</span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-4 border-t">
                          <Link
                            to={`/teacher/courses/${course.id}/dashboard`}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-2 px-3 rounded-lg text-sm font-medium transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <button
                            onClick={(e) => handleToggleActive(course.id, e)}
                            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                              course.isActive
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={course.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {course.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">My Students</h2>
              <p className="text-gray-500">Student management coming soon...</p>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Class Schedule</h2>
              <p className="text-gray-500">Schedule management coming soon...</p>
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
