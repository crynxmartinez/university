import { useState, useEffect } from 'react'
import { GraduationCap, Plus, Edit2, Trash2, ChevronRight, Layers, X, Check } from 'lucide-react'
import { getMasterPrograms, createMasterProgram, updateMasterProgram, deleteMasterProgram } from '../../api/masterPrograms'

const STATUS_COLORS = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-700'
}

const PROGRAM_TYPES = ['ONLINE', 'IN_PERSON', 'HYBRID', 'WEBINAR', 'EVENT']

export default function AdminMasterPrograms({ onViewOfferings }) {
  const [masterPrograms, setMasterPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [form, setForm] = useState({ code: '', title: '', description: '', programType: 'ONLINE', duration: '', credits: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const data = await getMasterPrograms()
      setMasterPrograms(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingProgram(null)
    setForm({ code: '', title: '', description: '', programType: 'ONLINE', duration: '', credits: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (program) => {
    setEditingProgram(program)
    setForm({ code: program.code, title: program.title, description: program.description || '', programType: program.programType || 'ONLINE', duration: program.duration || '', credits: program.credits || '' })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingProgram) {
        await updateMasterProgram(editingProgram.id, form)
      } else {
        await createMasterProgram(form)
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (program) => {
    if (!confirm(`Delete master program "${program.title}"? This cannot be undone.`)) return
    try {
      await deleteMasterProgram(program.id)
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="text-emerald-600" size={32} />
              Master Programs
            </h1>
            <p className="text-gray-500 mt-1">Permanent program templates. Teachers create offerings from these.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
            <Plus size={18} /> New Master Program
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-emerald-600">{masterPrograms.length}</div>
            <div className="text-gray-500 text-sm mt-1">Total Master Programs</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {masterPrograms.reduce((sum, p) => sum + (p._count?.offerings || 0), 0)}
            </div>
            <div className="text-gray-500 text-sm mt-1">Total Offerings</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600">
              {masterPrograms.reduce((sum, p) => sum + (p.offerings?.filter(o => o.status === 'ACTIVE').length || 0), 0)}
            </div>
            <div className="text-gray-500 text-sm mt-1">Active Offerings</div>
          </div>
        </div>

        <div className="space-y-4">
          {masterPrograms.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <GraduationCap size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No master programs yet</p>
              <button onClick={openCreate} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
                Create Master Program
              </button>
            </div>
          ) : (
            masterPrograms.map(program => (
              <div key={program.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">{program.code}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{program.programType}</span>
                      {program.duration && <span className="text-xs text-gray-500">⏱ {program.duration}</span>}
                    </div>
                    {program.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{program.description}</p>}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Layers size={13} /> {program._count?.offerings || 0} offerings total
                      </span>
                      {program.offerings?.map(o => (
                        <span key={o.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>
                          {o.term} · {o.status}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onViewOfferings && onViewOfferings(program)}
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                    >
                      View Offerings <ChevronRight size={14} />
                    </button>
                    <button onClick={() => openEdit(program)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(program)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProgram ? 'Edit Master Program' : 'New Master Program'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. BCS001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required disabled={!!editingProgram} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.programType} onChange={e => setForm({ ...form, programType: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Bachelor of Computer Science" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input type="text" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 6 months" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} placeholder="0" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Check size={16} />}
                  {editingProgram ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
