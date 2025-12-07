import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, X, Search, Check } from 'lucide-react'
import { getCourse } from '../../api/courses'
import { getAllStudents, getEnrolledStudents, enrollStudent, removeEnrollment } from '../../api/enrollments'

export default function EnrollStudents() {
  const { id: courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    try {
      const [courseData, students, enrolled] = await Promise.all([
        getCourse(courseId),
        getAllStudents(),
        getEnrolledStudents(courseId)
      ])
      setCourse(courseData)
      setAllStudents(students)
      setEnrolledStudents(enrolled)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      navigate('/teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (studentId) => {
    setEnrolling(studentId)
    try {
      const enrollment = await enrollStudent(studentId, courseId)
      setEnrolledStudents(prev => [...prev, enrollment])
    } catch (error) {
      console.error('Failed to enroll student:', error)
      alert(error.response?.data?.error || 'Failed to enroll student')
    } finally {
      setEnrolling(null)
    }
  }

  const handleRemove = async (enrollmentId) => {
    if (!confirm('Remove this student from the course?')) return
    try {
      await removeEnrollment(enrollmentId)
      setEnrolledStudents(prev => prev.filter(e => e.id !== enrollmentId))
    } catch (error) {
      console.error('Failed to remove student:', error)
    }
  }

  const enrolledStudentIds = enrolledStudents.map(e => e.student.id)
  
  const filteredStudents = allStudents.filter(student => {
    const name = `${student.user?.profile?.firstName} ${student.user?.profile?.lastName}`.toLowerCase()
    const studentId = student.studentId.toLowerCase()
    const search = searchTerm.toLowerCase()
    return name.includes(search) || studentId.includes(search)
  })

  const availableStudents = filteredStudents.filter(s => !enrolledStudentIds.includes(s.id))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to={`/teacher/courses/${courseId}/dashboard`} className="flex items-center gap-2 text-blue-200 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
              Back to Course
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
          <p className="text-gray-600">{course?.name}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Enrolled Students */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Enrolled Students ({enrolledStudents.length})
            </h2>
            
            {enrolledStudents.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No students enrolled yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {enrolledStudents.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {enrollment.student.user?.profile?.firstName} {enrollment.student.user?.profile?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{enrollment.student.studentId}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(enrollment.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove student"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Students */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Students
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
              />
            </div>

            {availableStudents.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                {searchTerm ? 'No students found' : 'All students are enrolled'}
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#1e3a5f] transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.user?.profile?.firstName} {student.user?.profile?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{student.studentId}</p>
                    </div>
                    <button
                      onClick={() => handleEnroll(student.id)}
                      disabled={enrolling === student.id}
                      className="flex items-center gap-1 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white px-3 py-1.5 rounded-lg text-sm transition disabled:opacity-50"
                    >
                      {enrolling === student.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Enroll
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
