import { Link } from 'react-router-dom'
import { ChevronRight, Star, Target, Heart, BookOpen, Award, GraduationCap, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section - ILM Style */}
      <section className="relative">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Left - White Background with ILM Logo */}
          <div className="bg-white flex items-center justify-center p-8 lg:p-16">
            <div className="text-center">
              <img 
                src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Stacked-with-Sec-Reg-1-364x302x0x0x364x302x1711677866.png"
                alt="ILM Learning Center"
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>
          
          {/* Right - Green Content */}
          <div className="bg-emerald-800 text-white flex items-center">
            <div className="p-8 lg:p-16">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Empowering Minds, Inspiring Futures:
                <span className="text-amber-400"> Excellence in Education</span>
              </h1>
              <p className="text-lg text-emerald-100 mb-8">
                ILM Learning Center is dedicated to producing competent Islamic educators 
                through quality Quran and Arabic programs rooted in authentic Islamic teachings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="bg-amber-500 hover:bg-amber-400 text-emerald-900 px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2">
                  Explore Now <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">About Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">ILM Learning Center Inc.</h2>
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-gray-700 leading-relaxed">
              ILM Learning Center, Inc. (ILM-LC) is a training and learning hub in Southern Palawan, 
              a non-formal Islamic institution that provides short-term courses, quality instructions and education. 
              The institution's main core is centered in Qur'an and Arabic program. The goal is to produce quality 
              and competent Islamic educators to better serve the general Muslim community.
            </p>
            <p className="text-gray-600 mt-4">
              Its primary office, learning and training facility are located in 3rd Avenue, Barangay Tubtub, Brooke's Point, Palawan.
            </p>
          </div>
        </div>
      </section>

      {/* ILM Term - Logo Explanation Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                The <span className="text-amber-500">ILM Learning Center Inc.</span> is enthusiastic to release the wisdom and explanation behind its logo.
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">ILM term:</h4>
                  <p className="text-gray-600">
                    Inspired by Arabic calligraphy, the "ILM" term can be seen and read from the logo itself. 
                    ILM connotes meaning of knowledge, learning and wisdom.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">2 DOTS, SHADED ROUNDS, PEN:</h4>
                  <p className="text-gray-600">
                    These represent pen for writing and embracing the knowledge and wisdom coming from the two (2) 
                    authentic sources of Islamic education and foundation – the Qur'an and Hadith.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">LIGHT:</h4>
                  <p className="text-gray-600">
                    This symbol ignites the light or the guidance from the Almighty Allah in pursuit of 
                    Islamic educational empowerment and development.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right - Logo with breakdown */}
            <div className="flex flex-col items-center">
              <img 
                src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Stacked-with-Sec-Reg-1-364x302x0x0x364x302x1711677866.png"
                alt="ILM Learning Center Logo"
                className="w-64 mb-8"
              />
              
              {/* Logo Elements */}
              <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-8 h-12 bg-gradient-to-b from-amber-400 to-amber-500 rounded-t-full"></div>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">ILM</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                    <div className="w-8 h-12 bg-gradient-to-b from-gray-400 to-gray-500 rounded-t-full"></div>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">PEN</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                    <div className="w-8 h-12 bg-gradient-to-b from-gray-400 to-gray-500 rounded-t-full"></div>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">2 DOTS</p>
                  <p className="text-xs text-gray-500">(QURAN & SUNNAH)</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                    <div className="w-8 h-12 bg-gradient-to-b from-amber-300 to-amber-400 rounded-t-full"></div>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">LIGHT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proposed ILM Educational Center */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              PROPOSED <span className="text-amber-500">ILM</span> EDUCATIONAL CENTER
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left - Orthographic Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="w-32 h-32 bg-emerald-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">Building Floor Plan</p>
                  <p className="text-xs text-gray-500 mt-1">Student's Quarter • Lecture Hall • Kitchen</p>
                </div>
              </div>
              <p className="text-center font-semibold text-gray-700">ORTHOGRAPHIC Section</p>
            </div>
            
            {/* Right - Perspective Views */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">PROPOSED <span className="text-amber-500">ILM</span> EDUCATIONAL CENTER</p>
                  <p className="font-semibold text-gray-800">PERSPECTIVE</p>
                </div>
                <div className="aspect-video bg-gradient-to-br from-emerald-50 to-amber-50 rounded-xl flex items-center justify-center">
                  <div className="w-24 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="aspect-video bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl flex items-center justify-center">
                  <div className="w-32 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <svg className="w-16 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision, Mission, Goals */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">Our Purpose</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Vision, Mission & Goals</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-emerald-600">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To be a leading Islamic educational institution that produces competent Islamic 
                educators who uphold authentic teachings and serve the Muslim Ummah with excellence.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-amber-500">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide quality Quran and Arabic education through short-term courses, 
                nurturing students who are spiritually grounded and intellectually capable.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-emerald-600">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Goals</h3>
              <p className="text-gray-600 leading-relaxed">
                To develop a community of learners dedicated to Islamic knowledge, 
                character development, and service to humanity based on Quran and Sunnah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Short-term courses focused on Quran and Arabic education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition border border-gray-100 group hover:bg-emerald-700">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white">
                <BookOpen className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-white">Quran Recitation</h3>
              <p className="text-gray-600 text-sm group-hover:text-emerald-100">
                Tajweed rules, proper pronunciation, and beautiful recitation of the Holy Quran.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition border border-gray-100 group hover:bg-emerald-700">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white">
                <Award className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-white">Quran Memorization</h3>
              <p className="text-gray-600 text-sm group-hover:text-emerald-100">
                Structured Hifz program with qualified teachers and proven methodology.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition border border-gray-100 group hover:bg-emerald-700">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white">
                <GraduationCap className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-white">Arabic Language</h3>
              <p className="text-gray-600 text-sm group-hover:text-emerald-100">
                Classical Arabic grammar, vocabulary, and conversation skills.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition border border-gray-100 group hover:bg-emerald-700">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white">
                <Users className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-white">Teacher Training</h3>
              <p className="text-gray-600 text-sm group-hover:text-emerald-100">
                Programs to produce qualified Islamic educators for the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-200 font-semibold mb-2 uppercase tracking-wide">Why Us</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ILM Learning Center?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-emerald-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Authentic Islamic Knowledge</h3>
              <p className="text-emerald-200">
                Curriculum based on Quran and Sunnah, taught by qualified scholars and educators.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-emerald-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality Education</h3>
              <p className="text-emerald-200">
                Modern teaching methods combined with traditional Islamic pedagogy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-emerald-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Supportive Community</h3>
              <p className="text-emerald-200">
                A brotherhood and sisterhood environment that nurtures growth and learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
