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
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`
              px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
              ${canUndo 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`
              px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
              ${canRedo 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Redo
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleExportPPTX}
            className="px-3 sm:px-4 py-1 sm:py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Export PPTX
          </button>
        </div>
      </div>
    </div>
  )
}

