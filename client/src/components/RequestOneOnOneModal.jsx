import { useState } from 'react'
import { X, Calendar, Clock, MessageSquare } from 'lucide-react'
import { createOneOnOneRequest } from '../api/oneOnOne'

export default function RequestOneOnOneModal({ offering, offeringType = 'course', onClose, onSuccess }) {
  const [form, setForm] = useState({
    topic: '',
    studentNote: '',
    requestedDate: '',
    requestedTime: '',
    duration: 60,
    isFlexible: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.topic.trim()) {
      setError('Topic is required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const data = {
        [offeringType === 'course' ? 'courseOfferingId' : 'programOfferingId']: offering.id,
        topic: form.topic,
        studentNote: form.studentNote || null,
        requestedDate: form.isFlexible ? null : (form.requestedDate || null),
        requestedTime: form.isFlexible ? null : (form.requestedTime || null),
        duration: form.duration
      }

      await createOneOnOneRequest(data)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const title = offeringType === 'course'
    ? offering.masterCourse?.title
    : offering.masterProgram?.title

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Request 1-on-1 Session</h2>
            <p className="text-sm text-gray-500 mt-0.5">{title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Topic / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g., Need help with React hooks for Exam 2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes (optional)
            </label>
            <textarea
              value={form.studentNote}
              onChange={e => setForm({ ...form, studentNote: e.target.value })}
              placeholder="Any additional context or specific questions..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, duration: 30 })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  form.duration === 30
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Clock size={16} className="inline mr-1.5" />
                30 minutes
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, duration: 60 })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  form.duration === 60
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Clock size={16} className="inline mr-1.5" />
                1 hour
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="flexible"
                checked={form.isFlexible}
                onChange={e => setForm({ ...form, isFlexible: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="flexible" className="text-sm font-medium text-gray-700">
                I'm flexible with the date/time
              </label>
            </div>

            {!form.isFlexible && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={form.requestedDate}
                    onChange={e => setForm({ ...form, requestedDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    value={form.requestedTime}
                    onChange={e => setForm({ ...form, requestedTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {form.isFlexible
                ? 'Teacher will propose a time that works for both of you'
                : 'This is just a preference — teacher will confirm or propose an alternative'}
            </p>
          </div>

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
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <MessageSquare size={16} />
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
