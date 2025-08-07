'use client'


import { Settings, User, Sun, Moon } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useTheme } from '@/contexts/ThemeContext'

interface ProfileData {
  name: string
  email: string
  role: string
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  
  const profileData: ProfileData = {
    name: 'Farm Manager',
    email: 'manager@farmsmart.ai',
    role: 'Administrator'
  };

  const handleThemeToggle = () => {
    console.log(`⚙️ Settings: theme toggle clicked, current theme: ${theme}`);
    toggleTheme();
  };

  return (
    <Layout title="Settings">
      <div className="space-y-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your account and preferences</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Profile */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your account information</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Name</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.name}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.email}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Role</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customize your experience</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Currently using {theme === 'dark' ? 'dark' : 'light'} mode
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About FarmSmart AI</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Version</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">1.0.0</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Build</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">2024.1</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Environment</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">Production</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}