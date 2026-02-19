import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Plus, CheckCircle, Archive, XCircle, Trash2, Users, Calendar, Clock } from 'lucide-react'
import { getMasterCourse } from '../../api/masterCourses'
import { activateCourseOffering, completeCourseOffering, archiveCourseOffering, deleteCourseOffering } from '../../api/courseOfferings'

const STATUS_COLORS = {
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200'
}

const STATUS_LABELS = {
  DRAFT: '⏳ Draft',
  ACTIVE: '✅ Active',
  COMPLETED: '🎓 Completed',
  ARCHIVED: '📦 Archived'
}

export default function AdminMasterCourseDetail() {
  const { id } = useParams()
  const [masterCourse, setMasterCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    try {
      const data = await getMasterCourse(id)
      setMasterCourse(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (offeringId) => {
    setActionLoading(offeringId)
    try {
      await activateCourseOffering(offeringId)
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  const handleComplete = async (offeringId) => {
    if (!confirm('Mark this offering as completed?')) return
    setActionLoading(offeringId)
    try {
      await completeCourseOffering(offeringId)
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  const handleArchive = async (offeringId) => {
    if (!confirm('Archive this offering?')) return
    setActionLoading(offeringId)
    try {
      await archiveCourseOffering(offeringId)
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  const handleDelete = async (offeringId) => {
    if (!confirm('Delete this offering? This cannot be undone.')) return
    setActionLoading(offeringId)
    try {
      await deleteCourseOffering(offeringId)
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  )

  if (!masterCourse) return (
    <div className="p-6 text-center text-gray-500">Master course not found.</div>
  )

  const draftOfferings = masterCourse.offerings?.filter(o => o.status === 'DRAFT') || []
  const activeOfferings = masterCourse.offerings?.filter(o => o.status === 'ACTIVE') || []
  const completedOfferings = masterCourse.offerings?.filter(o => o.status === 'COMPLETED') || []
  const archivedOfferings = masterCourse.offerings?.filter(o => o.status === 'ARCHIVED') || []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link to="/admin/master-courses" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Master Courses
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-lg">{masterCourse.code}</span>
                <h1 className="text-2xl font-bold text-gray-900">{masterCourse.title}</h1>
              </div>
              {masterCourse.description && <p className="text-gray-500 mb-3">{masterCourse.description}</p>}
              {masterCourse.syllabus && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-2">
                  <strong className="text-gray-700">Syllabus:</strong> {masterCourse.syllabus}
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                {masterCourse.credits > 0 && <span>📚 {masterCourse.credits} credits</span>}
                <span>📋 {masterCourse.offerings?.length || 0} total offerings</span>
                <span>✅ {activeOfferings.length} active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approval - DRAFT offerings */}
        {draftOfferings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
              Pending Approval ({draftOfferings.length})
            </h2>
            <div className="space-y-3">
              {draftOfferings.map(offering => (
                <OfferingCard
                  key={offering.id}
                  offering={offering}
                  actionLoading={actionLoading}
                  onActivate={() => handleActivate(offering.id)}
                  onDelete={() => handleDelete(offering.id)}
                  showActivate
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Offerings */}
        {activeOfferings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
              Active ({activeOfferings.length})
            </h2>
            <div className="space-y-3">
              {activeOfferings.map(offering => (
                <OfferingCard
                  key={offering.id}
                  offering={offering}
                  actionLoading={actionLoading}
                  onComplete={() => handleComplete(offering.id)}
                  onArchive={() => handleArchive(offering.id)}
                  onDelete={() => handleDelete(offering.id)}
                  showComplete
                  showArchive
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Offerings */}
        {completedOfferings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              Completed ({completedOfferings.length})
            </h2>
            <div className="space-y-3">
              {completedOfferings.map(offering => (
                <OfferingCard
                  key={offering.id}
                  offering={offering}
                  actionLoading={actionLoading}
                  onArchive={() => handleArchive(offering.id)}
                  onDelete={() => handleDelete(offering.id)}
                  showArchive
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Offerings */}
        {archivedOfferings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>
              Archived ({archivedOfferings.length})
            </h2>
            <div className="space-y-3">
              {archivedOfferings.map(offering => (
                <OfferingCard
                  key={offering.id}
                  offering={offering}
                  actionLoading={actionLoading}
                  onDelete={() => handleDelete(offering.id)}
                />
              ))}
            </div>
          </div>
        )}

        {masterCourse.offerings?.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No offerings yet for this course.</p>
            <p className="text-gray-400 text-sm mt-1">Teachers will create offerings from this master course.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function OfferingCard({ offering, actionLoading, onActivate, onComplete, onArchive, onDelete, showActivate, showComplete, showArchive }) {
  const isLoading = actionLoading === offering.id
  const teacher = offering.teacher?.user?.profile
  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'No teacher'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[offering.status]}`}>
            {STATUS_LABELS[offering.status]}
          </span>
          <span className="font-semibold text-gray-900">{offering.term}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
          <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(offering.startDate).toLocaleDateString()} – {new Date(offering.endDate).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Users size={13} /> {offering._count?.enrollments || 0} students{offering.maxStudents ? ` / ${offering.maxStudents}` : ''}</span>
          <span>👨‍🏫 {teacherName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showActivate && (
          <button
            onClick={onActivate}
            disabled={isLoading}
            className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <CheckCircle size={13} /> Activate
          </button>
        )}
        {showComplete && (
          <button
            onClick={onComplete}
            disabled={isLoading}
            className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <CheckCircle size={13} /> Complete
          </button>
        )}
        {showArchive && (
          <button
            onClick={onArchive}
            disabled={isLoading}
            className="flex items-center gap-1 bg-gray-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
          >
            <Archive size={13} /> Archive
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
