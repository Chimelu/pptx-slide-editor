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

  // Extract transform information from raw XML data
  const extractTransformFromRawData = useCallback((obj: any) => {
    try {
      console.log(`🔍 Extracting transform for object ${obj.id}:`, obj)
      console.log(`🔍 rawData structure:`, JSON.stringify(obj.rawData, null, 2))
      
      if (!obj.rawData) {
        console.warn(`Object ${obj.id} has no rawData, using default transform`)
        return {
          left: 0,
          top: 0,
          width: 100,
          height: 100,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          flipX: false,
          flipY: false,
        }
      }

      // Try to extract transform from the XML structure
      const spPr = obj.rawData['p:spPr']
      console.log(`🔍 Found spPr:`, spPr)
      
      if (spPr && spPr['a:xfrm']) {
        const xfrm = spPr['a:xfrm']
        console.log(`🔍 Found xfrm:`, xfrm)
        
        const off = xfrm['a:off']
        const ext = xfrm['a:ext']
        const rot = xfrm['a:rot']
        
        console.log(`🔍 Found off:`, off)
        console.log(`🔍 Found ext:`, ext)
        console.log(`🔍 Found rot:`, rot)

        // Convert EMU to pixels (1 EMU = 1/914400 inch, assuming 96 DPI)
        // For better visibility, we'll use a more appropriate scaling
        const emuToPixels = 1 / 12700 // This gives better scaling for PPTX coordinates
        
        const left = off && off.$ && off.$.x ? parseInt(off.$.x) * emuToPixels : 0
        const top = off && off.$ && off.$.y ? parseInt(off.$.y) * emuToPixels : 0
        const width = ext && ext.$ && ext.$.cx ? parseInt(ext.$.cx) * emuToPixels : 100
        const height = ext && ext.$ && ext.$.cy ? parseInt(ext.$.cy) * emuToPixels : 100
        const angle = rot && rot.$ && rot.$.val ? parseInt(rot.$.val) / 60000 : 0

        console.log(`🔍 Calculated transform:`, { left, top, width, height, angle })
        console.log(`🔍 Raw EMU values: x=${off?.$?.x}, y=${off?.$?.y}, cx=${ext?.$?.cx}, cy=${ext?.$?.cy}`)
        console.log(`🔍 Conversion factor: ${emuToPixels}`)

        return {
          left: Math.max(0, left),
          top: Math.max(0, top),
          width: Math.max(10, width),
          height: Math.max(10, height),
          angle,
          scaleX: 1,
          scaleY: 1,
          flipX: false,
          flipY: false,
        }
      }

      // If spPr is empty, try to get transform from placeholder info
      if (spPr === "" || !spPr) {
        console.log(`🔍 spPr is empty, checking for placeholder info`)
        
        // Check if this is a placeholder shape
        const nvSpPr = obj.rawData['p:nvSpPr']
        if (nvSpPr && nvSpPr['p:nvPr'] && nvSpPr['p:nvPr']['p:ph']) {
          const ph = nvSpPr['p:nvPr']['p:ph']
          const phType = ph.$ && ph.$.type
          const phIdx = ph.$ && ph.$.idx
          
          console.log(`🔍 Found placeholder type: ${phType}, idx: ${phIdx}`)
          
          // Use placeholder-based positioning for common types
          if (phType === 'title') {
            return { left: 50, top: 50, width: 700, height: 100, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false }
          } else if (phType === 'subTitle') {
            return { left: 50, top: 200, width: 700, height: 80, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false }
          } else if (phType === 'body') {
            return { left: 50, top: 300, width: 700, height: 250, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false }
          } else if (phIdx === '1') {
            return { left: 50, top: 200, width: 700, height: 80, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false }
          } else if (phIdx === '2') {
            return { left: 50, top: 300, width: 700, height: 250, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false }
          }
        }
      }

      // Fallback to default transform
      console.log(`🔍 No transform found, using default`)
      return {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false,
      }
    } catch (error) {
      console.error(`Error extracting transform for object ${obj.id}:`, error)
      return {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false,
      }
    }
  }, [])

  // Create Fabric.js objects function
  const createFabricObject = useCallback((obj: any) => {
    try {
      console.log('Creating Fabric.js object for:', obj)
      
      // Extract transform information from raw XML data
      const transform = obj.transform || extractTransformFromRawData(obj)
      console.log('Using transform:', transform)
      
      // Common properties for all objects
      const commonProps = {
        left: transform.left,
        top: transform.top,
        width: transform.width,
        height: transform.height,
        angle: transform.angle,
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        flipX: transform.flipX,
        flipY: transform.flipY,
        selectable: true,
        evented: true,
      }

      // Determine the actual type based on content
      let actualType = obj.type
      if (obj.type === 'shape' && obj.text && obj.text.trim()) {
        actualType = 'text'
        console.log(`Converting shape to text object: "${obj.text}"`)
      }

      switch (actualType) {
        case 'text':
          return new fabric.Text(obj.text || 'Text', {
            ...commonProps,
            fontSize: 16,
            fill: '#000000',
            fontFamily: 'Arial, sans-serif',
            originX: 'left',
            originY: 'top',
          })

        case 'image':
          if (obj.src) {
            console.log('Creating image object with src:', obj.src)
            return new fabric.Image(obj.src, {
              ...commonProps,
              originX: 'left',
              originY: 'top',
            })
          }
          // Fallback for images without src
          console.log('Creating placeholder for image without src')
          return new fabric.Rect({
            ...commonProps,
            fill: '#e0e0e0',
            stroke: '#999999',
            strokeWidth: 2,
            originX: 'left',
            originY: 'top',
          })

        case 'rectangle':
          return new fabric.Rect({
            ...commonProps,
            fill: '#f0f0f0',
            stroke: '#cccccc',
            strokeWidth: 1,
            originX: 'left',
            originY: 'top',
          })

        case 'ellipse':
          return new fabric.Ellipse({
            ...commonProps,
            fill: '#f0f0f0',
            stroke: '#cccccc',
            strokeWidth: 1,
            originX: 'left',
            originY: 'top',
          })

        case 'line':
          return new fabric.Line([0, 0, transform.width, transform.height], {
            ...commonProps,
            stroke: '#000000',
            strokeWidth: 2,
            originX: 'left',
            originY: 'top',
          })

        case 'group':
          if (obj.children && obj.children.length > 0) {
            const groupObjects = obj.children
              .map((child: any) => createFabricObject(child))
              .filter(Boolean)
            
            if (groupObjects.length > 0) {
              return new fabric.Group(groupObjects, {
                ...commonProps,
                originX: 'left',
                originY: 'top',
              })
            }
          }
          // Fallback for empty groups
          return new fabric.Rect({
            ...commonProps,
            fill: 'rgba(200, 200, 200, 0.3)',
            stroke: '#999999',
            strokeWidth: 1,
            originX: 'left',
            originY: 'top',
          })

        case 'shape':
          // Handle generic shapes - if they have text, treat as text; otherwise as rectangle
          if (obj.text && obj.text.trim()) {
            console.log('Creating text object from generic shape:', obj.text)
            return new fabric.Text(obj.text, {
              ...commonProps,
              fontSize: 16,
              fill: '#000000',
              fontFamily: 'Arial, sans-serif',
              originX: 'left',
              originY: 'top',
            })
          } else {
            console.log('Creating rectangle from generic shape')
            return new fabric.Rect({
              ...commonProps,
              fill: '#f0f0f0',
              stroke: '#cccccc',
              strokeWidth: 1,
              originX: 'left',
              originY: 'top',
            })
          }

        default:
          console.warn(`Unknown object type: ${obj.type}, creating fallback rectangle`)
          return new fabric.Rect({
            ...commonProps,
            fill: '#ffcccc',
            stroke: '#ff0000',
            strokeWidth: 2,
            originX: 'left',
            originY: 'top',
          })
      }
    } catch (error) {
      console.error(`Failed to create editable object for:`, obj, error)
      return null
    }
  }, [extractTransformFromRawData])

  // Render slide SVG as background
  const renderSlideSVG = useCallback((svgContent: string, width: number, height: number) => {
    if (!fabricRef.current || !fabric) return

    try {
      // Create a Fabric.js SVG object from the slide content
      fabric.loadSVGFromString(svgContent, (objects: any[], options: any) => {
        if (objects && objects.length > 0) {
          // Create a group from all SVG objects
          const svgGroup = new fabric.Group(objects, {
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            zIndex: 0, // Background layer
          })

          // Scale SVG to fit canvas if needed
          const svgBounds = svgGroup.getBoundingRect()
          if (svgBounds.width > width || svgBounds.height > height) {
            const scaleX = width / svgBounds.width
            const scaleY = height / svgBounds.height
            const scale = Math.min(scaleX, scaleY)
            svgGroup.scale(scale)
          }

          // Add SVG group to canvas
          fabricRef.current!.add(svgGroup)
          fabricRef.current!.sendToBack(svgGroup)
          
          console.log('SVG background rendered successfully')
        }
      })
    } catch (error) {
      console.error('Error rendering slide SVG:', error)
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
    
    // Set canvas dimensions based on slide dimensions
    const canvasWidth = Math.max(slide.width, 800)
    const canvasHeight = Math.max(slide.height, 600)
    
    fabricRef.current.setDimensions({
      width: canvasWidth,
      height: canvasHeight,
    })

    console.log('Canvas dimensions set to:', canvasWidth, 'x', canvasHeight)

    // If we have SVG content, render it as background first
    if (slide.svgContent) {
      console.log('Rendering slide SVG background')
      renderSlideSVG(slide.svgContent, canvasWidth, canvasHeight)
    }

    // Sort objects by z-order if available, otherwise maintain order
    const sortedObjects = [...slide.objects].sort((a, b) => {
      const zOrderA = (a as any).zOrder || 0
      const zOrderB = (b as any).zOrder || 0
      return zOrderA - zOrderB
    })

    // Render editable objects as overlays
    sortedObjects.forEach((obj, index) => {
      console.log(`Creating editable overlay object ${index + 1}:`, obj)
      const fabricObject = createFabricObject(obj)
      if (fabricObject) {
        // Set the object's z-index to maintain proper layering
        fabricObject.set('zIndex', index + 1000) // Higher than SVG background
        
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
        console.log(`Added editable object ${index + 1} to canvas:`, fabricObject)
      } else {
        console.warn(`Failed to create editable object for:`, obj)
      }
    })

    // Ensure proper object stacking order
    fabricRef.current.bringToFront()
    
    // Final render to ensure everything is displayed correctly
    fabricRef.current.requestRenderAll()
    console.log('Slide rendering completed')
  }, [document, currentSlideIndex, createFabricObject, renderSlideSVG])

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

