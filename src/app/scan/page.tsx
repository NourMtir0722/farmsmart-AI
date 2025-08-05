'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { PlantScanResult } from '@/types/plant-scan'

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PlantScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError(null)
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
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/plant-scan', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to scan plant')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (preview) {
      URL.revokeObjectURL(preview)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plant Scanner</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Upload a photo to identify plants and detect diseases</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Image</h2>
            
            {!preview ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer ${
                  isDragActive
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  or click to select a file
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Supports: JPEG, PNG, WebP
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <button
                  onClick={handleScan}
                  disabled={isLoading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Scan Plant</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 dark:text-red-400 font-medium">Error</span>
              </div>
              <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Scan Results</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`h-5 w-5 ${result.isHealthy ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{result.plantName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">{result.scientificName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(result.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Health Status</p>
                    <p className={`text-lg font-semibold ${result.isHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {result.isHealthy ? 'Healthy' : 'Diseased'}
                    </p>
                  </div>
                </div>

                {result.diseaseInfo && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Disease Information</h4>
                    <p className="text-red-700 dark:text-red-300 text-sm">{result.diseaseInfo}</p>
                  </div>
                )}

                {result.careTips && result.careTips.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Care Tips</h4>
                    <ul className="space-y-1">
                      {result.careTips.map((tip, index) => (
                        <li key={index} className="text-green-700 dark:text-green-300 text-sm flex items-start space-x-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 