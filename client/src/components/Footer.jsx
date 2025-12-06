import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-emerald-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & About */}
          <div className="md:col-span-2">
            <img 
              src="https://ilmlearningcenter.com/wp-content/uploads/brizy/imgs/ILM-Logo-Landscape-with-Sec-Reg-white-189x69x0x3x189x63x1711677866.png" 
              alt="ILM Learning Center" 
              className="h-14 mb-4"
            />
            <p className="text-emerald-300 mb-4">
              ILM Learning Center Inc. is a training and learning hub providing short-term courses 
              and quality Islamic education centered on Qur'an and Arabic programs.
            </p>
            <p className="font-arabic text-xl text-amber-400">العلم نور</p>
            <p className="text-emerald-400 text-sm">"Knowledge is Light"</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-emerald-300 hover:text-white transition">Home</Link></li>
              <li><Link to="/about" className="text-emerald-300 hover:text-white transition">About Us</Link></li>
              <li><Link to="/programs" className="text-emerald-300 hover:text-white transition">Programs</Link></li>
              <li><Link to="/contact" className="text-emerald-300 hover:text-white transition">Contact</Link></li>
              <li><Link to="/blog" className="text-emerald-300 hover:text-white transition">Blog</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-emerald-300 text-sm">3rd Avenue, Brgy. Tubtub, Brooke's Point, Palawan</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-emerald-300 text-sm">ilmlearningcenterinc@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-emerald-800 mt-8 pt-8 text-center">
          <p className="text-emerald-400 text-sm">
            © 2025 ILM Learning Center Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
