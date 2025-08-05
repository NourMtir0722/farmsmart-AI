'use client'

import { useState } from 'react'
import { 
  Settings, User, Shield, Bell, Palette, Database, Globe, Key, Edit, Check, X, AlertCircle,
  Copy, Loader2, ExternalLink, Info, CheckCircle, AlertTriangle
} from 'lucide-react'
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
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, message: string, type: 'info' | 'success' | 'warning'}>({
    title: '',
    message: '',
    type: 'info'
  });

  // Toast notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Loading state management
  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  // Modal management
  const showModalWithContent = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setModalContent({ title, message, type });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Copy to clipboard utility
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(successMessage, 'success');
    } catch (error) {
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  // Profile editing functions
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditProfileData(profileData);
  };

  const handleSaveProfile = async () => {
    setLoading('profile', true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProfileData(editProfileData);
    setIsEditingProfile(false);
    setLoading('profile', false);
    showNotification('Profile updated successfully', 'success');
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
    showModalWithContent(
      'Session Management',
      'This feature allows you to view and manage active sessions across all your devices. Coming in the next update.',
      'info'
    );
  };

  const handleViewApiKeys = () => {
    showModalWithContent(
      'API Keys',
      `You have ${securitySettings.apiKeysCount} active API keys. This feature will allow you to view, regenerate, and manage your API keys.`,
      'info'
    );
  };

  const handleExportData = async () => {
    setLoading('export', true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading('export', false);
    showNotification('Data export initiated. You will receive an email when ready.', 'success');
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

  const handleClearCache = async () => {
    setLoading('cache', true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading('cache', false);
    showNotification('Cache cleared successfully', 'success');
  };

  const handleResetSettings = () => {
    showModalWithContent(
      'Reset Settings',
      'This will reset all your settings to their default values. This action cannot be undone. Are you sure you want to continue?',
      'warning'
    );
  };

  const handleChangePassword = async () => {
    setLoading('password', true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading('password', false);
    showModalWithContent(
      'Password Change',
      'This feature is currently under development. You will be able to change your password in the next update.',
      'info'
    );
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
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border transition-all duration-300 ${
            toastType === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : toastType === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              {toastType === 'success' && <CheckCircle className="h-4 w-4" />}
              {toastType === 'error' && <AlertTriangle className="h-4 w-4" />}
              {toastType === 'info' && <Info className="h-4 w-4" />}
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  modalContent.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                  modalContent.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                  'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {modalContent.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
                  {modalContent.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                  {modalContent.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modalContent.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {modalContent.message}
              </p>
              <div className="flex justify-end space-x-3">
                {modalContent.type === 'warning' && (
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    modalContent.type === 'success' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' :
                    modalContent.type === 'warning'
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                      'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {modalContent.type === 'warning' ? 'Reset Settings' : 'OK'}
                </button>
              </div>
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
                      disabled={loadingStates.profile}
                      className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingStates.profile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      disabled={loadingStates.profile}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleEditProfile}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95"
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
                  disabled={loadingStates.password}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStates.password ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Change'
                  )}
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
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors active:scale-95 ${
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
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                    Coming soon
                  </span>
                  <button 
                    onClick={handleConfigureNotifications}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95"
                  >
                    Configure
                  </button>
                </div>
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
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95"
                >
                  Manage
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">API Keys</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{securitySettings.apiKeysCount} active keys</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => copyToClipboard('sk-1234567890abcdef', 'API key copied to clipboard')}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors active:scale-95"
                    title="Copy API key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleViewApiKeys}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95"
                  >
                    View
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Data Export</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Export your data</p>
                </div>
                <button 
                  onClick={handleExportData}
                  disabled={loadingStates.export}
                  className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStates.export ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Exporting...</span>
                    </div>
                  ) : (
                    'Export'
                  )}
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
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                    Coming soon
                  </span>
                  <button 
                    onClick={() => handleToggleIntegration('weather')}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95"
                  >
                    {integrations.weather ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
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
                  disabled={loadingStates.cache}
                  className="px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStates.cache ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Clearing...</span>
                    </div>
                  ) : (
                    'Clear'
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reset Settings</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reset to default settings</p>
                </div>
                <button 
                  onClick={handleResetSettings}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
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