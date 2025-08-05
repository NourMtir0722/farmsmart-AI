import { DashboardCard } from '../components/DashboardCard'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FarmSmart AI Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your intelligent farm management system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Plants Scanned Today"
            value="12"
            icon={<span className="text-2xl">🌱</span>}
            trend={{ value: 15, isPositive: true }}
          />
          
          <DashboardCard
            title="Tasks Completed"
            value="8/10"
            icon={<span className="text-2xl">✅</span>}
            trend={{ value: 8, isPositive: true }}
          />
          
          <DashboardCard
            title="Team Performance"
            value="92%"
            icon={<span className="text-2xl">⭐</span>}
            trend={{ value: 3, isPositive: true }}
          />
          
          <DashboardCard
            title="Diseases Detected"
            value="2"
            icon={<span className="text-2xl">⚠️</span>}
            trend={{ value: -50, isPositive: false }}
          />
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/scan" className="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group">
              <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">📸</span>
              <h3 className="font-medium text-gray-900">Plant Scanner</h3>
              <p className="text-sm text-gray-600">AI-powered plant identification</p>
            </a>
            <a href="/measure" className="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group">
              <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">📏</span>
              <h3 className="font-medium text-gray-900">Plant Measure</h3>
              <p className="text-sm text-gray-600">Computer vision size measurement</p>
            </a>
            <a href="/ai-measure" className="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group">
              <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">🤖</span>
              <h3 className="font-medium text-gray-900">AI Measure</h3>
              <p className="text-sm text-gray-600">AI-powered automatic measurement</p>
            </a>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <span className="text-3xl mb-2 block">📋</span>
              <h3 className="font-medium">Task Management</h3>
              <p className="text-sm text-gray-600">Assign and track farm tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}