'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Slide } from '@/types/pptx'

export function ThumbnailRail() {
  const { document, currentSlideIndex, setCurrentSlide } = useEditorStore()

  if (!document) return null

  const handleSlideClick = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [setCurrentSlide])

  const handleAddSlide = useCallback(() => {
    // TODO: Implement add slide functionality
    alert('Add slide functionality coming soon!')
  }, [])

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Slides</h3>
        <button
          onClick={handleAddSlide}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"    
        >
          + Add
        </button>
      </div>
      
      <div className="space-y-3">
        {document.slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            slide={slide}
            index={index}
            isActive={index === currentSlideIndex}
            onClick={() => handleSlideClick(index)}
          />
        ))}
      </div>
    </div>
  )
}

interface SlideThumbnailProps {
  slide: Slide
  index: number
  isActive: boolean
  onClick: () => void
}

function SlideThumbnail({ slide, index, isActive, onClick }: SlideThumbnailProps) {
  return (
    <div
      className={`
        relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-md
        ${isActive 
          ? 'border-primary-500 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
      onClick={onClick}
    >
      <div className="p-2">
        <div className="text-xs text-gray-500 mb-1">
          Slide {index + 1}
        </div>
        
        <div 
          className="bg-gray-100 rounded border border-gray-200 overflow-hidden"
          style={{
            width: '100%',
            height: '80px',
            aspectRatio: `${slide.width} / ${slide.height}`,
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
            {slide.objects.length > 0 ? (
              <div className="text-center">
                <div className="font-medium">{slide.name}</div>
                <div>{slide.objects.length} objects</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="font-medium">Empty Slide</div>
                <div className="text-gray-400">No content</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-1 text-xs text-gray-600 truncate">
          {slide.name}
        </div>
      </div>
      
      {isActive && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-primary-500 rounded-full transform translate-x-1 -translate-y-1" />
      )}
    </div>
  )
}

