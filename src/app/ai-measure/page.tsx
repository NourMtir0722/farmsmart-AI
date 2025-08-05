'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface AIMeasurementResult {
  height: number
  width: number
  area: number
  unit: string
  confidence: number
  detectedObjects: DetectedObject[]
  plantDimensions: PlantDimensions
}

interface DetectedObject {
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

interface PlantDimensions {
  height: number
  width: number
  area: number
}

export default function AIMeasurePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [measurementResult, setMeasurementResult] = useState<AIMeasurementResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setMeasurementResult(null)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  const handleMeasure = async () => {
    if (!selectedFile) return

    setIsMeasuring(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/ai-plant-measure', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to measure plant')
      }

      const result = await response.json()
      setMeasurementResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsMeasuring(false)
    }
  }

  const resetMeasurement = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setMeasurementResult(null)
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High'
    if (confidence >= 60) return 'Medium'
    return 'Low'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Plant Measurement</h1>
              <p className="text-gray-600 mt-2">Upload any photo - AI will detect reference objects automatically</p>
            </div>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <span className="mr-2">←</span>
              Back to Dashboard
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Image</h2>
              
              <div className="mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-purple-900 mb-2">🤖 AI-Powered Detection</h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• AI automatically detects reference objects</li>
                    <li>• No need to specify reference objects manually</li>
                    <li>• Works with people, cars, doors, and more</li>
                    <li>• Advanced computer vision analysis</li>
                  </ul>
                </div>
              </div>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-purple-400 bg-purple-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="text-4xl">🤖</div>
                  {isDragActive ? (
                    <p className="text-purple-600 font-medium">Drop the image here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 font-medium">Drag & drop an image here</p>
                      <p className="text-gray-500 text-sm mt-1">or click to select</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="mt-4">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={resetMeasurement}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {selectedFile && (
                <button
                  onClick={handleMeasure}
                  disabled={isMeasuring}
                  className="w-full mt-4 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMeasuring ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>AI Analyzing...</span>
                    </div>
                  ) : (
                    'Analyze with AI'
                  )}
                </button>
              )}
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Plant preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="text-red-700 font-medium">Error</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {measurementResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis Results</h2>
                
                <div className="space-y-6">
                  {/* Detected Objects */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Detected Reference Objects</h3>
                    <div className="space-y-2">
                      {measurementResult.detectedObjects.map((obj, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{obj.name}</span>
                              <span className="text-sm text-gray-600 ml-2">~{obj.estimatedSize.toFixed(1)}cm</span>
                            </div>
                            <span className={`text-sm font-medium ${getConfidenceColor(obj.confidence)}`}>
                              {obj.confidence.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plant Measurements */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Plant Measurements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">Height</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {measurementResult.height.toFixed(1)} {measurementResult.unit}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">Width</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {measurementResult.width.toFixed(1)} {measurementResult.unit}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">Area</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {measurementResult.area.toFixed(1)} {measurementResult.unit}²
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Overall Confidence */}
                  <div>
                    <h3 className="font-medium text-gray-900">Overall Confidence</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            getConfidenceColor(measurementResult.confidence).replace('text-', 'bg-')
                          }`}
                          style={{ width: `${measurementResult.confidence}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getConfidenceColor(measurementResult.confidence)}`}>
                        {getConfidenceText(measurementResult.confidence)} ({measurementResult.confidence}%)
                      </span>
                    </div>
                  </div>

                  {/* AI Tips */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-medium text-purple-900 mb-2">🤖 AI Analysis Tips</h3>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• AI detected {measurementResult.detectedObjects.length} reference object(s)</li>
                      <li>• Multiple objects improve measurement accuracy</li>
                      <li>• Results based on Google Vision API analysis</li>
                      <li>• Confidence indicates measurement reliability</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isMeasuring && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis in Progress</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    <span className="text-gray-700">Processing image with AI...</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Our AI is analyzing your image to detect reference objects and calculate plant measurements using Google Vision API.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 