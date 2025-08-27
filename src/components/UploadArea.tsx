'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText } from 'lucide-react'

interface UploadAreaProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export function UploadArea({ onFileUpload, isLoading }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
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
      onFileUpload(files[0])
    }
  }, [onFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files[0])
    }
  }, [onFileUpload])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
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
        
        <div className="flex items-center text-xs text-gray-400">
          <FileText className="h-4 w-4 mr-1" />
          Supports .pptx files only
        </div>
      </div>
    </div>
  )
}

