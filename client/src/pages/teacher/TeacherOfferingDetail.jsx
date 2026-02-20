import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Award, ExternalLink, X, Check, BookOpen, GraduationCap, CalendarDays } from 'lucide-react'
import { getCourseOffering } from '../../api/courseOfferings'
import { getProgramOffering } from '../../api/programOfferings'
import { issueCertificate, getOfferingCertificates, revokeCertificate } from '../../api/certificates'

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const STATUS_COLORS = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-700'
}

export default function TeacherOfferingDetail({ offeringId, offeringType = 'course', onBack }) {
  const [offering, setOffering] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('students')

  // Issue cert modal
  const [showCertModal, setShowCertModal] = useState(false)
  const [certStudent, setCertStudent] = useState(null)
  const [certUrl, setCertUrl] = useState('')
  const [certDate, setCertDate] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [certError, setCertError] = useState('')

  useEffect(() => { fetchData() }, [offeringId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [off, certs] = await Promise.all([
        offeringType === 'course' ? getCourseOffering(offeringId) : getProgramOffering(offeringId),
        getOfferingCertificates(offeringId, offeringType)
      ])
      setOffering(off)
      setCertificates(certs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCertModal = (enrollment) => {
    setCertStudent(enrollment)
    setCertUrl('')
    setCertDate(new Date().toISOString().slice(0, 10))
    setCertError('')
    setShowCertModal(true)
  }

  const handleIssueCert = async (e) => {
    e.preventDefault()
    if (!certUrl.trim()) { setCertError('Certificate URL is required'); return }
    setIssuing(true)
    setCertError('')
    try {
      await issueCertificate({
        studentId: certStudent.student.id,
        [offeringType === 'course' ? 'courseOfferingId' : 'programOfferingId']: offeringId,
        certificateUrl: certUrl,
        completionDate: certDate || undefined
      })
      setShowCertModal(false)
      fetchData()
    } catch (err) {
      setCertError(err.message)
    } finally {
      setIssuing(false)
    }
  }

  const handleRevoke = async (certId) => {
    if (!confirm('Revoke this certificate?')) return
    try {
      await revokeCertificate(certId, 'Revoked by teacher')
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  const getCertForStudent = (studentId) =>
    certificates.find(c => c.student?.id === studentId)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  )

  if (!offering) return (
    <div className="text-center py-20 text-gray-500">Offering not found.</div>
  )

  const title = offeringType === 'course'
    ? offering.masterCourse?.title
    : offering.masterProgram?.title
  const code = offeringType === 'course'
    ? offering.masterCourse?.code
    : offering.masterProgram?.code
  const enrollments = offering.enrollments || []

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Back to My Offerings
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${offeringType === 'course' ? 'bg-emerald-100' : 'bg-purple-100'}`}>
              {offeringType === 'course'
                ? <BookOpen size={24} className="text-emerald-600" />
                : <GraduationCap size={24} className="text-purple-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400">{code}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[offering.status]}`}>{offering.status}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {offering.semester && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <CalendarDays size={13} />
                  {offering.semester.name} · {fmt(offering.semester.startDate)} → {fmt(offering.semester.endDate)}
                </div>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="font-semibold text-2xl text-gray-900">{enrollments.length}</div>
            <div>enrolled</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'students' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={14} className="inline mr-1.5" />Enrolled Students ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'certificates' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Award size={14} className="inline mr-1.5" />Certificates ({certificates.length})
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No students enrolled yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Enrolled</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Certificate</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((enrollment) => {
                  const cert = getCertForStudent(enrollment.student?.id)
                  const profile = enrollment.student?.user?.profile
                  const name = profile ? `${profile.firstName} ${profile.lastName}` : enrollment.student?.user?.email
                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                            {name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{name}</div>
                            <div className="text-xs text-gray-400">{enrollment.student?.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{fmt(enrollment.enrolledAt)}</td>
                      <td className="px-6 py-4">
                        {cert ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <Check size={11} /> Issued
                            </span>
                            <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink size={11} /> View
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not issued</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {cert ? (
                          <button onClick={() => handleRevoke(cert.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => openCertModal(enrollment)}
                            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition ml-auto"
                          >
                            <Award size={12} /> Issue Certificate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {certificates.length === 0 ? (
            <div className="p-12 text-center">
              <Award size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No certificates issued yet</p>
              <p className="text-gray-400 text-sm mt-1">Go to the Students tab to issue certificates</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cert #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Issued</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Link</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {certificates.map((cert) => {
                  const profile = cert.student?.user?.profile
                  const name = profile ? `${profile.firstName} ${profile.lastName}` : cert.student?.user?.email
                  return (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">{name}</div>
                        <div className="text-xs text-gray-400">{cert.student?.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-600">{cert.certificateNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{fmt(cert.issuedDate)}</td>
                      <td className="px-6 py-4">
                        <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink size={13} /> Open
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleRevoke(cert.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                          Revoke
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Issue Certificate Modal */}
      {showCertModal && certStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award size={20} className="text-emerald-600" /> Issue Certificate
              </h2>
              <button onClick={() => setShowCertModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleIssueCert} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="font-medium text-gray-900">
                  {certStudent.student?.user?.profile
                    ? `${certStudent.student.user.profile.firstName} ${certStudent.student.user.profile.lastName}`
                    : certStudent.student?.user?.email}
                </div>
                <div className="text-gray-500 text-xs">{certStudent.student?.user?.email}</div>
              </div>

              {certError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{certError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Download URL *</label>
                <input
                  type="url"
                  value={certUrl}
                  onChange={e => setCertUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Paste a Google Drive, Dropbox, or any shareable link to the certificate file.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                <input
                  type="date"
                  value={certDate}
                  onChange={e => setCertDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCertModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={issuing} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {issuing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Award size={15} />}
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
