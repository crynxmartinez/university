import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section - Blue/Orange with curved design */}
      <section className="relative bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] min-h-[600px] overflow-hidden">
        {/* Orange curved shape on right */}
        <div className="absolute right-0 top-0 w-1/2 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f7941d] to-[#f15a24]" 
               style={{clipPath: 'ellipse(100% 100% at 100% 50%)'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div className="text-white z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Empowering Minds,<br />
                Inspiring Futures:<br />
                <span className="text-[#f7941d]">Excellence in Education,</span><br />
                Leadership, and Skills<br />
                Development.
              </h1>
              <Link 
                to="/programs" 
                className="inline-block bg-[#f7941d] hover:bg-[#e8850f] text-white px-8 py-3 rounded-full font-semibold transition mt-4"
              >
                Explore Now
              </Link>
            </div>
            
            {/* Right - Student Image */}
            <div className="hidden lg:flex justify-end z-10">
              <div className="w-80 h-96 rounded-3xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/5905445/pexels-photo-5905445.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Muslim Student"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <div className="flex justify-center">
              <img 
                src="https://images.pexels.com/photos/8535214/pexels-photo-8535214.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Islamic Education"
                className="rounded-2xl shadow-lg max-w-md w-full"
              />
            </div>
            
            {/* Right - Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-[#f7941d]">ABOUT</span> US
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                ILM Learning Center, Inc. (ILM-LC) is a training and learning hub in Southern Palawan, a non-formal Islamic institution that provides short-term courses, quality instructions and education. The institution's main core is centered in Qur'an and Arabic program. The goal is to produce quality and competent Islamic educators to better serve the general Muslim community.
              </p>
              <p className="text-gray-600 leading-relaxed">
                It's primary office, learning and training facility are located in 3rd Avenue, Barangay Tubtub, Brooke's Point, Palawan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ILM Logo Explanation Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left - Text Content */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 leading-tight">
                The <span className="text-[#f7941d]">ILM Learning Center Inc.</span> is enthusiastic to release the wisdom and explanation behind its logo.
              </h2>
              
              <div className="space-y-6 text-gray-600">
                <div>
                  <p>
                    <span className="font-bold text-[#f7941d]">ILM term</span> : Inspired by Arabic calligraphy, the "ILM" term can be seen and read from the logo itself. ILM connotes meaning of knowledge, learning and wisdom
                  </p>
                </div>
                
                <div>
                  <p>
                    <span className="font-bold text-[#f7941d]">2 DOTS, SHADED ROUNDS, PEN</span> : These represent pen for writing and embracing the knowledge and wisdom coming from the two (2) authentic sources of Islamic education and foundation – the Qur'an and Hadith.
                  </p>
                </div>
                
                <div>
                  <p>
                    <span className="font-bold text-[#f7941d]">LIGHT</span> : This symbol ignites the light or the guidance from the Almighty Allah in pursuit of Islamic educational empowerment and development
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right - Logo breakdown image */}
            <div className="flex justify-center">
              <img 
                src="https://ilmlearningcenter.com/wp-content/uploads/2024/04/Screenshot-2024-04-07-165639.png"
                alt="ILM Logo Explanation"
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-20 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Vision */}
            <div className="text-center">
              <img 
                src="https://images.pexels.com/photos/8535230/pexels-photo-8535230.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Vision"
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
              <h3 className="text-2xl font-bold mb-4 text-[#f7941d]">VISION</h3>
              <p className="text-gray-300 leading-relaxed">
                To produce competent and quality Islamic educators and propagators to be of service and commitment towards the general Muslim community.
              </p>
            </div>
            
            {/* Mission */}
            <div className="text-center">
              <img 
                src="https://images.pexels.com/photos/8535236/pexels-photo-8535236.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Mission"
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
              <h3 className="text-2xl font-bold mb-4 text-[#f7941d]">MISSION</h3>
              <p className="text-gray-300 leading-relaxed">
                Providing quality instructions and short-term courses, mastering program development in Qur'an and Arabic language, center for best practices learning and benchmarking in non-formal Islamic education through the guidance of scholars and Du'ats driven by true Aqeedah based from the teachings and practices of Ahlus Sunnah Wal Jamaah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Goals and Objectives Section */}
      <section className="py-20 bg-gradient-to-r from-[#f7941d] to-[#f15a24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <div className="flex justify-center">
              <img 
                src="https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=500"
                alt="Goals"
                className="rounded-2xl shadow-lg max-w-sm w-full"
              />
            </div>
            
            {/* Right - Goals List */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">GOALS AND OBJECTIVES</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold">01</span>
                  <p>To produce competent and quality Islamic educators and propagators to serve best the general Muslim community.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold">02</span>
                  <p>To exemplify and uphold authentic teachings of Islam faith based on Qur'an and Sunnah.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold">03</span>
                  <p>To design quality and short-term trainings and courses to address community needs and trends generally based on Qur'an and Hadith.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold">04</span>
                  <p>To uplift the welfare of the entire Muslim community.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold">05</span>
                  <p>To be a center for best practices for learning benchmarking; To adopt Multimedia platforms in providing at par and quality instructions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proposed ILM Educational Center */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            PROPOSED <span className="text-[#f7941d]">ILM</span> EDUCATIONAL CENTER
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-100 rounded-2xl p-6">
              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm">Floor Plan</p>
                </div>
              </div>
              <p className="text-center text-gray-600 font-semibold">ORTHOGRAPHIC Section</p>
            </div>
            <div className="bg-gray-100 rounded-2xl p-6">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-orange-100 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-sm">Building Perspective</p>
                </div>
              </div>
              <p className="text-center text-gray-600 font-semibold">PERSPECTIVE View</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values and Principles */}
      <section className="py-20 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="text-[#f7941d]">CORE</span> AND PRINCIPLES
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#f7941d] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="font-semibold">Competence and Excellence</h4>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#f7941d] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="font-semibold">Service and Commitment</h4>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#f7941d] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="font-semibold">Adaptability</h4>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#f7941d] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="font-semibold">Quality Instruction</h4>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#f7941d] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-semibold">Collaboration & Network Building</h4>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
