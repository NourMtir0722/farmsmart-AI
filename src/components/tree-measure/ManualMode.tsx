'use client'

import { useState } from 'react'
import { formatAngle } from '@/utils/treeCalculations'

interface ManualModeProps {
  onAngleChange: (angle: number) => void
  onCaptureBase: (angle: number) => void
  onCaptureTop: (angle: number) => void
  onReset: () => void
  baseAngle: number | null
  topAngle: number | null
}

export function ManualMode({ 
  onAngleChange, 
  onCaptureBase, 
  onCaptureTop, 
  onReset,
  baseAngle, 
  topAngle 
}: ManualModeProps) {
  const [currentAngle, setCurrentAngle] = useState(0)
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const angle = Number(e.target.value)
    setCurrentAngle(angle)
    onAngleChange(angle)
  }
  
  const handleCaptureBase = () => {
    console.log('📐 [Manual] Capturing base angle:', currentAngle)
    onCaptureBase(currentAngle)
  }
  
  const handleCaptureTop = () => {
    console.log('📐 [Manual] Capturing top angle:', currentAngle)
    onCaptureTop(currentAngle)
  }
  
  return (
    <div className="space-y-4">
      {/* Angle Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Adjust Angle: {formatAngle(currentAngle)}
        </label>
        <input
          type="range"
          min="-60"
          max="60"
          step="0.1"
          value={currentAngle}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>-60°</span>
          <span>0°</span>
          <span>60°</span>
        </div>
      </div>
      
      {/* Current Angle Display */}
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
          {formatAngle(currentAngle)}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manual Angle
        </p>
      </div>
      
      {/* Capture Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCaptureBase}
          className={`flex-1 font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            baseAngle !== null
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          Set Base ({baseAngle ? formatAngle(baseAngle) : '--'})
        </button>
        
        <button
          onClick={handleCaptureTop}
          className={`flex-1 font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            topAngle !== null
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Set Top ({topAngle ? formatAngle(topAngle) : '--'})
        </button>
      </div>
      
      {/* Reset Button */}
      {(baseAngle !== null || topAngle !== null) && (
        <button
          onClick={onReset}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Reset Angles
        </button>
      )}
      
      {/* Stored Angles Display */}
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Base Angle:
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {baseAngle ? formatAngle(baseAngle) : '--'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Top Angle:
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {topAngle ? formatAngle(topAngle) : '--'}
          </span>
        </div>
      </div>
      
      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Tips for Manual Measurement:</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>Base angle</strong> (looking down): typically -20° to -45°</li>
          <li>• <strong>Top angle</strong> (looking up): typically 20° to 45°</li>
          <li>• Use the slider to simulate your phone's tilt</li>
          <li>• Negative angles = looking down, Positive angles = looking up</li>
        </ul>
      </div>
      
      {/* Debug Section */}
      <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
        <p className="font-medium mb-2">🔧 Manual Debug Info:</p>
        <p>Mode: Manual</p>
        <p>Current Angle: {currentAngle}°</p>
        <p>Base: {baseAngle}° | Top: {topAngle}°</p>
      </div>
    </div>
  )
} 