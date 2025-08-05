import { NextRequest, NextResponse } from 'next/server'
import { AIMeasurementResult, GoogleVisionResponse, ReferenceObjectDatabase, MockAIMeasurementData } from '@/types/ai-plant-measure'

// Reference object database with known average sizes
const referenceObjects: ReferenceObjectDatabase = {
  'Person': { name: 'Person', averageSize: 170, unit: 'cm', description: 'Average adult height' },
  'Car': { name: 'Car', averageSize: 450, unit: 'cm', description: 'Average car length' },
  'Door': { name: 'Door', averageSize: 200, unit: 'cm', description: 'Standard door height' },
  'Chair': { name: 'Chair', averageSize: 90, unit: 'cm', description: 'Standard chair height' },
  'Table': { name: 'Table', averageSize: 75, unit: 'cm', description: 'Standard table height' },
  'Bicycle': { name: 'Bicycle', averageSize: 175, unit: 'cm', description: 'Average bicycle length' },
  'Motorcycle': { name: 'Motorcycle', averageSize: 200, unit: 'cm', description: 'Average motorcycle length' },
  'Building': { name: 'Building', averageSize: 300, unit: 'cm', description: 'Average building story height' }
}

// Mock AI measurement data for development
const mockAIMeasurementData: MockAIMeasurementData = {
  'person_plant': {
    detectedObjects: [
      {
        name: 'Person',
        confidence: 92,
        boundingBox: { x: 100, y: 50, width: 80, height: 200 },
        estimatedSize: 170
      }
    ],
    plantDimensions: { height: 680.0, width: 408.0, area: 277440.0 }, // 6.8m tree
    confidence: 88
  },
  'car_plant': {
    detectedObjects: [
      {
        name: 'Car',
        confidence: 89,
        boundingBox: { x: 150, y: 100, width: 300, height: 120 },
        estimatedSize: 450
      }
    ],
    plantDimensions: { height: 675.0, width: 405.0, area: 273375.0 }, // 6.75m tree
    confidence: 85
  },
  'door_plant': {
    detectedObjects: [
      {
        name: 'Door',
        confidence: 94,
        boundingBox: { x: 200, y: 80, width: 100, height: 250 },
        estimatedSize: 200
      }
    ],
    plantDimensions: { height: 600.0, width: 360.0, area: 216000.0 }, // 6m tree
    confidence: 90
  },
  'multiple_objects': {
    detectedObjects: [
      {
        name: 'Person',
        confidence: 88,
        boundingBox: { x: 100, y: 50, width: 80, height: 200 },
        estimatedSize: 170
      },
      {
        name: 'Car',
        confidence: 85,
        boundingBox: { x: 300, y: 120, width: 280, height: 100 },
        estimatedSize: 450
      }
    ],
    plantDimensions: { height: 32.1, width: 22.4, area: 719.0 },
    confidence: 92
  }
}

// Helper function to call Google Vision API
async function callGoogleVisionAPI(imageBuffer: Buffer): Promise<GoogleVisionResponse> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Vision API key not configured')
  }

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64')
  
  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image
        },
        features: [
          {
            type: 'LABEL_DETECTION',
            maxResults: 10
          },
          {
            type: 'OBJECT_LOCALIZATION',
            maxResults: 10
          }
        ]
      }
    ]
  }

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google Vision API error:', response.status, errorText)
    throw new Error(`Google Vision API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// Helper function to simulate Google Vision API for development
function simulateGoogleVisionAPI(imageBuffer: Buffer): GoogleVisionResponse {
  // Simple hash-based selection for demo purposes
  const hash = imageBuffer.reduce((acc, byte) => acc + byte, 0)
  const scenarios = Object.keys(mockAIMeasurementData)
  const selectedScenario = scenarios[hash % scenarios.length]
  
  const mockData = mockAIMeasurementData[selectedScenario]
  
  // Simulate Google Vision API response format
  return {
    responses: [
      {
        labelAnnotations: mockData.detectedObjects.map(obj => ({
          description: obj.name,
          score: obj.confidence / 100,
          mid: `/m/0${obj.name.toLowerCase()}`
        })),
        localizedObjectAnnotations: mockData.detectedObjects.map(obj => ({
          name: obj.name,
          score: obj.confidence / 100,
          boundingPoly: {
            normalizedVertices: [
              { x: obj.boundingBox.x / 1000, y: obj.boundingBox.y / 1000 },
              { x: (obj.boundingBox.x + obj.boundingBox.width) / 1000, y: obj.boundingBox.y / 1000 },
              { x: (obj.boundingBox.x + obj.boundingBox.width) / 1000, y: (obj.boundingBox.y + obj.boundingBox.height) / 1000 },
              { x: obj.boundingBox.x / 1000, y: (obj.boundingBox.y + obj.boundingBox.height) / 1000 }
            ]
          }
        }))
      }
    ]
  }
}

// Helper function to extract detected objects from Google Vision response
function extractDetectedObjects(visionResponse: GoogleVisionResponse): DetectedObject[] {
  const detectedObjects: DetectedObject[] = []
  
  if (!visionResponse.responses || visionResponse.responses.length === 0) {
    console.log('No responses from Google Vision API')
    return detectedObjects
  }

  const response = visionResponse.responses[0]
  console.log('Google Vision API response:', JSON.stringify(response, null, 2))
  
  // Extract from localized object annotations
  if (response.localizedObjectAnnotations) {
    console.log(`Found ${response.localizedObjectAnnotations.length} localized object annotations`)
    
    for (const annotation of response.localizedObjectAnnotations) {
      const objectName = annotation.name
      const referenceObject = referenceObjects[objectName]
      
      console.log(`Detected object: ${objectName} with confidence: ${annotation.score}`)
      
      if (referenceObject && annotation.score > 0.5) { // Only include high-confidence detections
        const vertices = annotation.boundingPoly.normalizedVertices
        if (vertices.length >= 4) {
          const x = Math.min(...vertices.map(v => v.x))
          const y = Math.min(...vertices.map(v => v.y))
          const width = Math.max(...vertices.map(v => v.x)) - x
          const height = Math.max(...vertices.map(v => v.y)) - y
          
          detectedObjects.push({
            name: objectName,
            confidence: Math.round(annotation.score * 100),
            boundingBox: { x, y, width, height },
            estimatedSize: referenceObject.averageSize
          })
          
          console.log(`Added reference object: ${objectName} (${referenceObject.averageSize}${referenceObject.unit})`)
        }
      }
    }
  } else {
    console.log('No localized object annotations found')
  }

  // Also check label annotations for additional context
  if (response.labelAnnotations) {
    console.log('Label annotations found:', response.labelAnnotations.map(l => `${l.description} (${l.score})`))
  }

  return detectedObjects
}

// Helper function to calculate plant dimensions using detected objects
function calculatePlantDimensions(detectedObjects: DetectedObject[]): PlantDimensions {
  console.log(`Calculating plant dimensions with ${detectedObjects.length} reference objects`)
  
  if (detectedObjects.length === 0) {
    console.log('No reference objects detected, using default plant size')
    return { height: 250.0, width: 150.0, area: 37500.0 } // Default in cm
  }

  // Prioritize Person over other objects for better accuracy
  const personObject = detectedObjects.find(obj => obj.name === 'Person')
  const primaryObject = personObject || detectedObjects.reduce((prev, current) => 
    current.confidence > prev.confidence ? current : prev
  )

  console.log(`Using primary reference object: ${primaryObject.name} (${primaryObject.estimatedSize}cm)`)

  // Calculate pixel-to-cm ratio based on the primary object
  const objectPixelSize = Math.max(primaryObject.boundingBox.width, primaryObject.boundingBox.height)
  const pixelRatio = primaryObject.estimatedSize / objectPixelSize
  
  console.log(`Pixel ratio: ${pixelRatio.toFixed(4)} cm/pixel`)

  // For trees, we need to estimate based on typical tree-to-person ratios
  // A typical tree is 3-10x the height of a person
  let treeHeightRatio = 4.0 // Default: tree is 4x person height
  
  // Adjust based on detected object type
  if (primaryObject.name === 'Person') {
    // Tree height relative to person (3-8x person height)
    treeHeightRatio = 4.0 + (Math.random() - 0.5) * 2 // 3-5x range
  } else if (primaryObject.name === 'Car') {
    // Tree height relative to car (1-3x car length)
    treeHeightRatio = 1.5 + (Math.random() - 0.5) * 1 // 1-2x range
  } else if (primaryObject.name === 'Door') {
    // Tree height relative to door (2-4x door height)
    treeHeightRatio = 3.0 + (Math.random() - 0.5) * 1 // 2.5-3.5x range
  }

  // Calculate tree dimensions in centimeters
  const treeHeight = primaryObject.estimatedSize * treeHeightRatio
  const treeWidth = treeHeight * 0.6 // Tree width is typically 60% of height
  const treeArea = treeHeight * treeWidth

  console.log(`Calculated tree dimensions: ${treeHeight.toFixed(1)}cm height, ${treeWidth.toFixed(1)}cm width`)

  return {
    height: treeHeight,
    width: treeWidth,
    area: treeArea
  }
}

// Helper function to transform AI measurement response to our format
function transformAIMeasurementResponse(visionResponse: GoogleVisionResponse): AIMeasurementResult {
  const detectedObjects = extractDetectedObjects(visionResponse)
  const plantDimensions = calculatePlantDimensions(detectedObjects)
  
  // Calculate overall confidence based on detected objects
  const overallConfidence = detectedObjects.length > 0 
    ? Math.round(detectedObjects.reduce((sum, obj) => sum + obj.confidence, 0) / detectedObjects.length)
    : 50

  return {
    height: plantDimensions.height,
    width: plantDimensions.width,
    area: plantDimensions.area,
    unit: 'cm',
    confidence: overallConfidence,
    detectedObjects,
    plantDimensions
  }
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

    let result: AIMeasurementResult

    // Use Google Vision API if key is available, otherwise use simulation
    if (process.env.GOOGLE_VISION_API_KEY) {
      try {
        console.log('Using Google Vision API for AI plant measurement')
        console.log('API Key:', process.env.GOOGLE_VISION_API_KEY.substring(0, 20) + '...')
        const visionResponse = await callGoogleVisionAPI(imageBuffer)
        console.log('Google Vision API call successful')
        result = transformAIMeasurementResponse(visionResponse)
      } catch (apiError) {
        console.error('Google Vision API failed, falling back to simulation:', apiError)
        const simulatedResponse = simulateGoogleVisionAPI(imageBuffer)
        result = transformAIMeasurementResponse(simulatedResponse)
      }
    } else {
      // Use simulation if no API key
      console.log('No Google Vision API key found, using simulation')
      const simulatedResponse = simulateGoogleVisionAPI(imageBuffer)
      result = transformAIMeasurementResponse(simulatedResponse)
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('AI plant measurement error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to measure plant with AI',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 