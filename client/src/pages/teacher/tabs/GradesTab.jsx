import { BookOpen, Users, Video, Radio, ChevronRight, ChevronLeft, Shield } from 'lucide-react'
import { useToast } from '../../../components/Toast'
import { issueCertificate } from '../../../api/certificates'

export default function GradesTab({
  courses,
  loading,
  selectedGradeCourse,
  setSelectedGradeCourse,
  gradesData,
  setGradesData,
  loadingGrades,
  handleSelectGradeCourse,
  issuingCertificate,
  setIssuingCertificate
}) {
  const toast = useToast()

  if (!selectedGradeCourse) {
    return (
      <div>
        <p className="text-gray-600 mb-6">Select a course to view student grades</p>
        
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Yet</h3>
            <p className="text-gray-500">Create a course first to manage grades</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => handleSelectGradeCourse(course)}
                className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    course.type === 'LIVE' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    {course.type === 'LIVE' ? (
                      <Radio className="w-6 h-6 text-purple-600" />
                    ) : (
                      <Video className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1e3a5f] transition" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{course.name}</h3>
                <p className="text-sm text-gray-500">
                  {course.enrollments?.length || 0} students enrolled
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            setSelectedGradeCourse(null)
            setGradesData(null)
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Courses
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{selectedGradeCourse.name}</h2>
          <p className="text-sm text-gray-500">Gradebook</p>
        </div>
      </div>

      {loadingGrades ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading grades...</p>
        </div>
      ) : !gradesData || gradesData.students?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h3>
          <p className="text-gray-500">Students need to enroll in this course first</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Student</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Exam Score</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Attendance</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Final Grade</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Letter</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">GPA</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gradesData.students.map(student => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {student.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{student.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.grade ? (
                        <span className="font-medium text-gray-900">{student.grade.examScore.toFixed(1)}%</span>
                      ) : (
                        <span className="text-gray-400">Not calculated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.grade ? (
                        <span className="font-medium text-gray-900">{student.grade.attendanceScore.toFixed(1)}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.grade ? (
                        <span className={`text-lg font-bold ${
                          student.grade.finalGrade >= 90 ? 'text-green-600' :
                          student.grade.finalGrade >= 80 ? 'text-blue-600' :
                          student.grade.finalGrade >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {student.grade.finalGrade.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.grade ? (
                        <span className={`text-xl font-bold ${
                          student.grade.letterGrade === 'A' || student.grade.letterGrade === 'A-' ? 'text-green-600' :
                          student.grade.letterGrade.startsWith('B') ? 'text-blue-600' :
                          student.grade.letterGrade.startsWith('C') ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {student.grade.letterGrade}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.grade ? (
                        <span className="font-semibold text-[#1e3a5f]">{student.grade.gpa.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.grade && student.grade.finalGrade >= 70 ? (
                        <button
                          onClick={async () => {
                            const certificateUrl = prompt('Enter the certificate download URL (e.g., Google Drive link, Dropbox link, etc.):')
                            if (!certificateUrl) {
                              toast.error('Certificate URL is required')
                              return
                            }
                            
                            setIssuingCertificate(student.studentId)
                            try {
                              await issueCertificate({
                                studentId: student.studentId,
                                courseId: selectedGradeCourse.id,
                                completionDate: new Date().toISOString(),
                                grade: student.grade.letterGrade,
                                gpa: student.grade.gpa,
                                certificateUrl
                              })
                              toast.success('Certificate issued successfully!')
                            } catch (error) {
                              console.error('Error issuing certificate:', error)
                              if (error.response?.data?.error?.includes('already issued')) {
                                toast.error('Certificate already issued')
                              } else {
                                toast.error('Failed to issue certificate')
                              }
                            } finally {
                              setIssuingCertificate(null)
                            }
                          }}
                          disabled={issuingCertificate === student.studentId}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f7941d] hover:bg-[#e88a1a] text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {issuingCertificate === student.studentId ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Issuing...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Issue Certificate
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {student.grade ? 'Below passing grade' : 'No grade'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary */}
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total Students: <span className="font-semibold">{gradesData.students.length}</span>
            </span>
            <span className="text-gray-600">
              Graded: <span className="font-semibold">{gradesData.students.filter(s => s.grade).length}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
