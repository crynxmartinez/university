import { Link } from 'react-router-dom'
import { Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1a3c34] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo */}
          <div>
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
              alt="ILM Learning Center" 
              className="h-14 mb-4"
            />
            <p className="text-gray-300 text-sm">ILM Learning Center Inc.</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[#c9a227] font-semibold mb-4">CONTACTS</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#c9a227] flex-shrink-0" />
                <span className="text-gray-300 text-sm">ilmlearningcenterinc@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#c9a227] flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">3rd Avenue, Brgy. Tubtub, Brooke's Point, Palawan</span>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h4 className="text-[#c9a227] font-semibold mb-4">Get in Touch</h4>
            <div className="flex gap-4">
              <Link to="/contact" className="bg-[#c9a227] hover:bg-[#b89223] text-white px-6 py-2 rounded font-semibold transition">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 ILM Learning Center Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
