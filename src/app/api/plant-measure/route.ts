import { NextRequest, NextResponse } from 'next/server'
import { MeasurementResult, MockMeasurementData, ComputerVisionResponse } from '@/types/plant-measure'

// Reference object database with known sizes
const referenceObjects = {
  'Coin': { size: 2.4, unit: 'cm', description: 'Standard coin diameter' },
  'Phone': { size: 15, unit: 'cm', description: 'Average smartphone length' },
  'Hand': { size: 18, unit: 'cm', description: 'Average adult hand length' },
  'Credit Card': { size: 8.5, unit: 'cm', description: 'Standard credit card length' },
  'Ruler': { size: 30, unit: 'cm', description: 'Standard ruler length' }
}

// Mock measurement data for development
const mockMeasurementData: MockMeasurementData = {
  'small_plant': {
    height: 12.5,
    width: 8.2,
    area: 102.5,
    confidence: 85
  },
  'medium_plant': {
    height: 25.8,
    width: 15.3,
    area: 394.7,
    confidence: 92
  },
  'large_plant': {
    height: 45.2,
    width: 28.7,
    area: 1297.2,
    confidence: 88
  },
  'wide_plant': {
    height: 18.4,
    width: 35.6,
    area: 655.0,
    confidence: 90
  }
}

// Helper function to simulate computer vision analysis
function simulateComputerVision(imageBuffer: Buffer, referenceObjectName: string): ComputerVisionResponse {
  // Simple hash-based selection for demo purposes
  const hash = imageBuffer.reduce((acc, byte) => acc + byte, 0)
  const plantTypes = Object.keys(mockMeasurementData)
  const selectedPlant = plantTypes[hash % plantTypes.length]
  
  if (!selectedPlant) {
    throw new Error('No plant type selected')
  }
  
  const plantData = mockMeasurementData[selectedPlant]
  
  if (!plantData) {
    throw new Error('No plant data found for selected type')
  }
  const referenceObject = referenceObjects[referenceObjectName as keyof typeof referenceObjects]
  
  // Simulate reference object detection with some variance
  const detectionVariance = 0.95 + (Math.random() * 0.1) // ±5% variance
  const detectedSize = referenceObject.size * detectionVariance
  
  // Apply variance to plant measurements
  const height = plantData.height * (1 + (Math.random() - 0.5) * 0.1) // ±5% variance
  const width = plantData.width * (1 + (Math.random() - 0.5) * 0.1)
  const area = height * width
  
  return {
    plantDimensions: {
      height,
      width,
      area
    },
    referenceObject: {
      name: referenceObjectName,
      detectedSize,
      confidence: 85 + Math.random() * 10 // 85-95% confidence
    },
    overallConfidence: plantData.confidence
  }
}

// Helper function to call real computer vision API (placeholder for future implementation)
async function callComputerVisionAPI(imageBuffer: Buffer, referenceObjectName: string): Promise<ComputerVisionResponse> {
  // This would integrate with a real computer vision service like:
  // - Google Cloud Vision API
  // - Azure Computer Vision
  // - AWS Rekognition
  // - Custom ML model
  
  // For now, we'll use the simulation
  return simulateComputerVision(imageBuffer, referenceObjectName)
}

// Helper function to transform computer vision response to our format
function transformMeasurementResponse(response: ComputerVisionResponse, referenceObjectName: string): MeasurementResult {
  const referenceObject = referenceObjects[referenceObjectName as keyof typeof referenceObjects]
  
  return {
    height: response.plantDimensions.height,
    width: response.plantDimensions.width,
    area: response.plantDimensions.area,
    unit: referenceObject.unit,
    confidence: response.overallConfidence,
    referenceObject: referenceObjectName
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const referenceObjectName = formData.get('referenceObject') as string

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    if (!referenceObjectName || !referenceObjects[referenceObjectName as keyof typeof referenceObjects]) {
      return NextResponse.json(
        { error: 'Invalid reference object' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please upload an image smaller than 10MB.' },
        { status: 400 }
      )
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Use computer vision API (simulated for now)
    console.log('Using computer vision for plant measurement')
    const computerVisionResponse = await callComputerVisionAPI(imageBuffer, referenceObjectName)
    const result = transformMeasurementResponse(computerVisionResponse, referenceObjectName)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Plant measurement error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to measure plant',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 