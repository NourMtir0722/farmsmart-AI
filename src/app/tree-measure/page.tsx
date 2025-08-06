'use client'

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { InputPanel } from '@/components/tree-measure/InputPanel'
import { AngleMeasurement } from '@/components/tree-measure/AngleMeasurement'
import { ResultsDisplay } from '@/components/tree-measure/ResultsDisplay'
import { MeasurementHistory } from '@/components/tree-measure/MeasurementHistory'
import { MeasurementGuide } from '@/components/tree-measure/MeasurementGuide'
import { DebugPanel } from '@/components/tree-measure/DebugPanel'
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation'
import { useTreeMeasurement } from '@/hooks/useTreeMeasurement'
import { MeasurementMode } from '@/types/treeMeasure'

export default function TreeMeasurePage() {
  // State for measurement mode
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('sensor')
  
  // Import hooks
  const { sensorState, requestPermission } = useDeviceOrientation()
  const {
    distance,
    userHeight,
    baseAngle,
    topAngle,
    treeHeight,
    measurements,
    errors,
    handleDistanceChange,
    handleHeightChange,
    handleCaptureBase,
    handleCaptureTop,
    handleResetAngles,
    handleCalculate,
    saveMeasurement,
    clearHistory
  } = useTreeMeasurement()
  
  // Handle angle capture with current sensor angle
  const handleCaptureBaseWithSensor = () => {
    const currentAngle = measurementMode === 'sensor' ? sensorState.currentAngle : 0
    handleCaptureBase(currentAngle)
  }
  
  const handleCaptureTopWithSensor = () => {
    const currentAngle = measurementMode === 'sensor' ? sensorState.currentAngle : 0
    handleCaptureTop(currentAngle)
  }
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tree Measurement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Measure tree height using your phone's sensors or manual input
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InputPanel 
            distance={distance}
            userHeight={userHeight}
            onDistanceChange={handleDistanceChange}
            onHeightChange={handleHeightChange}
            errors={errors}
          />
          
          <AngleMeasurement
            mode={measurementMode}
            currentAngle={sensorState.currentAngle}
            baseAngle={baseAngle}
            topAngle={topAngle}
            onCaptureBase={handleCaptureBaseWithSensor}
            onCaptureTop={handleCaptureTopWithSensor}
            onReset={handleResetAngles}
            onModeChange={setMeasurementMode}
          />
          
          <ResultsDisplay
            treeHeight={treeHeight}
            baseAngle={baseAngle}
            topAngle={topAngle}
            onCalculate={handleCalculate}
            onSave={saveMeasurement}
          />
          
          <MeasurementHistory 
            measurements={measurements}
            onClearHistory={clearHistory}
          />
        </div>
        
        <div className="mt-8">
          <MeasurementGuide 
            state={{
              currentAngle: sensorState.currentAngle,
              baseAngle,
              topAngle,
              hasOrientationPermission: sensorState.hasPermission,
              hasGyroscope: sensorState.isSupported,
              isCalibrating: false,
              calibrationOffset: 0,
              rawBeta: null,
              angleReadings: []
            }}
          />
        </div>
        
        {/* Debug Panel for Testing */}
        <div className="mt-8">
          <DebugPanel
            distance={distance}
            userHeight={userHeight}
            baseAngle={baseAngle}
            topAngle={topAngle}
            treeHeight={treeHeight}
            sensorState={sensorState}
            errors={errors}
            measurementMode={measurementMode}
            measurementsCount={measurements.length}
          />
        </div>
      </div>
    </Layout>
  )
} 