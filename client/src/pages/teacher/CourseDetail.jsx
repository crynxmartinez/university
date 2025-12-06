import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Video, Radio, FileText, Trash2 } from 'lucide-react'
import { getCourse } from '../../api/courses'

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const data = await getCourse(id)
      setCourse(data)
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

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  if (!course) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/teacher" className="flex items-center gap-2 text-green-200 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <span className={`text-xs px-3 py-1 rounded-full ${
              course.type === 'RECORDED' 
                ? 'bg-blue-500 text-white' 
                : 'bg-purple-500 text-white'
            }`}>
              {course.type === 'RECORDED' ? 'Recorded Video' : 'Live Class'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              {course.description && (
                <p className="text-gray-600 mt-2">{course.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {course.type === 'RECORDED' ? (
                <Video className="w-5 h-5 text-blue-600" />
              ) : (
                <Radio className="w-5 h-5 text-purple-600" />
              )}
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
            <Link
              to={`/teacher/courses/${id}/modules/create`}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Module
            </Link>
          </div>

          {course.modules?.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
              <p className="text-gray-500 mb-4">Start building your course by adding a module</p>
              <Link
                to={`/teacher/courses/${id}/modules/create`}
                className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add First Module
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {course.modules.map((module, index) => (
                <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      {expandedModules[module.id] ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        Module {index + 1}: {module.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({module.lessons?.length || 0} lessons)
                      </span>
                    </div>
                  </button>

                  {/* Module Content */}
                  {expandedModules[module.id] && (
                    <div className="p-4 border-t border-gray-200">
                      {module.lessons?.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No lessons in this module</p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <Link
                              key={lesson.id}
                              to={`/teacher/courses/${id}/modules/${module.id}/lessons/${lesson.id}`}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                            >
                              <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600">
                                {lessonIndex + 1}
                              </span>
                              <span className="text-gray-700">{lesson.name}</span>
                              {lesson.videoUrl && <Video className="w-4 h-4 text-blue-500 ml-auto" />}
                              {lesson.zoomLink && <Radio className="w-4 h-4 text-purple-500 ml-auto" />}
                            </Link>
                          ))}
                        </div>
                      )}
                      <Link
                        to={`/teacher/courses/${id}/modules/${module.id}/lessons/create`}
                        className="flex items-center gap-2 text-green-700 hover:text-green-800 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
