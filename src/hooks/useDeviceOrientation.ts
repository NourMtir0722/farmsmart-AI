import { useState, useCallback, useEffect } from 'react'
import { SensorState } from '@/types/treeMeasure'

export function useDeviceOrientation() {
  const [sensorState, setSensorState] = useState<SensorState>({
    hasPermission: false,
    isSupported: typeof DeviceOrientationEvent !== 'undefined',
    currentAngle: 0,
    isActive: false
  })
  
  const [error, setError] = useState<string | null>(null)
  
  const requestPermission = useCallback(async () => {
    console.log('🔧 [Sensor] Requesting permission...')
    setError(null)
    
    if (!sensorState.isSupported) {
      console.log('❌ [Sensor] Device orientation not supported')
      setError('Device orientation not supported')
      return false
    }
    
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        console.log('📱 [Sensor] iOS-style permission request')
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission === 'granted') {
          console.log('✅ [Sensor] Permission granted')
          setSensorState(prev => ({ ...prev, hasPermission: true }))
          return true
        } else {
          console.log('❌ [Sensor] Permission denied')
          setError('Permission denied')
          return false
        }
      } else {
        console.log('✅ [Sensor] Automatic permission (non-iOS)')
        setSensorState(prev => ({ ...prev, hasPermission: true }))
        return true
      }
    } catch (err) {
      console.error('❌ [Sensor] Error requesting permission:', err)
      setError('Failed to request permission')
      return false
    }
  }, [sensorState.isSupported])
  
  const startTracking = useCallback(() => {
    if (!sensorState.hasPermission) {
      console.log('❌ [Sensor] Cannot start tracking - no permission')
      return
    }
    
    console.log('🔄 [Sensor] Starting angle tracking...')
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null) {
        const angle = Math.round(event.beta * 10) / 10
        console.log('📐 [Sensor] Angle update:', angle, '°')
        setSensorState(prev => ({ ...prev, currentAngle: angle, isActive: true }))
      }
    }
    
    const handleError = () => {
      console.log('❌ [Sensor] Sensor error occurred')
      setSensorState(prev => ({ ...prev, isActive: false }))
      setError('Sensor error')
    }
    
    window.addEventListener('deviceorientation', handleOrientation)
    window.addEventListener('deviceorientationerror', handleError)
    
    console.log('✅ [Sensor] Event listeners attached')
    
    return () => {
      console.log('🔄 [Sensor] Cleaning up event listeners')
      window.removeEventListener('deviceorientation', handleOrientation)
      window.removeEventListener('deviceorientationerror', handleError)
    }
  }, [sensorState.hasPermission])
  
  const stopTracking = useCallback(() => {
    console.log('🛑 [Sensor] Stopping tracking')
    setSensorState(prev => ({ ...prev, isActive: false }))
  }, [])
  
  useEffect(() => {
    if (sensorState.hasPermission && sensorState.isActive) {
      console.log('🔄 [Sensor] Setting up tracking...')
      const cleanup = startTracking()
      return cleanup
    }
  }, [sensorState.hasPermission, sensorState.isActive, startTracking])
  
  // Log state changes
  useEffect(() => {
    console.log('📊 [Sensor] State updated:', {
      hasPermission: sensorState.hasPermission,
      isSupported: sensorState.isSupported,
      isActive: sensorState.isActive,
      currentAngle: sensorState.currentAngle,
      error
    })
  }, [sensorState, error])
  
  return {
    sensorState,
    error,
    requestPermission,
    startTracking,
    stopTracking
  }
} 