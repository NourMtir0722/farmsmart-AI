'use client'


import { MeasurementMode } from '@/types/treeMeasure'
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation'
import { formatAngle } from '@/utils/treeCalculations'
import { ManualMode } from './ManualMode'

interface AngleMeasurementProps {
  mode: MeasurementMode
  currentAngle: number
  baseAngle: number | null
  topAngle: number | null
  onCaptureBase: (angle: number) => void
  onCaptureTop: (angle: number) => void
  onReset: () => void
  onModeChange: (mode: MeasurementMode) => void
}

function SensorMode({ 
  mode,
  baseAngle, 
  topAngle, 
  onCaptureBase, 
  onCaptureTop, 
  onReset 
}: {
  mode: MeasurementMode
  baseAngle: number | null
  topAngle: number | null
  onCaptureBase: (angle: number) => void
  onCaptureTop: (angle: number) => void
  onReset: () => void
}) {
  const { sensorState, error, requestPermission } = useDeviceOrientation()

  const handleCaptureBase = () => {
    console.log('🔘 [Sensor] Base capture button clicked')
    if (sensorState?.currentAngle !== undefined) {
      console.log('📐 [Sensor] Capturing base angle:', sensorState.currentAngle)
      onCaptureBase(sensorState.currentAngle)
    } else {
      console.log('❌ [Sensor] Cannot capture base angle - currentAngle is undefined')
    }
  }

  const handleCaptureTop = () => {
    console.log('🔘 [Sensor] Top capture button clicked')
    if (sensorState?.currentAngle !== undefined) {
      console.log('📐 [Sensor] Capturing top angle:', sensorState.currentAngle)
      onCaptureTop(sensorState.currentAngle)
    } else {
      console.log('❌ [Sensor] Cannot capture top angle - currentAngle is undefined')
    }
  }

  const handleReset = () => {
    console.log('🔄 [Sensor] Reset button clicked')
    onReset()
  }

  const handleRequestPermission = () => {
    console.log('🔧 [Sensor] Request permission button clicked')
    requestPermission()
  }

  return (
    <div className="space-y-4">
      {/* Permission Request */}
      {!sensorState.hasPermission && (
        <div className="text-center">
          <button
            onClick={handleRequestPermission}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Enable Sensors
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Required for angle measurement
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Current Angle Display */}
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
          {formatAngle(sensorState.currentAngle)}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Current Angle
        </p>
      </div>

      {/* Measurement Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleCaptureBase}
          disabled={!sensorState.hasPermission}
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            sensorState.hasPermission
              ? baseAngle !== null
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          Measure Base Angle
        </button>

        <button
          onClick={handleCaptureTop}
          disabled={!sensorState.hasPermission}
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            sensorState.hasPermission
              ? topAngle !== null
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          Measure Top Angle
        </button>

        {(baseAngle !== null || topAngle !== null) && (
          <button
            onClick={handleReset}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Reset Angles
          </button>
        )}
      </div>

      {/* Stored Angles */}
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

      {/* Debug Section */}
      <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
        <p className="font-medium mb-2">🔧 Sensor Debug Info:</p>
        <p>Mode: {mode}</p>
        <p>Current Angle: {sensorState?.currentAngle || 'N/A'}°</p>
        <p>Has Permission: {sensorState?.hasPermission ? 'Yes' : 'No'}</p>
        <p>Is Active: {sensorState?.isActive ? 'Yes' : 'No'}</p>
        <p>Is Supported: {sensorState?.isSupported ? 'Yes' : 'No'}</p>
        <p>Base: {baseAngle}° | Top: {topAngle}°</p>
        <p>Error: {error || 'None'}</p>
      </div>
    </div>
  )
}

export function AngleMeasurement({
  mode,
  currentAngle,
  baseAngle,
  topAngle,
  onCaptureBase,
  onCaptureTop,
  onReset,
  onModeChange
}: AngleMeasurementProps) {
  const handleModeChange = (newMode: MeasurementMode) => {
    console.log('🔄 [AngleMeasurement] Mode changed from', mode, 'to', newMode)
    onModeChange(newMode)
  }

  console.log('📊 [AngleMeasurement] Render with props:', {
    mode,
    currentAngle,
    baseAngle,
    topAngle
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Angle Measurement
        </h2>
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('sensor')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              mode === 'sensor'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Sensor
          </button>
          <button
            onClick={() => handleModeChange('manual')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {mode === 'sensor' ? (
        <SensorMode
          mode={mode}
          baseAngle={baseAngle}
          topAngle={topAngle}
          onCaptureBase={onCaptureBase}
          onCaptureTop={onCaptureTop}
          onReset={onReset}
        />
      ) : (
        <ManualMode
          onAngleChange={(angle) => console.log('📐 [Manual] Angle changed:', angle)}
          onCaptureBase={onCaptureBase}
          onCaptureTop={onCaptureTop}
          onReset={onReset}
          baseAngle={baseAngle}
          topAngle={topAngle}
        />
      )}
    </div>
  )
} 