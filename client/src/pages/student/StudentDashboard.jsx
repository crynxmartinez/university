import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Video, Radio } from 'lucide-react'
import { getMyCourses } from '../../api/enrollments'

export default function StudentDashboard() {
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
    if (userData.role !== 'STUDENT') {
      navigate('/login')
      return
    }
    
    setUser(userData)
    fetchCourses()
  }, [navigate])

  const fetchCourses = async () => {
    try {
      const data = await getMyCourses()
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
                <span className="text-green-200 text-sm ml-2">Student Portal</span>
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
          <p className="text-gray-600 mt-1">Student Dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                <p className="text-gray-600 text-sm">Enrolled Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Courses</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500">You haven't been enrolled in any courses yet.</p>
              <p className="text-gray-500 text-sm mt-2">Contact your teacher to get enrolled.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/student/courses/${course.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition"
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
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{course.modules?.length || 0} modules</span>
                    <span>
                      By {course.teacher?.user?.profile?.firstName} {course.teacher?.user?.profile?.lastName}
                    </span>
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
