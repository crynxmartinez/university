import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Video, Radio, FileText, ExternalLink, Calendar } from 'lucide-react'
import { getMyCourses } from '../../api/enrollments'

export default function StudentCourseView() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState({})
  const [selectedLesson, setSelectedLesson] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const courses = await getMyCourses()
      const found = courses.find(c => c.id === id)
      if (!found) {
        navigate('/student')
        return
      }
      setCourse(found)
      // Expand all modules by default
      const expanded = {}
      found.modules?.forEach(m => { expanded[m.id] = true })
      setExpandedModules(expanded)
      // Select first lesson if available
      if (found.modules?.[0]?.lessons?.[0]) {
        setSelectedLesson(found.modules[0].lessons[0])
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      navigate('/student')
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

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/student" className="flex items-center gap-2 text-green-200 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <span className={`text-xs px-3 py-1 rounded-full ${
              course.type === 'RECORDED' ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              {course.type === 'RECORDED' ? 'Recorded Video' : 'Live Class'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">{course.name}</h2>
              
              {course.modules?.length === 0 ? (
                <p className="text-gray-500 text-sm">No content available yet.</p>
              ) : (
                <div className="space-y-2">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                      >
                        <div className="flex items-center gap-2">
                          {expandedModules[module.id] ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            Module {index + 1}: {module.name}
                          </span>
                        </div>
                      </button>

                      {expandedModules[module.id] && module.lessons?.length > 0 && (
                        <div className="p-2 space-y-1">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLesson(lesson)}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition text-sm ${
                                selectedLesson?.id === lesson.id
                                  ? 'bg-green-100 text-green-800'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                                {lessonIndex + 1}
                              </span>
                              <span className="truncate">{lesson.name}</span>
                              {lesson.videoUrl && <Video className="w-3 h-3 text-blue-500 ml-auto flex-shrink-0" />}
                              {lesson.zoomLink && <Radio className="w-3 h-3 text-purple-500 ml-auto flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Lesson View */}
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Video Player for RECORDED */}
                {course.type === 'RECORDED' && selectedLesson.videoUrl && (
                  <div className="aspect-video bg-black">
                    {getYouTubeEmbedUrl(selectedLesson.videoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(selectedLesson.videoUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <a
                          href={selectedLesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Open Video
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Class Info for LIVE */}
                {course.type === 'LIVE' && selectedLesson.zoomLink && (
                  <div className="bg-purple-50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Radio className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">Live Class</h3>
                        {selectedLesson.scheduledAt && (
                          <p className="text-purple-700 text-sm flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(selectedLesson.scheduledAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={selectedLesson.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Join Meeting
                    </a>
                  </div>
                )}

                {/* Lesson Details */}
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedLesson.name}</h1>
                  
                  {selectedLesson.description && (
                    <p className="text-gray-600 mb-4">{selectedLesson.description}</p>
                  )}

                  {selectedLesson.materials && (
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Materials
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {selectedLesson.materials.split('\n').map((link, i) => (
                          link.trim() && (
                            <a
                              key={i}
                              href={link.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-green-700 hover:text-green-800 text-sm mb-1 truncate"
                            >
                              {link.trim()}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a lesson</h3>
                <p className="text-gray-500">Choose a lesson from the sidebar to start learning</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
