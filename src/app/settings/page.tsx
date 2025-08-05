'use client'

import { useState } from 'react'
import { Settings, User, Shield, Bell, Palette, Database, Globe, Key, Edit, Check, X, AlertCircle } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useTheme } from '@/contexts/ThemeContext'

interface ProfileData {
  name: string
  email: string
  role: string
}

interface IntegrationStatus {
  googleVision: boolean
  plantId: boolean
  weather: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  apiKeysCount: number
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  
  console.log(`⚙️ Settings: current theme is ${theme}`);

  const handleThemeToggle = () => {
    console.log(`⚙️ Settings: theme toggle clicked, current theme: ${theme}`);
    toggleTheme();
  };
  
  // State management
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Farm Manager',
    email: 'manager@farmsmart.ai',
    role: 'Administrator'
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<ProfileData>(profileData);
  
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    googleVision: true,
    plantId: true,
    weather: false
  });
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    apiKeysCount: 3
  });
  
  const [debugMode, setDebugMode] = useState(false);
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Toast notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Profile editing functions
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditProfileData(profileData);
  };

  const handleSaveProfile = () => {
    setProfileData(editProfileData);
    setIsEditingProfile(false);
    showNotification('Profile updated successfully');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditProfileData(profileData);
  };

  // Security functions
  const handleToggleTwoFactor = () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorEnabled: !prev.twoFactorEnabled
    }));
    showNotification(
      securitySettings.twoFactorEnabled 
        ? 'Two-factor authentication disabled' 
        : 'Two-factor authentication enabled'
    );
  };

  const handleManageSessions = () => {
    showNotification('Session management feature coming soon', 'info');
  };

  const handleViewApiKeys = () => {
    showNotification(`You have ${securitySettings.apiKeysCount} active API keys`, 'info');
  };

  const handleExportData = () => {
    showNotification('Data export initiated. You will receive an email when ready.', 'info');
  };

  // Integration functions
  const handleToggleIntegration = (integration: keyof IntegrationStatus) => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: !prev[integration]
    }));
    showNotification(
      integrations[integration] 
        ? `${integration} integration disconnected` 
        : `${integration} integration connected`
    );
  };

  // Advanced settings functions
  const handleToggleDebugMode = () => {
    setDebugMode(!debugMode);
    showNotification(
      debugMode 
        ? 'Debug mode disabled' 
        : 'Debug mode enabled'
    );
  };

  const handleToggleAutoUpdates = () => {
    setAutoUpdates(!autoUpdates);
    showNotification(
      autoUpdates 
        ? 'Auto updates disabled' 
        : 'Auto updates enabled'
    );
  };

  const handleClearCache = () => {
    showNotification('Cache cleared successfully');
  };

  const handleResetSettings = () => {
    showNotification('Settings reset to defaults', 'info');
  };

  const handleChangePassword = () => {
    showNotification('Password change feature coming soon', 'info');
  };

  const handleConfigureNotifications = () => {
    setNotifications(!notifications);
    showNotification(
      notifications 
        ? 'Notifications disabled' 
        : 'Notifications enabled'
    );
  };

  return (
    <Layout title="Settings">
      <div className="space-y-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your account and system preferences</p>

        {/* Toast Notification */}
        {showToast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
            toastType === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : toastType === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              {toastType === 'success' && <Check className="h-4 w-4" />}
              {toastType === 'error' && <X className="h-4 w-4" />}
              {toastType === 'info' && <AlertCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isEditingProfile ? 'Editing profile...' : `${profileData.name} • ${profileData.email}`}
                  </p>
                </div>
                {isEditingProfile ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleSaveProfile}
                      className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleEditProfile}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingProfile && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={editProfileData.name}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={editProfileData.email}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
                </div>
                <button 
                  onClick={handleChangePassword}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Change
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button 
                  onClick={handleToggleTwoFactor}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    securitySettings.twoFactorEnabled
                      ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
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
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    id="dark-mode" 
                    checked={theme === 'dark'}
                    onChange={handleThemeToggle}
                  />
                  <label htmlFor="dark-mode" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${
                        theme === 'dark' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`}></div>
                      <div className={`dot absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                      } -top-1`}></div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {notifications ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button 
                  onClick={handleConfigureNotifications}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Configure
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Language</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Set your preferred language</p>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg"
                >
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
                <button 
                  onClick={handleManageSessions}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Manage
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">API Keys</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{securitySettings.apiKeysCount} active keys</p>
                </div>
                <button 
                  onClick={handleViewApiKeys}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  View
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Data Export</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Export your data</p>
                </div>
                <button 
                  onClick={handleExportData}
                  className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
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
                  <span className={`text-sm ${
                    integrations.googleVision 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {integrations.googleVision ? 'Connected' : 'Disconnected'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    integrations.googleVision ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Plant.id API</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Plant identification service</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${
                    integrations.plantId 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {integrations.plantId ? 'Connected' : 'Disconnected'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    integrations.plantId ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Weather API</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Weather data integration</p>
                </div>
                <button 
                  onClick={() => handleToggleIntegration('weather')}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {integrations.weather ? 'Disconnect' : 'Connect'}
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
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    id="debug-mode" 
                    checked={debugMode}
                    onChange={handleToggleDebugMode}
                  />
                  <label htmlFor="debug-mode" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${
                        debugMode ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`}></div>
                      <div className={`dot absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        debugMode ? 'translate-x-4' : 'translate-x-0'
                      } -top-1`}></div>
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
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    id="auto-updates" 
                    checked={autoUpdates}
                    onChange={handleToggleAutoUpdates}
                  />
                  <label htmlFor="auto-updates" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${
                        autoUpdates ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`}></div>
                      <div className={`dot absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        autoUpdates ? 'translate-x-4' : 'translate-x-0'
                      } -top-1`}></div>
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
                <button 
                  onClick={handleClearCache}
                  className="px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reset Settings</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reset to default settings</p>
                </div>
                <button 
                  onClick={handleResetSettings}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 