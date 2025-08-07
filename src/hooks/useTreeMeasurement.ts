import { useState, useEffect, useCallback } from 'react'
import { TreeMeasurement, MeasurementInput, ValidationError } from '@/types/treeMeasure'
import { validateDistance, validateHeight } from '@/utils/treeCalculations'

export function useTreeMeasurement() {
  // Input state
  const [distance, setDistance] = useState(20)
  const [userHeight, setUserHeight] = useState(1.6)
  
  // Angle state
  const [baseAngle, setBaseAngle] = useState<number | null>(null)
  const [topAngle, setTopAngle] = useState<number | null>(null)
  
  // Results state
  const [treeHeight, setTreeHeight] = useState<number | null>(null)
  
  // History state
  const [measurements, setMeasurements] = useState<TreeMeasurement[]>([])
  
  // Validation state
  const [errors, setErrors] = useState<ValidationError[]>([])
  
  // Load measurements from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('farmsmart-tree-measurements')
      if (stored) {
        const parsed = JSON.parse(stored)
        setMeasurements(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Error loading measurements:', error)
    }
  }, [])
  
  // Validate inputs
  useEffect(() => {
    const newErrors: ValidationError[] = []
    
    if (!validateDistance(distance)) {
      newErrors.push({ field: 'distance', message: 'Distance must be between 0 and 1000 meters' })
    }
    
    if (!validateHeight(userHeight)) {
      newErrors.push({ field: 'userHeight', message: 'Height must be between 0.5 and 3 meters' })
    }
    
    setErrors(newErrors)
  }, [distance, userHeight])
  
  // Input handlers
  const handleDistanceChange = useCallback((value: number) => {
    setDistance(value)
    setTreeHeight(null) // Clear result when inputs change
  }, [])
  
  const handleHeightChange = useCallback((value: number) => {
    setUserHeight(value)
    setTreeHeight(null) // Clear result when inputs change
  }, [])
  
  // Angle handlers
  const handleCaptureBase = useCallback((angle: number) => {
    setBaseAngle(angle)
    setTreeHeight(null) // Clear result when angles change
  }, [])
  
  const handleCaptureTop = useCallback((angle: number) => {
    setTopAngle(angle)
    setTreeHeight(null) // Clear result when angles change
  }, [])
  
  const handleResetAngles = useCallback(() => {
    setBaseAngle(null)
    setTopAngle(null)
    setTreeHeight(null)
  }, [])
  
  // Calculation handler
  const handleCalculate = useCallback(() => {
    if (baseAngle !== null && topAngle !== null) {
      // Import here to avoid circular dependency
      import('@/utils/treeCalculations').then(({ calculateTreeHeight }) => {
        const height = calculateTreeHeight(distance, baseAngle, topAngle, userHeight)
        setTreeHeight(Math.round(height * 10) / 10) // Round to 1 decimal place
      })
    }
  }, [distance, baseAngle, topAngle, userHeight])
  
  // Save measurement
  const saveMeasurement = useCallback(() => {
    if (treeHeight && baseAngle !== null && topAngle !== null) {
      const newMeasurement: TreeMeasurement = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        treeHeight,
        distance,
        userHeight,
        baseAngle,
        topAngle,
        location: 'Unknown Location'
      }
      
      const updatedMeasurements = [newMeasurement, ...measurements].slice(0, 10)
      setMeasurements(updatedMeasurements)
      
      try {
        localStorage.setItem('farmsmart-tree-measurements', JSON.stringify(updatedMeasurements))
      } catch (error) {
        console.error('Error saving measurement:', error)
      }
    }
  }, [treeHeight, distance, userHeight, baseAngle, topAngle, measurements])
  
  // Clear history
  const clearHistory = useCallback(() => {
    setMeasurements([])
    try {
      localStorage.removeItem('farmsmart-tree-measurements')
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }, [])
  
  // Get current measurement input
  const currentMeasurement: MeasurementInput = {
    distance,
    userHeight,
    baseAngle,
    topAngle
  }
  
  return {
    // State
    distance,
    userHeight,
    baseAngle,
    topAngle,
    treeHeight,
    measurements,
    errors,
    currentMeasurement,
    
    // Handlers
    handleDistanceChange,
    handleHeightChange,
    handleCaptureBase,
    handleCaptureTop,
    handleResetAngles,
    handleCalculate,
    saveMeasurement,
    clearHistory
  }
} 