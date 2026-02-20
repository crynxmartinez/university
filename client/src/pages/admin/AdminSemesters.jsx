import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import { getSemesters, createSemester, updateSemester, deleteSemester } from '../../api/semesters'

const STATUS_COLORS = {
  UPCOMING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-700'
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default function AdminSemesters() {
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', enrollmentStart: '', enrollmentEnd: '', status: 'UPCOMING' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const data = await getSemesters()
      setSemesters(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', startDate: '', endDate: '', enrollmentStart: '', enrollmentEnd: '', status: 'UPCOMING' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      name: s.name,
      startDate: s.startDate?.slice(0, 10) || '',
      endDate: s.endDate?.slice(0, 10) || '',
      enrollmentStart: s.enrollmentStart?.slice(0, 10) || '',
      enrollmentEnd: s.enrollmentEnd?.slice(0, 10) || '',
      status: s.status
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateSemester(editing.id, form)
      } else {
        await createSemester(form)
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s) => {
    if (!confirm(`Delete semester "${s.name}"? This cannot be undone.`)) return
    try {
      await deleteSemester(s.id)
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarDays className="text-emerald-600" size={32} />
            Semesters
          </h1>
          <p className="text-gray-500 mt-1">Manage academic semesters. Teachers pick a semester when creating offerings.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          <Plus size={18} /> New Semester
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-3xl font-bold text-emerald-600">{semesters.length}</div>
          <div className="text-gray-500 text-sm mt-1">Total Semesters</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-3xl font-bold text-green-600">{semesters.filter(s => s.status === 'ACTIVE').length}</div>
          <div className="text-gray-500 text-sm mt-1">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-3xl font-bold text-yellow-600">{semesters.filter(s => s.status === 'UPCOMING').length}</div>
          <div className="text-gray-500 text-sm mt-1">Upcoming</div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {semesters.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CalendarDays size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No semesters yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first semester to get started</p>
            <button onClick={openCreate} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
              Create Semester
            </button>
          </div>
        ) : (
          semesters.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                    <span>📅 {fmt(s.startDate)} → {fmt(s.endDate)}</span>
                    {s.enrollmentStart && (
                      <span>🎟 Enrollment: {fmt(s.enrollmentStart)} → {fmt(s.enrollmentEnd)}</span>
                    )}
                    <span className="text-emerald-600 font-medium">
                      {(s._count?.courseOfferings || 0) + (s._count?.programOfferings || 0)} offerings
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(s)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Semester' : 'New Semester'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Term 1 - 2026, Batch 5 - 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester Duration *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Check size={16} />}
                  {editing ? 'Save Changes' : 'Create Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
