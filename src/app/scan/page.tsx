'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { PlantScanResult } from '@/types/plant-scan'

export default function ScanPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<PlantScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setScanResult(null)
      
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

  const handleScan = async () => {
    if (!selectedFile) return

    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/plant-scan', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to scan plant')
      }

      const result = await response.json()
      setScanResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsScanning(false)
    }
  }

  const resetScan = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setScanResult(null)
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plant Scanner</h1>
              <p className="text-gray-600 mt-2">Upload a photo to identify plants and detect diseases</p>
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
                  <div className="text-4xl">📸</div>
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
                      onClick={resetScan}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {selectedFile && (
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isScanning ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Scanning...</span>
                    </div>
                  ) : (
                    'Scan Plant'
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

            {scanResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan Results</h2>
                
                <div className="space-y-4">
                  {/* Plant Name */}
                  <div>
                    <h3 className="font-medium text-gray-900">Plant Name</h3>
                    <p className="text-lg text-gray-700">{scanResult.plantName}</p>
                  </div>

                  {/* Scientific Name */}
                  <div>
                    <h3 className="font-medium text-gray-900">Scientific Name</h3>
                    <p className="text-sm text-gray-600 italic">{scanResult.scientificName}</p>
                  </div>

                  {/* Confidence */}
                  <div>
                    <h3 className="font-medium text-gray-900">Confidence</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${scanResult.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{scanResult.confidence}%</span>
                    </div>
                  </div>

                  {/* Health Status */}
                  <div>
                    <h3 className="font-medium text-gray-900">Health Status</h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      scanResult.isHealthy 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="mr-1">
                        {scanResult.isHealthy ? '🌱' : '⚠️'}
                      </span>
                      {scanResult.isHealthy ? 'Healthy' : 'Disease Detected'}
                    </div>
                  </div>

                  {/* Disease Info */}
                  {!scanResult.isHealthy && scanResult.diseaseInfo && (
                    <div>
                      <h3 className="font-medium text-gray-900">Disease Information</h3>
                      <p className="text-sm text-gray-600">{scanResult.diseaseInfo}</p>
                    </div>
                  )}

                  {/* Care Tips */}
                  {scanResult.careTips && (
                    <div>
                      <h3 className="font-medium text-gray-900">Care Tips</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {scanResult.careTips.map((tip, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isScanning && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyzing Image</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    <span className="text-gray-700">Processing image...</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Our AI is analyzing your plant image to identify the species and check for any health issues.
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