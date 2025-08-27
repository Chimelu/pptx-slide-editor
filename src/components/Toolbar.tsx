'use client'

import { Download, Trash2, Undo2, Redo2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { PPTXExporter } from '@/utils/pptxExporter'
import { toast } from 'react-hot-toast'

export function Toolbar() {
  const { document, selectedObjects, deleteSelectedObjects } = useEditorStore()

  const handleExportPPTX = async () => {
    if (!document) {
      toast.error('No document to export')
      return
    }
    
    try {
      const exporter = new PPTXExporter()
      const pptxBlob = await exporter.exportToPPTX(document)
      
      // Create download link
      const url = URL.createObjectURL(pptxBlob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${document.name || 'presentation'}.pptx`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Presentation exported as PPTX!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export PPTX. Please try again.')
    }
  }

  const handleDelete = () => {
    if (selectedObjects.length === 0) {
      toast.error('No objects selected to delete')
      return
    }
    
    try {
      deleteSelectedObjects()
      toast.success(`Deleted ${selectedObjects.length} object${selectedObjects.length > 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete objects')
    }
  }

  const handleUndo = () => {
    toast('Undo feature coming soon! 🚀', {
      icon: '⏪',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    })
  }

  const handleRedo = () => {
    toast('Redo feature coming soon! 🚀', {
      icon: '⏩',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    })
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {document?.name || 'PPTX Editor'}
        </h1>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Edit Controls */}
        <div className="flex items-center space-x-2 border-r border-gray-300 pr-3">
          <button
            onClick={handleUndo}
            className="inline-flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Undo (Coming Soon)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRedo}
            className="inline-flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Redo (Coming Soon)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDelete}
            disabled={selectedObjects.length === 0}
            className={`inline-flex items-center p-2 rounded-md transition-colors ${
              selectedObjects.length > 0
                ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={selectedObjects.length > 0 ? `Delete ${selectedObjects.length} selected object${selectedObjects.length > 1 ? 's' : ''}` : 'No objects selected'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportPPTX}
          className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export PPTX
        </button>
      </div>
    </div>
  )
}

