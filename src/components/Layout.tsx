'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar component (fixed position) */}
      <Sidebar />
      
      {/* Main content wrapper with responsive padding */}
      <div className="lg:pl-60">
        {/* Header bar with page title */}
        {title && (
          <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          </header>
        )}
        
        {/* Content area with proper spacing */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 