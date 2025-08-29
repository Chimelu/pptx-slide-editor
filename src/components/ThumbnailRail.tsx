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
    <div className="w-full sm:w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Slides</h2>
        <div className="space-y-2 sm:space-y-3">
          {document.slides.map((slide, index) => (
            <div
              key={index}
              onClick={() => handleSlideClick(index)}
              className={`
                cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-md
                ${index === currentSlideIndex 
                  ? 'border-primary-500 bg-primary-50 shadow-md' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              <div className="p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Slide {index + 1}
                </div>
                <div className="text-xs text-gray-500">
                  {slide.objects.length} object{slide.objects.length !== 1 ? 's' : ''}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {slide.width} × {slide.height}
                </div>
              </div>
            </div>
          ))}
        </div>
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

