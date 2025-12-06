import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Video, Radio } from 'lucide-react'
import { createCourse } from '../../api/courses'

export default function CreateCourse() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('RECORDED')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const course = await createCourse({ name, description, type })
      navigate(`/teacher/courses/${course.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/teacher" className="flex items-center gap-2 text-emerald-200 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Introduction to Arabic"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                placeholder="Describe what students will learn in this course..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            {/* Course Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Course Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('RECORDED')}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    type === 'RECORDED'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      type === 'RECORDED' ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      <Video className={`w-5 h-5 ${type === 'RECORDED' ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <span className={`font-medium ${type === 'RECORDED' ? 'text-emerald-700' : 'text-gray-700'}`}>
                      Recorded Video
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload YouTube video links for students to watch anytime
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setType('LIVE')}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    type === 'LIVE'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      type === 'LIVE' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Radio className={`w-5 h-5 ${type === 'LIVE' ? 'text-purple-600' : 'text-gray-500'}`} />
                    </div>
                    <span className={`font-medium ${type === 'LIVE' ? 'text-purple-700' : 'text-gray-700'}`}>
                      Live Class
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Schedule Zoom/Meet sessions for live teaching
                  </p>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <Link
                to="/teacher"
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
