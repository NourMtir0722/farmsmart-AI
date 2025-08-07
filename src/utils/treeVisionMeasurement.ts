import * as tf from '@tensorflow/tfjs'
import * as depthEstimation from '@tensorflow-models/depth-estimation'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

// Types for measurement calculations
export interface TreeMeasurement {
  height: number // in cm
  distance: number // in cm
  confidence: number // 0-100
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  depthMap?: tf.Tensor3D
  referenceObject?: string | undefined
}

export interface CameraConfig {
  fov: number // field of view in degrees
  imageWidth: number
  imageHeight: number
  focalLength?: number // in pixels
}

export interface DepthEstimationResult {
  depthMap: tf.Tensor3D
  minDepth: number
  maxDepth: number
  averageDepth: number
}

export interface TreeDetectionResult {
  treeBoundingBox: [number, number, number, number] // [x, y, width, height]
  confidence: number
  treeType?: string
  referenceObjects: Array<{
    class: string
    boundingBox: [number, number, number, number]
    confidence: number
    knownHeight: number // in cm
  }>
}

// Constants for known object heights (in cm)
export const KNOWN_OBJECT_HEIGHTS = {
  'person': 170,
  'car': 150,
  'chair': 90,
  'dining table': 75,
  'bench': 45,
  'bicycle': 175,
  'motorcycle': 200,
  'door': 200,
  'building': 300,
} as const

// Default camera configuration
export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fov: 60, // typical smartphone camera FOV
  imageWidth: 1280,
  imageHeight: 720,
}

export class TreeVisionMeasurement {
  private depthModel: depthEstimation.DepthEstimator | null = null
  private objectModel: cocoSsd.ObjectDetection | null = null
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  /**
   * Initialize TensorFlow.js and load required models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._initializeModels()
    await this.initializationPromise
  }

  private async _initializeModels(): Promise<void> {
    try {
      console.log('🚀 Initializing TreeVisionMeasurement...')

      // Initialize TensorFlow.js
      await tf.ready()
      console.log('✅ TensorFlow.js ready, backend:', tf.getBackend())

      // Note: Depth estimation model loading is simplified for now
      // Future enhancement: Load proper depth estimation model
      console.log('📦 Depth estimation using simplified heuristics (future: load MiDaS model)')
      this.depthModel = null // Placeholder for future depth model
      console.log('✅ Depth estimation ready (simplified mode)')

      // Load object detection model (COCO-SSD)
      console.log('📦 Loading object detection model...')
      this.objectModel = await cocoSsd.load()
      console.log('✅ Object detection model loaded')

      this.isInitialized = true
      console.log('🎉 TreeVisionMeasurement initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize TreeVisionMeasurement:', error)
      throw new Error(`Model initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Estimate depth from camera frame (simplified approach)
   */
  async estimateDepth(imageTensor: tf.Tensor3D): Promise<DepthEstimationResult> {
    try {
      console.log('🔍 Estimating depth from image...')
      
      // For now, use a simplified depth estimation based on image analysis
      // In a real implementation, you'd use the depth model properly
      const imageData = imageTensor.dataSync()
      const [height, width] = imageTensor.shape
      
      // Create a mock depth map based on image brightness
      // Brighter areas are assumed to be closer
      const depthData = new Float32Array(height * width)
      for (let i = 0; i < height * width; i++) {
        const pixelIndex = i * 3 // RGB channels
        if (pixelIndex + 2 < imageData.length) {
          const r = imageData[pixelIndex] || 0
          const g = imageData[pixelIndex + 1] || 0
          const b = imageData[pixelIndex + 2] || 0
          const brightness = (r + g + b) / 3 / 255 // Normalize to 0-1
          depthData[i] = 1 - brightness // Invert: darker = closer
        } else {
          depthData[i] = 0.5 // fallback depth value
        }
      }
      
      const depthTensor = tf.tensor3d(depthData, [height, width, 1])
      const minDepth = Math.min(...depthData)
      const maxDepth = Math.max(...depthData)
      const averageDepth = depthData.reduce((sum, val) => sum + val, 0) / depthData.length

      console.log(`📊 Depth stats: min=${minDepth.toFixed(3)}, max=${maxDepth.toFixed(3)}, avg=${averageDepth.toFixed(3)}`)

      return {
        depthMap: depthTensor,
        minDepth,
        maxDepth,
        averageDepth
      }
    } catch (error) {
      console.error('❌ Depth estimation failed:', error)
      throw new Error(`Depth estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Detect trees and reference objects in image
   */
  async detectTreesAndObjects(imageTensor: tf.Tensor3D): Promise<TreeDetectionResult> {
    if (!this.objectModel) {
      throw new Error('Object detection model not initialized')
    }

    try {
      console.log('🌳 Detecting trees and objects...')
      
      // Convert tensor to HTMLImageElement for COCO-SSD
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Set canvas size to match tensor
      const [height, width] = imageTensor.shape
      canvas.width = width
      canvas.height = height

      // Draw tensor to canvas
      await tf.browser.toPixels(imageTensor, canvas)
      
      // Detect objects
      const predictions = await this.objectModel.detect(canvas)
      
      // Filter and categorize detections
      const treeDetections = predictions.filter(pred => 
        pred.class.includes('plant') || 
        pred.class.includes('tree') ||
        pred.class.includes('potted plant') ||
        pred.class.includes('flower')
      )

      const referenceDetections = predictions.filter(pred => 
        Object.keys(KNOWN_OBJECT_HEIGHTS).includes(pred.class) && 
        pred.score > 0.5
      ).map(pred => ({
        class: pred.class,
        boundingBox: pred.bbox,
        confidence: pred.score,
        knownHeight: KNOWN_OBJECT_HEIGHTS[pred.class as keyof typeof KNOWN_OBJECT_HEIGHTS]
      }))

      // Find the most confident tree detection
      const bestTreeDetection = treeDetections.length > 0 ? treeDetections.reduce((best, current) => 
        current.score > best.score ? current : best
      , treeDetections[0]!) : null

      if (!bestTreeDetection) {
        throw new Error('No trees detected in image')
      }

      console.log(`🌳 Found ${treeDetections.length} trees, ${referenceDetections.length} reference objects`)

      return {
        treeBoundingBox: bestTreeDetection.bbox,
        confidence: bestTreeDetection.score,
        treeType: bestTreeDetection.class,
        referenceObjects: referenceDetections
      }
    } catch (error) {
      console.error('❌ Tree detection failed:', error)
      throw new Error(`Tree detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate tree height using depth estimation and camera geometry
   * Formula: real_height = (pixel_height / image_height) * 2 * distance * tan(FOV/2)
   */
  calculateTreeHeight(
    treeBbox: [number, number, number, number],
    depthResult: DepthEstimationResult,
    cameraConfig: CameraConfig = DEFAULT_CAMERA_CONFIG
  ): number {
    try {
      const [x, y, width, height] = treeBbox
      const pixelHeight = height
      const imageHeight = cameraConfig.imageHeight
      const fovRadians = (cameraConfig.fov * Math.PI) / 180

      // Get depth at the center of the tree bounding box
      const centerX = Math.floor(x + width / 2)
      const centerY = Math.floor(y + height / 2)
      
      // Extract depth value at center point
      const depthData = depthResult.depthMap.dataSync()
      const depthWidth = depthResult.depthMap.shape[1]
      const depthIndex = centerY * depthWidth + centerX
      const normalizedDepth = depthData[depthIndex] || 0.5 // fallback if out of bounds

      // Convert normalized depth to real distance (in cm)
      // This is a simplified conversion - in practice you'd need calibration
      const distance = 50 + (normalizedDepth * 950) // 50cm to 1000cm range

      // Calculate real-world height using the formula
      const realHeight = (pixelHeight / imageHeight) * 2 * distance * Math.tan(fovRadians / 2)

      console.log(`📏 Height calculation:`)
      console.log(`  Pixel height: ${pixelHeight}px`)
      console.log(`  Image height: ${imageHeight}px`)
      console.log(`  Distance: ${distance.toFixed(1)}cm`)
      console.log(`  FOV: ${cameraConfig.fov}°`)
      console.log(`  Real height: ${realHeight.toFixed(1)}cm`)

      return realHeight
    } catch (error) {
      console.error('❌ Height calculation failed:', error)
      throw new Error(`Height calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate tree height using reference object scaling (alternative method)
   */
  calculateTreeHeightWithReference(
    treeBbox: [number, number, number, number],
    referenceObject: {
      boundingBox: [number, number, number, number]
      knownHeight: number
    }
  ): number {
    try {
      const [, , , treeHeight] = treeBbox
      const [, , , refHeight] = referenceObject.boundingBox
      const refKnownHeight = referenceObject.knownHeight

      // Calculate pixels per cm ratio using reference object
      const pixelsPerCm = refHeight / refKnownHeight
      
      // Calculate tree height using the same ratio
      const treeHeightCm = treeHeight / pixelsPerCm

      console.log(`📏 Reference scaling calculation:`)
      console.log(`  Reference height: ${refHeight}px = ${refKnownHeight}cm`)
      console.log(`  Pixels per cm: ${pixelsPerCm.toFixed(3)}`)
      console.log(`  Tree height: ${treeHeight}px = ${treeHeightCm.toFixed(1)}cm`)

      return treeHeightCm
    } catch (error) {
      console.error('❌ Reference height calculation failed:', error)
      throw new Error(`Reference height calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get depth at specific point in image
   */
  getDepthAtPoint(
    depthMap: tf.Tensor3D,
    x: number,
    y: number
  ): number {
    try {
      const depthData = depthMap.dataSync()
      const width = depthMap.shape[1]
      const index = Math.floor(y) * width + Math.floor(x)
      return depthData[index] || 0.5 // fallback if out of bounds
    } catch (error) {
      console.error('❌ Failed to get depth at point:', error)
      return 0.5 // fallback depth value
    }
  }

  /**
   * Convert normalized depth to real distance
   */
  convertDepthToDistance(normalizedDepth: number, minDistance: number = 50, maxDistance: number = 1000): number {
    // Convert normalized depth (0-1) to real distance (cm)
    return minDistance + (normalizedDepth * (maxDistance - minDistance))
  }

  /**
   * Calculate distance using object size heuristic
   */
  calculateDistanceFromSize(
    objectHeight: number,
    imageHeight: number,
    knownHeight: number
  ): number {
    // Simple heuristic: larger objects are closer
    const objectSizeRatio = objectHeight / imageHeight
    
    // Inverse relationship: distance = knownHeight / (actualRatio * maxDistance)
    const estimatedDistance = knownHeight / (objectSizeRatio * 10)
    
    return Math.max(50, Math.min(1000, estimatedDistance))
  }

  /**
   * Perform complete tree measurement
   */
  async measureTree(
    imageTensor: tf.Tensor3D,
    cameraConfig: CameraConfig = DEFAULT_CAMERA_CONFIG
  ): Promise<TreeMeasurement> {
    try {
      console.log('🌳 Starting complete tree measurement...')

      // Ensure models are initialized
      await this.initialize()

      // Step 1: Estimate depth
      const depthResult = await this.estimateDepth(imageTensor)

      // Step 2: Detect trees and reference objects
      const detectionResult = await this.detectTreesAndObjects(imageTensor)

      // Step 3: Calculate tree height using depth estimation
      const heightFromDepth = this.calculateTreeHeight(
        detectionResult.treeBoundingBox,
        depthResult,
        cameraConfig
      )

      // Step 4: If reference object available, calculate using reference scaling
      let finalHeight = heightFromDepth
      let referenceObject: string | undefined

      if (detectionResult.referenceObjects.length > 0) {
        const bestReference = detectionResult.referenceObjects.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        )

        const heightFromReference = this.calculateTreeHeightWithReference(
          detectionResult.treeBoundingBox,
          bestReference
        )

        // Use reference scaling if it's more reliable (higher confidence)
        if (bestReference.confidence > detectionResult.confidence) {
          finalHeight = heightFromReference
          referenceObject = bestReference.class
          console.log(`📏 Using reference scaling (${bestReference.confidence.toFixed(2)} > ${detectionResult.confidence.toFixed(2)})`)
        } else {
          console.log(`📏 Using depth estimation (${detectionResult.confidence.toFixed(2)} > ${bestReference.confidence.toFixed(2)})`)
        }
      }

      // Step 5: Calculate distance
      const centerX = Math.floor(detectionResult.treeBoundingBox[0] + detectionResult.treeBoundingBox[2] / 2)
      const centerY = Math.floor(detectionResult.treeBoundingBox[1] + detectionResult.treeBoundingBox[3] / 2)
      const normalizedDepth = this.getDepthAtPoint(depthResult.depthMap, centerX, centerY)
      const distance = this.convertDepthToDistance(normalizedDepth)

      // Step 6: Calculate overall confidence
      const confidence = Math.round(detectionResult.confidence * 100)

      const measurement: TreeMeasurement = {
        height: Math.round(finalHeight * 10) / 10, // Round to 1 decimal
        distance: Math.round(distance),
        confidence,
        boundingBox: {
          x: detectionResult.treeBoundingBox[0],
          y: detectionResult.treeBoundingBox[1],
          width: detectionResult.treeBoundingBox[2],
          height: detectionResult.treeBoundingBox[3]
        },
        depthMap: depthResult.depthMap,
        referenceObject
      }

      console.log(`✅ Tree measurement complete:`)
      console.log(`  Height: ${measurement.height}cm`)
      console.log(`  Distance: ${measurement.distance}cm`)
      console.log(`  Confidence: ${measurement.confidence}%`)
      console.log(`  Reference: ${referenceObject || 'None'}`)

      return measurement
    } catch (error) {
      console.error('❌ Tree measurement failed:', error)
      throw new Error(`Tree measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.depthModel) {
      // Note: TensorFlow.js models don't have explicit dispose methods
      // Memory is managed by the garbage collector
      this.depthModel = null
    }
    if (this.objectModel) {
      this.objectModel = null
    }
    this.isInitialized = false
    this.initializationPromise = null
    console.log('🧹 TreeVisionMeasurement resources disposed')
  }

  /**
   * Check if models are initialized
   */
  get isReady(): boolean {
    return this.isInitialized && this.depthModel !== null && this.objectModel !== null
  }
}

// Export singleton instance
export const treeVisionMeasurement = new TreeVisionMeasurement()

// Export utility functions for standalone use
export {
  TreeVisionMeasurement as TreeVisionMeasurementClass
}
