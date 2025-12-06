import { Star, Target } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AboutPage() {
  const goals = [
    "To produce competent and quality Islamic educators and propagators to serve best the general Muslim community.",
    "To exemplify and uphold authentic teachings of Islam faith based on Qur'an and Sunnah.",
    "To design quality and short-term trainings and courses to address community needs and trends generally based on Qur'an and Hadith.",
    "To uplift the welfare of the entire Muslim community.",
    "To be a center for best practices for learning benchmarking; To adopt Multimedia platforms in providing at par and quality instructions."
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-blue-200">Learn more about ILM Learning Center Inc.</p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                <span className="text-[#f7941d]">ILM</span> Learning Center Inc.
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                ILM Learning Center, Inc. (ILM-LC) is a training and learning hub in Southern Palawan, 
                a non-formal Islamic institution that provides short-term courses, quality instructions and education.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                The institution's main core is centered in Qur'an and Arabic program. The goal is to produce 
                quality and competent Islamic educators to better serve the general Muslim community.
              </p>
              <p className="text-gray-600">
                Its primary office, learning and training facility are located in 3rd Avenue, 
                Barangay Tubtub, Brooke's Point, Palawan.
              </p>
            </div>
            <div className="flex justify-center">
              <img 
                src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Stacked-with-Sec-Reg-1-364x302x0x0x364x302x1711677866.png"
                alt="ILM Learning Center"
                className="max-w-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-[#f7941d] rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#f7941d]">Vision</h3>
              <p className="text-gray-300 leading-relaxed">
                To produce competent and quality Islamic educators and propagators to be of service 
                and commitment towards the general Muslim community.
              </p>
            </div>
            <div className="bg-white/10 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-[#f7941d] rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#f7941d]">Mission</h3>
              <p className="text-gray-300 leading-relaxed">
                Providing quality instructions and short-term courses, mastering program development in Qur'an 
                and Arabic language, center for best practices learning and benchmarking in non-formal Islamic 
                education through the guidance of scholars and Du'ats driven by true Aqeedah based from the 
                teachings and practices of Ahlus Sunnah Wal Jamaah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Goals & Objectives */}
      <section className="py-20 bg-gradient-to-r from-[#f7941d] to-[#f15a24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Goals and Objectives</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => (
              <div key={index} className="bg-white/20 p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white text-[#f7941d] rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <p>{goal}</p>
                </div>
              </div>
            ))}
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
