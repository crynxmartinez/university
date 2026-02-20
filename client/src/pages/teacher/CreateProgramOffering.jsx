import { useState, useEffect } from 'react'
import { ArrowLeft, GraduationCap, Users, Info, CalendarDays } from 'lucide-react'
import { getMasterPrograms } from '../../api/masterPrograms'
import { getSemesters } from '../../api/semesters'
import { createProgramOffering } from '../../api/programOfferings'

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export default function CreateProgramOffering({ onBack, onSuccess }) {
  const [masterPrograms, setMasterPrograms] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ masterProgramId: '', semesterId: '', maxStudents: '', meetingLink: '', location: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [programs, sems] = await Promise.all([getMasterPrograms(), getSemesters()])
      setMasterPrograms(programs)
      setSemesters(sems)
    } catch (err) {
      setError('Failed to load data')
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
        masterProgramId: form.masterProgramId,
        semesterId: form.semesterId,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : null,
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

  const selectedProgram = masterPrograms.find(p => p.id === form.masterProgramId)
  const selectedSemester = semesters.find(s => s.id === form.semesterId)

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

      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="text-emerald-600" size={28} />
            Create Program Offering
          </h1>
          <p className="text-gray-500 mt-1">Pick a master program and a semester. Admin will activate it.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>How it works:</strong> Your offering will be submitted as <strong>DRAFT</strong>. Admin will review and activate it before students can enroll.
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Master Program */}
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
            {selectedProgram?.description && (
              <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{selectedProgram.description}</p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
            {semesters.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                No semesters available. Ask an admin to create a semester first.
              </div>
            ) : (
              <select
                value={form.semesterId}
                onChange={e => setForm({ ...form, semesterId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Select a semester --</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                ))}
              </select>
            )}
            {selectedSemester && (
              <div className="mt-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-xs text-purple-700 flex items-center gap-2">
                <CalendarDays size={13} />
                {fmt(selectedSemester.startDate)} → {fmt(selectedSemester.endDate)}
                {selectedSemester.enrollmentStart && (
                  <span className="ml-2">· Enrollment: {fmt(selectedSemester.enrollmentStart)} → {fmt(selectedSemester.enrollmentEnd)}</span>
                )}
              </div>
            )}
          </div>

          {/* Max Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Users size={15} /> Max Students (optional)
            </label>
            <input type="number" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: e.target.value })} placeholder="Leave empty for unlimited" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
            <input type="url" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://zoom.us/j/..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room 101, Building A" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onBack} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : null}
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
