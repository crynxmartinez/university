import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Calendar, Plus, Users } from 'lucide-react'

export default function DashboardTab({ courses, setActiveTab }) {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#1e3a5f]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-gray-600 text-sm">My Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#f7941d]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#f7941d]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-gray-600 text-sm">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-gray-600 text-sm">Upcoming Classes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            to="/teacher/courses/create"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition"
          >
            <div className="w-10 h-10 bg-[#f7941d] rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Course</p>
              <p className="text-sm text-gray-500">Add new course</p>
            </div>
          </Link>
          <button 
            onClick={() => setActiveTab('courses')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
          >
            <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Courses</p>
              <p className="text-sm text-gray-500">Manage courses</p>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Students</p>
              <p className="text-sm text-gray-500">Enrolled students</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
          <button 
            onClick={() => setActiveTab('courses')}
            className="text-[#f7941d] hover:text-[#e8850f] text-sm font-medium"
          >
            View All
          </button>
        </div>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No courses yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 3).map((course) => (
              <Link
                key={course.id}
                to={`/teacher/courses/${course.slug || course.id}/dashboard`}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#f7941d] hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{course.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      course.type === 'RECORDED' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      course.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{course.description || 'No description'}</p>
                <div className="mt-3 text-xs text-gray-400">
                  {course.modules?.length || 0} modules
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
