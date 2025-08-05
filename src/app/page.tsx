import { DashboardCard } from '@/components/DashboardCard'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome to your intelligent farm management system</p>
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
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500 text-white group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">📸</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Plant Scanner</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered plant identification</p>
              </div>
            </div>
          </div>
          
          <div className="group relative p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">📏</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Plant Measure</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Computer vision size measurement</p>
              </div>
            </div>
          </div>
          
          <div className="group relative p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500 text-white group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Measure</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered automatic measurement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <span className="text-sm">🌱</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">New plant identified: Durian Tree</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-sm">📏</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Plant measured: 6.5m height</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">15 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <span className="text-sm">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Disease detected: Leaf spot</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}