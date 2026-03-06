import { useState } from 'react'
import { Users, Video } from 'lucide-react'
import { useToast } from '../../../components/Toast'

export default function OneOnOneTab({
  oneOnOneRequests,
  loadingOneOnOne,
  fetchOneOnOneRequests
}) {
  const [oneOnOneTab, setOneOnOneTab] = useState('pending')
  const toast = useToast()

  const filteredRequests = oneOnOneRequests.filter(r => {
    if (oneOnOneTab === 'pending') return r.status === 'PENDING'
    if (oneOnOneTab === 'scheduled') return r.status === 'SCHEDULED'
    return ['COMPLETED', 'CANCELLED', 'DECLINED', 'AUTO_DECLINED'].includes(r.status)
  })

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">1-on-1 Session Requests</h2>
          <p className="text-sm text-gray-500">Review and respond to student requests for 1-on-1 sessions</p>
        </div>
        <button
          onClick={fetchOneOnOneRequests}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm"
        >
          <Users className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setOneOnOneTab('pending')}
          className={`px-4 py-2 font-medium text-sm transition ${
            oneOnOneTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending ({oneOnOneRequests.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setOneOnOneTab('scheduled')}
          className={`px-4 py-2 font-medium text-sm transition ${
            oneOnOneTab === 'scheduled'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Scheduled ({oneOnOneRequests.filter(r => r.status === 'SCHEDULED').length})
        </button>
        <button
          onClick={() => setOneOnOneTab('history')}
          className={`px-4 py-2 font-medium text-sm transition ${
            oneOnOneTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History ({oneOnOneRequests.filter(r => ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(r.status)).length})
        </button>
      </div>

      {loadingOneOnOne ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const studentProfile = req.student?.user?.profile
            const studentName = studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : req.student?.user?.email
            const courseName = req.courseOffering?.masterCourse?.title || req.programOffering?.masterProgram?.title
            const semesterName = req.courseOffering?.semester?.name || req.programOffering?.semester?.name

            return (
              <div key={req.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{studentName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' :
                        req.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{courseName}</p>
                    {semesterName && <p className="text-xs text-gray-400">{semesterName}</p>}
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Topic:</p>
                  <p className="text-sm text-gray-600">{req.topic}</p>
                  {req.studentNote && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mt-2 mb-1">Student's Note:</p>
                      <p className="text-sm text-gray-600">{req.studentNote}</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Duration:</p>
                    <p className="font-medium text-gray-900">{req.duration} min</p>
                  </div>
                  {req.requestedDate && (
                    <div>
                      <p className="text-gray-500">Requested:</p>
                      <p className="font-medium text-gray-900">
                        {new Date(req.requestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {req.requestedTime || ''}
                      </p>
                    </div>
                  )}
                  {req.status === 'SCHEDULED' && req.scheduledAt && (
                    <div>
                      <p className="text-gray-500">Scheduled:</p>
                      <p className="font-medium text-gray-900">
                        {new Date(req.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {req.finalTime}
                      </p>
                    </div>
                  )}
                </div>

                {req.status === 'SCHEDULED' && req.meetingLink && (
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-green-900 mb-1">Meeting Link:</p>
                    <a href={req.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:underline break-all">
                      {req.meetingLink}
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  {req.status === 'PENDING' && (
                    <button
                      onClick={async () => {
                        const { default: RespondToRequestModal } = await import('../../../components/RespondToRequestModal')
                        const modal = document.createElement('div')
                        document.body.appendChild(modal)
                        const { createRoot } = await import('react-dom/client')
                        const root = createRoot(modal)
                        root.render(
                          <RespondToRequestModal
                            request={req}
                            onClose={() => { root.unmount(); modal.remove() }}
                            onSuccess={() => { root.unmount(); modal.remove(); fetchOneOnOneRequests() }}
                          />
                        )
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                    >
                      Respond
                    </button>
                  )}
                  {req.status === 'SCHEDULED' && (
                    <>
                      <a
                        href={req.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                      >
                        <Video size={16} />
                        Join Meeting
                      </a>
                      <button
                        onClick={async () => {
                          if (confirm('Cancel this session?')) {
                            try {
                              const { cancelOneOnOneSession } = await import('../../../api/oneOnOne')
                              const reason = prompt('Reason for cancellation:')
                              if (reason) {
                                await cancelOneOnOneSession(req.id, reason)
                                toast.success('Session cancelled')
                                fetchOneOnOneRequests()
                              }
                            } catch (err) {
                              toast.error(err.message)
                            }
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {filteredRequests.length === 0 && (
            <div className="py-12 text-center">
              <Users size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {oneOnOneTab === 'pending' && 'No pending requests'}
                {oneOnOneTab === 'scheduled' && 'No scheduled sessions'}
                {oneOnOneTab === 'history' && 'No session history'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
