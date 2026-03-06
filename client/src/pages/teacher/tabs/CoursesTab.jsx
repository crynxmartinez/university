import { Link } from 'react-router-dom'
import { BookOpen, Plus, Video, Radio, ExternalLink } from 'lucide-react'

export default function CoursesTab({ courses, loading }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">My Courses (Legacy)</h2>
        <Link
          to="/teacher/courses/create"
          className="flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-4">Create your first course to get started</p>
          <Link
            to="/teacher/courses/create"
            className="inline-flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-6 py-3 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Course
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col"
            >
              {/* Course Header */}
              <div className={`h-2 ${course.type === 'LIVE' ? 'bg-purple-500' : 'bg-[#1e3a5f]'}`}></div>
              
              <div className="p-5 flex flex-col flex-1">
                {/* Type & Status Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                    course.type === 'RECORDED' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {course.type === 'RECORDED' ? <Video className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                    {course.type === 'RECORDED' ? 'Recorded' : 'Live'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    course.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Course Name */}
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{course.name}</h3>
                
                {/* Description */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                  {course.description || 'No description'}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>{course.modules?.length || 0} modules</span>
                  {course.type === 'LIVE' && (
                    <span>{course.sessions?.length || 0} sessions</span>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t mt-auto">
                  <Link
                    to={`/teacher/courses/${course.slug || course.id}/dashboard`}
                    className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-2 px-3 rounded-lg text-sm font-medium transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
