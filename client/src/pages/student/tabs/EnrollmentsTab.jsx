import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Video, Radio, Folder, Calendar, CheckCircle, CreditCard, Clock, XCircle } from 'lucide-react'
import PaymentUploadModal from '../../../components/PaymentUploadModal'

export default function EnrollmentsTab({
  enrollmentsTab,
  loading,
  myProgramEnrollments,
  myCourseEnrollments,
  setActiveTab,
  setBrowseTab,
  setShowProgramCalendarModal,
  setShowCalendarModal,
  setSelectedEnrolledProgram,
  setSelectedCourse
}) {
  const navigate = useNavigate()
  const [paymentModal, setPaymentModal] = useState({ open: false, type: null, id: null })

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        )
      case 'PENDING':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Payment Pending
          </span>
        )
      case 'REJECTED':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Payment Rejected
          </span>
        )
      default:
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Unpaid
          </span>
        )
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* My Enrolled Programs */}
      {enrollmentsTab === 'programs' && (
        <>
          {/* Calendar Button - Always visible */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowProgramCalendarModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
            >
              <Calendar className="w-4 h-4" />
              View Schedule
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading your programs...</p>
            </div>
          ) : myProgramEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled programs</h3>
              <p className="text-gray-500 mb-4">You haven't enrolled in any programs yet.</p>
              <button 
                onClick={() => { setActiveTab('browse'); setBrowseTab('programs') }}
                className="text-[#f7941d] hover:underline font-medium"
              >
                Browse Programs →
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProgramEnrollments.map((enrollment) => {
                const program = enrollment.program
                return (
                  <div 
                    key={enrollment.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#f7941d] transition flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{program.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        program.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
                        program.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
                        program.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
                        program.programType === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {program.programType === 'WEBINAR' ? 'Webinar' :
                         program.programType === 'IN_PERSON' ? 'In-Person' :
                         program.programType === 'EVENT' ? 'Event' :
                         program.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
                      </span>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Enrolled
                      </span>
                      {getPaymentStatusBadge(enrollment.paymentStatus)}
                    </div>
                    
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                      {program.description?.replace(/<[^>]*>/g, '') || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>{program.modules?.length || 0} modules</span>
                      {program.schedule && <span>{program.schedule}</span>}
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => navigate(`/student/programs/${program.id}`)}
                        className="flex-1 py-2 bg-[#f7941d] text-white text-sm rounded-lg hover:bg-[#e8850f] font-medium"
                      >
                        View Program
                      </button>
                      {enrollment.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() => setPaymentModal({ open: true, type: 'program', id: enrollment.id })}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center gap-1"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedEnrolledProgram(program)}
                        className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                      >
                        Info
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* My Enrolled Courses */}
      {enrollmentsTab === 'courses' && (
        <>
          {/* Calendar Button - Always visible */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition"
            >
              <Calendar className="w-4 h-4" />
              View Schedule
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading your courses...</p>
            </div>
          ) : myCourseEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
              <button 
                onClick={() => { setActiveTab('browse'); setBrowseTab('courses') }}
                className="text-[#f7941d] hover:underline font-medium"
              >
                Browse Courses →
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCourseEnrollments.map((course) => (
                <div 
                  key={course.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#f7941d] transition flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{course.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                      course.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {course.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                    </span>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Enrolled
                    </span>
                    {getPaymentStatusBadge(course.paymentStatus)}
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                    {course.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{course.modules?.length || 0} modules</span>
                    <span>By Sheikh {course.teacher?.user?.profile?.firstName} {course.teacher?.user?.profile?.lastName}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <Link
                      to={`/student/courses/${course.slug || course.id}`}
                      className="flex-1 py-2 bg-[#f7941d] text-white text-sm rounded-lg hover:bg-[#e8850f] font-medium text-center"
                    >
                      View Course
                    </Link>
                    {course.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => setPaymentModal({ open: true, type: 'course', id: course.enrollmentId || course.id })}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center gap-1"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                    >
                      Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Payment Upload Modal */}
      <PaymentUploadModal
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, type: null, id: null })}
        enrollmentType={paymentModal.type}
        enrollmentId={paymentModal.id}
        onSuccess={() => {
          setPaymentModal({ open: false, type: null, id: null })
          // Refresh will happen on next page load
        }}
      />
    </div>
  )
}
