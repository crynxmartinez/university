import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Video, Radio } from 'lucide-react'
import { createLesson } from '../../api/lessons'
import { getCourse } from '../../api/courses'

export default function CreateLesson() {
  const { id: courseId, moduleId } = useParams()
  const [course, setCourse] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [materials, setMaterials] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const data = await getCourse(courseId)
      setCourse(data)
    } catch (error) {
      console.error('Failed to fetch course:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createLesson({
        name,
        description,
        materials,
        videoUrl: course?.type === 'RECORDED' ? videoUrl : null,
        moduleId
      })
      navigate(`/teacher/courses/${courseId}/dashboard`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create class')
    } finally {
      setLoading(false)
    }
  }

  const isRecorded = course?.type === 'RECORDED'
  const isLive = course?.type === 'LIVE'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={`/teacher/courses/${courseId}/dashboard`} className="flex items-center gap-2 text-blue-200 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
              Back to Course
            </Link>
            {course && (
              <span className={`text-xs px-3 py-1 rounded-full ${
                isRecorded ? 'bg-blue-500' : 'bg-purple-500'
              }`}>
                {isRecorded ? 'Recorded Video' : 'Live Class'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Class</h1>
          {isLive && (
            <p className="text-sm text-gray-500 mb-6 -mt-4">
              Create a class template. You can schedule it on the calendar later.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lesson 1: Introduction"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this lesson covers..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
              />
            </div>

            {/* Materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materials (URLs)
              </label>
              <textarea
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Add links to PDF, documents, or other materials (one per line)"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
              />
            </div>

            {/* Video URL - for RECORDED courses */}
            {isRecorded && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    Video URL (YouTube)
                  </div>
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste a YouTube link. You can make the video unlisted/private.
                </p>
              </div>
            )}

            
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <Link
                to={`/teacher/courses/${courseId}/dashboard`}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Class'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
