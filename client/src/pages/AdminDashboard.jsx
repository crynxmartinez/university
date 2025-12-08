import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users, UserPlus, Settings, X, Copy, Check, LayoutDashboard, GraduationCap, BookOpen, Menu, Search, MoreVertical, Eye, Edit, KeyRound, Trash2, ChevronLeft, ChevronRight, Plus, DollarSign, Clock, Image, MapPin, Video, Calendar, Link as LinkIcon, MessageSquare, Award, Globe } from 'lucide-react'
import { createUser, getUsers, deleteUser, resetUserPassword } from '../api/users'
import { getAdminPrograms, deleteAdminProgram } from '../api/adminPrograms'
import { getAdminCourses, deleteAdminCourse } from '../api/adminCourses'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [copied, setCopied] = useState('')
  const navigate = useNavigate()

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Users list state
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ total: 0, students: 0, teachers: 0, registrars: 0 })
  const [usersLoading, setUsersLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [resetConfirm, setResetConfirm] = useState(null)

  // Programs state
  const [programs, setPrograms] = useState([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const [deleteProgramConfirm, setDeleteProgramConfirm] = useState(null)

  // Courses state
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState(null)

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

  // Fetch users when filters change
  useEffect(() => {
    if (user) {
      fetchUsers()
      fetchPrograms()
      fetchCourses()
    }
  }, [user, roleFilter, pagination.page])

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const data = await getUsers({
        role: roleFilter,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      })
      setUsers(data.users)
      setStats(data.stats)
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchUsers()
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId)
      setDeleteConfirm(null)
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const handleResetPassword = async (userId) => {
    try {
      await resetUserPassword(userId)
      setResetConfirm(null)
    } catch (err) {
      console.error('Failed to reset password:', err)
    }
  }

  // Programs functions
  const fetchPrograms = async () => {
    setProgramsLoading(true)
    try {
      const data = await getAdminPrograms()
      setPrograms(data)
    } catch (err) {
      console.error('Failed to fetch programs:', err)
    } finally {
      setProgramsLoading(false)
    }
  }

  const handleDeleteProgram = async (programId) => {
    try {
      await deleteAdminProgram(programId)
      setDeleteProgramConfirm(null)
      fetchPrograms()
    } catch (err) {
      console.error('Failed to delete program:', err)
    }
  }

  // Courses functions
  const fetchCourses = async () => {
    setCoursesLoading(true)
    try {
      const data = await getAdminCourses()
      setCourses(data)
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    } finally {
      setCoursesLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    try {
      await deleteAdminCourse(courseId)
      setDeleteCourseConfirm(null)
      fetchCourses()
    } catch (err) {
      console.error('Failed to delete course:', err)
    }
  }

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null)
    if (actionMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [actionMenuOpen])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setRole('STUDENT')
    setError('')
  }

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await createUser({ firstName, lastName, role })
      setCreatedUser(data.user)
      setShowModal(false)
      setShowSuccess(true)
      resetForm()
      fetchUsers() // Refresh user list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'programs', label: 'Programs', icon: BookOpen },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a5f] text-white flex flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Logo */}
        <div className="p-4 border-b border-[#2d5a87]">
          <div className="flex items-center gap-3">
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
              alt="ILM Learning Center" 
              className={`${sidebarOpen ? 'h-10' : 'h-8'} transition-all`}
            />
          </div>
          {sidebarOpen && (
            <p className="text-blue-200 text-xs mt-2">Super Admin Panel</p>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === item.id 
                      ? 'bg-[#f7941d] text-white' 
                      : 'text-blue-200 hover:bg-[#2d5a87]'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#2d5a87]">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-white font-medium text-sm">{user.profile?.firstName} {user.profile?.lastName}</p>
              <p className="text-blue-200 text-xs">Super Admin</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-blue-200 hover:bg-[#2d5a87] rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm">
                Welcome, {user.profile?.firstName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#1e3a5f]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#1e3a5f]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-gray-600 text-sm">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#f7941d]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-[#f7941d]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
                      <p className="text-gray-600 text-sm">Students</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.teachers}</p>
                      <p className="text-gray-600 text-sm">Teachers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.registrars}</p>
                      <p className="text-gray-600 text-sm">Registrars</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create Account</p>
                      <p className="text-sm text-gray-500">Add new user</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('programs')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-[#f7941d] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Manage Programs</p>
                      <p className="text-sm text-gray-500">View all programs</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#f7941d] transition text-left"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">View Users</p>
                      <p className="text-sm text-gray-500">Manage all users</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm">
              {/* Header with search and filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">All Users ({stats.total})</h2>
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none w-full md:w-64"
                      />
                    </form>
                    {/* Role Filter */}
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="STUDENT">Students</option>
                      <option value="TEACHER">Teachers</option>
                      <option value="REGISTRAR">Registrars</option>
                    </select>
                    {/* Add User Button */}
                    <button 
                      onClick={() => setShowModal(true)}
                      className="flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-4 py-2 rounded-lg transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add User
                    </button>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-visible">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-medium">
                                {u.profile?.firstName?.[0]}{u.profile?.lastName?.[0]}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{u.profile?.firstName} {u.profile?.lastName}</p>
                                <p className="text-sm text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-900">{u.userId}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              u.role === 'STUDENT' ? 'bg-orange-100 text-orange-700' :
                              u.role === 'TEACHER' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              u.status === 'ACTIVE' || u.status === 'ENROLLED' ? 'bg-green-100 text-green-700' :
                              u.status === 'APPLICANT' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === u.id ? null : u.id) }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              {actionMenuOpen === u.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                  <button
                                    onClick={() => { setActionMenuOpen(null); setResetConfirm(u) }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                    Reset Password
                                  </button>
                                  <button
                                    onClick={() => { setActionMenuOpen(null); setDeleteConfirm(u) }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete User
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'programs' && (
            <div>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Programs</h2>
                  <p className="text-gray-500">{programs.length} total programs</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/programs/create')}
                  className="flex items-center gap-2 bg-[#f7941d] hover:bg-[#e8850f] text-white px-4 py-2 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Program
                </button>
              </div>

              {/* Programs Grid */}
              {programsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
                </div>
              ) : programs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
                  <p className="text-gray-500 mb-4">Create your first program to get started</p>
                  <button 
                    onClick={() => navigate('/admin/programs/create')}
                    className="text-[#f7941d] hover:underline"
                  >
                    + Create Program
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {programs.map((p) => (
                    <div 
                      key={p.id} 
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => navigate(`/admin/programs/${p.id}`)}
                    >
                      {/* Image */}
                      <div className="h-40 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] relative">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-white/30" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            p.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/90 text-gray-700">
                            {p.programType}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{p.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {p.description ? p.description.replace(/<[^>]*>/g, '') : 'No description'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#1e3a5f]">₱{p.price?.toLocaleString() || '0'}</span>
                          <span className="text-sm text-gray-500">{p.enrollments?.length || 0} enrolled</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/programs/${p.id}`) }}
                            className="flex-1 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d5a87]"
                          >
                            Manage
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteProgramConfirm(p) }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
                  <p className="text-gray-500">{courses.length} total courses</p>
                </div>
                <button
                  onClick={() => navigate('/admin/courses/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f7941d] text-white rounded-lg hover:bg-[#e8850f] transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </button>
              </div>

              {/* Courses Grid */}
              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
                </div>
              ) : courses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-500 mb-4">Create your first course to get started</p>
                  <button
                    onClick={() => navigate('/admin/courses/create')}
                    className="text-[#f7941d] hover:underline"
                  >
                    + Create Course
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((c) => (
                    <div 
                      key={c.id} 
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => navigate(`/admin/courses/${c.id}`)}
                    >
                      {/* Image */}
                      <div className={`h-40 relative ${c.type === 'LIVE' ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
                        <div className="w-full h-full flex items-center justify-center">
                          {c.type === 'LIVE' ? (
                            <Video className="w-16 h-16 text-white/30" />
                          ) : (
                            <GraduationCap className="w-16 h-16 text-white/30" />
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            c.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            c.type === 'LIVE' ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'
                          }`}>
                            {c.type}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{c.name}</h3>
                        <p className="text-xs text-gray-500 mb-0.5">
                          <span className="font-medium">Created by:</span> {c.createdBy?.profile ? `${c.createdBy.profile.firstName} ${c.createdBy.profile.lastName}` : (c.createdBy?.role === 'SUPER_ADMIN' ? 'Admin' : 'Unknown')}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Assigned to:</span> {c.teacher?.user?.profile ? `${c.teacher.user.profile.firstName} ${c.teacher.user.profile.lastName}` : 'No teacher assigned'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-bold text-[#1e3a5f]">₱{c.price?.toLocaleString() || '0'}</span>
                          <span className="text-sm text-gray-500">{c.enrollments?.length || 0} enrolled</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/courses/${c.id}`) }}
                            className="flex-1 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d5a87]"
                          >
                            Manage
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteCourseConfirm(c) }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">All Students</h2>
              <p className="text-gray-500 mb-4">Coming Soon</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                View all students enrolled in programs and courses.
              </p>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h2>
              <p className="text-gray-500 mb-4">Coming Soon</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                View all scheduled sessions across programs and courses.
              </p>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Grades</h2>
              <p className="text-gray-500 mb-4">Coming Soon</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                View all student grades across programs and courses.
              </p>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Messages</h2>
              <p className="text-gray-500 mb-4">Coming Soon</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                You'll be able to send announcements and messages to all users here.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>
              <p className="text-gray-500">Settings coming soon...</p>
            </div>
          )}
        </main>
      </div>

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create Account</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="REGISTRAR">Registrar</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dela Cruz"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none"
                    required
                  />
                </div>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">
                Default password: <span className="font-mono font-semibold">passwordtest123</span>
                <br />
                <span className="text-blue-600 text-xs">User will be asked to change it on first login.</span>
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && createdUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Created!</h2>
              <p className="text-gray-600 mb-6">Save these credentials - they won't be shown again.</p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">User ID (for login)</p>
                    <p className="font-mono font-semibold text-gray-900">{createdUser.userId}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdUser.userId, 'userId')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {copied === 'userId' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Email (internal use)</p>
                    <p className="font-mono text-sm text-gray-900">{createdUser.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdUser.email, 'email')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {copied === 'email' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Default Password</p>
                    <p className="font-mono font-semibold text-gray-900">passwordtest123</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard('passwordtest123', 'password')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {copied === 'password' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">User will be prompted to change password on first login.</p>
              </div>

              <button
                onClick={() => { setShowSuccess(false); setCreatedUser(null) }}
                className="w-full mt-6 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-3 rounded-lg font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete User?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.profile?.firstName} {deleteConfirm.profile?.lastName}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm.id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-[#1e3a5f]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Password?</h2>
              <p className="text-gray-600 mb-2">
                Reset password for <strong>{resetConfirm.profile?.firstName} {resetConfirm.profile?.lastName}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Password will be reset to: <span className="font-mono font-semibold">passwordtest123</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResetConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetPassword(resetConfirm.id)}
                  className="flex-1 px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg transition"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Program Confirmation Modal */}
      {deleteProgramConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Program?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteProgramConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteProgramConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProgram(deleteProgramConfirm.id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {deleteCourseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Course?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteCourseConfirm.name}</strong>? All modules, lessons, and student data will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteCourseConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCourse(deleteCourseConfirm.id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
