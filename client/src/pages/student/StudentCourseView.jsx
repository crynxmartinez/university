import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, ChevronDown, ChevronRight, Video, Radio, FileText, 
  ExternalLink, Calendar, Menu, BookOpen, Clock, Play, Download,
  StickyNote, X, Save
} from 'lucide-react'
import { getMyCourses } from '../../api/enrollments'
import { useToast } from '../../components/Toast'

export default function StudentCourseView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState({})
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [activeTab, setActiveTab] = useState('content') // content, materials, notes

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
      // Expand first module by default
      if (found.modules?.[0]) {
        setExpandedModules({ [found.modules[0].id]: true })
      }
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

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
    return null
  }

  const getTotalLessons = () => {
    return course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-[#1e3a5f] text-white transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="w-80 h-screen flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#2d5a87]">
            <Link to="/student" className="flex items-center gap-2 text-blue-200 hover:text-white transition mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h2 className="font-semibold text-lg leading-tight">{course.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                course.type === 'RECORDED' ? 'bg-blue-500/30 text-blue-200' : 'bg-purple-500/30 text-purple-200'
              }`}>
                {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
              </span>
              <span className="text-xs text-blue-200">
                {course.modules?.length || 0} modules • {getTotalLessons()} lessons
              </span>
            </div>
          </div>

          {/* Course Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {course.modules?.length === 0 ? (
              <p className="text-blue-200 text-sm text-center py-8">No content available yet.</p>
            ) : (
              <div className="space-y-2">
                {course.modules.map((module, index) => (
                  <div key={module.id}>
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-[#2d5a87] transition text-left"
                    >
                      {expandedModules[module.id] ? (
                        <ChevronDown className="w-4 h-4 text-blue-300 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-blue-300 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-xs text-blue-300 uppercase tracking-wide">Module {index + 1}</p>
                        <p className="text-sm font-medium">{module.name}</p>
                      </div>
                    </button>

                    {/* Lessons */}
                    {expandedModules[module.id] && module.lessons?.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setSelectedLesson(lesson)
                              setActiveTab('content')
                            }}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition text-sm ${
                              selectedLesson?.id === lesson.id
                                ? 'bg-[#f7941d] text-white'
                                : 'text-blue-200 hover:bg-[#2d5a87] hover:text-white'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                              selectedLesson?.id === lesson.id
                                ? 'bg-white/20'
                                : 'bg-[#2d5a87]'
                            }`}>
                              {lessonIndex + 1}
                            </span>
                            <span className="truncate flex-1">{lesson.name}</span>
                            {course.type === 'RECORDED' && lesson.videoUrl && (
                              <Play className="w-3 h-3 flex-shrink-0" />
                            )}
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            {selectedLesson && (
              <div>
                <h1 className="font-semibold text-gray-900">{selectedLesson.name}</h1>
                <p className="text-sm text-gray-500">
                  {course.modules?.find(m => m.lessons?.some(l => l.id === selectedLesson.id))?.name}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              course.type === 'RECORDED' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {course.type === 'RECORDED' ? (
                <><Video className="w-3 h-3 inline mr-1" /> Recorded</>
              ) : (
                <><Radio className="w-3 h-3 inline mr-1" /> Live</>
              )}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {selectedLesson ? (
            <div className="max-w-4xl mx-auto">
              {/* Video Player for RECORDED */}
              {course.type === 'RECORDED' && selectedLesson.videoUrl && (
                <div className="bg-black rounded-xl overflow-hidden mb-6 shadow-lg">
                  <div className="aspect-video">
                    {getYouTubeEmbedUrl(selectedLesson.videoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(selectedLesson.videoUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <a
                          href={selectedLesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-6 py-3 rounded-lg font-medium transition"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Open Video
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Class Banner for LIVE */}
              {course.type === 'LIVE' && (
                <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <Radio className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Live Class</h3>
                        <p className="text-purple-100 text-sm">
                          Check the schedule for upcoming sessions
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/student"
                      onClick={() => {
                        // Will navigate to student dashboard with calendar open
                      }}
                      className="flex items-center gap-2 bg-white text-purple-600 px-5 py-2.5 rounded-lg font-medium hover:bg-purple-50 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      View Schedule
                    </Link>
                  </div>
                </div>
              )}

              {/* Content Tabs */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Tab Headers */}
                <div className="border-b flex">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-6 py-4 font-medium text-sm transition ${
                      activeTab === 'content'
                        ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`px-6 py-4 font-medium text-sm transition ${
                      activeTab === 'materials'
                        ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-6 py-4 font-medium text-sm transition ${
                      activeTab === 'notes'
                        ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <StickyNote className="w-4 h-4 inline mr-2" />
                    My Notes
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'content' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedLesson.name}</h2>
                      {selectedLesson.description ? (
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-600 whitespace-pre-wrap">{selectedLesson.description}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No description available for this lesson.</p>
                      )}
                    </div>
                  )}

                  {/* Materials Tab */}
                  {activeTab === 'materials' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Lesson Materials</h2>
                      {selectedLesson.materials ? (
                        <div className="space-y-3">
                          {selectedLesson.materials.split('\n').filter(link => link.trim()).map((link, i) => (
                            <a
                              key={i}
                              href={link.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                            >
                              <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Download className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#1e3a5f]">
                                  {link.trim().split('/').pop() || 'Material'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{link.trim()}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#1e3a5f]" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No materials available for this lesson.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Notes</h2>
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">Notes feature coming soon!</p>
                        <p className="text-sm text-gray-400">You'll be able to take notes while learning.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a lesson</h3>
                <p className="text-gray-500">Choose a lesson from the sidebar to start learning</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
