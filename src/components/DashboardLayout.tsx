'use client';

import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      
      {/* Main content area with padding for sidebar */}
      <div className="lg:pl-64">
        {/* Top header bar */}
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b 
          border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              FarmSmart AI Dashboard
            </h1>
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 