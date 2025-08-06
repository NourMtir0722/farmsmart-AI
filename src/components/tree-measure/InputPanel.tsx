'use client'

import { ValidationError } from '@/types/treeMeasure'

interface InputPanelProps {
  distance: number
  userHeight: number
  onDistanceChange: (value: number) => void
  onHeightChange: (value: number) => void
  errors?: ValidationError[]
}

export function InputPanel({
  distance,
  userHeight,
  onDistanceChange,
  onHeightChange,
  errors = []
}: InputPanelProps) {
  const getError = (field: string) => {
    return errors.find(error => error.field === field)?.message
  }

  const handleDistanceChange = (value: string) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      onDistanceChange(numValue)
    }
  }

  const handleHeightChange = (value: string) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      onHeightChange(numValue)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Input Parameters
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Distance to Tree (meters)
          </label>
          <input
            type="number"
            id="distance"
            min="5"
            max="100"
            step="0.5"
            value={distance}
            onChange={(e) => handleDistanceChange(e.target.value)}
            className={`rounded-lg border p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              getError('distance') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter distance to tree"
          />
          {getError('distance') && (
            <p className="text-red-500 text-sm mt-1">{getError('distance')}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="userHeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Eye Level Height (meters)
          </label>
          <input
            type="number"
            id="userHeight"
            min="1.0"
            max="2.5"
            step="0.05"
            value={userHeight}
            onChange={(e) => handleHeightChange(e.target.value)}
            className={`rounded-lg border p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              getError('userHeight') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your height"
          />
          {getError('userHeight') && (
            <p className="text-red-500 text-sm mt-1">{getError('userHeight')}</p>
          )}
        </div>
      </div>
    </div>
  )
} 