import { useState, useEffect } from 'react'
import { BookOpen, GraduationCap, Folder, Clock, ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import API_URL from '../api/config'

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState('programs')
  const [programs, setPrograms] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch public programs and courses
      const [programsRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/programs/public`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/courses/public`).catch(() => ({ data: [] }))
      ])
      setPrograms(programsRes.data || [])
      setCourses(coursesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Programs & Courses</h1>
          <p className="text-xl text-blue-200">Explore our Islamic education offerings</p>
        </div>
      </section>

      {/* Toggle Tabs */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-1 shadow-md inline-flex">
              <button
                onClick={() => setActiveTab('programs')}
                className={`px-8 py-3 rounded-full font-semibold transition ${
                  activeTab === 'programs'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'text-gray-600 hover:text-[#1e3a5f]'
                }`}
              >
                <Folder className="w-5 h-5 inline-block mr-2" />
                Programs
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-8 py-3 rounded-full font-semibold transition ${
                  activeTab === 'courses'
                    ? 'bg-[#f7941d] text-white'
                    : 'text-gray-600 hover:text-[#f7941d]'
                }`}
              >
                <BookOpen className="w-5 h-5 inline-block mr-2" />
                Courses
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : activeTab === 'programs' ? (
            // Programs Tab
            programs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((program) => (
                  <div key={program.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition group">
                    {/* Program Image or Default Header */}
                    {program.image ? (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={program.image} 
                          alt={program.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-[#f7941d] rounded-lg flex items-center justify-center">
                            <Folder className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white">{program.name}</h3>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      {program.image && (
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{program.name}</h3>
                      )}
                      <p className="text-gray-600 mb-4 line-clamp-3">{program.description || 'No description available'}</p>
                      {program.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <Clock className="w-4 h-4" />
                          <span>{program.duration}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => setSelectedProgram(program)}
                        className="inline-flex items-center gap-2 text-[#f7941d] font-semibold hover:gap-3 transition-all"
                      >
                        Learn More <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty State for Programs
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Folder className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No Programs Available</h3>
                <p className="text-gray-500 mb-6">Programs will be displayed here once they are created by the administrator.</p>
              </div>
            )
          ) : (
            // Courses Tab
            courses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition">
                    <div className="bg-[#f7941d] p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-7 h-7 text-[#f7941d]" />
                        </div>
                        <h3 className="text-xl font-bold text-white">{course.name}</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">{course.description || 'No description available'}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{course.type === 'RECORDED' ? 'Recorded' : 'Live'}</span>
                        {course.teacher && <span>By: {course.teacher.user?.profile?.firstName || 'Instructor'}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty State for Courses
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No Courses Available</h3>
                <p className="text-gray-500 mb-6">Courses will be displayed here once they are created.</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-200 mb-8">
            Enroll now and begin your path to Islamic knowledge and excellence.
          </p>
          <Link 
            to="/login" 
            className="inline-block bg-[#f7941d] hover:bg-[#e8850f] text-white px-8 py-4 rounded-full font-semibold text-lg transition"
          >
            Enroll Now
          </Link>
        </div>
      </section>

      <Footer />

      {/* Program Details Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header with Image */}
            {selectedProgram.image ? (
              <div className="h-48 relative">
                <img 
                  src={selectedProgram.image} 
                  alt={selectedProgram.name} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="h-32 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] relative flex items-center justify-center">
                <Folder className="w-16 h-16 text-white/50" />
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProgram.name}</h2>
              
              {selectedProgram.duration && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{selectedProgram.duration}</span>
                </div>
              )}
              
              <div className="prose prose-gray max-w-none mb-6">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedProgram.description || 'No description available for this program.'}
                </p>
              </div>
              
              <div className="border-t pt-6 flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/signup" 
                  className="flex-1 bg-[#f7941d] hover:bg-[#e8850f] text-white py-3 rounded-lg font-semibold text-center transition"
                >
                  Sign Up to Enroll
                </Link>
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
