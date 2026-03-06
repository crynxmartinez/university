import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'

export default function SettingsTab() {
  const { isDark, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      {/* Appearance Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                !isDark 
                  ? 'border-[#f7941d] bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Sun className={`w-6 h-6 ${!isDark ? 'text-[#f7941d]' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${!isDark ? 'text-[#f7941d]' : 'text-gray-600'}`}>
                Light
              </span>
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                isDark 
                  ? 'border-[#f7941d] bg-orange-50 dark:bg-orange-900/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Moon className={`w-6 h-6 ${isDark ? 'text-[#f7941d]' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-[#f7941d]' : 'text-gray-600'}`}>
                Dark
              </span>
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('theme')
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                setTheme(prefersDark ? 'dark' : 'light')
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition"
            >
              <Monitor className="w-6 h-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Account</h2>
        <p className="text-gray-500 dark:text-gray-400">More settings coming soon...</p>
      </div>
    </div>
  )
}
