import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Users, Plus } from 'lucide-react'
import { getCourses } from '../../api/courses'

export default function TeacherDashboard() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-800 font-bold text-lg">AU</span>
              </div>
              <div>
                <span className="text-lg font-semibold">Assalaam University</span>
                <span className="text-green-200 text-sm ml-2">Teacher Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-green-200">
                {user.profile?.firstName} {user.profile?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.profile?.firstName}!</h1>
          <p className="text-gray-600 mt-1">Teacher Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                <p className="text-gray-600 text-sm">My Courses</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600 text-sm">Total Students</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
            <Link
              to="/teacher/courses/create"
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-4">Create your first course to get started</p>
              <Link
                to="/teacher/courses/create"
                className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Create Course
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/teacher/courses/${course.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{course.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      course.type === 'RECORDED' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
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
      </main>
    </div>
  )
}
