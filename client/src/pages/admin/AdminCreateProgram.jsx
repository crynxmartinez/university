import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Globe, MapPin, Image, Info, Calendar, Clock, User } from 'lucide-react'
import { createAdminProgram } from '../../api/adminPrograms'
import { getTeachers } from '../../api/adminCourses'

export default function AdminCreateProgram() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [programType, setProgramType] = useState('ONLINE')
  const [teacherId, setTeacherId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [enrollmentEnd, setEnrollmentEnd] = useState('')
  const [durationType, setDurationType] = useState('dates')
  const [durationMonths, setDurationMonths] = useState(3)
  const [image, setImage] = useState('')
  const [teachers, setTeachers] = useState([])
  const [teachersLoading, setTeachersLoading] = useState(true)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers()
      setTeachers(data)
    } catch (err) {
      console.error('Failed to fetch teachers:', err)
    } finally {
      setTeachersLoading(false)
    }
  }

  const calculateEndDate = (start, months) => {
    if (!start) return ''
    const date = new Date(start)
    date.setMonth(date.getMonth() + months)
    return date.toISOString().split('T')[0]
  }

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let actualEndDate = endDate
      if (durationType === 'months' && startDate) {
        actualEndDate = calculateEndDate(startDate, durationMonths)
      }

      const program = await createAdminProgram({
        name,
        description,
        programType,
        teacherId: teacherId || null,
        startDate: startDate || null,
        endDate: actualEndDate || null,
        enrollmentEnd: enrollmentEnd || null,
        image: image || null
      })
      navigate(`/admin/programs/${program.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create program')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/admin" className="flex items-center gap-2 text-blue-200 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Program</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Islamic Studies Certificate"
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
                placeholder="Describe what students will learn in this program..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none resize-none"
              />
            </div>

            {/* Program Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Program Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProgramType('ONLINE')}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    programType === 'ONLINE'
                      ? 'border-[#1e3a5f] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      programType === 'ONLINE' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Globe className={`w-5 h-5 ${programType === 'ONLINE' ? 'text-[#1e3a5f]' : 'text-gray-500'}`} />
                    </div>
                    <span className={`font-medium ${programType === 'ONLINE' ? 'text-[#1e3a5f]' : 'text-gray-700'}`}>
                      Online Program
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Live sessions via Zoom/Meet for remote learning
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProgramType('IN_PERSON')}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    programType === 'IN_PERSON'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      programType === 'IN_PERSON' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <MapPin className={`w-5 h-5 ${programType === 'IN_PERSON' ? 'text-purple-600' : 'text-gray-500'}`} />
                    </div>
                    <span className={`font-medium ${programType === 'IN_PERSON' ? 'text-purple-700' : 'text-gray-700'}`}>
                      In-Person
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Physical classes at a specific location
                  </p>
                </button>
              </div>
            </div>

            {/* Info for program types */}
            {programType === 'ONLINE' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Schedule sessions after creation</p>
                  <p className="text-sm text-blue-600">You'll be able to add class dates, times, and meeting links in the Program Dashboard.</p>
                </div>
              </div>
            )}

            {programType === 'IN_PERSON' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-purple-800 font-medium">Add location details after creation</p>
                  <p className="text-sm text-purple-600">You'll be able to set the venue and schedule in the Program Dashboard.</p>
                </div>
              </div>
            )}

            {/* Assign Teacher */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                Assign Teacher
              </h3>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
              >
                <option value="">-- No Teacher (Assign Later) --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user?.profile ? `${teacher.user.profile.firstName} ${teacher.user.profile.lastName}` : (teacher.user?.email || 'Unknown Teacher')}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The assigned teacher will be able to manage this program
              </p>
            </div>

            {/* Program Duration Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                Program Duration
              </h3>
              
              {/* Start Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">When the program begins (optional)</p>
              </div>

              {/* Duration Type Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date Method
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationType('dates')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                      durationType === 'dates'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pick End Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationType('months')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                      durationType === 'months'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Set Duration
                  </button>
                </div>
              </div>

              {/* End Date or Duration */}
              {durationType === 'dates' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Program will auto-deactivate after this date</p>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (months)
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  >
                    <option value={1}>1 month</option>
                    <option value={2}>2 months</option>
                    <option value={3}>3 months</option>
                    <option value={6}>6 months</option>
                    <option value={12}>12 months (1 year)</option>
                  </select>
                  {startDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      End date: {new Date(calculateEndDate(startDate, durationMonths)).toLocaleDateString('en-PH', { 
                        timeZone: 'Asia/Manila', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Enrollment Period Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Enrollment Period
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Deadline
                </label>
                <input
                  type="date"
                  value={enrollmentEnd}
                  onChange={(e) => setEnrollmentEnd(e.target.value)}
                  min={today}
                  max={endDate || (durationType === 'months' && startDate ? calculateEndDate(startDate, durationMonths) : undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  After this date, students won't be able to enroll (optional)
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-gray-500" />
                Program Image
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL for the program card image (optional)
                </p>
              </div>
              {image && (
                <div className="mt-3">
                  <img 
                    src={image} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded-lg"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <Link
                to="/admin"
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Program'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
