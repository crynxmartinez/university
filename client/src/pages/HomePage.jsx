import { Link } from 'react-router-dom'
import { BookOpen, Users, GraduationCap, Award, Mail, MapPin, Phone, ChevronRight, Star, Target, Heart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-emerald-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img 
                src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
                alt="ILM Learning Center" 
                className="h-12"
              />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="hover:text-emerald-200 transition">Home</a>
              <a href="#about" className="hover:text-emerald-200 transition">About Us</a>
              <a href="#programs" className="hover:text-emerald-200 transition">Programs</a>
              <a href="#contact" className="hover:text-emerald-200 transition">Contact</a>
              <Link to="/login" className="bg-amber-500 hover:bg-amber-400 text-emerald-900 px-6 py-2 rounded-lg font-semibold transition">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - ILM Style */}
      <section id="home" className="relative">
        <div className="grid lg:grid-cols-2">
          {/* Left - Image */}
          <div className="relative h-[400px] lg:h-[600px]">
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/2024/04/Screenshot-2024-04-07-165639.png"
              alt="ILM Learning"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-transparent lg:hidden"></div>
          </div>
          
          {/* Right - Content */}
          <div className="bg-emerald-800 text-white flex items-center">
            <div className="p-8 lg:p-16">
              <p className="font-arabic text-2xl md:text-3xl text-emerald-200 mb-4">
                طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
              </p>
              <p className="text-emerald-200 mb-6 text-lg italic">
                "Seeking knowledge is an obligation upon every Muslim"
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Empowering Minds Through
                <span className="text-amber-400"> Islamic Education</span>
              </h1>
              <p className="text-lg text-emerald-100 mb-8">
                ILM Learning Center is dedicated to producing competent Islamic educators 
                through quality Quran and Arabic programs rooted in authentic Islamic teachings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="bg-amber-500 hover:bg-amber-400 text-emerald-900 px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2">
                  Get Started <ChevronRight className="w-5 h-5" />
                </Link>
                <a href="#programs" className="border-2 border-white hover:bg-white hover:text-emerald-800 px-8 py-4 rounded-lg font-semibold text-lg transition text-center">
                  Our Programs
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - ILM Educational Center Style */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Images Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="row-span-2">
                <img 
                  src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/photo_2024-04-09_09-58-22-617x674x17x0x583x674x1712628523.jpg"
                  alt="ILM Students"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div>
                <img 
                  src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/photo_2024-04-09_09-58-17-583x428x0x28x583x372x1712628528.jpg"
                  alt="ILM Class"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div>
                <img 
                  src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/photo_2024-04-09_09-58-19-583x365x0x31x583x303x1712628526.jpg"
                  alt="ILM Learning"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
            
            {/* Right - Content */}
            <div>
              <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">About Us</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                ILM Learning Center Inc.
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                ILM Learning Center Inc. is an Islamic institution providing short-term courses 
                focused on Quran and Arabic programs. Our mission is to produce competent Islamic 
                educators who can serve the Muslim community.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Founded on the principles of authentic Islamic teachings, we combine traditional 
                knowledge with modern educational methods to nurture both the intellectual and 
                spiritual development of our students.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Quran Studies</h4>
                    <p className="text-gray-600 text-sm">Tajweed, Hifz, and Tafsir</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Arabic Language</h4>
                    <p className="text-gray-600 text-sm">Classical & Modern Arabic</p>
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

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">Get In Touch</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-lg transition">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600">
                Marawi City<br />
                Lanao del Sur, Philippines
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-lg transition">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">
                +63 912 345 6789
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-lg transition">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">
                info@ilmlearningcenter.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
                alt="ILM Learning Center" 
                className="h-16"
              />
            </div>
            <p className="font-arabic text-xl text-emerald-300 mb-2">العلم نور</p>
            <p className="text-emerald-400 mb-6">"Knowledge is Light"</p>
            <div className="border-t border-emerald-800 pt-6">
              <p className="text-emerald-400 text-sm">
                © 2025 ILM Learning Center Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
