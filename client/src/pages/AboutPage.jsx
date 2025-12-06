import { Star, Target, Heart, CheckCircle } from 'lucide-react'
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
      <section className="bg-emerald-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-emerald-200">Learn more about ILM Learning Center Inc.</p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">Our Story</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                ILM Learning Center Inc.
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-emerald-600">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To produce competent and quality Islamic educators and propagators to be of service 
                and commitment towards the general Muslim community.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-amber-500">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Mission</h3>
              <p className="text-gray-600 leading-relaxed">
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">Our Purpose</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Goals and Objectives</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <p className="text-gray-700">{goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-emerald-200 font-semibold mb-2 uppercase tracking-wide">What We Stand For</p>
            <h2 className="text-3xl md:text-4xl font-bold">Core Values and Principles</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              "Competence and Excellence",
              "Service and Commitment", 
              "Adaptability",
              "Quality Instruction",
              "Collaboration, Linkage and Network Building"
            ].map((value, index) => (
              <div key={index} className="bg-emerald-700/50 p-6 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
