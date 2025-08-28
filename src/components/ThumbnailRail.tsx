'use client'

import { useCallback, useEffect, useRef, forwardRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Slide } from '@/types/pptx'

export function ThumbnailRail() {
  const { document, currentSlideIndex, setCurrentSlide } = useEditorStore()
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize refs array when document changes
  useEffect(() => {
    if (document && document.slides) {
      thumbnailRefs.current = new Array(document.slides.length).fill(null)
      console.log('🔄 Initialized thumbnail refs array with length:', document.slides.length)
    }
  }, [document])

  // Auto-scroll active slide into view
  useEffect(() => {
    console.log('🔄 Auto-scroll effect triggered, currentSlideIndex:', currentSlideIndex)
    console.log('🔄 thumbnailRefs.current:', thumbnailRefs.current)
    console.log('🔄 containerRef.current:', containerRef.current)
    
    if (currentSlideIndex >= 0 && thumbnailRefs.current[currentSlideIndex]) {
      const activeThumbnail = thumbnailRefs.current[currentSlideIndex]
      const container = containerRef.current
      
      console.log('🔄 Active thumbnail found:', activeThumbnail)
      console.log('🔄 Container found:', container)
      
      if (activeThumbnail && container) {
        // Calculate scroll position to center the active thumbnail
        const containerRect = container.getBoundingClientRect()
        const thumbnailTop = activeThumbnail.offsetTop
        const thumbnailHeight = activeThumbnail.offsetHeight
        
        console.log('🔄 Container dimensions:', containerRect)
        console.log('🔄 Thumbnail position:', { thumbnailTop, thumbnailHeight })
        
        // Center the thumbnail in the visible area
        const targetScrollTop = thumbnailTop - (containerRect.height / 2) + (thumbnailHeight / 2)
        
        console.log('🔄 Target scroll position:', targetScrollTop)
        console.log('🔄 Current scroll position:', container.scrollTop)
        
        // Smooth scroll to the target position
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        })
        
        console.log('🔄 Scrolling to:', Math.max(0, targetScrollTop))
      } else {
        console.log('❌ Missing thumbnail or container')
      }
    } else {
      console.log('❌ Invalid slide index or thumbnail ref not found')
    }
  }, [currentSlideIndex])

  if (!document) return null

  const handleSlideClick = useCallback((index: number) => {
    console.log('🔄 Slide clicked, index:', index)
    console.log('🔄 Current slide index before:', currentSlideIndex)
    setCurrentSlide(index)
    console.log('🔄 setCurrentSlide called with:', index)
  }, [setCurrentSlide, currentSlideIndex])

  const handleAddSlide = useCallback(() => {
    // TODO: Implement add slide functionality
    alert('Add slide functionality coming soon!')
  }, [])

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto" ref={containerRef}>
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
            ref={(el) => {
              if (el) {
                console.log(`🔄 Setting ref for slide ${index}:`, el)
                thumbnailRefs.current[index] = el
              } else {
                console.log(`🔄 Clearing ref for slide ${index}`)
                thumbnailRefs.current[index] = null
              }
            }}
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

const SlideThumbnail = forwardRef<HTMLDivElement, SlideThumbnailProps>(
  ({ slide, index, isActive, onClick }, ref) => {
    return (
      <div
        ref={ref}
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
          <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none" />
        )}
      </div>
    )
  }
)

SlideThumbnail.displayName = 'SlideThumbnail'

