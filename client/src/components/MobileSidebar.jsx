// Phase 6.4: Mobile-responsive sidebar component
import { X } from 'lucide-react'

export default function MobileSidebar({ 
  isOpen, 
  onClose, 
  children,
  logo,
  subtitle 
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-[#1e3a5f] text-white flex flex-col z-50 lg:hidden transform transition-transform duration-300">
        {/* Header with close button */}
        <div className="p-4 border-b border-[#2d5a87] flex items-center justify-between">
          <div>
            {logo}
            {subtitle && <p className="text-blue-200 text-xs mt-2">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#2d5a87] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        {children}
      </aside>
    </>
  )
}
