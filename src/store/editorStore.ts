import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { PPTXDocument, Slide, ShapeObject, EditorState, Point } from '@/types/pptx'

interface EditorStore extends EditorState {
  // Actions
  setDocument: (document: PPTXDocument) => void
  setCurrentSlide: (index: number) => void
  selectObjects: (objectIds: string[]) => void
  updateObject: (id: string, updates: Partial<ShapeObject>) => void
  moveObjects: (objectIds: string[], delta: Point) => void
  resizeObject: (id: string, width: number, height: number) => void
  rotateObject: (id: string, angle: number) => void
  setZoom: (zoom: number) => void
  setPan: (pan: Point) => void
  saveToHistory: () => void
  deleteSelectedObjects: () => void
  
  // Computed properties
  canUndo: boolean
  canRedo: boolean
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      document: null,
      currentSlideIndex: 0,
      selectedObjects: [],
      zoom: 1,
      pan: { x: 0, y: 0 },    
      history: {
        past: [],
        future: [],
      },
      isEditing: false,
      gridSnap: true, 
      objectSnap: true,

      // Computed properties
      get canUndo() {
        return get().history.past.length > 0
      },

      get canRedo() {
        return get().history.future.length > 0
      },

      // Actions
      setDocument: (document) => {
        set({ document, currentSlideIndex: 0, selectedObjects: [] })
        get().saveToHistory()
      },

      setCurrentSlide: (index) => {
        const { document } = get()
        if (document && index >= 0 && index < document.slides.length) {
          set({ currentSlideIndex: index, selectedObjects: [] })
        }
      },

      selectObjects: (objectIds) => {
        set({ selectedObjects: objectIds })
      },

      updateObject: (id, updates) => {
        const { document } = get()
        if (document) {
          const newDocument = { ...document }
          const slide = newDocument.slides[get().currentSlideIndex]
          const objectIndex = slide.objects.findIndex(obj => obj.id === id)
          if (objectIndex !== -1) {
            slide.objects[objectIndex] = { ...slide.objects[objectIndex], ...updates }
            set({ document: newDocument })
          }
        }
      },

      moveObjects: (objectIds, delta) => {
        const { document } = get()
        if (document) {
          const newDocument = { ...document }
          const slide = newDocument.slides[get().currentSlideIndex]
          slide.objects.forEach(obj => {
            if (objectIds.includes(obj.id) && obj.transform) {
              obj.transform.left += delta.x
              obj.transform.top += delta.y
            }
          })
          set({ document: newDocument })
        }
      },

      resizeObject: (id, width, height) => {
        const { document } = get()
        if (document) {
          const slide = document.slides[get().currentSlideIndex]
          const obj = slide.objects.find(obj => obj.id === id)
          if (obj && obj.transform) {
            get().updateObject(id, {
              transform: {
                ...obj.transform,
                width,
                height,
              }
            })
          }
        }
      },

      rotateObject: (id, angle) => {
        const { document } = get()
        if (document) {
          const slide = document.slides[get().currentSlideIndex]
          const obj = slide.objects.find(obj => obj.id === id)
          if (obj && obj.transform) {
            get().updateObject(id, {
              transform: {
                ...obj.transform,
                angle,
              }
            })
          }
        }
      },

      setZoom: (zoom) => {
        set({ zoom: Math.max(0.1, Math.min(5, zoom)) })
      },

      setPan: (pan) => {
        set({ pan })
      },

      saveToHistory: () => {
        const { document, history } = get()
        if (document) {
          set({
            history: {
              past: [...history.past, document],
              future: [],
            }
          })
        }
      },

      deleteSelectedObjects: () => {
        const { document, selectedObjects } = get()
        if (document && selectedObjects.length > 0) {
          const newDocument = { ...document }
          const slide = newDocument.slides[get().currentSlideIndex]
          
          // Remove selected objects from the current slide
          slide.objects = slide.objects.filter(obj => !selectedObjects.includes(obj.id))
          
          set({ 
            document: newDocument, 
            selectedObjects: [] // Clear selection after deletion
          })
          
          get().saveToHistory()
        }
      },
    }),
    {
      name: 'pptx-editor-store',
    }
  )
)

