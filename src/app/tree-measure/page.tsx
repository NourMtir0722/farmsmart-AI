'use client'

import { useState, useEffect } from 'react'
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
import { calculateTreeHeight } from '@/utils/treeCalculations'

export default function TreeMeasurePage() {
  // State for measurement mode
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('sensor')
  
  // Import hooks
  const { sensorState } = useDeviceOrientation()
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
  
  // Handle angle capture with proper angle values
  const handleCaptureBaseWithAngle = (angle: number) => {
    console.log('🌳 [Main] Base angle captured:', angle)
    handleCaptureBase(angle)
  }
  
  const handleCaptureTopWithAngle = (angle: number) => {
    console.log('🌳 [Main] Top angle captured:', angle)
    handleCaptureTop(angle)
  }
  
  // Handle calculation with proper values
  const handleCalculateWithValues = () => {
    console.log('🧮 [Main] Calculate button clicked')
    if (baseAngle !== null && topAngle !== null) {
      console.log('🧮 [Main] Calculating with values:', {
        distance,
        baseAngle,
        topAngle,
        userHeight
      })
      const height = calculateTreeHeight(distance, baseAngle, topAngle, userHeight)
      console.log('🌳 [Main] Calculated tree height:', height, 'm')
      // Note: handleCalculate() from the hook will handle setting the state
      handleCalculate()
    } else {
      console.log('❌ [Main] Cannot calculate - missing angles. Base:', baseAngle, 'Top:', topAngle)
    }
  }
  
  const handleModeChange = (newMode: MeasurementMode) => {
    console.log('🔄 [Main] Mode changed from', measurementMode, 'to', newMode)
    setMeasurementMode(newMode)
  }
  
  const handleSaveMeasurement = () => {
    console.log('💾 [Main] Save measurement button clicked')
    saveMeasurement()
  }
  
  const handleClearHistory = () => {
    console.log('🗑️ [Main] Clear history button clicked')
    clearHistory()
  }
  
  // Log state changes
  useEffect(() => {
    console.log('📊 [Main] State updated:', {
      measurementMode,
      distance,
      userHeight,
      baseAngle,
      topAngle,
      treeHeight,
      measurementsCount: measurements.length,
      sensorState: {
        hasPermission: sensorState.hasPermission,
        isActive: sensorState.isActive,
        currentAngle: sensorState.currentAngle
      }
    })
  }, [measurementMode, distance, userHeight, baseAngle, topAngle, treeHeight, measurements.length, sensorState])
  
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
            onCaptureBase={handleCaptureBaseWithAngle}
            onCaptureTop={handleCaptureTopWithAngle}
            onReset={handleResetAngles}
            onModeChange={handleModeChange}
          />
          
          <ResultsDisplay
            treeHeight={treeHeight}
            baseAngle={baseAngle}
            topAngle={topAngle}
            onCalculate={handleCalculateWithValues}
            onSave={handleSaveMeasurement}
          />
          
          <MeasurementHistory 
            measurements={measurements}
            onClearHistory={handleClearHistory}
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