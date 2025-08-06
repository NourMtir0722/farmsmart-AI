export interface TreeMeasurement {
  id: string
  timestamp: number
  treeHeight: number
  distance: number
  userHeight: number
  baseAngle: number
  topAngle: number
  location?: string
}

export interface MeasurementInput {
  distance: number
  userHeight: number
  baseAngle: number | null
  topAngle: number | null
}

export interface SensorState {
  hasPermission: boolean
  isSupported: boolean
  currentAngle: number
  isActive: boolean
}

export type MeasurementMode = 'sensor' | 'manual'

export interface ValidationError {
  field: string
  message: string
} 