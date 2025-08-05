export interface AIMeasurementResult {
  height: number
  width: number
  area: number
  unit: string
  confidence: number
  detectedObjects: DetectedObject[]
  plantDimensions: PlantDimensions
}

export interface DetectedObject {
  name: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  estimatedSize: number
}

export interface PlantDimensions {
  height: number
  width: number
  area: number
}

export interface AIMeasurementError {
  error: string
  message: string
  code?: string
}

export interface GoogleVisionResponse {
  responses: Array<{
    labelAnnotations?: Array<{
      description: string
      score: number
      mid: string
    }>
    objectAnnotations?: Array<{
      name: string
      score: number
      boundingPoly: {
        vertices: Array<{
          x: number
          y: number
        }>
      }
    }>
    localizedObjectAnnotations?: Array<{
      name: string
      score: number
      boundingPoly: {
        normalizedVertices: Array<{
          x: number
          y: number
        }>
      }
    }>
  }>
}

export interface ReferenceObjectDatabase {
  [key: string]: {
    name: string
    averageSize: number
    unit: string
    description: string
  }
}

export interface MockAIMeasurementData {
  [key: string]: {
    detectedObjects: DetectedObject[]
    plantDimensions: PlantDimensions
    confidence: number
  }
} 