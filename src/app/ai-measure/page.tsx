'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Bot, Eye, Target } from 'lucide-react'
import { AIMeasurementResult } from '@/types/ai-plant-measure'

export default function AIMeasurePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AIMeasurementResult | null>(null)
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

  const handleAIMeasure = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/ai-plant-measure', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to analyze image')
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Plant Measurement</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Upload any photo - AI will detect reference objects automatically</p>
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
                    ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
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
                  AI will automatically detect reference objects
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
                  onClick={handleAIMeasure}
                  disabled={isLoading}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={16} />
                      <span>AI Analysis</span>
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
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700 dark:text-red-400 font-medium">Error</span>
              </div>
              <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Analysis Results</h2>
              
              <div className="space-y-6">
                {/* Detected Objects */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    <span>Detected Objects</span>
                  </h3>
                  <div className="space-y-2">
                    {result.detectedObjects.map((obj, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{obj.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Size: {obj.estimatedSize}cm
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {(obj.confidence * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">confidence</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plant Measurements */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Plant Dimensions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">📏</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Height</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(result.height / 100).toFixed(1)}m
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">📏</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Width</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(result.width / 100).toFixed(1)}m
                      </p>
                    </div>
                  </div>
                </div>

                {/* Area and Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">📐</span>
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Area</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {(result.area / 10000).toFixed(1)}m²
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">🎯</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(result.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">AI Insights</h4>
                  <ul className="space-y-1">
                    <li className="text-blue-700 dark:text-blue-300 text-sm flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Automatically detected {result.detectedObjects.length} reference objects</span>
                    </li>
                    <li className="text-blue-700 dark:text-blue-300 text-sm flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Used {result.detectedObjects[0]?.name || 'unknown'} as primary reference</span>
                    </li>
                    <li className="text-blue-700 dark:text-blue-300 text-sm flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Calculated measurements using computer vision algorithms</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 