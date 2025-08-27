export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Transform {
  left: number
  top: number
  width: number
  height: number
  angle: number
  scaleX: number
  scaleY: number
  flipX: boolean
  flipY: boolean
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string
  fontStyle: string
  textDecoration: string
  color: string
  textAlign: string
  lineHeight: number
}

export interface ShapeObject {
  id: string
  type: 'text' | 'image' | 'rectangle' | 'ellipse' | 'line' | 'group'
  transform: Transform
  style: Partial<TextStyle> | Record<string, any>
  content?: string
  src?: string
  children?: ShapeObject[]
  groupId?: string
}

export interface Slide {
  id: string
  name: string
  width: number
  height: number
  objects: ShapeObject[]
  background?: string
}

export interface PPTXDocument {
  id: string
  name: string
  slides: Slide[]
  metadata: {
    author?: string
    created?: Date
    modified?: Date
    version?: string
  }
}

export interface EditorState {
  document: PPTXDocument | null
  currentSlideIndex: number
  selectedObjects: string[]
  zoom: number
  pan: Point
  history: {
    past: PPTXDocument[]
    future: PPTXDocument[]
  }
  isEditing: boolean
  gridSnap: boolean
  objectSnap: boolean
}

