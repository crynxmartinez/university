import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Left - Logo */}
          <div className="bg-white flex items-center justify-center p-8 lg:p-16">
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Stacked-with-Sec-Reg-1-364x302x0x0x364x302x1711677866.png"
              alt="ILM Learning Center"
              className="w-full max-w-sm"
            />
          </div>
          
          {/* Right - Content */}
          <div className="bg-[#1a3c34] text-white flex items-center">
            <div className="p-8 lg:p-16">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Empowering Minds, Inspiring Futures: Excellence in Education, Leadership, and Skills Development
              </h1>
              <Link 
                to="/programs" 
                className="inline-block bg-[#c9a227] hover:bg-[#b89223] text-white px-8 py-3 rounded font-semibold transition"
              >
                Explore Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
