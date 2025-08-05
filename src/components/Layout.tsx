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
      <Sidebar />
      
      {/* Main content area with padding for sidebar */}
      <div className="lg:pl-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {title}
            </h1>
          )}
          {children}
        </div>
      </div>
    </div>
  );
} 