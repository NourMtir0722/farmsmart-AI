'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface MeasurementResult {
  height: number
  width: number
  area: number
  unit: string
  confidence: number
  referenceObject: string
}

interface ReferenceObject {
  name: string
  size: number
  unit: string
  description: string
}

const referenceObjects: ReferenceObject[] = [
  { name: 'Coin', size: 2.4, unit: 'cm', description: 'Standard coin (2.4cm diameter)' },
  { name: 'Phone', size: 15, unit: 'cm', description: 'Average smartphone length' },
  { name: 'Hand', size: 18, unit: 'cm', description: 'Average adult hand length' },
  { name: 'Credit Card', size: 8.5, unit: 'cm', description: 'Standard credit card length' },
  { name: 'Ruler', size: 30, unit: 'cm', description: 'Standard ruler length' }
]

export default function MeasurePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedReference, setSelectedReference] = useState<string>('Coin')
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null)
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
      formData.append('referenceObject', selectedReference)

      const response = await fetch('/api/plant-measure', {
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
              <h1 className="text-3xl font-bold text-gray-900">Plant Size Measurement</h1>
              <p className="text-gray-600 mt-2">Measure your plants accurately using computer vision</p>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-900 mb-2">📏 Measurement Instructions</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Place a reference object next to your plant</li>
                    <li>• Ensure good lighting and clear focus</li>
                    <li>• Keep the camera parallel to the plant</li>
                    <li>• Include the entire plant in the frame</li>
                  </ul>
                </div>
              </div>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="text-4xl">📏</div>
                  {isDragActive ? (
                    <p className="text-blue-600 font-medium">Drop the image here...</p>
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

              {/* Reference Object Selection */}
              {selectedFile && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Object
                  </label>
                  <select
                    value={selectedReference}
                    onChange={(e) => setSelectedReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    {referenceObjects.map((obj) => (
                      <option key={obj.name} value={obj.name}>
                        {obj.name} ({obj.size}{obj.unit} - {obj.description})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedFile && (
                <button
                  onClick={handleMeasure}
                  disabled={isMeasuring}
                  className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMeasuring ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Measuring...</span>
                    </div>
                  ) : (
                    'Measure Plant'
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
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Measurement Results</h2>
                
                <div className="space-y-4">
                  {/* Reference Object */}
                  <div>
                    <h3 className="font-medium text-gray-900">Reference Object</h3>
                    <p className="text-sm text-gray-600">{measurementResult.referenceObject}</p>
                  </div>

                  {/* Measurements */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">Height</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {measurementResult.height.toFixed(1)} {measurementResult.unit}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">Width</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {measurementResult.width.toFixed(1)} {measurementResult.unit}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">Area</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {measurementResult.area.toFixed(1)} {measurementResult.unit}²
                      </p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <h3 className="font-medium text-gray-900">Confidence</h3>
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

                  {/* Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">💡 Tips for Better Accuracy</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ensure the reference object is clearly visible</li>
                      <li>• Keep the camera at a right angle to the plant</li>
                      <li>• Use good lighting to avoid shadows</li>
                      <li>• Place reference object close to the plant</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isMeasuring && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyzing Image</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    <span className="text-gray-700">Processing image...</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Our AI is analyzing your plant image to detect the reference object and calculate measurements.
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