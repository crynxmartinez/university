// Phase 6.8: Student Progress Dashboard Component
import { useState, useEffect } from 'react'
import { 
  TrendingUp, Award, BookOpen, Calendar, Target, Flame, 
  CheckCircle, Clock, BarChart3, Activity 
} from 'lucide-react'
import { getProgressOverview, getCourseProgress, getRecentActivity } from '../api/progress'

export default function ProgressDashboard() {
  const [overview, setOverview] = useState(null)
  const [courses, setCourses] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overviewData, courseData, activityData] = await Promise.all([
        getProgressOverview(),
        getCourseProgress(),
        getRecentActivity(30)
      ])
      setOverview(overviewData.overview)
      setCourses(courseData.courses)
      setActivities(activityData.activities)
    } catch (error) {
      console.error('Failed to fetch progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Progress</h2>
        <div className="flex gap-2">
          {['overview', 'courses', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && overview && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Courses Completed"
              value={`${overview.completedCourses}/${overview.totalCourses}`}
              subtext={`${overview.courseCompletionRate.toFixed(0)}% complete`}
              color="blue"
            />
            <StatCard
              icon={Target}
              label="Programs Completed"
              value={`${overview.completedPrograms}/${overview.totalPrograms}`}
              subtext={`${overview.programCompletionRate.toFixed(0)}% complete`}
              color="purple"
            />
            <StatCard
              icon={Calendar}
              label="Attendance Rate"
              value={`${overview.attendanceRate.toFixed(0)}%`}
              subtext="Sessions attended"
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              label="Average GPA"
              value={overview.averageGPA.toFixed(2)}
              subtext="Cumulative"
              color="orange"
            />
          </div>

          {/* Streak & Certificates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Flame className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{overview.currentStreak} days</p>
                  <p className="text-white/80">Current Learning Streak</p>
                  <p className="text-sm text-white/60 mt-1">
                    Longest: {overview.longestStreak} days
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] rounded-xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{overview.certificatesEarned}</p>
                  <p className="text-white/80">Certificates Earned</p>
                  <p className="text-sm text-white/60 mt-1">
                    Keep learning to earn more!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Overall Progress</h3>
            <div className="space-y-4">
              <ProgressBar
                label="Course Completion"
                value={overview.courseCompletionRate}
                color="bg-blue-500"
              />
              <ProgressBar
                label="Program Completion"
                value={overview.programCompletionRate}
                color="bg-purple-500"
              />
              <ProgressBar
                label="Attendance"
                value={overview.attendanceRate}
                color="bg-green-500"
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Course Progress</h3>
          </div>
          {courses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No courses enrolled yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {courses.map(course => (
                <div key={course.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                      <p className="text-sm text-gray-500">{course.semester}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-700'
                        : course.status === 'ACTIVE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-500">Attendance</p>
                      <p className="font-medium">
                        {course.progress.sessionsAttended}/{course.progress.totalSessions}
                        <span className="text-gray-400 ml-1">
                          ({course.progress.attendanceRate.toFixed(0)}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Grade</p>
                      <p className="font-medium">{course.progress.grade || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">GPA Points</p>
                      <p className="font-medium">
                        {course.progress.gradePoints?.toFixed(2) || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#f7941d] rounded-full transition-all"
                        style={{ width: `${course.progress.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {activities.map((activity, index) => (
                <div key={index} className="p-4 flex items-start gap-3 hover:bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'attendance' 
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'attendance' 
                      ? <CheckCircle className="w-5 h-5" />
                      : <BarChart3 className="w-5 h-5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper Components
function StatCard({ icon: Icon, label, value, subtext, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  }

  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  )
}

function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}
