import { useState, useEffect } from 'react'
import { ArrowLeft, BookOpen, Calendar, Users, Info } from 'lucide-react'
import { getMasterCourses } from '../../api/masterCourses'
import { createCourseOffering } from '../../api/courseOfferings'

export default function CreateCourseOffering({ onBack, onSuccess }) {
  const [masterCourses, setMasterCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    masterCourseId: '',
    term: '',
    startDate: '',
    endDate: '',
    enrollmentStart: '',
    enrollmentEnd: '',
    maxStudents: '',
    meetingLink: '',
    location: ''
  })

  useEffect(() => { fetchMasterCourses() }, [])

  const fetchMasterCourses = async () => {
    try {
      const data = await getMasterCourses()
      setMasterCourses(data)
    } catch (err) {
      setError('Failed to load master courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createCourseOffering({
        ...form,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : null,
        enrollmentStart: form.enrollmentStart || null,
        enrollmentEnd: form.enrollmentEnd || null,
        meetingLink: form.meetingLink || null,
        location: form.location || null
      })
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCourse = masterCourses.find(c => c.id === form.masterCourseId)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  )

  return (
    <div>
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to My Offerings
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="text-emerald-600" size={28} />
              Create Course Offering
            </h1>
            <p className="text-gray-500 mt-1">Pick a master course and set the schedule for this semester.</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <strong>How it works:</strong> Your offering will be submitted as <strong>DRAFT</strong>. An admin will review and activate it before students can enroll.
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Master Course Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Master Course *</label>
              <select
                value={form.masterCourseId}
                onChange={e => setForm({ ...form, masterCourseId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Select a course --</option>
                {masterCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                ))}
              </select>
              {selectedCourse && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                  <strong>{selectedCourse.code}:</strong> {selectedCourse.description || selectedCourse.title}
                </div>
              )}
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term / Semester Name *</label>
              <input
                type="text"
                value={form.term}
                onChange={e => setForm({ ...form, term: e.target.value })}
                placeholder="e.g. Spring 2025, Fall 2025, Batch 3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Course Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={15} /> Course Duration *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Enrollment Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Period (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Enrollment Opens</label>
                  <input
                    type="date"
                    value={form.enrollmentStart}
                    onChange={e => setForm({ ...form, enrollmentStart: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Enrollment Closes</label>
                  <input
                    type="date"
                    value={form.enrollmentEnd}
                    onChange={e => setForm({ ...form, enrollmentEnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Users size={15} /> Max Students (optional)
              </label>
              <input
                type="number"
                value={form.maxStudents}
                onChange={e => setForm({ ...form, maxStudents: e.target.value })}
                placeholder="Leave empty for unlimited"
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Meeting Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
              <input
                type="url"
                value={form.meetingLink}
                onChange={e => setForm({ ...form, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Room 101, Building A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onBack} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : null}
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}
