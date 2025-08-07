'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/Layout';
import { Sun, Moon } from 'lucide-react';

export default function TestThemePage() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log(`🧪 TestTheme: toggle clicked, current theme: ${theme}`);
    toggleTheme();
  };

  return (
    <Layout title="Theme Test">
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Theme Synchronization Test
          </h2>
          
          <div className="space-y-4">
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">Toggle Theme</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Test theme synchronization</p>
              </div>
              <button
                onClick={handleToggle}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Toggle
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Test Instructions:</p>
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Click the toggle button above</li>
                <li>Check the sidebar theme toggle - it should update</li>
                <li>Navigate to Settings page - the toggle should match</li>
                <li>Navigate back - theme should persist</li>
                <li>Check browser console for debug logs</li>
              </ol>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Debug Information:
              </p>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <p>• Current theme: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{theme}</code></p>
                <p>• Document classes: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                  {typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}
                </code></p>
                <p>• localStorage theme: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                  {typeof window !== 'undefined' ? localStorage.getItem('theme') || 'null' : 'N/A'}
                </code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 