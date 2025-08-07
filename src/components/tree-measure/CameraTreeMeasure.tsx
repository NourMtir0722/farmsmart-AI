'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as depthEstimation from '@tensorflow-models/depth-estimation'
import { Camera, Square, Ruler, Eye, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface Detection {
  class: string
  score: number
  bbox: [number, number, number, number] // [x, y, width, height]
}

interface TreeMeasurement {
  height: number
  distance: number
  confidence: number
  referenceObject?: string
}

interface CameraTreeMeasureProps {
  onMeasurement?: (measurement: TreeMeasurement) => void
  onError?: (error: string) => void
}

// Constants for calculations
const CAMERA_FOV = 60 // degrees - typical smartphone camera FOV
const KNOWN_HEIGHTS = {
  'person': 170, // cm
  'car': 150,    // cm (height)
  'chair': 90,   // cm
  'dining table': 75, // cm
  'bench': 45,   // cm
} as const

export default function CameraTreeMeasure({ onMeasurement, onError }: CameraTreeMeasureProps) {
  // State management
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMeasurement, setCurrentMeasurement] = useState<TreeMeasurement | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  // Refs for DOM elements and models
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const objectModelRef = useRef<cocoSsd.ObjectDetection | null>(null)
  const depthModelRef = useRef<depthEstimation.DepthEstimator | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize TensorFlow.js and load models
  const initializeModels = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🚀 Initializing TensorFlow.js...')
      
      // Set TensorFlow backend
      await tf.ready()
      console.log('✅ TensorFlow.js ready, backend:', tf.getBackend())

      // Load object detection model (COCO-SSD)
      console.log('📦 Loading object detection model...')
      const objectModel = await cocoSsd.load()
      objectModelRef.current = objectModel
      console.log('✅ Object detection model loaded')

      // Note: Depth estimation model loading is simplified for now
      // Future enhancement: Load proper depth estimation model
      console.log('📦 Depth estimation using simplified heuristics (future: load MiDaS model)')
      depthModelRef.current = null // Placeholder for future depth model
      console.log('✅ Depth estimation ready (simplified mode)')

      setIsInitialized(true)
      setIsLoading(false)
    } catch (err) {
      const errorMessage = `Failed to initialize models: ${err instanceof Error ? err.message : 'Unknown error'}`
      console.error('❌', errorMessage)
      setError(errorMessage)
      setIsLoading(false)
      onError?.(errorMessage)
    }
  }, [onError])

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      console.log('📹 Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraPermission('granted')
        console.log('✅ Camera stream started')
      }
    } catch (err) {
      const errorMessage = `Camera access denied: ${err instanceof Error ? err.message : 'Unknown error'}`
      console.error('❌', errorMessage)
      setError(errorMessage)
      setCameraPermission('denied')
      onError?.(errorMessage)
    }
  }, [onError])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      console.log('🛑 Camera stream stopped')
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Calculate distance using depth estimation (simplified approach)
  const calculateDepthDistance = useCallback(async (video: HTMLVideoElement, bbox: number[]): Promise<number> => {
    // For now, use a simplified depth estimation based on object size
    // In a real implementation, you'd use the depth model properly
    try {
      // Validate bbox has the expected format [x, y, width, height]
      if (!bbox || bbox.length < 4 || bbox[3] === undefined) {
        console.warn('Invalid bbox format, using fallback distance')
        return 200
      }

      // Use object size as a proxy for distance
      // Larger objects are typically closer, smaller objects are farther
      const objectHeight = bbox[3]
      const videoHeight = video.videoHeight || 720 // fallback height
      
      // Simple heuristic: if object takes up more of the frame, it's closer
      const objectSizeRatio = objectHeight / videoHeight
      
      // Estimate distance based on object size (inverse relationship)
      // This is a rough approximation - real depth estimation would be much more accurate
      const estimatedDistance = Math.max(50, Math.min(1000, 200 / Math.max(0.01, objectSizeRatio)))
      
      console.log(`📏 Distance estimation: object ${objectHeight}px of ${videoHeight}px = ${objectSizeRatio.toFixed(3)} ratio = ${estimatedDistance.toFixed(0)}cm`)
      
      return estimatedDistance
    } catch (err) {
      console.warn('Distance calculation failed, using fallback:', err)
      return 200 // fallback distance in cm
    }
  }, [])

  // Calculate tree height using camera geometry
  const calculateTreeHeight = useCallback((
    treeBbox: number[],
    referenceObject: { bbox: number[], height: number } | undefined,
    distance: number,
    videoHeight: number
  ): number => {
    // Validate tree bbox
    if (!treeBbox || treeBbox.length < 4 || treeBbox[3] === undefined) {
      console.warn('Invalid tree bbox, using fallback height')
      return 200 // fallback height in cm
    }

    // Method 1: Using reference object for scale
    if (referenceObject && referenceObject.bbox && referenceObject.bbox.length >= 4 && referenceObject.bbox[3] !== undefined) {
      const refHeightPixels = referenceObject.bbox[3]
      const treeHeightPixels = treeBbox[3]
      const refHeightReal = referenceObject.height
      
      if (refHeightPixels > 0 && refHeightReal > 0) {
        // Calculate pixels per cm ratio
        const pixelsPerCm = refHeightPixels / refHeightReal
        const treeHeightCm = treeHeightPixels / pixelsPerCm
        
        console.log(`📏 Reference scaling: ${treeHeightPixels}px / ${refHeightPixels}px * ${refHeightReal}cm = ${treeHeightCm.toFixed(1)}cm`)
        return treeHeightCm
      }
    }

    // Method 2: Using camera FOV and distance
    const fovRadians = (CAMERA_FOV * Math.PI) / 180
    const safeVideoHeight = videoHeight || 720 // fallback height
    const realWorldHeight = safeVideoHeight * Math.tan(fovRadians / 2) * 2 * (distance / 100) // convert cm to m
    const pixelsPerMeter = safeVideoHeight / realWorldHeight
    const treeHeightMeters = (treeBbox[3] / pixelsPerMeter)
    const treeHeightCm = treeHeightMeters * 100

    console.log(`📐 FOV calculation: ${distance}cm distance, ${treeHeightCm.toFixed(1)}cm height`)
    return treeHeightCm
  }, [])

  // Process video frame for object detection and measurement
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !objectModelRef.current || isProcessing) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== 4) {
      return
    }

    setIsProcessing(true)

    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Detect objects in current frame
      const predictions = await objectModelRef.current.detect(video)
      
      // Filter for relevant objects
      const relevantDetections: Detection[] = predictions
        .filter(pred => pred.score > 0.5)
        .map(pred => ({
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox
        }))

      setDetections(relevantDetections)

      // Find tree/plant and reference objects
      const treeDetection = relevantDetections.find(det => 
        det.class.includes('plant') || 
        det.class.includes('tree') ||
        det.class.includes('potted plant')
      )

      const referenceDetection = relevantDetections.find(det => 
        Object.keys(KNOWN_HEIGHTS).includes(det.class)
      )

      // Calculate measurement if tree is detected
      if (treeDetection) {
        const distance = await calculateDepthDistance(video, treeDetection.bbox)
        
        const referenceObject = referenceDetection ? {
          bbox: referenceDetection.bbox,
          height: KNOWN_HEIGHTS[referenceDetection.class as keyof typeof KNOWN_HEIGHTS]
        } : undefined

        const height = calculateTreeHeight(
          treeDetection.bbox,
          referenceObject,
          distance,
          canvas.height
        )

        const measurement: TreeMeasurement = {
          height: Math.round(height * 10) / 10, // Round to 1 decimal
          distance: Math.round(distance),
          confidence: Math.round(treeDetection.score * 100),
          ...(referenceDetection?.class && { referenceObject: referenceDetection.class })
        }

        setCurrentMeasurement(measurement)
        onMeasurement?.(measurement)

        // Draw measurement overlay
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.strokeRect(...treeDetection.bbox)
        
        ctx.fillStyle = '#00ff00'
        ctx.font = '16px Arial'
        ctx.fillText(
          `Tree: ${measurement.height}cm (${measurement.confidence}%)`,
          treeDetection.bbox[0],
          treeDetection.bbox[1] - 10
        )
      }

      // Draw all detections
      relevantDetections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox
        
        // Draw bounding box
        ctx.strokeStyle = detection.class.includes('plant') || detection.class.includes('tree') ? '#00ff00' : '#ff6b00'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, width, height)
        
        // Draw label
        ctx.fillStyle = ctx.strokeStyle
        ctx.font = '14px Arial'
        ctx.fillText(
          `${detection.class} (${Math.round(detection.score * 100)}%)`,
          x,
          y - 5
        )
      })

    } catch (err) {
      console.error('Frame processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, calculateDepthDistance, calculateTreeHeight, onMeasurement])

  // Start processing loop
  const startProcessing = useCallback(() => {
    const process = () => {
      processFrame()
      animationFrameRef.current = requestAnimationFrame(process)
    }
    process()
  }, [processFrame])

  // Initialize on mount
  useEffect(() => {
    initializeModels()
    return () => {
      stopCamera()
    }
  }, [initializeModels, stopCamera])

  // Start processing when video is ready
  useEffect(() => {
    const video = videoRef.current
    if (video && isInitialized) {
      const handleLoadedData = () => {
        startProcessing()
      }
      
      video.addEventListener('loadeddata', handleLoadedData)
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData)
      }
    }
    
    // Return empty cleanup function for cases where if condition is false
    return () => {}
  }, [isInitialized, startProcessing])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Camera className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Camera Measurement</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Real-time tree measurement using depth estimation</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading models...</span>
            </div>
          )}
          
          {isInitialized && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Ready</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Error</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200 font-medium">Error</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
        </div>
      )}

      {/* Camera Controls */}
      {!error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={startCamera}
                disabled={isLoading || cameraPermission === 'granted'}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Camera className="h-4 w-4" />
                <span>Start Camera</span>
              </button>

              <button
                onClick={stopCamera}
                disabled={cameraPermission !== 'granted'}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Square className="h-4 w-4" />
                <span>Stop Camera</span>
              </button>
            </div>

            {/* Camera View */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-96 object-contain"
                style={{ display: cameraPermission === 'granted' ? 'block' : 'none' }}
              />
              
              {/* Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ display: cameraPermission === 'granted' ? 'block' : 'none' }}
              />

              {/* Placeholder */}
              {cameraPermission !== 'granted' && (
                <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Camera not active</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Measurement */}
      {currentMeasurement && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Ruler className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">Current Measurement</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Height</span>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {currentMeasurement.height} cm
              </p>
            </div>
            
            <div>
              <span className="text-gray-600 dark:text-gray-400">Distance</span>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {currentMeasurement.distance} cm
              </p>
            </div>
            
            <div>
              <span className="text-gray-600 dark:text-gray-400">Confidence</span>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {currentMeasurement.confidence}%
              </p>
            </div>
            
            {currentMeasurement.referenceObject && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Reference</span>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300 capitalize">
                  {currentMeasurement.referenceObject}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detection Status */}
      {detections.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Eye className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">Objects Detected</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {detections.map((detection, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 text-xs"
              >
                {detection.class} ({Math.round(detection.score * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">How to use:</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Click "Start Camera" to begin</li>
          <li>• Point camera at tree with a reference object (person, car, chair)</li>
          <li>• Keep camera steady for best results</li>
          <li>• Green boxes show detected trees, orange boxes show reference objects</li>
          <li>• Measurements appear automatically when tree is detected</li>
        </ul>
      </div>
    </div>
  )
}
