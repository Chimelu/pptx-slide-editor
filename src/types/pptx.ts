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
  type: 'text' | 'image' | 'rectangle' | 'ellipse' | 'line' | 'group' | 'shape'
  transform?: Transform // Optional since backend might not send it
  style?: Partial<TextStyle> | Record<string, any>
  content?: string
  text?: string // Backend sends text property
  src?: string
  children?: ShapeObject[]
  groupId?: string
  rawData?: any // Backend sends raw XML data
}

export interface Slide {
  id: string
  name: string
  width: number
  height: number
  objects: ShapeObject[]
  svgContent?: string // SVG representation of the slide for faithful rendering
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

