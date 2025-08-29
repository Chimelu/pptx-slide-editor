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
    <div className="w-full max-w-2xl">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
          ${isDragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          ) : (
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
          )}
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isLoading ? 'Processing...' : 'Upload PowerPoint Presentation'}
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop a .pptx file here, or click to browse
          </p>
          
          <div className="flex items-center text-xs text-gray-400 mb-4">
            <FileText className="h-4 w-4 mr-1" />
            Supports .pptx files only
          </div>

          {/* File size limit info */}
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded">
            Maximum file size: <strong>4MB</strong>
          </div>
        </div>
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
  )
}

