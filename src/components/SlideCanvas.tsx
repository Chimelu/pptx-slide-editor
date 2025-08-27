'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { ShapeObject } from '@/types/pptx'

// Dynamic import for Fabric.js to avoid SSR issues
let fabric: any = null

export function SlideCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFabricLoaded, setIsFabricLoaded] = useState(false)
  
  const {
    document,
    currentSlideIndex,
    selectedObjects,
    zoom,
    pan,
    gridSnap,
    objectSnap,
    selectObjects,
    updateObject,
    moveObjects,
    resizeObject,
    rotateObject,
    setPan,
    saveToHistory,
  } = useEditorStore()

  // Load Fabric.js dynamically
  useEffect(() => {
    const loadFabric = async () => {
      try {
        const fabricModule = await import('fabric')
        fabric = fabricModule.fabric
        setIsFabricLoaded(true)
      } catch (error) {
        console.error('Failed to load Fabric.js:', error)
      }
    }
    
    loadFabric()
  }, [])

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricRef.current && fabric && isFabricLoaded) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: '#ffffff',
        enableRetinaScaling: true,
        renderOnAddRemove: true,
        selectionColor: 'rgba(59, 130, 246, 0.3)', // Blue selection
        selectionBorderColor: 'rgb(59, 130, 246)', // Blue border
        selectionLineWidth: 2,
        transparentCorners: false,
        cornerColor: 'rgb(59, 130, 246)',
        cornerStrokeColor: 'white',
        cornerSize: 10,
        cornerStyle: 'circle',
        padding: 5,
        // Enhanced settings for better rendering
        skipTargetFind: false,
        targetFindTolerance: 5,
        perPixelTargetFind: false,
        fireRightClick: true,
        fireMiddleClick: true,
        stopContextMenu: false,
        // Better object interaction
        allowTouchScrolling: true,
        isDrawingMode: false,
        // Improved performance
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      })
      
      // Set up event handlers
      fabricRef.current.on('selection:created', handleSelection)
      fabricRef.current.on('selection:updated', handleSelection)
      fabricRef.current.on('selection:cleared', handleSelectionCleared)
      fabricRef.current.on('object:modified', handleObjectModified)
      fabricRef.current.on('object:moving', handleObjectMoving)
      fabricRef.current.on('object:scaling', handleObjectScaling)
      fabricRef.current.on('object:rotating', handleObjectRotating)
      
      // Add text editing events
      fabricRef.current.on('text:changed', handleTextChanged)
      fabricRef.current.on('text:editing:exited', handleTextEditingExited)
      
      // Add object selection events for better UX
      fabricRef.current.on('mouse:down', (e: any) => {
        if (e.target) {
          console.log('Object selected:', e.target.data)
        }
      })
      
      setIsInitialized(true)
    }

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
    }
  }, [isFabricLoaded])

  // Create Fabric.js objects function
  const createFabricObject = useCallback((obj: ShapeObject): any => {
    if (!fabric) return null
    
    try {
      console.log(`Creating Fabric.js object for:`, obj)
      
      // Ensure transform values are reasonable and preserve exact positioning
      const transform = {
        left: obj.transform.left || 0,
        top: obj.transform.top || 0,
        width: Math.max(1, obj.transform.width || 100),
        height: Math.max(1, obj.transform.height || 100),
        angle: obj.transform.angle || 0,
        scaleX: obj.transform.scaleX || 1,
        scaleY: obj.transform.scaleY || 1,
        flipX: obj.transform.flipX || false,
        flipY: obj.transform.flipY || false,
      }
      
      console.log(`Using transform:`, transform)
      
      // Common properties for all objects
      const commonProps = {
        left: transform.left,
        top: transform.top,
        angle: transform.angle,
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        flipX: transform.flipX,
        flipY: transform.flipY,
        data: { id: obj.id, type: obj.type },
        originX: 'left',
        originY: 'top',
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        lockUniScaling: false,
        lockSkewingX: false,
        lockSkewingY: false,
        lockScalingFlip: false,
      }
      
      switch (obj.type) {
        case 'text':
          const textObject = new fabric.Text(obj.content || 'Text', {
            ...commonProps,
            width: transform.width,
            height: transform.height,
            fontFamily: obj.style?.fontFamily || 'Arial',
            fontSize: obj.style?.fontSize || 18,
            fontWeight: obj.style?.fontWeight || 'normal',
            fontStyle: obj.style?.fontStyle || 'normal',
            textDecoration: obj.style?.textDecoration || 'none',
            fill: obj.style?.color || '#000000',
            textAlign: obj.style?.textAlign || 'left',
            lineHeight: obj.style?.lineHeight || 1.2,
            editable: true,
            lockUniScaling: true, // Text should scale proportionally
          })
          
          // Add double-click handler for text editing
          textObject.on('dblclick', () => {
            if (fabricRef.current) {
              fabricRef.current.setActiveObject(textObject)
              textObject.enterEditing()
              textObject.selectAll()
            }
          })
          
          console.log(`Created text object:`, textObject)
          return textObject

        case 'image':
          const img = new Image()
          img.src = obj.src || `data:image/svg+xml;base64,${btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ccc"/><text x="50" y="50" text-anchor="middle" dy=".3em">Image</text></svg>')}`
          
          const imageObject = new fabric.Image(img, {
            ...commonProps,
            width: transform.width,
            height: transform.height,
            crossOrigin: 'anonymous',
            lockUniScaling: true, // Images should scale proportionally
          })
          
          console.log(`Created image object:`, imageObject)
          return imageObject

        case 'rectangle':
          const rectObject = new fabric.Rect({
            ...commonProps,
            width: transform.width,
            height: transform.height,
            fill: (obj.style as any)?.fill || '#ffffff',
            stroke: (obj.style as any)?.stroke || '#000000',
            strokeWidth: (obj.style as any)?.strokeWidth || 1,
            strokeUniform: true, // Stroke width doesn't scale with object
            rx: (obj.style as any)?.rx || 0, // Corner radius
            ry: (obj.style as any)?.ry || 0,
          })
          
          console.log(`Created rectangle object:`, rectObject)
          return rectObject

        case 'ellipse':
          const ellipseObject = new fabric.Ellipse({
            ...commonProps,
            rx: transform.width / 2,
            ry: transform.height / 2,
            fill: (obj.style as any)?.fill || '#ffffff',
            stroke: (obj.style as any)?.stroke || '#000000',
            strokeWidth: (obj.style as any)?.strokeWidth || 1,
            strokeUniform: true,
          })
          
          console.log(`Created ellipse object:`, ellipseObject)
          return ellipseObject

        case 'line':
          // For lines, we need to calculate the actual line coordinates
          const lineLength = Math.sqrt(transform.width * transform.width + transform.height * transform.height)
          const lineAngle = Math.atan2(transform.height, transform.width)
          
          const lineObject = new fabric.Line([0, 0, lineLength, 0], {
            ...commonProps,
            stroke: (obj.style as any)?.stroke || '#000000',
            strokeWidth: (obj.style as any)?.strokeWidth || 2,
            strokeUniform: true,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            lockUniScaling: true, // Lines should scale proportionally
          })
          
          // Apply the line's natural rotation
          lineObject.set('angle', (transform.angle * Math.PI / 180) + lineAngle)
          
          console.log(`Created line object:`, lineObject)
          return lineObject

        case 'group':
          // Handle grouped shapes - preserve as a single unit
          if (obj.children && obj.children.length > 0) {
            const groupObjects = obj.children
              .map(child => createFabricObject(child))
              .filter(Boolean)
            
            if (groupObjects.length > 0) {
              const group = new fabric.Group(groupObjects, {
                ...commonProps,
                subTargetCheck: true, // Allow selecting individual objects within group
                interactive: true,
              })
              
              console.log(`Created group object with ${groupObjects.length} children:`, group)
              return group
            }
          }
          
          // Fallback for groups without children
          console.warn(`Group object ${obj.id} has no children, creating placeholder`)
          return new fabric.Rect({
            ...commonProps,
            width: transform.width,
            height: transform.height,
            fill: 'rgba(200, 200, 200, 0.3)',
            stroke: '#666',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
          })

        default:
          console.warn(`Unknown object type: ${obj.type}, creating fallback rectangle`)
          return new fabric.Rect({
            ...commonProps,
            width: transform.width,
            height: transform.height,
            fill: '#ffcccc',
            stroke: '#ff0000',
            strokeWidth: 2,
            data: { id: obj.id, type: 'unknown' },
          })
      }
    } catch (error) {
      console.error(`Error creating Fabric.js object for ${obj.type}:`, error)
      return null
    }
  }, [])

  // Render slide function
  const renderSlide = useCallback(() => {
    if (!fabricRef.current || !document || !fabric) return

    const slide = document.slides[currentSlideIndex]
    if (!slide) return

    console.log('Rendering slide:', slide)
    console.log('Slide objects:', slide.objects)

    // Clear canvas
    fabricRef.current.clear()
    
    // Set canvas dimensions with proper scaling and preserve aspect ratio
    const canvasWidth = Math.max(slide.width, 800)
    const canvasHeight = Math.max(slide.height, 600)
    
    fabricRef.current.setDimensions({
      width: canvasWidth,
      height: canvasHeight,
    })

    console.log('Canvas dimensions set to:', canvasWidth, 'x', canvasHeight)

    // Sort objects by z-order if available, otherwise maintain order
    const sortedObjects = [...slide.objects].sort((a, b) => {
      const zOrderA = (a as any).zOrder || 0
      const zOrderB = (b as any).zOrder || 0
      return zOrderA - zOrderB
    })

    // Render objects with proper positioning and z-order
    sortedObjects.forEach((obj, index) => {
      console.log(`Creating Fabric.js object ${index + 1}:`, obj)
      const fabricObject = createFabricObject(obj)
      if (fabricObject) {
        // Set the object's z-index to maintain proper layering
        fabricObject.set('zIndex', index)
        
        // Ensure objects are properly positioned within canvas bounds
        const objLeft = fabricObject.left || 0
        const objTop = fabricObject.top || 0
        const objWidth = fabricObject.width || 0
        const objHeight = fabricObject.height || 0
        
        // Adjust position if object is outside canvas bounds
        if (objLeft < 0) fabricObject.set('left', 0)
        if (objTop < 0) fabricObject.set('top', 0)
        if (objLeft + objWidth > canvasWidth) fabricObject.set('left', Math.max(0, canvasWidth - objWidth))
        if (objTop + objHeight > canvasHeight) fabricObject.set('top', Math.max(0, canvasHeight - objHeight))
        
        // Add object to canvas
        fabricRef.current!.add(fabricObject)
        console.log(`Added object ${index + 1} to canvas:`, fabricObject)
      } else {
        console.warn(`Failed to create Fabric.js object for:`, obj)
      }
    })

    // Ensure proper object stacking order
    fabricRef.current.bringToFront()
    
    // Render all objects
    fabricRef.current.renderAll()
    
    // Fit canvas to show all objects if needed
    const objects = fabricRef.current.getObjects()
    if (objects.length > 0) {
      // Calculate the bounding box of all objects
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      
      objects.forEach((obj: any) => {
        const objLeft = obj.left || 0
        const objTop = obj.top || 0
        const objWidth = obj.width || 0
        const objHeight = obj.height || 0
        
        minX = Math.min(minX, objLeft)
        minY = Math.min(minY, objTop)
        maxX = Math.max(maxX, objLeft + objWidth)
        maxY = Math.max(maxY, objTop + objHeight)
      })
      
      // Add some padding around objects
      const padding = 50
      minX = Math.max(0, minX - padding)
      minY = Math.max(0, minY - padding)
      maxX = Math.min(canvasWidth, maxX + padding)
      maxY = Math.min(canvasHeight, maxY + padding)
      
      // Center the view if objects are not centered
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const canvasCenterX = canvasWidth / 2
      const canvasCenterY = canvasHeight / 2
      
      if (Math.abs(centerX - canvasCenterX) > 10 || Math.abs(centerY - canvasCenterY) > 10) {
        const offsetX = canvasCenterX - centerX
        const offsetY = canvasCenterY - centerY
        
        objects.forEach((obj: any) => {
          obj.set({
            left: (obj.left || 0) + offsetX,
            top: (obj.top || 0) + offsetY,
          })
        })
        
        fabricRef.current.renderAll()
      }
    }
    
    // Final render to ensure everything is displayed correctly
    fabricRef.current.requestRenderAll()
    console.log('Slide rendering completed')
  }, [document, currentSlideIndex, createFabricObject])

  // Update canvas when slide changes
  useEffect(() => {
    if (fabricRef.current && document && isInitialized) {
      console.log('Slide changed, rendering new slide:', currentSlideIndex)
      console.log('Current slide data:', document.slides[currentSlideIndex])
      renderSlide()
    }
  }, [document, currentSlideIndex, isInitialized, renderSlide])

  // Update canvas zoom and pan
  useEffect(() => {
    if (fabricRef.current && fabric) {
      fabricRef.current.setZoom(zoom)
      fabricRef.current.absolutePan(new fabric.Point(pan.x, pan.y))
    }
  }, [zoom, pan])

  const handleSelection = useCallback(() => {
    if (!fabricRef.current) return
    
    const activeObjects = fabricRef.current.getActiveObjects()
    const selectedIds = activeObjects.map((obj: any) => obj.data?.id).filter(Boolean)
    selectObjects(selectedIds)
  }, [selectObjects])

  const handleSelectionCleared = useCallback(() => {
    selectObjects([])
  }, [selectObjects])

  const handleObjectModified = useCallback(() => {
    if (!fabricRef.current) return
    
    const activeObjects = fabricRef.current.getActiveObjects()
    activeObjects.forEach((obj: any) => {
      if (obj.data?.id) {
        updateObject(obj.data.id, {
          transform: {
            left: obj.left || 0,
            top: obj.top || 0,
            width: obj.width || 0,
            height: obj.height || 0,
            angle: obj.angle || 0,
            scaleX: obj.scaleX || 1,
            scaleY: obj.scaleY || 1,
            flipX: obj.flipX || false,
            flipY: obj.flipY || false,
          }
        })
      }
    })
    
    saveToHistory()
  }, [updateObject, saveToHistory])

  const handleObjectMoving = useCallback((e: any) => {
    if (!fabricRef.current || !gridSnap) return
    
    const obj = e.target
    if (obj) {
      // Snap to grid (10px grid)
      const gridSize = 10
      obj.set({
        left: Math.round(obj.left / gridSize) * gridSize,
        top: Math.round(obj.top / gridSize) * gridSize,
      })
    }
  }, [gridSnap])

  const handleObjectScaling = useCallback((e: any) => {
    if (!fabricRef.current) return
    
    const obj = e.target
    if (obj && obj.data?.id) {
      resizeObject(obj.data.id, obj.width || 0, obj.height || 0)
    }
  }, [resizeObject])

  const handleObjectRotating = useCallback((e: any) => {
    if (!fabricRef.current) return
    
    const obj = e.target
    if (obj && obj.data?.id) {
      rotateObject(obj.data.id, obj.angle || 0)
    }
  }, [rotateObject])

  // Text editing handlers
  const handleTextChanged = useCallback((e: any) => {
    if (!fabricRef.current) return
    
    const textObject = e.target
    if (textObject && textObject.data?.id) {
      updateObject(textObject.data.id, {
        content: textObject.text,
      })
    }
  }, [updateObject])

  const handleTextEditingExited = useCallback((e: any) => {
    if (!fabricRef.current) return
    
    const textObject = e.target
    if (textObject && textObject.data?.id) {
      // Save the final text content
      updateObject(textObject.data.id, {
        content: textObject.text,
      })
      saveToHistory()
    }
  }, [updateObject, saveToHistory])

  // Pan and zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!fabricRef.current) return
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
      fabricRef.current.isDragging = true
      fabricRef.current.selection = false
      fabricRef.current.defaultCursor = 'grab'
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!fabricRef.current || !fabricRef.current.isDragging) return
    
    const deltaX = e.movementX
    const deltaY = e.movementY
    
    setPan({
      x: pan.x + deltaX,
      y: pan.y + deltaY,
    })
  }, [pan, setPan])

  const handleMouseUp = useCallback(() => {
    if (!fabricRef.current) return
    
    fabricRef.current.isDragging = false
    fabricRef.current.selection = true
    fabricRef.current.defaultCursor = 'default'
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!fabricRef.current) return
    
    e.preventDefault()
    
    if (e.ctrlKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor))
      // TODO: Implement zoom to cursor
    } else {
      // Pan
      setPan({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      })
    }
  }, [zoom, pan, setPan])

  if (!document) return null

  const slide = document.slides[currentSlideIndex]
  if (!slide) return null

  // Show loading state while Fabric.js loads
  if (!isFabricLoaded) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading editor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-300">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="block border border-gray-200"
            style={{ minWidth: '800px', minHeight: '600px' }}
          />
        </div>
      </div>
      
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-sm text-gray-600">
        Slide {currentSlideIndex + 1} of {document.slides.length} • 
        {slide.width} × {slide.height} • 
        {slide.objects.length} objects
      </div>
    </div>
  )
}

