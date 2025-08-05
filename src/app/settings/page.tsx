'use client'

import { Settings, User, Shield, Bell, Palette, Database, Globe, Key } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account and system preferences</p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile and preferences</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Information</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Update your name and email</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  Edit
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Change your password</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  Change
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure application preferences</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark/light theme</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="dark-mode" />
                  <label htmlFor="dark-mode" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded-full shadow-inner"></div>
                      <div className="dot absolute w-4 h-4 bg-white rounded-full shadow -left-1 -top-1 transition"></div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage notification preferences</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  Configure
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Language</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Set your preferred language</p>
                </div>
                <select className="px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage security settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Session Management</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View and manage active sessions</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  Manage
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">API Keys</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage your API keys</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  View
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Data Export</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Export your data</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Integration Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Integrations</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect with external services</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Google Cloud Vision</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI image analysis service</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Plant.id API</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Plant identification service</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Weather API</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Weather data integration</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Key className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Advanced configuration options</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Debug Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enable debug logging</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="debug-mode" />
                  <label htmlFor="debug-mode" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded-full shadow-inner"></div>
                      <div className="dot absolute w-4 h-4 bg-white rounded-full shadow -left-1 -top-1 transition"></div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Auto Updates</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically update the app</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="auto-updates" defaultChecked />
                  <label htmlFor="auto-updates" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="w-10 h-6 bg-green-500 rounded-full shadow-inner"></div>
                      <div className="dot absolute w-4 h-4 bg-white rounded-full shadow left-5 -top-1 transition"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Cache Management</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clear application cache</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
                  Clear
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reset Settings</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reset to default settings</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 