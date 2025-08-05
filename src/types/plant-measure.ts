export interface MeasurementResult {
  height: number
  width: number
  area: number
  unit: string
  confidence: number
  referenceObject: string
}

export interface ReferenceObject {
  name: string
  size: number
  unit: string
  description: string
}

export interface MeasurementError {
  error: string
  message: string
  code?: string
}

export interface MockMeasurementData {
  [key: string]: {
    height: number
    width: number
    area: number
    confidence: number
  }
}

export interface ComputerVisionResponse {
  plantDimensions: {
    height: number
    width: number
    area: number
  }
  referenceObject: {
    name: string
    detectedSize: number
    confidence: number
  }
  overallConfidence: number
} 