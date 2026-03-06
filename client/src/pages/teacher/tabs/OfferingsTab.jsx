import { BookOpen, GraduationCap, Plus, Users, Award } from 'lucide-react'
import CreateCourseOffering from '../CreateCourseOffering'
import CreateProgramOffering from '../CreateProgramOffering'
import TeacherOfferingDetail from '../TeacherOfferingDetail'

export default function OfferingsTab({
  offeringsView,
  setOfferingsView,
  courseOfferings,
  programOfferings,
  loadingOfferings,
  selectedOffering,
  setSelectedOffering
}) {
  return (
    <div>
      {offeringsView === 'list' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Offerings</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage your course and program offerings. Click an offering to view enrolled students and issue certificates.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOfferingsView('create-course')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition text-sm">
                <Plus className="w-4 h-4" /> New Course Offering
              </button>
              <button onClick={() => setOfferingsView('create-program')} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm">
                <Plus className="w-4 h-4" /> New Program Offering
              </button>
            </div>
          </div>

          {loadingOfferings ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
          ) : (courseOfferings.length === 0 && programOfferings.length === 0) ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No offerings yet</p>
              <p className="text-gray-400 text-sm mt-1">Create a course or program offering to get started. Admin will review and activate it.</p>
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => setOfferingsView('create-course')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm">
                  <Plus size={16} /> New Course Offering
                </button>
                <button onClick={() => setOfferingsView('create-program')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                  <Plus size={16} /> New Program Offering
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {courseOfferings.map(o => (
                <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer" onClick={() => { setSelectedOffering({ id: o.id, type: 'course' }); setOfferingsView('detail') }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <BookOpen size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400">{o.masterCourse?.code}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${o.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : o.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{o.masterCourse?.title}</div>
                        {o.semester && <div className="text-xs text-gray-400">{o.semester.name}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Users size={13} /> {o._count?.enrollments || 0}</span>
                      <Award size={16} className="text-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
              {programOfferings.map(o => (
                <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer" onClick={() => { setSelectedOffering({ id: o.id, type: 'program' }); setOfferingsView('detail') }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <GraduationCap size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400">{o.masterProgram?.code}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${o.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : o.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{o.masterProgram?.title}</div>
                        {o.semester && <div className="text-xs text-gray-400">{o.semester.name}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Users size={13} /> {o._count?.enrollments || 0}</span>
                      <Award size={16} className="text-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {offeringsView === 'detail' && selectedOffering && (
        <TeacherOfferingDetail
          offeringId={selectedOffering.id}
          offeringType={selectedOffering.type}
          onBack={() => { setOfferingsView('list'); setSelectedOffering(null) }}
        />
      )}
      {offeringsView === 'create-course' && (
        <CreateCourseOffering
          onBack={() => setOfferingsView('list')}
          onSuccess={() => setOfferingsView('list')}
        />
      )}
      {offeringsView === 'create-program' && (
        <CreateProgramOffering
          onBack={() => setOfferingsView('list')}
          onSuccess={() => setOfferingsView('list')}
        />
      )}
    </div>
  )
}
