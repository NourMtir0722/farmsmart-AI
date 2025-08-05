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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </span>
        <span className="text-sm text-gray-500 ml-1">from last week</span>
      </div>
    </div>
  )
} 