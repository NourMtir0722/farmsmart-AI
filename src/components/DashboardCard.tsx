import React from 'react'

interface DashboardCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend: {
    value: number
    isPositive: boolean
  }
}

export function DashboardCard({ title, value, icon, trend }: DashboardCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${
          trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last week</span>
      </div>
    </div>
  )
} 