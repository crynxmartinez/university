import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Calendar, Plus, Users } from 'lucide-react'

export default function DashboardTab({ setActiveTab }) {
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
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-gray-600 text-sm">My Offerings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#f7941d]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#f7941d]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">-</p>
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
              <p className="text-2xl font-bold text-gray-900">-</p>
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
            to="/teacher/course-offerings/create"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition"
          >
            <div className="w-10 h-10 bg-[#f7941d] rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Course Offering</p>
              <p className="text-sm text-gray-500">Add new offering</p>
            </div>
          </Link>
          <button 
            onClick={() => setActiveTab('offerings')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
          >
            <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Offerings</p>
              <p className="text-sm text-gray-500">Manage offerings</p>
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

      {/* Getting Started */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Create course offerings to start teaching</p>
          <Link 
            to="/teacher/course-offerings/create"
            className="inline-flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Create Your First Offering
          </Link>
        </div>
      </div>
    </>
  )
}
