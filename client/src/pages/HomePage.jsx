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
            
            {/* Right - Image placeholder */}
            <div className="hidden lg:flex justify-end z-10">
              <div className="w-80 h-96 bg-white/10 rounded-3xl flex items-center justify-center">
                <div className="text-center text-white/50">
                  <div className="w-32 h-32 bg-white/20 rounded-full mx-auto mb-4"></div>
                  <p>Student Image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ILM Logo Explanation Section */}
      <section className="py-20 bg-white">
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

      <Footer />
    </div>
  )
}
