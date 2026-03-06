import { useState } from 'react'
import { X, Check, XCircle, Calendar, Clock, Link as LinkIcon } from 'lucide-react'
import { respondToOneOnOneRequest } from '../api/oneOnOne'

export default function RespondToRequestModal({ request, onClose, onSuccess }) {
  const [action, setAction] = useState('ACCEPT') // 'ACCEPT', 'DECLINE', 'PROPOSE'
  const [form, setForm] = useState({
    finalDate: '',
    finalTime: '',
    meetingLink: '',
    teacherNote: '',
    proposedDate: '',
    proposedTime: '',
    proposalReason: '',
    declineReason: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const studentProfile = request.student?.user?.profile
  const studentName = studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : request.student?.user?.email
  const courseName = request.courseOffering?.masterCourse?.title || request.programOffering?.masterProgram?.title

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (action === 'ACCEPT') {
      if (!form.finalDate || !form.finalTime || !form.meetingLink) {
        setError('Date, time, and meeting link are required')
        return
      }
    } else if (action === 'PROPOSE') {
      if (!form.proposedDate || !form.proposedTime) {
        setError('Proposed date and time are required')
        return
      }
    } else if (action === 'DECLINE') {
      if (!form.declineReason.trim()) {
        setError('Please provide a reason for declining')
        return
      }
    }

    setSubmitting(true)

    try {
      const data = { action }
      if (action === 'ACCEPT') {
        data.finalDate = form.finalDate
        data.finalTime = form.finalTime
        data.meetingLink = form.meetingLink
        data.teacherNote = form.teacherNote || null
      } else if (action === 'PROPOSE') {
        data.proposedDate = form.proposedDate
        data.proposedTime = form.proposedTime
        data.proposalReason = form.proposalReason || null
      } else if (action === 'DECLINE') {
        data.declineReason = form.declineReason
      }

      await respondToOneOnOneRequest(request.id, data)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Respond to 1-on-1 Request</h2>
              <p className="text-sm text-gray-600 mt-1">{studentName} • {courseName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Request Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Duration</p>
                <p className="text-sm font-semibold text-gray-900">{request.duration} minutes</p>
              </div>
              {request.requestedDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Student's Preference</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(request.requestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {request.requestedTime || 'Flexible'}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Topic</p>
              <p className="text-sm text-gray-900">{request.topic}</p>
            </div>
            {request.studentNote && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Student's Note</p>
                <p className="text-sm text-gray-700">{request.studentNote}</p>
              </div>
            )}
          </div>

          {/* Action Selector */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setAction('ACCEPT')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                action === 'ACCEPT'
                  ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Check size={18} className="inline mr-1.5" />
              Accept
            </button>
            <button
              type="button"
              onClick={() => setAction('PROPOSE')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                action === 'PROPOSE'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Calendar size={18} className="inline mr-1.5" />
              Propose Alternative
            </button>
            <button
              type="button"
              onClick={() => setAction('DECLINE')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                action === 'DECLINE'
                  ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <XCircle size={18} className="inline mr-1.5" />
              Decline
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Accept Form */}
            {action === 'ACCEPT' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Final Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.finalDate}
                      onChange={e => setForm({ ...form, finalDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Final Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.finalTime}
                      onChange={e => setForm({ ...form, finalTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.meetingLink}
                    onChange={e => setForm({ ...form, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/... or https://zoom.us/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Paste your Google Meet, Zoom, or other meeting link</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message to Student (optional)
                  </label>
                  <textarea
                    value={form.teacherNote}
                    onChange={e => setForm({ ...form, teacherNote: e.target.value })}
                    placeholder="e.g., Looking forward to helping you with React hooks!"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Propose Form */}
            {action === 'PROPOSE' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Proposed Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.proposedDate}
                      onChange={e => setForm({ ...form, proposedDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Proposed Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.proposedTime}
                      onChange={e => setForm({ ...form, proposedTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Alternative (optional)
                  </label>
                  <textarea
                    value={form.proposalReason}
                    onChange={e => setForm({ ...form, proposalReason: e.target.value })}
                    placeholder="e.g., I'm not available at 3PM, but 5PM works better for me"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Decline Form */}
            {action === 'DECLINE' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.declineReason}
                  onChange={e => setForm({ ...form, declineReason: e.target.value })}
                  placeholder="e.g., I'm fully booked this week. Please request again next week."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-2.5 rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-white ${
                  action === 'ACCEPT' ? 'bg-green-600 hover:bg-green-700' :
                  action === 'PROPOSE' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {action === 'ACCEPT' && <><Check size={16} /> Accept & Schedule</>}
                    {action === 'PROPOSE' && <><Calendar size={16} /> Send Proposal</>}
                    {action === 'DECLINE' && <><XCircle size={16} /> Decline Request</>}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
