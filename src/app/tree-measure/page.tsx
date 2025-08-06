'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Check, AlertCircle, Info } from 'lucide-react'

export default function TreeMeasurePage() {
  // Tree measurement state variables
  const [distance, setDistance] = useState<number>(20)
  const [userHeight, setUserHeight] = useState<number>(1.6)
  const [baseAngle, setBaseAngle] = useState<number | null>(null)
  const [topAngle, setTopAngle] = useState<number | null>(null)
  const [treeHeight, setTreeHeight] = useState<number | null>(null)
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false)
  const [hasOrientationPermission, setHasOrientationPermission] = useState<boolean>(false)
  const [currentAngle, setCurrentAngle] = useState<number>(0)
  const [showGuide, setShowGuide] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasGyroscope, setHasGyroscope] = useState<boolean>(true)
  const [showManualInput, setShowManualInput] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [measurements, setMeasurements] = useState<Array<{
    id: string
    timestamp: number
    treeHeight: number
    distance: number
    userHeight: number
    baseAngle: number
    topAngle: number
    location?: string
  }>>([])

  // Validation functions
  const validateInput = (value: number, field: string): boolean => {
    if (value <= 0) {
      setErrors(prev => ({ ...prev, [field]: `${field} must be greater than 0` }))
      return false
    }
    setErrors(prev => ({ ...prev, [field]: '' }))
    return true
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
  }

  // LocalStorage functions
  const loadMeasurements = () => {
    try {
      const stored = localStorage.getItem('farmsmart-tree-measurements')
      if (stored) {
        const parsed = JSON.parse(stored)
        setMeasurements(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Error loading measurements:', error)
      showToast('Error loading measurement history', 'error')
    }
  }

  const saveMeasurement = () => {
    if (!treeHeight) {
      showToast('No measurement to save', 'error')
      return
    }

    try {
      const newMeasurement = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        treeHeight,
        distance,
        userHeight,
        baseAngle: baseAngle!,
        topAngle: topAngle!,
        location: 'Unknown Location' // Could be enhanced with GPS later
      }

      const updatedMeasurements = [newMeasurement, ...measurements].slice(0, 10) // Keep last 10
      setMeasurements(updatedMeasurements)
      localStorage.setItem('farmsmart-tree-measurements', JSON.stringify(updatedMeasurements))
      
      showToast('Measurement saved successfully!', 'success')
      triggerHapticFeedback()
    } catch (error) {
      console.error('Error saving measurement:', error)
      showToast('Error saving measurement', 'error')
    }
  }

  const clearHistory = () => {
    try {
      setMeasurements([])
      localStorage.removeItem('farmsmart-tree-measurements')
      showToast('Measurement history cleared', 'info')
    } catch (error) {
      console.error('Error clearing history:', error)
      showToast('Error clearing history', 'error')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Device orientation event listener
  useEffect(() => {
    if (!hasOrientationPermission) return

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null) {
        // Calculate angle from beta (pitch)
        const angle = Math.round((90 - Math.abs(event.beta)) * 10) / 10
        
        // Limit to -90 to 90 degrees
        const limitedAngle = Math.max(-90, Math.min(90, angle))
        
        setCurrentAngle(limitedAngle)
        setHasGyroscope(true)
      } else {
        // No gyroscope data available
        setHasGyroscope(false)
        showToast('Gyroscope not available. Manual input mode enabled.', 'info')
      }
    }

    const handleOrientationError = () => {
      setHasGyroscope(false)
      showToast('Device orientation not supported. Manual input mode enabled.', 'info')
    }

    // Add event listeners
    window.addEventListener('deviceorientation', handleDeviceOrientation)
    window.addEventListener('deviceorientationerror', handleOrientationError)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
      window.removeEventListener('deviceorientationerror', handleOrientationError)
    }
  }, [hasOrientationPermission])

  // Load measurements on mount
  useEffect(() => {
    loadMeasurements()
  }, [])

  // Capture angle functions
  const captureBaseAngle = () => {
    if (!hasGyroscope && !showManualInput) {
      showToast('Please enable manual input mode or check device sensors', 'error')
      return
    }
    
    setBaseAngle(currentAngle)
    triggerHapticFeedback()
    showToast('Base angle captured successfully!', 'success')
    console.log('Base angle captured:', currentAngle)
  }

  const captureTopAngle = () => {
    if (!hasGyroscope && !showManualInput) {
      showToast('Please enable manual input mode or check device sensors', 'error')
      return
    }
    
    setTopAngle(currentAngle)
    triggerHapticFeedback()
    showToast('Top angle captured successfully!', 'success')
    console.log('Top angle captured:', currentAngle)
  }

  const resetAngles = () => {
    setBaseAngle(null)
    setTopAngle(null)
    showToast('Angles reset successfully', 'info')
    console.log('Angles reset')
  }

  const calculateTreeHeight = () => {
    // Check if all required values exist
    if (distance === null || baseAngle === null || topAngle === null || userHeight === null) {
      console.log('Missing required values for calculation')
      return
    }

    // Convert angles to radians
    const baseAngleRad = baseAngle * Math.PI / 180
    const topAngleRad = topAngle * Math.PI / 180

    // Calculate tree height
    const heightDiff = distance * (Math.tan(topAngleRad) - Math.tan(baseAngleRad))
    const totalHeight = Math.abs(heightDiff) + userHeight

    // Round to 1 decimal place and set result
    const roundedHeight = Math.round(totalHeight * 10) / 10
    setTreeHeight(roundedHeight)
    
    console.log('Tree height calculated:', roundedHeight, 'meters')
  }

  // Handle sensor permission request (must be triggered by user interaction)
  const handleEnableSensors = async () => {
    setIsLoading(true)
    
    try {
      // Check if DeviceOrientationEvent exists
      if (typeof DeviceOrientationEvent === 'undefined') {
        showToast('Device orientation not supported on this device', 'error')
        setShowManualInput(true)
        setIsLoading(false)
        return
      }

      // Check if it's iOS 13+ with requestPermission
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission()
          if (permission === 'granted') {
            setHasOrientationPermission(true)
            setHasGyroscope(true)
            showToast('Sensor access granted! You can now measure angles.', 'success')
            console.log('iOS orientation permission granted')
          } else {
            showToast('Permission denied. Enable in Settings > Privacy > Motion & Fitness > Safari', 'error')
            setShowManualInput(true)
            console.log('iOS orientation permission denied')
          }
        } catch (error) {
          console.error('Error requesting iOS permission:', error)
          showToast('Permission request failed. Manual mode enabled.', 'info')
          setShowManualInput(true)
        }
      } else {
        // Non-iOS or older iOS - permission is automatic
        setHasOrientationPermission(true)
        setHasGyroscope(true)
        showToast('Sensors enabled automatically!', 'success')
        console.log('Non-iOS orientation permission automatic')
      }
    } catch (error) {
      console.error('Error enabling sensors:', error)
      showToast('Error enabling sensors. Manual mode enabled.', 'error')
      setShowManualInput(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Tree Measurement</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Measure tree height using your phone's sensors
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
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
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    if (validateInput(value, 'distance')) {
                      setDistance(value)
                    }
                  }}
                  className={`rounded-lg border p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.distance ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.distance && (
                  <p className="text-red-500 text-sm mt-1">{errors.distance}</p>
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
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    if (validateInput(value, 'userHeight')) {
                      setUserHeight(value)
                    }
                  }}
                  className={`rounded-lg border p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.userHeight ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.userHeight && (
                  <p className="text-red-500 text-sm mt-1">{errors.userHeight}</p>
                )}
              </div>
            </div>
          </div>

          {/* Measurement Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Angle Measurement
            </h2>
            
            {/* Current Angle Display */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {currentAngle.toFixed(1)}°
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current Angle
              </p>
            </div>

            {/* Enable Sensors Button */}
            {!hasOrientationPermission && (
              <div className="mb-6">
                <button
                  onClick={handleEnableSensors}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Enable Sensors
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Required for angle measurement
                </p>
              </div>
            )}

            {/* Measurement Buttons */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={captureBaseAngle}
                  disabled={!hasOrientationPermission}
                  className={`flex-1 font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                    hasOrientationPermission 
                      ? baseAngle !== null
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {baseAngle !== null && <Check size={16} />}
                    Measure Base Angle
                  </div>
                </button>
                {baseAngle !== null && (
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    {baseAngle.toFixed(1)}°
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={captureTopAngle}
                  disabled={!hasOrientationPermission}
                  className={`flex-1 font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                    hasOrientationPermission 
                      ? topAngle !== null
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {topAngle !== null && <Check size={16} />}
                    Measure Top Angle
                  </div>
                </button>
                {topAngle !== null && (
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {topAngle.toFixed(1)}°
                  </div>
                )}
              </div>

              {/* Reset Button */}
              {(baseAngle !== null || topAngle !== null) && (
                <button
                  onClick={resetAngles}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Reset Angles
                </button>
              )}
            </div>

            {/* Stored Angles Display */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base Angle:
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {baseAngle || '--'}°
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Top Angle:
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {topAngle || '--'}°
                </span>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Results
            </h2>
            
            {/* Calculate Button */}
            <div className="mb-6">
              <button
                onClick={calculateTreeHeight}
                disabled={!baseAngle || !topAngle}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                  baseAngle && topAngle
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Calculate Tree Height
              </button>
            </div>

            {/* Results Display */}
            {treeHeight !== null && (
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-4xl mb-2">🌳</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {treeHeight.toFixed(1)} meters
                </div>
                <div className="text-xl font-semibold text-green-700 dark:text-green-300 mb-3">
                  {(treeHeight * 3.281).toFixed(1)} feet
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  ±5% margin of error
                </p>
                <button
                  onClick={saveMeasurement}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Save Measurement
                </button>
              </div>
            )}

            {/* Instructions */}
            {!treeHeight && (
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Capture both base and top angles to calculate tree height
              </p>
            )}
          </div>

          {/* Measurement History */}
          {measurements.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Measurements
                </h2>
                <button
                  onClick={clearHistory}
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
                        {formatDate(measurement.timestamp)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {measurement.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Measurement Guide */}
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
                  !baseAngle && !topAngle 
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
                  !baseAngle && !topAngle 
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                    : baseAngle && !topAngle
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
                  baseAngle && !topAngle
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : baseAngle && topAngle
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
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <Check size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Manual Input Option */}
        {!hasGyroscope && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Manual Input Mode
              </h3>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              Your device doesn't have a gyroscope. You can manually input angles or use a protractor.
            </p>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1 rounded"
            >
              {showManualInput ? 'Hide Manual Input' : 'Enable Manual Input'}
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300">Detecting sensors...</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 