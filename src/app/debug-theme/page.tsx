'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/Layout';
import { Sun, Moon, RefreshCw, CheckCircle, AlertTriangle, Info, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ThemeDebugInfo {
  currentTheme: string;
  documentClasses: string;
  localStorageTheme: string;
  systemPreference: string;
  mounted: boolean;
  hasThemeProvider: boolean;
}

export default function DebugThemePage() {
  const { theme, toggleTheme } = useTheme();
  const [debugInfo, setDebugInfo] = useState<ThemeDebugInfo>({
    currentTheme: 'unknown',
    documentClasses: 'unknown',
    localStorageTheme: 'unknown',
    systemPreference: 'unknown',
    mounted: false,
    hasThemeProvider: false,
  });
  const [testResults, setTestResults] = useState<string[]>([]);

  const updateDebugInfo = () => {
    const info: ThemeDebugInfo = {
      currentTheme: theme,
      documentClasses: typeof document !== 'undefined' ? document.documentElement.className : 'N/A',
      localStorageTheme: typeof window !== 'undefined' ? localStorage.getItem('theme') || 'null' : 'N/A',
      systemPreference: typeof window !== 'undefined' ? 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 'N/A',
      mounted: true,
      hasThemeProvider: true,
    };
    setDebugInfo(info);
  };

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [theme]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runThemeTests = () => {
    setTestResults([]);
    addTestResult('Starting theme system tests...');

    // Test 1: Check if theme context is working
    addTestResult(`✅ Theme context working: ${theme}`);

    // Test 2: Check document classes
    const docClasses = document.documentElement.className;
    const hasDarkClass = docClasses.includes('dark');
    const hasLightClass = docClasses.includes('light');
    addTestResult(`✅ Document classes: "${docClasses}"`);
    addTestResult(`   - Has dark class: ${hasDarkClass}`);
    addTestResult(`   - Has light class: ${hasLightClass}`);

    // Test 3: Check localStorage
    const storedTheme = localStorage.getItem('theme');
    addTestResult(`✅ localStorage theme: "${storedTheme}"`);

    // Test 4: Check system preference
    const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    addTestResult(`✅ System preference: ${systemPref}`);

    // Test 5: Verify consistency
    const isConsistent = (theme === 'dark' && hasDarkClass) || (theme === 'light' && hasLightClass);
    addTestResult(`✅ Theme consistency: ${isConsistent ? 'PASS' : 'FAIL'}`);

    // Test 6: Test toggle functionality
    addTestResult('🔄 Testing theme toggle...');
    const originalTheme = theme;
    toggleTheme();
    setTimeout(() => {
      const newTheme = theme;
      const toggleWorked = newTheme !== originalTheme;
      addTestResult(`✅ Toggle test: ${toggleWorked ? 'PASS' : 'FAIL'} (${originalTheme} → ${newTheme})`);
    }, 100);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('theme');
    addTestResult('🗑️ Cleared localStorage theme');
    updateDebugInfo();
  };

  const forceLightTheme = () => {
    localStorage.setItem('theme', 'light');
    addTestResult('☀️ Forced light theme in localStorage');
    updateDebugInfo();
  };

  const forceDarkTheme = () => {
    localStorage.setItem('theme', 'dark');
    addTestResult('🌙 Forced dark theme in localStorage');
    updateDebugInfo();
  };

  const copyDebugInfo = () => {
    const info = `
Theme Debug Information:
- Current Theme: ${debugInfo.currentTheme}
- Document Classes: ${debugInfo.documentClasses}
- localStorage Theme: ${debugInfo.localStorageTheme}
- System Preference: ${debugInfo.systemPreference}
- Mounted: ${debugInfo.mounted}
- Has ThemeProvider: ${debugInfo.hasThemeProvider}
    `.trim();
    
    navigator.clipboard.writeText(info);
    addTestResult('📋 Copied debug info to clipboard');
  };

  return (
    <Layout title="Theme Debug">
      <div className="space-y-8">
        {/* Current Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Theme Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Current Theme</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {theme}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Document Classes</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {debugInfo.documentClasses}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {debugInfo.documentClasses.includes('dark') ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : debugInfo.documentClasses.includes('light') ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">localStorage</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {debugInfo.localStorageTheme}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {debugInfo.localStorageTheme === theme ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">System Preference</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {debugInfo.systemPreference}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Theme Testing Tools
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={runThemeTests}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Run Tests
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Toggle Theme
            </button>

            <button
              onClick={copyDebugInfo}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy Debug Info
            </button>

            <button
              onClick={clearLocalStorage}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
            >
              🗑️ Clear localStorage
            </button>

            <button
              onClick={forceLightTheme}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
            >
              ☀️ Force Light
            </button>

            <button
              onClick={forceDarkTheme}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
            >
              🌙 Force Dark
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Debug Instructions
          </h2>
          
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
              <p>Open browser DevTools (F12) and check the Console tab for theme-related logs</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
              <p>Inspect the &lt;html&gt; element to verify 'dark' or 'light' class is present</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
              <p>Check localStorage in DevTools → Application → Storage → Local Storage</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
              <p>Test theme toggle and verify all components update consistently</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">5.</span>
              <p>Refresh the page and verify theme persists correctly</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 