'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌱</span>
              <span className="text-xl font-bold text-gray-900">FarmSmart AI</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <Link 
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/scan"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/scan'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Plant Scanner
            </Link>
            <Link 
              href="/measure"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/measure'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Plant Measure
            </Link>
            <Link 
              href="/ai-measure"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/ai-measure'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              AI Measure
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 