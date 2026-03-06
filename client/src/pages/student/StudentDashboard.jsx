import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, BookOpen, Video, Radio, LayoutDashboard, GraduationCap, Calendar, Settings, Menu, Award, Folder, MapPin, ExternalLink, Search, ChevronDown, ChevronRight, CheckCircle, X, Clock, MessageSquare, Shield, Users } from 'lucide-react'
import { getMyCourses, selfEnrollInCourse } from '../../api/enrollments'
import { getStudentPrograms } from '../../api/programs'
import { getMyProgramEnrollments, enrollInProgram } from '../../api/programEnrollments'
import { getUpcomingSessions, getAllCourseSessions } from '../../api/sessions'
import { getUpcomingProgramSessions, getAllProgramSessions, joinProgramSession } from '../../api/studentPrograms'
import { getMyNotes, deleteNote } from '../../api/notes'
import { markJoinAttendance } from '../../api/attendance'
import { useToast, ConfirmModal } from '../../components/Toast'
import SessionCalendar from '../../components/SessionCalendar'
import axios from 'axios'
import API_URL from '../../api/config'

// Lazy load tab components for better performance
const DashboardTab = lazy(() => import('./tabs/DashboardTab'))
const BrowseTab = lazy(() => import('./tabs/BrowseTab'))
const EnrollmentsTab = lazy(() => import('./tabs/EnrollmentsTab'))
const NotesTab = lazy(() => import('./tabs/NotesTab'))
const GradesTab = lazy(() => import('./tabs/GradesTab'))
const CertificatesTab = lazy(() => import('./tabs/CertificatesTab'))
const OneOnOneTab = lazy(() => import('./tabs/OneOnOneTab'))
const MessagesTab = lazy(() => import('./tabs/MessagesTab'))
const SettingsTab = lazy(() => import('./tabs/SettingsTab'))

// Loading spinner component
const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
  </div>
)

export default function StudentDashboard() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [allPrograms, setAllPrograms] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [myProgramEnrollments, setMyProgramEnrollments] = useState([])
  const [myCourseEnrollments, setMyCourseEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [browseTab, setBrowseTab] = useState('programs')
  const [enrollmentsTab, setEnrollmentsTab] = useState('programs')
  const [enrollmentsOpen, setEnrollmentsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [enrollingId, setEnrollingId] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedEnrolledProgram, setSelectedEnrolledProgram] = useState(null)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [allCourseSessions, setAllCourseSessions] = useState([])
  const [showProgramCalendarModal, setShowProgramCalendarModal] = useState(false)
  const [allProgramSessionsData, setAllProgramSessionsData] = useState([])
  const [myNotes, setMyNotes] = useState([])
  const [notesSearchTerm, setNotesSearchTerm] = useState('')
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState(null)
  const [showTodayPopup, setShowTodayPopup] = useState(false)
  const [todaySessions, setTodaySessions] = useState([])
  const [gradesData, setGradesData] = useState(null)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [calculatingGrades, setCalculatingGrades] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [loadingCertificates, setLoadingCertificates] = useState(false)
  const [oneOnOneRequests, setOneOnOneRequests] = useState([])
  const [loadingOneOnOne, setLoadingOneOnOne] = useState(false)
  const [oneOnOneTab, setOneOnOneTab] = useState('pending')
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/login')
      return
    }
    
    const userData = JSON.parse(storedUser)
    if (userData.role !== 'STUDENT') {
      navigate('/login')
      return
    }
    
    setUser(userData)
    fetchAllData()
  }, [navigate])

  const fetchAllData = async () => {
    try {
      const programsRes = await getStudentPrograms()
      setAllPrograms(programsRes)
      
      const myPrograms = await getMyProgramEnrollments()
      setMyProgramEnrollments(myPrograms)
      
      const myCourses = await getMyCourses()
      setMyCourseEnrollments(myCourses)
      setCourses(myCourses)
      
      try {
        const coursesRes = await axios.get(`${API_URL}/courses/public`)
        setAllCourses(coursesRes.data)
      } catch (e) {
        console.error('Failed to fetch courses:', e)
      }

      try {
        const sessions = await getUpcomingSessions()
        setUpcomingSessions(sessions)
        
        if (!sessionStorage.getItem('studentTodayPopupShown')) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayEnd = new Date(today)
          todayEnd.setHours(23, 59, 59, 999)
          
          const sessionsToday = sessions.filter(s => {
            const sessionDate = new Date(s.date)
            return sessionDate >= today && sessionDate <= todayEnd
          })
          
          if (sessionsToday.length > 0) {
            setTodaySessions(sessionsToday)
            setShowTodayPopup(true)
            sessionStorage.setItem('studentTodayPopupShown', 'true')
          }
        }
      } catch (e) {
        console.error('Failed to fetch sessions:', e)
      }

      try {
        const allSessions = await getAllCourseSessions()
        setAllCourseSessions(allSessions)
      } catch (e) {
        console.error('Failed to fetch all course sessions:', e)
      }

      try {
        const allProgramSessions = await getAllProgramSessions()
        setAllProgramSessionsData(allProgramSessions)
      } catch (e) {
        console.error('Failed to fetch all program sessions:', e)
      }

      try {
        const notes = await getMyNotes()
        setMyNotes(notes)
      } catch (e) {
        console.error('Failed to fetch notes:', e)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'certificates' && certificates.length === 0) {
      setLoadingCertificates(true)
      import('../../api/certificates').then(({ getMyCertificates }) => {
        getMyCertificates()
          .then(certs => setCertificates(certs))
          .catch(err => console.error('Failed to load certificates:', err))
          .finally(() => setLoadingCertificates(false))
      })
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'one-on-one') {
      fetchOneOnOneRequests()
    }
  }, [activeTab, oneOnOneTab])

  const fetchOneOnOneRequests = async () => {
    setLoadingOneOnOne(true)
    try {
      const { getMyOneOnOneRequests } = await import('../../api/oneOnOne')
      const requests = await getMyOneOnOneRequests()
      setOneOnOneRequests(requests)
    } catch (err) {
      console.error('Failed to load 1-on-1 requests:', err)
    } finally {
      setLoadingOneOnOne(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!deleteNoteConfirm) return
    try {
      await deleteNote(deleteNoteConfirm)
      setMyNotes(prev => prev.filter(n => n.id !== deleteNoteConfirm))
      toast.success('Note deleted')
    } catch (error) {
      toast.error('Failed to delete note')
    } finally {
      setDeleteNoteConfirm(null)
    }
  }

  const handleEnrollProgram = async (programId) => {
    setEnrollingId(programId)
    try {
      await enrollInProgram(programId)
      const myPrograms = await getMyProgramEnrollments()
      setMyProgramEnrollments(myPrograms)
      toast.success('Successfully enrolled in program!')
    } catch (error) {
      console.error('Failed to enroll:', error)
      toast.error(error.response?.data?.error || 'Failed to enroll')
    } finally {
      setEnrollingId(null)
    }
  }

  const isEnrolledInProgram = (programId) => {
    return myProgramEnrollments.some(e => e.program?.id === programId)
  }

  const isEnrolledInCourse = (courseId) => {
    return myCourseEnrollments.some(c => c.id === courseId)
  }

  const handleEnrollCourse = async (courseId) => {
    setEnrollingId(courseId)
    try {
      await selfEnrollInCourse(courseId)
      const myCourses = await getMyCourses()
      setMyCourseEnrollments(myCourses)
      toast.success('Successfully enrolled in course!')
    } catch (error) {
      console.error('Failed to enroll:', error)
      toast.error(error.response?.data?.error || 'Failed to enroll')
    } finally {
      setEnrollingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'browse', label: 'Browse', icon: Search },
    { id: 'enrollments', label: 'My Enrollments', icon: CheckCircle, hasDropdown: true },
    { id: 'one-on-one', label: '1-on-1 Sessions', icon: Users },
    { id: 'notes', label: 'My Notes', icon: MessageSquare },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'certificates', label: 'Certificates', icon: Shield },
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            loading={loading}
            myProgramEnrollments={myProgramEnrollments}
            myCourseEnrollments={myCourseEnrollments}
            upcomingSessions={upcomingSessions}
            courses={courses}
            setActiveTab={setActiveTab}
          />
        )
      case 'browse':
        return (
          <BrowseTab
            browseTab={browseTab}
            setBrowseTab={setBrowseTab}
            loading={loading}
            allPrograms={allPrograms}
            allCourses={allCourses}
            isEnrolledInProgram={isEnrolledInProgram}
            isEnrolledInCourse={isEnrolledInCourse}
            setSelectedProgram={setSelectedProgram}
            setSelectedCourse={setSelectedCourse}
          />
        )
      case 'enrollments':
        return (
          <EnrollmentsTab
            enrollmentsTab={enrollmentsTab}
            loading={loading}
            myProgramEnrollments={myProgramEnrollments}
            myCourseEnrollments={myCourseEnrollments}
            setActiveTab={setActiveTab}
            setBrowseTab={setBrowseTab}
            setShowProgramCalendarModal={setShowProgramCalendarModal}
            setShowCalendarModal={setShowCalendarModal}
            setSelectedEnrolledProgram={setSelectedEnrolledProgram}
            setSelectedCourse={setSelectedCourse}
          />
        )
      case 'notes':
        return (
          <NotesTab
            myNotes={myNotes}
            notesSearchTerm={notesSearchTerm}
            setNotesSearchTerm={setNotesSearchTerm}
            setDeleteNoteConfirm={setDeleteNoteConfirm}
          />
        )
      case 'grades':
        return (
          <GradesTab
            gradesData={gradesData}
            setGradesData={setGradesData}
            loadingGrades={loadingGrades}
            calculatingGrades={calculatingGrades}
            setCalculatingGrades={setCalculatingGrades}
          />
        )
      case 'certificates':
        return (
          <CertificatesTab
            certificates={certificates}
            setCertificates={setCertificates}
            loadingCertificates={loadingCertificates}
            setLoadingCertificates={setLoadingCertificates}
          />
        )
      case 'one-on-one':
        return (
          <OneOnOneTab
            oneOnOneRequests={oneOnOneRequests}
            loadingOneOnOne={loadingOneOnOne}
            oneOnOneTab={oneOnOneTab}
            setOneOnOneTab={setOneOnOneTab}
            fetchOneOnOneRequests={fetchOneOnOneRequests}
          />
        )
      case 'messages':
        return <MessagesTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <DashboardTab loading={loading} myProgramEnrollments={myProgramEnrollments} myCourseEnrollments={myCourseEnrollments} upcomingSessions={upcomingSessions} courses={courses} setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile by default, shown when sidebarOpen is true */}
      <aside className={`
        bg-[#1e3a5f] text-white flex flex-col transition-all duration-300 fixed h-full z-50
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}
      `}>
        <div className="p-4 border-b border-[#2d5a87]">
          <div className="flex items-center gap-3">
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
              alt="ILM Learning Center" 
              className={`${sidebarOpen ? 'h-10' : 'h-8'} transition-all`}
            />
          </div>
          {sidebarOpen && <p className="text-blue-200 text-xs mt-2">Student Portal</p>}
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                {item.hasDropdown ? (
                  <div>
                    <button
                      onClick={() => {
                        setEnrollmentsOpen(!enrollmentsOpen)
                        if (!enrollmentsOpen) setActiveTab('enrollments')
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                        activeTab === 'enrollments' ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:bg-[#2d5a87]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </div>
                      {sidebarOpen && (enrollmentsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                    </button>
                    {enrollmentsOpen && sidebarOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        <button
                          onClick={() => { setActiveTab('enrollments'); setEnrollmentsTab('programs') }}
                          className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                            activeTab === 'enrollments' && enrollmentsTab === 'programs' ? 'bg-[#2d5a87] text-white' : 'text-blue-200 hover:bg-[#2d5a87]'
                          }`}
                        >
                          <Folder className="w-4 h-4" />
                          Programs
                        </button>
                        <button
                          onClick={() => { setActiveTab('enrollments'); setEnrollmentsTab('courses') }}
                          className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                            activeTab === 'enrollments' && enrollmentsTab === 'courses' ? 'bg-[#2d5a87] text-white' : 'text-blue-200 hover:bg-[#2d5a87]'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          Courses
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === item.id ? 'bg-[#f7941d] text-white' : 'text-blue-200 hover:bg-[#2d5a87]'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#2d5a87]">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-white font-medium text-sm">{user.profile?.firstName} {user.profile?.lastName}</p>
              <p className="text-blue-200 text-xs">Student</p>
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

      {/* Main Content - Responsive margin */}
      <div className="flex-1 lg:ml-20 transition-all duration-300">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-900">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm">Welcome, {user.profile?.firstName}</span>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Suspense fallback={<TabLoader />}>
            {renderActiveTab()}
          </Suspense>
        </main>
      </div>

      {/* Browse Program Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-start justify-between flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProgram.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    selectedProgram.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
                    selectedProgram.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
                    selectedProgram.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
                    selectedProgram.programType === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedProgram.programType === 'WEBINAR' ? 'Webinar' :
                     selectedProgram.programType === 'IN_PERSON' ? 'In-Person' :
                     selectedProgram.programType === 'EVENT' ? 'Event' :
                     selectedProgram.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
                  </span>
                </div>
                <p className="text-gray-500">
                  {!selectedProgram.price || selectedProgram.price === 0 
                    ? <span className="text-green-600 font-medium">FREE</span>
                    : <span className="text-[#1e3a5f] font-medium">₱{selectedProgram.price?.toLocaleString()}</span>
                  }
                </p>
              </div>
              <button onClick={() => setSelectedProgram(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Folder className="w-4 h-4 text-[#1e3a5f]" />
                  <span>{selectedProgram.modules?.length || 0} modules</span>
                </div>
                {selectedProgram.startDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-[#1e3a5f]" />
                    <span>Starts: {new Date(selectedProgram.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</span>
                  </div>
                )}
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About this program</h3>
                <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: selectedProgram.description || 'No description available.' }} />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button onClick={() => setSelectedProgram(null)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
                Close
              </button>
              <button 
                onClick={async () => { await handleEnrollProgram(selectedProgram.id); setSelectedProgram(null) }}
                disabled={enrollingId === selectedProgram.id}
                className="flex-1 bg-[#f7941d] hover:bg-[#e8850f] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {enrollingId === selectedProgram.id ? 'Enrolling...' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Course Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-start justify-between flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                    selectedCourse.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {selectedCourse.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                  </span>
                </div>
                {selectedCourse.teacher && (
                  <p className="text-gray-500">By Sheikh {selectedCourse.teacher?.user?.profile?.firstName} {selectedCourse.teacher?.user?.profile?.lastName}</p>
                )}
              </div>
              <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
                  <span>{selectedCourse.modules?.length || 0} modules</span>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About this course</h3>
                <p className="text-gray-600">{selectedCourse.description || 'No description available.'}</p>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button onClick={() => setSelectedCourse(null)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
                Close
              </button>
              {!selectedCourse.enrollmentOpen ? (
                <button disabled className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed">
                  Enrollment Closed
                </button>
              ) : (
                <button 
                  onClick={async () => { await handleEnrollCourse(selectedCourse.id); setSelectedCourse(null) }}
                  disabled={enrollingId === selectedCourse.id}
                  className="flex-1 bg-[#f7941d] hover:bg-[#e8850f] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {enrollingId === selectedCourse.id ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Program Modal */}
      {selectedEnrolledProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="h-48 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center relative flex-shrink-0">
              <Folder className="w-20 h-20 text-white/50" />
              <button onClick={() => setSelectedEnrolledProgram(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEnrolledProgram.name}</h2>
                  <p className="text-green-600 text-sm font-medium flex items-center gap-1 mt-1">
                    <CheckCircle className="w-4 h-4" /> You are enrolled
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                {selectedEnrolledProgram.schedule && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-[#1e3a5f]" />
                    <div>
                      <p className="text-xs text-gray-500">Schedule</p>
                      <p className="font-medium">{selectedEnrolledProgram.schedule}</p>
                    </div>
                  </div>
                )}
                {selectedEnrolledProgram.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-[#1e3a5f]" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium">{selectedEnrolledProgram.location}</p>
                    </div>
                  </div>
                )}
                {selectedEnrolledProgram.meetingLink && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <Video className="w-5 h-5 text-[#1e3a5f] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Meeting Link</p>
                      <a href={selectedEnrolledProgram.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] hover:underline font-medium break-all">
                        {selectedEnrolledProgram.meetingLink}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: selectedEnrolledProgram.description || 'No description available.' }} />
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button onClick={() => setSelectedEnrolledProgram(null)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
                Close
              </button>
              {selectedEnrolledProgram.meetingLink && (
                <a href={selectedEnrolledProgram.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                  <Video className="w-5 h-5" />
                  Join Meeting
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Schedule Calendar */}
      <SessionCalendar
        sessions={allCourseSessions}
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title="Course Schedule"
        subtitle="All your course sessions"
        accentColor="purple"
        type="course"
        onJoinSession={async (session) => {
          try { await markJoinAttendance(session.id) } catch (error) { console.error('Failed to mark attendance:', error) }
          window.open(session.meetingLink, '_blank')
        }}
        onTakeExam={(session) => {
          navigate(`/student/courses/${session.course?.slug || session.course?.id}/exam/${session.examId}?sessionId=${session.id}`)
        }}
      />

      {/* Program Schedule Calendar */}
      <SessionCalendar
        sessions={allProgramSessionsData}
        isOpen={showProgramCalendarModal}
        onClose={() => setShowProgramCalendarModal(false)}
        title="Program Schedule"
        subtitle="All your program sessions"
        accentColor="green"
        type="program"
        onJoinSession={async (session) => {
          try { await joinProgramSession(session.id) } catch (error) { console.error('Failed to mark attendance:', error) }
          window.open(session.meetingLink, '_blank')
        }}
        onTakeExam={(session) => {
          navigate(`/student/programs/${session.program?.id}/exam/${session.examId}?sessionId=${session.id}`)
        }}
      />

      {/* Delete Note Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteNoteConfirm}
        onClose={() => setDeleteNoteConfirm(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
      />

      {/* Today's Classes Popup */}
      {showTodayPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">You have classes today!</h2>
              <p className="text-blue-200 mt-1">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} scheduled</p>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto">
              {todaySessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2 last:mb-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.course?.type === 'LIVE' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {session.course?.type === 'LIVE' ? <Radio className="w-5 h-5 text-red-600" /> : <Video className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{session.course?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      {session.lesson?.name && ` • ${session.lesson.name}`}
                    </p>
                  </div>
                  {session.meetingLink && (
                    <button
                      onClick={async () => {
                        try { await markJoinAttendance(session.id) } catch (e) { console.error('Failed to mark attendance:', e) }
                        window.open(session.meetingLink, '_blank')
                      }}
                      className="px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white text-sm rounded-lg font-medium transition"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <button onClick={() => setShowTodayPopup(false)} className="w-full px-4 py-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white rounded-lg font-medium transition">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
