'use client'

import { SensorState, MeasurementInput } from '@/types/treeMeasure'

interface DebugPanelProps {
  // Input state
  distance: number
  userHeight: number
  
  // Angle state
  baseAngle: number | null
  topAngle: number | null
  
  // Results state
  treeHeight: number | null
  
  // Sensor state
  sensorState: SensorState
  
  // Validation state
  errors: { field: string; message: string }[]
  
  // Measurement mode
  measurementMode: 'sensor' | 'manual'
  
  // History state
  measurementsCount: number
}

export function DebugPanel({
  distance,
  userHeight,
  baseAngle,
  topAngle,
  treeHeight,
  sensorState,
  errors,
  measurementMode,
  measurementsCount
}: DebugPanelProps) {
  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
      <h3 className="text-white font-bold mb-3 border-b border-gray-700 pb-2">
        🔧 Debug Panel
      </h3>
      
      <div className="space-y-4">
        {/* Input Values */}
        <div>
          <h4 className="text-white font-semibold mb-2">📝 Input Values</h4>
          <div className="space-y-1">
            <div>Distance: {distance}m</div>
            <div>User Height: {userHeight}m</div>
            <div>Base Angle: {baseAngle !== null ? `${baseAngle}°` : 'null'}</div>
            <div>Top Angle: {topAngle !== null ? `${topAngle}°` : 'null'}</div>
          </div>
        </div>
        
        {/* Sensor Status */}
        <div>
          <h4 className="text-white font-semibold mb-2">📱 Sensor Status</h4>
          <div className="space-y-1">
            <div>Supported: {sensorState.isSupported ? '✅' : '❌'}</div>
            <div>Permission: {sensorState.hasPermission ? '✅' : '❌'}</div>
            <div>Active: {sensorState.isActive ? '✅' : '❌'}</div>
            <div>Current Angle: {sensorState.currentAngle}°</div>
          </div>
        </div>
        
        {/* Calculation */}
        <div>
          <h4 className="text-white font-semibold mb-2">🧮 Calculation</h4>
          <div className="space-y-1">
            <div>Tree Height: {treeHeight !== null ? `${treeHeight}m` : 'null'}</div>
            <div>Height (ft): {treeHeight !== null ? `${(treeHeight * 3.281).toFixed(1)}ft` : 'null'}</div>
            <div>Can Calculate: {baseAngle !== null && topAngle !== null ? '✅' : '❌'}</div>
          </div>
        </div>
        
        {/* Mode & Errors */}
        <div>
          <h4 className="text-white font-semibold mb-2">⚙️ Mode & Errors</h4>
          <div className="space-y-1">
            <div>Mode: {measurementMode}</div>
            <div>Errors: {errors.length}</div>
            {errors.map((error, index) => (
              <div key={index} className="text-red-400">
                {error.field}: {error.message}
              </div>
            ))}
          </div>
        </div>
        
        {/* History */}
        <div>
          <h4 className="text-white font-semibold mb-2">📚 History</h4>
          <div>Saved Measurements: {measurementsCount}</div>
        </div>
        
        {/* Raw Data */}
        <div>
          <h4 className="text-white font-semibold mb-2">🔍 Raw Data</h4>
          <div className="bg-gray-800 p-2 rounded text-xs">
            <pre>{JSON.stringify({
              distance,
              userHeight,
              baseAngle,
              topAngle,
              treeHeight,
              measurementMode,
              errors: errors.length,
              measurementsCount
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
} 