'use client'

import { useEditorStore } from '@/store/editorStore'
import { Download, Trash2, Undo2, Redo2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PPTXApiService } from '@/services/pptxApi'

export function Toolbar() {
  const { document, deleteSelectedObjects, canUndo, canRedo } = useEditorStore()

  const handleExportPPTX = async () => {
    if (!document) {
      toast.error('No presentation to export')
      return
    }

    try {
      toast.loading('Exporting PPTX...')
      const blob = await PPTXApiService.exportPPTX(document)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${document.name || 'presentation'}.pptx`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('PPTX exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export PPTX')
    }
  }

  const handleDelete = () => {
    deleteSelectedObjects()
    toast.success('Selected objects deleted')
  }

  const handleUndo = () => {
    toast('Undo feature coming soon!', { icon: '🔄' })
  }

  const handleRedo = () => {
    toast('Redo feature coming soon!', { icon: '🔄' })
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-semibold text-gray-900">
          {document?.name || 'PPTX Editor'}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo2 size={20} />
        </button>
        
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo2 size={20} />
        </button>
        
        <button
          onClick={handleDelete}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
          title="Delete Selected"
        >
          <Trash2 size={20} />
        </button>
        
        <button
          onClick={handleExportPPTX}
          className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <Download size={16} className="mr-2" />
          Export
        </button>
      </div>
    </div>
  )
}

