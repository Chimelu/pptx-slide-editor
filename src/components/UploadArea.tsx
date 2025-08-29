'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'

interface UploadAreaProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export function UploadArea({ onFileUpload, isLoading }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      onFileUpload(file)
    }
  }, [onFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      onFileUpload(file)
    }
  }, [onFileUpload])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const getFileSizeColor = (size: number) => {
    const sizeMB = size / (1024 * 1024)
    if (sizeMB > 4) return 'text-red-600'
    if (sizeMB > 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getFileSizeWarning = (size: number) => {
    const sizeMB = size / (1024 * 1024)
    if (sizeMB > 4) {
      return (
        <div className="flex items-center text-red-600 text-sm mt-2">
          <AlertCircle className="h-4 w-4 mr-1" />
          File too large! Maximum size is 4MB
        </div>
      )
    }
    if (sizeMB > 2) {
      return (
        <div className="flex items-center text-yellow-600 text-sm mt-2">
          <AlertCircle className="h-4 w-4 mr-1" />
          File size is getting close to the 4MB limit
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full">
        <div 
          className="bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300 p-6 sm:p-8 text-center cursor-pointer hover:border-primary-400 hover:shadow-xl transition-all duration-200 hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-4 sm:mb-6">
            <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 sm:w-10 h-8 sm:h-10 text-primary-600" />
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            Upload PowerPoint Presentation
          </h3>
          
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Click anywhere in this area or drag and drop your .pptx file here
          </p>
          
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-primary-600 hover:bg-primary-700 text-white text-base sm:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-300 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              📁 Choose File to Upload
            </button>
            
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">
                or drag and drop your file here
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Supports .pptx files up to 4MB
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        {/* Selected file info */}
        {selectedFile && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Selected File:</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">{selectedFile.name}</span>
              </div>
              <div className={`text-sm font-medium ${getFileSizeColor(selectedFile.size)}`}>
                {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
              </div>
            </div>
            {getFileSizeWarning(selectedFile.size)}
          </div>
        )}
      </div>
    </div>
  )
}

