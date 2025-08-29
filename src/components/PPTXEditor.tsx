'use client'

import { useState } from 'react'
import { PPTXApiService } from '@/services/pptxApi'
import { PPTXDocument } from '@/types/pptx'
import { useEditorStore } from '@/store/editorStore'
import { UploadArea } from './UploadArea'
import { Toolbar } from './Toolbar'
import { ThumbnailRail } from './ThumbnailRail'
import { SlideCanvas } from './SlideCanvas'
import { toast } from 'react-hot-toast'

export function PPTXEditor() {
  const [isLoading, setIsLoading] = useState(false)
  const { document, setDocument } = useEditorStore()

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.pptx')) {
      toast.error('Please upload a .pptx file')
      return   
    }

    // Check file size before uploading
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 4) {
      toast.error(`File too large: ${fileSizeMB.toFixed(1)}MB. Maximum size is 4MB.`)
      return
    }

    setIsLoading(true)
    try {
      const parsedDocument = await PPTXApiService.parsePPTX(file)
      setDocument(parsedDocument)
      toast.success('PPTX file parsed successfully!')
    } catch (error) {
      console.error('Error parsing file:', error)
      
      // Extract detailed error message from API response
      let errorMessage = 'Error parsing PPTX file. Please try again.'
      
      if (error instanceof Error) {
        // Try to parse the error message for more details
        if (error.message.includes('Failed to parse PPTX')) {
          errorMessage = error.message
        } else if (error.message.includes('File too large')) {
          errorMessage = error.message
        } else if (error.message.includes('413')) {
          errorMessage = 'File too large for processing. Maximum size is 4MB.'
        } else if (error.message.includes('404')) {
          errorMessage = 'Service temporarily unavailable. Please try again.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center w-full max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            PPTX Slide Editor
          </h1>
          <UploadArea onFileUpload={handleFileUpload} isLoading={isLoading} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-100">
      <Toolbar />
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Thumbnail Rail - Full width on mobile, sidebar on desktop */}
        <div className="order-2 lg:order-1">
          <ThumbnailRail />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 order-1 lg:order-2">
          <SlideCanvas />
        </div>
      </div>
    </div>
  )
}

