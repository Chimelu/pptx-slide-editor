// Units: all distances in px unless noted. Crop is fractional 0..1 like PPTX a:srcRect.

export interface Point { readonly x: number; readonly y: number }
export interface Size { readonly width: number; readonly height: number }

export interface Transform {
  /** top-left in px (post group transforms) */
  left: number
  top: number
  width: number
  height: number
  /** rotation in degrees, clockwise */
  angle?: number
  /** scale after rotation (1 = no scale) */
  scaleX?: number
  scaleY?: number
  flipX?: boolean
  flipY?: boolean
  /** optional rotation pivot (defaults to rect center) */
  originX?: number
  originY?: number
  /** drawing order (higher renders on top) */
  zIndex?: number
  /** raw EMU bbox if you want exactness later */
  emu?: { x: number; y: number; cx: number; cy: number }
}

export interface TextStyle {
  fontFamily?: string
  fontSize?: number // pt preferred in authoring; you can store px if that’s what you render
  fontWeight?: 'normal' | 'bold' | number
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline' | 'line-through'
  color?: string // #RRGGBB
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  lineHeight?: number // px or unitless ratio; be consistent in your renderer
  opacity?: number // 0..1
}

export interface ShapeStyle {
  fillColor?: string // #RRGGBB
  strokeColor?: string // #RRGGBB
  strokeWidth?: number // px
  opacity?: number // 0..1
}

export interface Crop {
  /** 0..1 fractions, like PPTX a:srcRect */
  left?: number
  top?: number
  right?: number
  bottom?: number
}

export type ChartKind =
  | 'bar' | 'column' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'bubble'
  | 'radar' | 'stock' | 'surface' | 'histogram' | 'boxwhisker' | 'funnel' | 'waterfall' | 'treemap' | 'sunburst'

export interface ChartData {
  chartType: ChartKind
  series: Array<{
    name?: string
    values: number[]
    categories?: (string | number)[]
  }>
  options?: Record<string, unknown>
}

/** Discriminated union per object type */
export type ShapeObject =
  | TextObject
  | ImageObject
  | RectObject
  | EllipseObject
  | LineObject
  | ChartObject
  | GroupObject
  | GenericShapeObject

export interface BaseObject {
  readonly id: string
  readonly name: string
  transform?: Transform
  rawData?: any
}

export interface TextObject extends BaseObject {
  type: 'text'
  style?: TextStyle
  text: string
}

export interface ImageObject extends BaseObject {
  type: 'image'
  src: string // data URL or remote URL
  crop?: Crop
  opacity?: number
}

export interface RectObject extends BaseObject {
  type: 'rectangle'
  style?: ShapeStyle
  rx?: number // corner radius
  ry?: number
}

export interface EllipseObject extends BaseObject {
  type: 'ellipse'
  style?: ShapeStyle
}

export interface LineObject extends BaseObject {
  type: 'line'
  style?: ShapeStyle
  /** Optional explicit endpoints; if omitted, derive from transform */
  points?: [Point, Point]
}

export interface ChartObject extends BaseObject {
  type: 'chart'
  chartData: ChartData
}

export interface GroupObject extends BaseObject {
  type: 'group'
  children: ShapeObject[]
}

export interface GenericShapeObject extends BaseObject {
  type: 'shape'
  style?: ShapeStyle
  /** OOXML shape type, e.g., 'rect','roundRect','flowChartProcess', etc. */
  shapeType?: string
}

export type SlideBackground =
  | { kind: 'solid'; color: string }
  | { kind: 'image'; src: string }
  | { kind: 'none' }

export interface Slide {
  readonly id: string
  readonly name: string
  readonly slideNumber: number
  width: number
  height: number
  objects: ShapeObject[]
  background?: SlideBackground
  /** Optional SVG snapshot if you render server-side */
  svgContent?: string
}

export interface SlideSize {
  width: number
  height: number
  /** '16:9', '4:3', 'Widescreen', etc. */
  type?: string
}

export interface ColorScheme {
  dk1?: string; lt1?: string; dk2?: string; lt2?: string
  accent1?: string; accent2?: string; accent3?: string; accent4?: string; accent5?: string; accent6?: string
  hlink?: string; folHlink?: string
}

export interface FontScheme {
  major?: string
  minor?: string
}

export interface Theme {
  name: string
  colorScheme?: ColorScheme
  fontScheme?: FontScheme
}

export interface PPTXMetadata {
  title?: string
  author?: string
  subject?: string
  description?: string
  keywords?: string
  category?: string
  created?: string
  modified?: string
  lastModifiedBy?: string
  revision?: number
  version?: string
  slideCount: number
  slideSize: SlideSize
  theme?: Theme
}

export interface PPTXDocument {
  readonly id: string
  name: string
  slides: Slide[]
  metadata: PPTXMetadata
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

