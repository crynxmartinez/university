import { BookOpen, Video, Radio, Folder, CheckCircle } from 'lucide-react'

export default function BrowseTab({
  browseTab,
  setBrowseTab,
  loading,
  allPrograms,
  allCourses,
  isEnrolledInProgram,
  isEnrolledInCourse,
  setSelectedProgram,
  setSelectedCourse
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Toggle Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setBrowseTab('programs')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            browseTab === 'programs' 
              ? 'bg-[#1e3a5f] text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Folder className="w-4 h-4 inline mr-2" />
          Programs
        </button>
        <button
          onClick={() => setBrowseTab('courses')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            browseTab === 'courses' 
              ? 'bg-[#1e3a5f] text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Courses
        </button>
      </div>

      {/* Browse Programs */}
      {browseTab === 'programs' && (
        <>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
            </div>
          ) : allPrograms.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No programs available</h3>
              <p className="text-gray-500">Programs will appear here once they are created.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPrograms.map((program) => (
                <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{program.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      program.programType === 'WEBINAR' ? 'bg-purple-100 text-purple-700' :
                      program.programType === 'IN_PERSON' ? 'bg-green-100 text-green-700' :
                      program.programType === 'EVENT' ? 'bg-orange-100 text-orange-700' :
                      program.programType === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {program.programType === 'WEBINAR' ? 'Webinar' :
                       program.programType === 'IN_PERSON' ? 'In-Person' :
                       program.programType === 'EVENT' ? 'Event' :
                       program.programType === 'HYBRID' ? 'Hybrid' : 'Online'}
                    </span>
                  </div>
                  
                  {/* Program Status Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {program.enrollmentEnd && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Enroll by {new Date(program.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                    {program.description?.replace(/<[^>]*>/g, '') || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{program.modules?.length || 0} modules</span>
                    <span className={`font-medium ${!program.price || program.price === 0 ? 'text-green-600' : 'text-[#1e3a5f]'}`}>
                      {!program.price || program.price === 0 ? 'FREE' : `₱${program.price?.toLocaleString()}`}
                    </span>
                  </div>
                  
                  {isEnrolledInProgram(program.id) ? (
                    <button 
                      disabled
                      className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-semibold mt-auto flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Enrolled
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSelectedProgram(program)}
                      className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition mt-auto"
                    >
                      Learn More
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Browse Courses */}
      {browseTab === 'courses' && (
        <>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
            </div>
          ) : allCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-500">Courses will appear here once they are created.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{course.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                      course.type === 'RECORDED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {course.type === 'RECORDED' ? <><Video className="w-3 h-3" /> Recorded</> : <><Radio className="w-3 h-3" /> Live</>}
                    </span>
                  </div>
                  
                  {/* Course Status Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {course.isUpcoming && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        Starts {new Date(course.startDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
                      </span>
                    )}
                    {course.enrollmentEnd && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        course.enrollmentOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {course.enrollmentOpen 
                          ? `Enroll by ${new Date(course.enrollmentEnd).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}`
                          : 'Enrollment Closed'
                        }
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{course.modules?.length || 0} modules</span>
                    <span>By Sheikh {course.teacher?.user?.profile?.firstName} {course.teacher?.user?.profile?.lastName}</span>
                  </div>
                  {isEnrolledInCourse(course.id) ? (
                    <button 
                      disabled
                      className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-semibold mt-auto flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Enrolled
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSelectedCourse(course)}
                      className="w-full bg-[#f7941d] hover:bg-[#e8850f] text-white py-2 rounded-lg font-semibold transition mt-auto"
                    >
                      Learn More
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
