import { Link } from 'react-router-dom'
import { BookOpen, Users, GraduationCap, Award, Mail, MapPin, Phone, ChevronRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-green-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-800 font-bold text-lg">AU</span>
              </div>
              <span className="text-xl font-semibold">Assalaam University</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="hover:text-green-200 transition">Home</a>
              <a href="#about" className="hover:text-green-200 transition">About Us</a>
              <a href="#programs" className="hover:text-green-200 transition">Programs</a>
              <a href="#contact" className="hover:text-green-200 transition">Contact</a>
              <Link to="/login" className="bg-yellow-500 hover:bg-yellow-400 text-green-900 px-4 py-2 rounded-lg font-medium transition">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-green-800 via-green-700 to-green-900 text-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <p className="font-arabic text-2xl md:text-3xl text-green-200 mb-4">
              طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
            </p>
            <p className="text-green-200 mb-8 text-lg">
              "Seeking knowledge is an obligation upon every Muslim"
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Empowering Minds Through
              <span className="text-yellow-400"> Islamic Education</span>
            </h1>
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Building future leaders grounded in faith, knowledge, and excellence. 
              Join our community of learners dedicated to both worldly and spiritual growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="bg-yellow-500 hover:bg-yellow-400 text-green-900 px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2">
                Enroll Now <ChevronRight className="w-5 h-5" />
              </Link>
              <a href="#programs" className="border-2 border-white hover:bg-white hover:text-green-800 px-8 py-4 rounded-lg font-semibold text-lg transition">
                Explore Programs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About Assalaam University</h2>
            <div className="w-24 h-1 bg-green-600 mx-auto"></div>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Assalaam University is an Islamic educational institution dedicated to providing quality education 
                rooted in the teachings of the Quran and Sunnah. We believe in nurturing both the intellectual 
                and spiritual development of our students.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Our institution combines traditional Islamic knowledge with modern academic excellence, 
                preparing students to become competent professionals and committed Muslims who contribute 
                positively to society.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Founded on the principles of Ahlus Sunnah Wal Jamaah, we strive to produce graduates who 
                embody Islamic values while excelling in their chosen fields of study.
              </p>
            </div>
            <div className="bg-green-800 text-white p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6">Our Core Values</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Excellence in Education</h4>
                    <p className="text-green-200 text-sm">Commitment to academic and spiritual excellence</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Islamic Foundation</h4>
                    <p className="text-green-200 text-sm">Education based on Quran and authentic Sunnah</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Community Service</h4>
                    <p className="text-green-200 text-sm">Serving the Muslim Ummah with dedication</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-sm font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Character Development</h4>
                    <p className="text-green-200 text-sm">Building moral and ethical leaders</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-700 to-green-800 text-white p-8 rounded-2xl">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-green-900" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-green-100 leading-relaxed">
                To be a leading Islamic educational institution that produces competent, 
                God-fearing graduates who excel in their professions while upholding Islamic 
                values and contributing to the betterment of the Muslim Ummah and society at large.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-8 rounded-2xl">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-green-900" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-green-100 leading-relaxed">
                To provide quality Islamic and academic education that integrates traditional 
                Islamic knowledge with modern disciplines, nurturing students who are spiritually 
                grounded, intellectually capable, and socially responsible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Programs</h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive programs combining Islamic values with modern education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Islamic Studies</h3>
              <p className="text-gray-600 text-sm">
                Quran, Hadith, Fiqh, Aqeedah, and Arabic Language studies based on authentic sources.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Computer Science</h3>
              <p className="text-gray-600 text-sm">
                Software development, information technology, and modern computing skills.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Administration</h3>
              <p className="text-gray-600 text-sm">
                Management, accounting, and entrepreneurship with Islamic business ethics.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Education</h3>
              <p className="text-gray-600 text-sm">
                Teacher training programs to produce qualified Islamic educators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Assalaam University?</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-green-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Authentic Islamic Knowledge</h3>
              <p className="text-green-200">
                Curriculum based on Quran and Sunnah, taught by qualified scholars and educators.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-green-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality Education</h3>
              <p className="text-green-200">
                Modern teaching methods and facilities combined with traditional Islamic pedagogy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-green-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Supportive Community</h3>
              <p className="text-green-200">
                A brotherhood and sisterhood environment that nurtures growth and learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <div className="w-24 h-1 bg-green-600 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600">
                Marawi City<br />
                Lanao del Sur, Philippines
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">
                +63 912 345 6789
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">
                info@assalaam.edu.ph
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-800 font-bold text-xl">AU</span>
              </div>
              <span className="text-2xl font-semibold">Assalaam University</span>
            </div>
            <p className="font-arabic text-xl text-green-300 mb-2">العلم نور</p>
            <p className="text-green-400 mb-6">"Knowledge is Light"</p>
            <div className="border-t border-green-800 pt-6">
              <p className="text-green-400 text-sm">
                © 2025 Assalaam University. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
