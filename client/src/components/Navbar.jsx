import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  
  const isActive = (path) => location.pathname === path

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/programs', label: 'Programs' },
    { path: '/contact', label: 'Contact Us' },
  ]

  return (
    <nav className="bg-[#1a3c34] text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center">
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
              alt="ILM Learning Center" 
              className="h-12"
            />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`transition ${isActive(link.path) ? 'text-[#c9a227]' : 'hover:text-[#c9a227]'}`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/login" className="bg-[#c9a227] hover:bg-[#b89223] text-white px-6 py-2 rounded font-semibold transition">
              Enroll Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`block py-2 ${isActive(link.path) ? 'text-[#c9a227]' : 'hover:text-[#c9a227]'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link 
              to="/login" 
              className="block mt-4 bg-[#c9a227] hover:bg-[#b89223] text-white px-6 py-2 rounded font-semibold transition text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Enroll Now
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
