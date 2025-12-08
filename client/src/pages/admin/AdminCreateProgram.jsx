import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Globe, MapPin, Video, DollarSign, Image, Info } from 'lucide-react'
import { createAdminProgram } from '../../api/adminPrograms'

export default function AdminCreateProgram() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [programType, setProgramType] = useState('ONLINE')
  const [price, setPrice] = useState('')
  const [priceType, setPriceType] = useState('ONE_TIME')
  const [location, setLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [image, setImage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const program = await createAdminProgram({
        name,
        description,
        programType,
        price: price ? parseFloat(price) : 0,
        priceType,
        location: location || null,
        meetingLink: meetingLink || null,
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

            {/* Pricing */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-500" />
                Pricing
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Type
                  </label>
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                  >
                    <option value="ONE_TIME">One-Time Payment</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
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
