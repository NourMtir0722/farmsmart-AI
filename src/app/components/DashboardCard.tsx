import { ReactNode } from 'react'
import { cn } from '../lib/utils'
interface DashboardCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function DashboardCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className 
}: DashboardCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-green-100 rounded-full text-green-600">
          {icon}
        </div>
      </div>
    </div>
  )
}