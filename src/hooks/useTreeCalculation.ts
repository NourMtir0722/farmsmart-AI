import { useState, useCallback } from 'react'
import { TreeMeasurement, TreeCalculationInputs } from '@/types/treeMeasure'
import { calculateTreeHeight } from '@/utils/treeCalculations'

export function useTreeCalculation() {
  const [treeHeight, setTreeHeight] = useState<number | null>(null)
  const [measurements, setMeasurements] = useState<TreeMeasurement[]>([])
  const [distance, setDistance] = useState(20)
  const [userHeight, setUserHeight] = useState(1.6)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const calculateHeight = useCallback((baseAngle: number, topAngle: number) => {
    const inputs: TreeCalculationInputs = {
      distance,
      userHeight,
      baseAngle,
      topAngle
    }

    try {
      const result = calculateTreeHeight(inputs.distance, inputs.baseAngle, inputs.topAngle, inputs.userHeight)
      setTreeHeight(result)
      return { treeHeight: result }
    } catch (error) {
      console.error('Error calculating tree height:', error)
      return null
    }
  }, [distance, userHeight])

  const saveMeasurement = useCallback((baseAngle: number, topAngle: number) => {
    if (!treeHeight) return

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
  }, [treeHeight, distance, userHeight, measurements])

  const loadMeasurements = useCallback(() => {
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

  const clearHistory = useCallback(() => {
    setMeasurements([])
    try {
      localStorage.removeItem('farmsmart-tree-measurements')
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }, [])

  const validateInput = useCallback((value: number, field: string) => {
    if (value <= 0) {
      setErrors(prev => ({ ...prev, [field]: `${field} must be greater than 0` }))
      return false
    }
    setErrors(prev => ({ ...prev, [field]: '' }))
    return true
  }, [])

  const updateDistance = useCallback((value: number) => {
    if (validateInput(value, 'distance')) {
      setDistance(value)
    }
  }, [validateInput])

  const updateUserHeight = useCallback((value: number) => {
    if (validateInput(value, 'userHeight')) {
      setUserHeight(value)
    }
  }, [validateInput])

  return {
    treeHeight,
    measurements,
    distance,
    userHeight,
    errors,
    calculateHeight,
    saveMeasurement,
    loadMeasurements,
    clearHistory,
    updateDistance,
    updateUserHeight
  }
} 