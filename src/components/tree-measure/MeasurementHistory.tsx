'use client'

import { TreeMeasurement } from '@/types/treeMeasure'
import { formatMeasurementDate } from '@/utils/treeCalculations'

interface MeasurementHistoryProps {
  measurements: TreeMeasurement[]
  onClearHistory: () => void
}

export function MeasurementHistory({
  measurements,
  onClearHistory
}: MeasurementHistoryProps) {
  if (measurements.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Measurements
        </h2>
        <button
          onClick={onClearHistory}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        >
          Clear History
        </button>
      </div>
      
      <div className="space-y-3">
        {measurements.slice(0, 5).map((measurement) => (
          <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {measurement.treeHeight.toFixed(1)}m
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({measurement.treeHeight * 3.281}ft)
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Distance: {measurement.distance}m • Height: {measurement.userHeight}m
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Angles: {measurement.baseAngle.toFixed(1)}° / {measurement.topAngle.toFixed(1)}°
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatMeasurementDate(measurement.timestamp)}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {measurement.location}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 