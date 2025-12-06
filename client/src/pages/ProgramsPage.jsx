import { BookOpen, Award, GraduationCap, Users, Clock, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ProgramsPage() {
  const programs = [
    {
      icon: BookOpen,
      title: "Quran Recitation (Tajweed)",
      description: "Master the art of Quran recitation with proper Tajweed rules, pronunciation, and melodious reading.",
      features: ["Proper articulation points", "Rules of Noon & Meem", "Stopping rules", "Beautiful recitation techniques"]
    },
    {
      icon: Award,
      title: "Quran Memorization (Hifz)",
      description: "Structured memorization program with qualified teachers and proven methodology for all ages.",
      features: ["Daily memorization schedule", "Revision techniques", "Progress tracking", "Certification upon completion"]
    },
    {
      icon: GraduationCap,
      title: "Arabic Language",
      description: "Learn Classical Arabic grammar, vocabulary, and conversation skills to understand Islamic texts.",
      features: ["Nahw (Grammar)", "Sarf (Morphology)", "Reading comprehension", "Conversational Arabic"]
    },
    {
      icon: Users,
      title: "Teacher Training",
      description: "Comprehensive programs to produce qualified Islamic educators for the Muslim community.",
      features: ["Teaching methodology", "Curriculum development", "Classroom management", "Assessment techniques"]
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-emerald-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Programs</h1>
          <p className="text-xl text-emerald-200">Short-term courses focused on Quran and Arabic education</p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition">
                <div className="bg-emerald-800 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-500 rounded-lg flex items-center justify-center">
                      <program.icon className="w-7 h-7 text-emerald-900" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{program.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6">{program.description}</p>
                  <div className="space-y-3">
                    {program.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Our Programs */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Quality Islamic Education</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Authentic Curriculum</h3>
              <p className="text-gray-600">
                Based on Quran and Sunnah, following the methodology of Ahlus Sunnah Wal Jamaah.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Qualified Instructors</h3>
              <p className="text-gray-600">
                Learn from scholars and Du'ats with proper Islamic education background.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Flexible Schedule</h3>
              <p className="text-gray-600">
                Short-term courses designed to fit your schedule and learning pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-emerald-200 mb-8">
            Enroll now and begin your path to Islamic knowledge and excellence.
          </p>
          <Link 
            to="/login" 
            className="inline-block bg-amber-500 hover:bg-amber-400 text-emerald-900 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            Enroll Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
