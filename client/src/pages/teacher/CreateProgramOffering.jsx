import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Calendar, Users, Info } from 'lucide-react'
import { getMasterPrograms } from '../../api/masterPrograms'
import { createProgramOffering } from '../../api/programOfferings'

export default function CreateProgramOffering() {
  const navigate = useNavigate()
  const [masterPrograms, setMasterPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    masterProgramId: '',
    term: '',
    startDate: '',
    endDate: '',
    enrollmentStart: '',
    enrollmentEnd: '',
    maxStudents: '',
    meetingLink: '',
    location: ''
  })

  useEffect(() => { fetchMasterPrograms() }, [])

  const fetchMasterPrograms = async () => {
    try {
      const data = await getMasterPrograms()
      setMasterPrograms(data)
    } catch (err) {
      setError('Failed to load master programs')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createProgramOffering({
        ...form,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : null,
        enrollmentStart: form.enrollmentStart || null,
        enrollmentEnd: form.enrollmentEnd || null,
        meetingLink: form.meetingLink || null,
        location: form.location || null
      })
      navigate('/teacher')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedProgram = masterPrograms.find(p => p.id === form.masterProgramId)

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/teacher" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="text-emerald-600" size={28} />
              Create Program Offering
            </h1>
            <p className="text-gray-500 mt-1">Pick a master program and set the schedule for this term.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <strong>How it works:</strong> Your offering will be submitted as <strong>DRAFT</strong>. An admin will review and activate it before students can enroll.
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Master Program *</label>
              <select
                value={form.masterProgramId}
                onChange={e => setForm({ ...form, masterProgramId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Select a program --</option>
                {masterPrograms.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
                ))}
              </select>
              {selectedProgram && (
                <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                  <strong>{selectedProgram.code}:</strong> {selectedProgram.description || selectedProgram.title}
                  {selectedProgram.duration && <span className="ml-2 text-purple-500">· {selectedProgram.duration}</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term / Batch Name *</label>
              <input
                type="text"
                value={form.term}
                onChange={e => setForm({ ...form, term: e.target.value })}
                placeholder="e.g. Spring 2025, Batch 3, Year 2025"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={15} /> Program Duration *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Period (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Enrollment Opens</label>
                  <input type="date" value={form.enrollmentStart} onChange={e => setForm({ ...form, enrollmentStart: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Enrollment Closes</label>
                  <input type="date" value={form.enrollmentEnd} onChange={e => setForm({ ...form, enrollmentEnd: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Users size={15} /> Max Students (optional)
              </label>
              <input type="number" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: e.target.value })} placeholder="Leave empty for unlimited" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
              <input type="url" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://zoom.us/j/..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room 101, Building A" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="flex gap-3 pt-2">
              <Link to="/teacher" className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm text-center">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : null}
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
