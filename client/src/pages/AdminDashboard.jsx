import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users, UserPlus, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/login')
      return
    }
    
    const userData = JSON.parse(storedUser)
    if (userData.role !== 'SUPER_ADMIN') {
      navigate('/login')
      return
    }
    
    setUser(userData)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-800 font-bold text-lg">AU</span>
              </div>
              <div>
                <span className="text-lg font-semibold">Assalaam University</span>
                <span className="text-green-200 text-sm ml-2">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-green-200">
                {user.profile?.firstName} {user.profile?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.profile?.firstName}!</h1>
          <p className="text-gray-600 mt-1">Super Admin Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600 text-sm">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600 text-sm">Registrars</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600 text-sm">Teachers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Registrar</p>
                <p className="text-sm text-gray-500">Add a new registrar account</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Teacher</p>
                <p className="text-sm text-gray-500">Add a new teacher account</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
