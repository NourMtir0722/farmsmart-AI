'use client'

import { useState } from 'react'
import { AngleMeasurementState } from '@/types/treeMeasure'

interface MeasurementGuideProps {
  state: AngleMeasurementState
}

export function MeasurementGuide({ state }: MeasurementGuideProps) {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Measurement Guide
        </h2>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </button>
      </div>

      {showGuide && (
        <div className="space-y-6">
          {/* Step 1 */}
          <div className={`p-4 rounded-lg border-2 ${
            !state.baseAngle && !state.topAngle 
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Set Distance and Height
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Enter your distance to the tree and your eye level height in the input fields above.
                </p>
                <div className="text-center text-2xl mb-2">
                  🚶────🌲
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Stand at a known distance from the tree
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-lg border-2 ${
            !state.baseAngle && !state.topAngle 
              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
              : state.baseAngle && !state.topAngle
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Measure Base Angle
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Point your phone at the base of the tree and capture the angle.
                </p>
                <div className="text-center text-2xl mb-2">
                  🚶 ＼<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;🌲
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Aim at the tree trunk base
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-lg border-2 ${
            state.baseAngle && !state.topAngle
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : state.baseAngle && state.topAngle
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Measure Top Angle
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Point your phone at the top of the tree and capture the angle.
                </p>
                <div className="text-center text-2xl mb-2">
                  🚶 ／<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;🌲
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Aim at the tree top
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              💡 Tips for Accurate Measurement
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Stand at least 10 meters from the tree</li>
              <li>• Keep your phone steady when capturing angles</li>
              <li>• Measure on a clear day with good visibility</li>
              <li>• Avoid measuring in strong winds</li>
              <li>• Ensure your eye level height is accurate</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 