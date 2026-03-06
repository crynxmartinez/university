import { Award } from 'lucide-react'
import { useToast } from '../../../components/Toast'
import { getStudentGrades, calculateAllGrades } from '../../../api/grades'
import axios from 'axios'
import API_URL from '../../../api/config'

export default function GradesTab({
  gradesData,
  setGradesData,
  loadingGrades,
  calculatingGrades,
  setCalculatingGrades
}) {
  const toast = useToast()

  const handleCalculateGrades = async () => {
    setCalculatingGrades(true)
    try {
      const student = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      await calculateAllGrades(student.data.student.id)
      const grades = await getStudentGrades(student.data.student.id)
      setGradesData(grades)
      toast.success('Grades calculated successfully!')
    } catch (error) {
      console.error('Error calculating grades:', error)
      toast.error('Failed to calculate grades')
    } finally {
      setCalculatingGrades(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Grades</h2>
          <p className="text-sm text-gray-500">View your academic performance</p>
        </div>
        <div className="flex items-center gap-3">
          {gradesData && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Overall GPA</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{gradesData.overallGPA.toFixed(2)}</p>
            </div>
          )}
          <button
            onClick={handleCalculateGrades}
            disabled={calculatingGrades}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {calculatingGrades ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calculating...
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                Calculate Grades
              </>
            )}
          </button>
        </div>
      </div>

      {loadingGrades ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading grades...</p>
        </div>
      ) : !gradesData ? (
        <div className="py-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No grades calculated yet</p>
          <p className="text-sm text-gray-400">Click "Calculate Grades" to view your academic performance</p>
        </div>
      ) : gradesData.totalGrades === 0 ? (
        <div className="py-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No grades available</p>
          <p className="text-sm text-gray-400">Complete exams and attend classes to earn grades</p>
        </div>
      ) : (
        <div className="space-y-6">
          {gradesData.courseGrades.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Course Grades</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gradesData.courseGrades.map(grade => (
                  <div key={grade.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{grade.course?.name || 'Unknown Course'}</h4>
                        <p className="text-sm text-gray-500">{grade.course?.type || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          grade.letterGrade === 'A' || grade.letterGrade === 'A-' ? 'text-green-600' :
                          grade.letterGrade.startsWith('B') ? 'text-blue-600' :
                          grade.letterGrade.startsWith('C') ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {grade.letterGrade}
                        </div>
                        <p className="text-sm text-gray-500">{grade.finalGrade.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Exam Score</p>
                        <p className="font-medium text-gray-900">{grade.examScore.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Attendance</p>
                        <p className="font-medium text-gray-900">{grade.attendanceScore.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">GPA</span>
                        <span className="font-semibold text-[#1e3a5f]">{grade.gpa.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gradesData.programGrades.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Program Grades</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gradesData.programGrades.map(grade => (
                  <div key={grade.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{grade.program?.name || 'Unknown Program'}</h4>
                        <p className="text-sm text-gray-500">{grade.program?.programType || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          grade.letterGrade === 'A' || grade.letterGrade === 'A-' ? 'text-green-600' :
                          grade.letterGrade.startsWith('B') ? 'text-blue-600' :
                          grade.letterGrade.startsWith('C') ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {grade.letterGrade}
                        </div>
                        <p className="text-sm text-gray-500">{grade.finalGrade.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Exam Score</p>
                        <p className="font-medium text-gray-900">{grade.examScore.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Attendance</p>
                        <p className="font-medium text-gray-900">{grade.attendanceScore.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">GPA</span>
                        <span className="font-semibold text-[#1e3a5f]">{grade.gpa.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
