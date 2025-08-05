export interface PlantScanResult {
  plantName: string
  scientificName: string
  confidence: number
  isHealthy: boolean
  description?: string
  diseaseInfo?: string
  diseases?: string[]
  care?: string
  careTips?: string[]
  imageUrl?: string
}

export interface PlantScanError {
  error: string
  message: string
  code?: string
}

export interface PlantIdResponse {
  result: {
    classification: {
      suggestions: Array<{
        name: string
        probability: number
        similar_images: Array<{
          id: string
          url: string
        }>
      }>
    }
    health_assessment?: {
      is_healthy: {
        probability: number
        binary: boolean
      }
      disease?: {
        name: string
        probability: number
        description: string
      }
    }
  }
  status: {
    code: number
    message: string
  }
}

export interface MockPlantData {
  [key: string]: {
    plantName: string
    scientificName: string
    confidence: number
    isHealthy: boolean
    diseaseInfo?: string
    careTips: string[]
  }
} 