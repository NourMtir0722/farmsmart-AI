import { NextRequest, NextResponse } from 'next/server'
import { PlantScanResult, PlantIdResponse, MockPlantData } from '@/types/plant-scan'

// Mock data for development
const mockPlantData: MockPlantData = {
  'tomato': {
    plantName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    confidence: 95,
    isHealthy: true,
    careTips: [
      'Water regularly, keeping soil consistently moist',
      'Provide full sun exposure (6-8 hours daily)',
      'Support plants with cages or stakes as they grow',
      'Fertilize with balanced nutrients every 2-3 weeks'
    ]
  },
  'tomato_diseased': {
    plantName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    confidence: 92,
    isHealthy: false,
    diseaseInfo: 'Early blight detected. This fungal disease causes brown spots on leaves and can affect fruit production.',
    careTips: [
      'Remove affected leaves immediately',
      'Improve air circulation around plants',
      'Avoid overhead watering',
      'Apply fungicide if necessary'
    ]
  },
  'basil': {
    plantName: 'Basil',
    scientificName: 'Ocimum basilicum',
    confidence: 88,
    isHealthy: true,
    careTips: [
      'Water when soil feels dry to the touch',
      'Pinch off flower buds to encourage leaf growth',
      'Harvest leaves regularly to promote bushiness',
      'Plant in well-draining soil with good sunlight'
    ]
  },
  'cucumber': {
    plantName: 'Cucumber',
    scientificName: 'Cucumis sativus',
    confidence: 91,
    isHealthy: true,
    careTips: [
      'Provide consistent moisture, especially during fruiting',
      'Train vines on trellises for better air circulation',
      'Harvest regularly to encourage more fruit production',
      'Protect from extreme heat with shade cloth if needed'
    ]
  }
}

// Helper function to get mock response based on image content
function getMockResponse(imageBuffer: Buffer): PlantScanResult {
  // Simple hash-based selection for demo purposes
  const hash = imageBuffer.reduce((acc, byte) => acc + byte, 0)
  const plants = Object.keys(mockPlantData)
  const selectedPlant = plants[hash % plants.length]
  
  if (!selectedPlant) {
    throw new Error('No plant selected')
  }
  
  const plantData = mockPlantData[selectedPlant]
  
  if (!plantData) {
    throw new Error('No plant data found for selected plant')
  }
  
  return {
    ...plantData
  }
}

// Helper function to call Plant.id API
async function callPlantIdAPI(imageBuffer: Buffer): Promise<PlantIdResponse> {
  const apiKey = process.env.PLANT_ID_API_KEY
  
  if (!apiKey) {
    throw new Error('Plant.id API key not configured')
  }

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64')
  
  const requestBody = {
    images: [base64Image],
    health: 'all',
    similar_images: true
  }

  const response = await fetch('https://plant.id/api/v3/identification', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Plant.id API error:', response.status, errorText)
    throw new Error(`Plant.id API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// Helper function to transform Plant.id response to our format
function transformPlantIdResponse(response: PlantIdResponse): PlantScanResult {
  const result = response.result
  const classification = result.classification
  const suggestions = classification.suggestions
  
  if (!suggestions || suggestions.length === 0) {
    throw new Error('No plant identification results')
  }

  const bestMatch = suggestions[0]
  
  if (!bestMatch) {
    throw new Error('No plant match found')
  }
  
  const healthAssessment = result.health_assessment
  
  // Determine health status
  let isHealthy = true
  let diseaseInfo: string | undefined
  
  if (healthAssessment && healthAssessment.is_healthy) {
    isHealthy = healthAssessment.is_healthy.binary
    if (!isHealthy && healthAssessment.disease) {
      diseaseInfo = healthAssessment.disease.description
    }
  }

  // Get scientific name if available
  const scientificName = bestMatch.similar_images?.[0]?.id || bestMatch.name

  // Generate care tips based on plant type
  const careTips = generateCareTips(bestMatch.name, isHealthy)

  const scanResult: PlantScanResult = {
    plantName: bestMatch.name,
    scientificName,
    confidence: Math.round(bestMatch.probability * 100),
    isHealthy,
    careTips
  }
  
  if (diseaseInfo) {
    scanResult.diseaseInfo = diseaseInfo
  }
  
  return scanResult
}

// Helper function to generate care tips based on plant type
function generateCareTips(plantName: string, isHealthy: boolean): string[] {
  const baseTips = [
    'Water according to plant needs',
    'Ensure adequate sunlight',
    'Monitor for pests and diseases',
    'Fertilize as needed'
  ]

  if (!isHealthy) {
    return [
      'Remove affected leaves immediately',
      'Improve air circulation around plants',
      'Avoid overhead watering',
      'Apply appropriate treatment for detected issues'
    ]
  }

  // Add specific tips based on common plant types
  const plantNameLower = plantName.toLowerCase()
  
  if (plantNameLower.includes('tomato')) {
    return [
      'Water regularly, keeping soil consistently moist',
      'Provide full sun exposure (6-8 hours daily)',
      'Support plants with cages or stakes as they grow',
      'Fertilize with balanced nutrients every 2-3 weeks'
    ]
  }
  
  if (plantNameLower.includes('basil')) {
    return [
      'Water when soil feels dry to the touch',
      'Pinch off flower buds to encourage leaf growth',
      'Harvest leaves regularly to promote bushiness',
      'Plant in well-draining soil with good sunlight'
    ]
  }
  
  if (plantNameLower.includes('cucumber')) {
    return [
      'Provide consistent moisture, especially during fruiting',
      'Train vines on trellises for better air circulation',
      'Harvest regularly to encourage more fruit production',
      'Protect from extreme heat with shade cloth if needed'
    ]
  }

  return baseTips
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
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

    let result: PlantScanResult

    // Use real Plant.id API if key is available, otherwise fallback to mock
    if (process.env.PLANT_ID_API_KEY) {
      try {
        console.log('Using Plant.id API for plant scan')
        const plantIdResponse = await callPlantIdAPI(imageBuffer)
        result = transformPlantIdResponse(plantIdResponse)
      } catch (apiError) {
        console.error('Plant.id API failed, falling back to mock data:', apiError)
        result = getMockResponse(imageBuffer)
      }
    } else {
      // Use mock response if no API key
      console.log('No API key found, using mock response for plant scan')
      result = getMockResponse(imageBuffer)
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Plant scan error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process plant scan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 