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

    setIsLoading(true)
    try {
      const parsedDocument = await PPTXApiService.parsePPTX(file)
      setDocument(parsedDocument)
      toast.success('PPTX file parsed successfully!')
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error('Error parsing PPTX file. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            PPTX Slide Editor
          </h1>
          <UploadArea onFileUpload={handleFileUpload} isLoading={isLoading} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Toolbar />
      <div className="flex-1 flex">
        <ThumbnailRail />
        <div className="flex-1 flex items-center justify-center p-4">
          <SlideCanvas />
        </div>
      </div>
    </div>
  )
}

