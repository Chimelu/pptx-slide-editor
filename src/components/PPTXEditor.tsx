'use client'

import { useState } from 'react'
import { PPTXParser } from '@/utils/pptxParser'
import { PPTXDocument } from '@/types/pptx'
import { useEditorStore } from '@/store/editorStore'
import { UploadArea } from './UploadArea'
import { Toolbar } from './Toolbar'
import { ThumbnailRail } from './ThumbnailRail'
import { SlideCanvas } from './SlideCanvas'

export function PPTXEditor() {
  const [isLoading, setIsLoading] = useState(false)
  const { document, setDocument } = useEditorStore()

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.pptx')) {
      alert('Please upload a .pptx file')
      return
    }

    setIsLoading(true)
    try {
      const parser = new PPTXParser()
      const parsedDocument = await parser.parseFile(file)
      setDocument(parsedDocument)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Error parsing PPTX file. Please try again.')
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

