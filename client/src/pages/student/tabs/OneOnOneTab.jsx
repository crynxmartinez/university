import { Users, Video } from 'lucide-react'
import { useToast } from '../../../components/Toast'

export default function OneOnOneTab({
  oneOnOneRequests,
  loadingOneOnOne,
  oneOnOneTab,
  setOneOnOneTab,
  fetchOneOnOneRequests
}) {
  const toast = useToast()

  const pendingCount = oneOnOneRequests.filter(r => ['PENDING', 'PROPOSAL_SENT'].includes(r.status)).length
  const upcomingCount = oneOnOneRequests.filter(r => r.status === 'SCHEDULED').length
  const historyCount = oneOnOneRequests.filter(r => ['COMPLETED', 'CANCELLED', 'DECLINED', 'AUTO_DECLINED'].includes(r.status)).length

  const filteredRequests = oneOnOneRequests.filter(r => {
    if (oneOnOneTab === 'pending') return ['PENDING', 'PROPOSAL_SENT'].includes(r.status)
    if (oneOnOneTab === 'upcoming') return r.status === 'SCHEDULED'
    return ['COMPLETED', 'CANCELLED', 'DECLINED', 'AUTO_DECLINED'].includes(r.status)
  })

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My 1-on-1 Sessions</h2>
          <p className="text-sm text-gray-500">Request and manage 1-on-1 sessions with your teachers</p>
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
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setOneOnOneTab('upcoming')}
          className={`px-4 py-2 font-medium text-sm transition ${
            oneOnOneTab === 'upcoming'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Upcoming ({upcomingCount})
        </button>
        <button
          onClick={() => setOneOnOneTab('history')}
          className={`px-4 py-2 font-medium text-sm transition ${
            oneOnOneTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History ({historyCount})
        </button>
      </div>

      {loadingOneOnOne ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading sessions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const teacherProfile = req.teacher?.user?.profile
            const teacherName = teacherProfile ? `${teacherProfile.firstName} ${teacherProfile.lastName}` : req.teacher?.user?.email
            const courseName = req.courseOffering?.masterCourse?.title || req.programOffering?.masterProgram?.title
            const semesterName = req.courseOffering?.semester?.name || req.programOffering?.semester?.name

            return (
              <div key={req.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{teacherName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'PROPOSAL_SENT' ? 'bg-purple-100 text-purple-700' :
                        req.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' :
                        req.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'DECLINED' || req.status === 'AUTO_DECLINED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.status === 'PROPOSAL_SENT' ? 'Proposal Sent' : req.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{courseName}</p>
                    {semesterName && <p className="text-xs text-gray-400">{semesterName}</p>}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Topic:</p>
                  <p className="text-sm text-gray-600">{req.topic}</p>
                  {req.studentNote && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mt-2 mb-1">Notes:</p>
                      <p className="text-sm text-gray-600">{req.studentNote}</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Duration:</p>
                    <p className="font-medium text-gray-900">{req.duration} minutes</p>
                  </div>
                  {req.status === 'SCHEDULED' && req.scheduledAt && (
                    <div>
                      <p className="text-gray-500">Scheduled:</p>
                      <p className="font-medium text-gray-900">
                        {new Date(req.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {req.finalTime}
                      </p>
                    </div>
                  )}
                  {req.requestedDate && !req.scheduledAt && (
                    <div>
                      <p className="text-gray-500">Requested:</p>
                      <p className="font-medium text-gray-900">
                        {new Date(req.requestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {req.requestedTime || 'Flexible'}
                      </p>
                    </div>
                  )}
                </div>

                {req.status === 'PROPOSAL_SENT' && req.proposedDate && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-purple-900 mb-1">Teacher proposed alternative time:</p>
                    <p className="text-sm text-purple-700">
                      {new Date(req.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {req.proposedTime}
                    </p>
                    {req.proposalReason && <p className="text-xs text-purple-600 mt-1">{req.proposalReason}</p>}
                  </div>
                )}

                {req.teacherNote && req.status === 'SCHEDULED' && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-blue-900 mb-1">Teacher's note:</p>
                    <p className="text-sm text-blue-700">{req.teacherNote}</p>
                  </div>
                )}

                {req.declineReason && (
                  <div className="bg-red-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-red-900 mb-1">Declined:</p>
                    <p className="text-sm text-red-700">{req.declineReason}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {req.status === 'SCHEDULED' && req.meetingLink && (
                    <a
                      href={req.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
                    >
                      <Video size={16} />
                      Join Meeting
                    </a>
                  )}
                  {['PENDING', 'SCHEDULED'].includes(req.status) && (
                    <button
                      onClick={async () => {
                        if (confirm('Cancel this request?')) {
                          try {
                            const { cancelOneOnOneRequest } = await import('../../../api/oneOnOne')
                            await cancelOneOnOneRequest(req.id, 'Cancelled by student')
                            toast.success('Request cancelled')
                            fetchOneOnOneRequests()
                          } catch (err) {
                            toast.error(err.message)
                          }
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition text-sm"
                    >
                      Cancel
                    </button>
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
                {oneOnOneTab === 'upcoming' && 'No upcoming sessions'}
                {oneOnOneTab === 'history' && 'No session history'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Request a 1-on-1 session from your enrolled courses
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
