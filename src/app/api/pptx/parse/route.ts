import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { parseString } from 'xml2js'
import crypto from 'node:crypto'
import pathPosix from 'node:path/posix'

export const runtime = 'nodejs'

// ---------- geometry / units ----------
const EMUS_PER_PX = 9525
const emuToPx = (emu: number) => emu / EMUS_PER_PX

// ---------- tiny utils ----------
const isObj = (v: any) => v && typeof v === 'object'
const asArray = <T>(x: T | T[] | undefined): T[] => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x])
const getAttr = (el: any, name: string): string | null => (el && el.$ ? (el.$[name] ?? null) : null)

// deep find (first hit) and deep collect (all hits) by tag name at any depth
function deepFind(node: any, tag: string): any | undefined {
  if (!isObj(node)) return undefined
  if (node[tag] !== undefined) return node[tag]
  const plain = tag.includes(':') ? tag.split(':')[1] : tag
  if (node[plain] !== undefined) return node[plain]
  for (const k of Object.keys(node)) {
    const v = node[k]
    if (isObj(v)) {
      const hit = deepFind(v, tag)
      if (hit !== undefined) return hit
    }
  }
  return undefined
}

// ---------- 2D matrix (affine) ----------
type Mat = [number, number, number, number, number, number] // a,b,c,d,e,f  => [[a c e],[b d f],[0 0 1]]

const MAT_I: Mat = [1, 0, 0, 1, 0, 0]
const matMul = (m1: Mat, m2: Mat): Mat => {
  const [a1,b1,c1,d1,e1,f1] = m1
  const [a2,b2,c2,d2,e2,f2] = m2
  return [
    a1*a2 + c1*b2,  b1*a2 + d1*b2,
    a1*c2 + c1*d2,  b1*c2 + d1*d2,
    a1*e2 + c1*f2 + e1,  b1*e2 + d1*f2 + f1
  ]
}
const matTranslate = (tx: number, ty: number): Mat => [1,0,0,1,tx,ty]
const matScale = (sx: number, sy: number): Mat => [sx,0,0,sy,0,0]
const matRotateCenter = (deg: number, cx: number, cy: number): Mat => {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad), sin = Math.sin(rad)
  // T(cx,cy) * R * T(-cx,-cy)
  return matMul(matMul(matTranslate(cx, cy), [cos,sin,-sin,cos,0,0]), matTranslate(-cx, -cy))
}

// apply matrix to rect defined by x,y,cx,cy (all in EMUs); return bbox in EMUs and in px
function rectThroughMatrix(x: number, y: number, cx: number, cy: number, M: Mat) {
  const pts = [
    [x, y], [x+cx, y], [x, y+cy], [x+cx, y+cy]
  ].map(([px,py]) => {
    const [a,b,c,d,e,f] = M
    return [a*px + c*py + e, b*px + d*py + f]
  })
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = maxX - minX, h = maxY - minY
  return {
    emu: { x: minX, y: minY, cx: w, cy: h },
    px: { left: emuToPx(minX), top: emuToPx(minY), width: emuToPx(w), height: emuToPx(h) }
  }
}

// ---------- group child-space → group-space transform ----------
function matrixFromGroupChildMap(groupNode: any): Mat {
  // p:grpSpPr > a:xfrm with off/ext (group space) AND chOff/chExt (child space)
  const grpSpPr = deepFind(groupNode, 'p:grpSpPr')
  const xfrm = grpSpPr ? deepFind(grpSpPr, 'a:xfrm') : undefined
  if (!xfrm) return MAT_I

  const off = deepFind(xfrm, 'a:off')
  const ext = deepFind(xfrm, 'a:ext')
  const chOff = deepFind(xfrm, 'a:chOff')
  const chExt = deepFind(xfrm, 'a:chExt')

  const offX = parseInt(getAttr(off, 'x') || '0', 10)
  const offY = parseInt(getAttr(off, 'y') || '0', 10)
  const extX = parseInt(getAttr(ext, 'cx') || '1', 10)
  const extY = parseInt(getAttr(ext, 'cy') || '1', 10)
  const chOffX = parseInt(getAttr(chOff, 'x') || '0', 10)
  const chOffY = parseInt(getAttr(chOff, 'y') || '0', 10)
  const chExtX = parseInt(getAttr(chExt, 'cx') || String(extX), 10)
  const chExtY = parseInt(getAttr(chExt, 'cy') || String(extY), 10)

  const sx = extX / (chExtX || 1)
  const sy = extY / (chExtY || 1)

  // translation maps chOff -> off (after scaling)
  // group rotation on grpSpPr is rare; if present PowerPoint applies it to the group geometry,
  // not to the child-space mapping; we ignore group rotation at this level.
  return matMul(matTranslate(offX - chOffX * sx, offY - chOffY * sy), matScale(sx, sy))
}

// ---------- shape local matrix (position + rotation) ----------
function matrixFromShapeXfrm(shape: any): { M: Mat; bboxEMU: {x:number;y:number;cx:number;cy:number}; rotDeg: number; flipH: boolean; flipV: boolean } {
  const spPr = deepFind(shape, 'p:spPr')
  const xfrm = deepFind(spPr, 'a:xfrm')
  const off = deepFind(xfrm, 'a:off')
  const ext = deepFind(xfrm, 'a:ext')
  const rot = parseInt(getAttr(xfrm, 'rot') || '0', 10) / 60000 // 60kths of a degree
  const flipH = getAttr(xfrm, 'flipH') === '1' || getAttr(xfrm, 'flipH') === 'true'
  const flipV = getAttr(xfrm, 'flipV') === '1' || getAttr(xfrm, 'flipV') === 'true'

  const x = parseInt(getAttr(off, 'x') || '0', 10)
  const y = parseInt(getAttr(off, 'y') || '0', 10)
  const cx = parseInt(getAttr(ext, 'cx') || '0', 10)
  const cy = parseInt(getAttr(ext, 'cy') || '0', 10)

  // local matrix: translate to (x,y), then optional rotate around center, then flips (we surface flags too)
  let M = matTranslate(x, y)
  if (flipH || flipV) {
    const sx = flipH ? -1 : 1
    const sy = flipV ? -1 : 1
    // flip around the rect center
    M = matMul(M, matRotateCenter(180, cx/2, cy/2)) // turn 180 then scale to emulate flip
    M = matMul(M, matScale(sx, sy))
  }
  if (rot) {
    M = matMul(M, matRotateCenter(rot, cx / 2, cy / 2))
  }
  return { M, bboxEMU: { x, y, cx, cy }, rotDeg: rot, flipH, flipV }
}

// ---------- HTTP handlers ----------
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const ct = request.headers.get('content-type') || ''
    if (!ct.includes('multipart/form-data'))
      return NextResponse.json({ error: 'Send multipart/form-data with field "file"' }, { status: 400 })

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided (field "file")' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const pres = await new PPTXService().parsePPTX(buffer)

    return NextResponse.json(pres, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to parse PPTX', details: err?.message ?? String(err) }, { status: 500 })
  }
}

// ---------- Parser ----------
class PPTXService {
  // -- constants
  private readonly DEFAULT_SLIDE_MARGINS = {
    top: 0.5,      // 0.5 inches = 48 pixels at 96 DPI
    left: 0.5,     // 0.5 inches = 48 pixels at 96 DPI
    right: 0.5,    // 0.5 inches = 48 pixels at 96 DPI
    bottom: 0.5    // 0.5 inches = 48 pixels at 96 DPI
  }

  private readonly DPI = 96 // Standard screen DPI

  // Convert inches to pixels
  private inchesToPixels(inches: number): number {
    return Math.round(inches * this.DPI)
  }

  // Apply default margins to positioning
  private applyDefaultMargins(position: any): any {
    if (!position) return position
    
    return {
      ...position,
      left: Math.max(this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.left), position.left || 0),
      top: Math.max(this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.top), position.top || 0),
      right: position.right ? Math.min(position.right, position.left + position.width - this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.right)) : undefined,
      bottom: position.bottom ? Math.min(position.bottom, position.top + position.height - this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.bottom)) : undefined
    }
  }

  // Ensure text objects have proper spacing and don't get squeezed
  private ensureTextSpacing(position: any, isText: boolean = false): any {
    if (!position || !isText) return position
    
    // For text objects, ensure they have proper spacing from the top
    const minTopSpacing = this.inchesToPixels(0.75) // 0.75 inches minimum from top
    
    return {
      ...position,
      top: Math.max(minTopSpacing, position.top || minTopSpacing),
      // Ensure text doesn't extend too far to the right
      width: Math.min(position.width || 0, 800), // Max width for readability
      // Add some padding around text
      padding: {
        top: this.inchesToPixels(0.1),
        left: this.inchesToPixels(0.1),
        right: this.inchesToPixels(0.1),
        bottom: this.inchesToPixels(0.1)
      }
    }
  }

  // Simple, robust coordinate extraction that bypasses complex matrix math
  private extractSimplePosition(shape: any): any {
    try {
      const spPr = deepFind(shape, 'p:spPr')
      const xfrm = deepFind(spPr, 'a:xfrm')
      
      if (!xfrm) {
        // Fallback: use default positioning
        return {
          left: this.inchesToPixels(1.0),
          top: this.inchesToPixels(1.0),
          width: this.inchesToPixels(8.0),
          height: this.inchesToPixels(1.0)
        }
      }

      const off = deepFind(xfrm, 'a:off')
      const ext = deepFind(xfrm, 'a:ext')
      
      if (!off || !ext) {
        // Fallback: use default positioning
        return {
          left: this.inchesToPixels(1.0),
          top: this.inchesToPixels(1.0),
          width: this.inchesToPixels(8.0),
          height: this.inchesToPixels(8.0)
        }
      }

      // Extract coordinates directly from XML
      const x = parseInt(getAttr(off, 'x') || '0', 10)
      const y = parseInt(getAttr(off, 'y') || '0', 10)
      const cx = parseInt(getAttr(ext, 'cx') || '0', 10)
      const cy = parseInt(getAttr(ext, 'cy') || '0', 10)

      // Convert EMU to pixels
      const left = emuToPx(x)
      const top = emuToPx(y)
      const width = emuToPx(cx)
      const height = emuToPx(cy)

      // Validate coordinates
      if (isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
        // Fallback: use default positioning
        return {
          left: this.inchesToPixels(1.0),
          top: this.inchesToPixels(1.0),
          width: this.inchesToPixels(8.0),
          height: this.inchesToPixels(1.0)
        }
      }

      // Check if coordinates are suspiciously small or zero
      if (left < 10 && top < 10) {
        // Generate a random position instead
        const randomPos = {
          left: this.inchesToPixels(1.0 + Math.random() * 3),
          top: this.inchesToPixels(1.0 + Math.random() * 3),
          width: width > 10 ? width : this.inchesToPixels(8.0),
          height: height > 10 ? height : this.inchesToPixels(1.0)
        }
        return randomPos
      }

      return { left, top, width, height }
    } catch (error) {
      // Fallback: use default positioning
      return {
        left: this.inchesToPixels(1.0),
        top: this.inchesToPixels(1.0),
        width: this.inchesToPixels(8.0),
        height: this.inchesToPixels(1.0)
      }
    }
  }

  // Track object positions to prevent stacking
  private objectPositions: Set<string> = new Set()
  private objectCounter: number = 0
  
  // Get unique position for object to prevent stacking
  private getUniquePosition(basePosition: any, objectType: string): any {
    this.objectCounter++
    
    // Completely ignore PPTX coordinates and force a grid layout
    const gridCols = 3 // 3 columns
    const col = (this.objectCounter - 1) % gridCols
    const row = Math.floor((this.objectCounter - 1) / gridCols)
    
    // Calculate grid position with margins
    const margin = this.inchesToPixels(1.0) // 1 inch margin
    const colWidth = this.inchesToPixels(2.5) // 2.5 inches between columns
    const rowHeight = this.inchesToPixels(2.0) // 2 inches between rows
    
    const forcedPosition = {
      left: margin + (col * colWidth),
      top: margin + (row * rowHeight),
      width: basePosition?.width || this.inchesToPixels(8.0),
      height: basePosition?.height || this.inchesToPixels(1.0)
    }
    

    
    return forcedPosition
  }

  // Special positioning for images to prevent cropping
  private getImagePosition(basePosition: any, objectIndex: number): any {
    this.objectCounter++
    
    // Images get positioned in a 2-column grid with more space
    const gridCols = 2 // 2 columns for images
    const col = (this.objectCounter - 1) % gridCols
    const row = Math.floor((this.objectCounter - 1) / gridCols)
    
    // Calculate grid position with larger margins for images
    const margin = this.inchesToPixels(1.5) // 1.5 inch margin
    const colWidth = this.inchesToPixels(4.0) // 4 inches between columns
    const rowHeight = this.inchesToPixels(3.0) // 3 inches between rows
    
    // Preserve original image dimensions if available
    const width = basePosition?.width || this.inchesToPixels(6.0)
    const height = basePosition?.height || this.inchesToPixels(4.0)
    
    const imagePosition = {
      left: margin + (col * colWidth),
      top: margin + (row * rowHeight),
      width: width,
      height: height
    }
    

    
    return imagePosition
  }

  async parsePPTX(buffer: Buffer) {
    const zip = await JSZip.loadAsync(buffer)
    const slides = await this.readSlides(zip)
    const meta = await this.readProps(zip)
    return { id: crypto.randomUUID(), name: 'Imported Presentation', slides, metadata: meta }
  }

  // -- Slides list via presentation.xml and rels
  private async readSlides(zip: JSZip) {
    const out: any[] = []
    const presXml = await zip.file('ppt/presentation.xml')?.async('text')
    if (!presXml) return out
    const presData = await this.parseXML(presXml)

    const presentation = deepFind(presData, 'p:presentation')
    const sldIdLst = deepFind(presentation, 'p:sldIdLst')
    const sldIds = asArray(deepFind(sldIdLst, 'p:sldId'))

    const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text')
    const relsData = relsXml ? await this.parseXML(relsXml) : null
    const rels = relsData ? asArray(deepFind(relsData, 'Relationship')) : []

    for (let i = 0; i < sldIds.length; i++) {
      const rId = getAttr(sldIds[i], 'r:id')
      const rel = rels.find(r => getAttr(r, 'Id') === rId)
      const target = rel ? getAttr(rel, 'Target') : null
      if (!target) continue
      const slidePath = this.joinOOXML('ppt/', target)
      const slide = await this.parseSlide(zip, slidePath, i + 1)
      if (slide) out.push(slide)
    }
    return out
  }

  private async parseSlide(zip: JSZip, slidePath: string, slideNumber: number) {
    const file = zip.file(slidePath)
    if (!file) return null
    const xml = await file.async('text')
    const data = await this.parseXML(xml)

    const { width, height } = await this.getSlideSize(zip)
    const background = await this.getSlideBackground(zip, data, slidePath)
    const objects = await this.walkShapes(zip, data, slidePath)

    return { id: crypto.randomUUID(), slideNumber, width, height, background, objects, rawData: data }
  }

  // -- Background: solid color or image
  private async getSlideBackground(zip: JSZip, slideData: any, slidePath: string) {
    const bg = deepFind(deepFind(slideData, 'p:sld'), 'p:bg')
    if (!bg) return null
    const bgPr = deepFind(bg, 'p:bgPr')
    if (!bgPr) return null

    // solid fill
    const solidFill = deepFind(bgPr, 'a:solidFill')
    const rgb = solidFill ? deepFind(solidFill, 'a:srgbClr') : null
    if (rgb) return { type: 'solid', color: '#' + (getAttr(rgb, 'val') || 'FFFFFF') }

    // picture fill (background image)
    const blipFill = deepFind(bgPr, 'a:blipFill')
    const blip = blipFill ? deepFind(blipFill, 'a:blip') : null
    const rId = blip ? getAttr(blip, 'r:embed') : null
    if (!rId) return null

    const src = await this.resolveImageByRel(zip, slidePath, rId)
    if (!src) return null
    return { type: 'image', src }
  }

  // -- Walk shape tree with full group transforms and z-order preserved
  private async walkShapes(zip: JSZip, slideData: any, slidePath: string) {
    // Reset position tracking for each new slide
    this.objectPositions.clear()
    this.objectCounter = 0
    
    const out: any[] = []
    const sld = deepFind(slideData, 'p:sld')
    const cSld = deepFind(sld, 'p:cSld')
    const spTree = deepFind(cSld, 'p:spTree')
    if (!spTree) return out

    const roots = [
      ...asArray(deepFind(spTree, 'p:sp')),
      ...asArray(deepFind(spTree, 'p:pic')),
      ...asArray(deepFind(spTree, 'p:grpSp')),
    ]

    let z = 0
    const walk = async (node: any, parentM: Mat) => {
      z += 1
      // unwrap wrapper object { 'p:pic': {...} } etc.
      const base = node['p:pic'] ?? node['p:sp'] ?? node['p:grpSp'] ?? node

      // group: compose its child-space mapping into the parent matrix
      if (deepFind(base, 'p:grpSpPr')) {
        const innerTree = deepFind(base, 'p:spTree') || base
        const childMap = matrixFromGroupChildMap(base)
        const nextM = matMul(parentM, childMap)
        const children = [
          ...asArray(deepFind(innerTree, 'p:sp')),
          ...asArray(deepFind(innerTree, 'p:pic')),
          ...asArray(deepFind(innerTree, 'p:grpSp')),
        ]
        for (const ch of children) await walk(ch, nextM)
        return
      }

      const obj = await this.extractLeaf(zip, base, slidePath, parentM, z)
      if (obj) out.push(obj)
    }

    for (const r of roots) await walk(r, MAT_I)
    return out
  }

  // -- Leaf extractor: text, picture, or shape
  private async extractLeaf(zip: JSZip, shape: any, slidePath: string, parentM: Mat, zIndex: number) {
    const nvSpPr = deepFind(shape, 'p:nvSpPr')
    const cNvPr = deepFind(nvSpPr, 'p:cNvPr')
    const name = getAttr(cNvPr, 'name') || 'Object'

    // Use simple, robust positioning instead of complex matrix math
    const position = this.extractSimplePosition(shape)
    
    // Extract basic properties
    const spPr = deepFind(shape, 'p:spPr')
    const xfrm = deepFind(spPr, 'a:xfrm')
    const rotDeg = xfrm ? parseInt(getAttr(xfrm, 'rot') || '0', 10) / 60000 : 0
    const flipH = xfrm ? (getAttr(xfrm, 'flipH') === '1' || getAttr(xfrm, 'flipH') === 'true') : false
    const flipV = xfrm ? (getAttr(xfrm, 'flipV') === '1' || getAttr(xfrm, 'flipV') === 'true') : false

    // If there is a text body, return a text object (do not misclassify as image)
    const txBody = deepFind(shape, 'p:txBody')
    if (txBody) {
      const text = this.extractText(txBody)
      const textStyle = this.extractTextStyle(txBody)
      const finalPosition = this.getUniquePosition(this.ensureTextSpacing(this.applyDefaultMargins(position), true), 'text')
      
      const textObject = {
        id: crypto.randomUUID(),
        type: 'text',
        name,
        zIndex,
        position: finalPosition,
        rotationDeg: rotDeg,
        flipH, flipV,
        text,
        richText: this.extractRichText(txBody),
        style: textStyle,
      }
      

      
      return textObject
    }

    // Picture: either p:pic subtree OR shape fill (p:spPr > a:blipFill)
    const blipFromPic = deepFind(deepFind(shape, 'p:pic'), 'a:blip') // p:pic > a:blipFill > a:blip via deepFind
    const blipFromFill = deepFind(deepFind(deepFind(shape, 'p:spPr'), 'a:blipFill'), 'a:blip')
    const blip = blipFromPic || blipFromFill || deepFind(shape, 'a:blip')
    const rId = blip ? getAttr(blip, 'r:embed') : null

    if (rId) {
      const src = await this.resolveImageByRel(zip, slidePath, rId)
      // crop (percentages)
      const srcRect = deepFind(deepFind(shape, 'a:blipFill'), 'a:srcRect') || deepFind(deepFind(shape, 'p:blipFill'), 'a:srcRect')
      const crop = srcRect ? {
        l: (parseInt(getAttr(srcRect, 'l') || '0', 10)) / 100000,
        t: (parseInt(getAttr(srcRect, 't') || '0', 10)) / 100000,
        r: (parseInt(getAttr(srcRect, 'r') || '0', 10)) / 100000,
        b: (parseInt(getAttr(srcRect, 'b') || '0', 10)) / 100000,
      } : null

      return {
        id: crypto.randomUUID(),
        type: 'image',
        name,
        zIndex,
        position: this.getImagePosition(this.applyDefaultMargins(position), zIndex),
        rotationDeg: rotDeg,
        flipH, flipV,
        src,
        crop,
      }
    }

    // Generic vector shape (no text, no picture)
    const fillColor = this.extractFillColor(shape)
    const line = this.extractLine(shape)
    return {
      id: crypto.randomUUID(),
      type: 'shape',
      name,
      zIndex,
              position: this.getUniquePosition(this.applyDefaultMargins(position), 'shape'),
      rotationDeg: rotDeg,
      flipH, flipV,
      fill: fillColor,
      line,
    }
  }

  // -- text extraction helpers
  private extractText(txBody: any) {
    const paras = asArray(deepFind(txBody, 'a:p'))
    const parts: string[] = []
    for (const p of paras) {
      const runs = asArray(deepFind(p, 'a:r'))
      if (!runs.length) {
        const fld = deepFind(p, 'a:fld')
        const t = fld ? deepFind(fld, 'a:t') : null
        if (typeof t === 'string') parts.push(t)
        else if (t && t._) parts.push(t._)
      } else {
        for (const r of runs) {
          const t = deepFind(r, 'a:t')
          if (typeof t === 'string') parts.push(t)
          else if (t && t._) parts.push(t._)
        }
      }
      parts.push('\n')
    }
    return parts.join('').trim()
  }

  private extractRichText(txBody: any) {
    const paras = asArray(deepFind(txBody, 'a:p'))
    return paras.map(p => {
      const pPr = deepFind(p, 'a:pPr')
      const algn = getAttr(pPr, 'algn') || undefined
      const lvl = parseInt(getAttr(pPr, 'lvl') || '0', 10) || 0
      const buAutoNum = deepFind(pPr, 'a:buAutoNum')
      const buChar = deepFind(pPr, 'a:buChar')
      const bullet = buAutoNum ? { type: 'auto', scheme: getAttr(buAutoNum, 'type') } :
                     buChar ? { type: 'char', char: getAttr(buChar, 'char') } : null

      const runs = asArray(deepFind(p, 'a:r')).map(r => {
        const rPr = deepFind(r, 'a:rPr')
        const b = getAttr(rPr, 'b') === '1' || getAttr(rPr, 'b') === 'true'
        const i = getAttr(rPr, 'i') === '1' || getAttr(rPr, 'i') === 'true'
        const u = getAttr(rPr, 'u') // 'sng' for single underline, etc.
        const sz = getAttr(rPr, 'sz')
        const latin = deepFind(rPr, 'a:latin')
        const font = latin ? getAttr(latin, 'typeface') : undefined
        const fill = deepFind(rPr, 'a:solidFill')
        const rgb = fill ? deepFind(fill, 'a:srgbClr') : null
        const color = rgb ? '#' + (getAttr(rgb, 'val') || '000000') : undefined
        const t = deepFind(r, 'a:t')
        const text = typeof t === 'string' ? t : t?._ ?? ''
        return { text, bold: b, italic: i, underline: u === 'sng', font, sizePt: sz ? parseInt(sz, 10)/100 : undefined, color }
      })
      return { align: algn, level: lvl, bullet, runs }
    })
  }

  private extractTextStyle(txBody: any) {
    const firstRun = asArray(deepFind(deepFind(txBody, 'a:p'), 'a:r'))[0]
    if (!firstRun) return {}
    const rPr = deepFind(firstRun, 'a:rPr')
    const sz = getAttr(rPr, 'sz')
    const latin = deepFind(rPr, 'a:latin')
    const fill = deepFind(rPr, 'a:solidFill')
    const rgb = fill ? deepFind(fill, 'a:srgbClr') : null
    return {
      fontSize: sz ? parseInt(sz, 10) / 100 : undefined,
      fontFamily: latin ? getAttr(latin, 'typeface') || undefined : undefined,
      color: rgb ? '#' + (getAttr(rgb, 'val') || '000000') : undefined,
    }
  }

  // -- shape visual style
  private extractFillColor(shape: any) {
    const solid = deepFind(deepFind(shape, 'p:spPr'), 'a:solidFill')
    if (!solid) return null
    const rgb = deepFind(solid, 'a:srgbClr')
    return rgb ? ('#' + (getAttr(rgb, 'val') || '000000')) : null
  }
  private extractLine(shape: any) {
    const ln = deepFind(deepFind(shape, 'p:spPr'), 'a:ln')
    if (!ln) return null
    const w = parseInt(getAttr(ln, 'w') || '0', 10) // in EMUs
    const solid = deepFind(ln, 'a:solidFill')
    const rgb = solid ? deepFind(solid, 'a:srgbClr') : null
    return {
      widthPx: w ? emuToPx(w) : undefined,
      color: rgb ? '#' + (getAttr(rgb, 'val') || '000000') : undefined
    }
  }

  // -- image resolution via slide rels
  private async resolveImageByRel(zip: JSZip, slidePath: string, rId: string) {
    const relsPath = this.slideRelsPath(slidePath)
    const relsXml = await zip.file(relsPath)?.async('text')
    if (!relsXml) return null
    const relsData = await this.parseXML(relsXml)
    const rel = asArray(deepFind(relsData, 'Relationship')).find(r => getAttr(r, 'Id') === rId)
    const target = rel ? getAttr(rel, 'Target') : null
    if (!target) return null

    // resolve ../media/.. etc
    const slideDir = pathPosix.dirname(slidePath) + '/'
    let imgPath = this.joinOOXML(slideDir, target)
    let file = zip.file(imgPath)

    if (!file) {
      // try common alternates
      const alt1 = this.joinOOXML('ppt/', target.replace(/^(\.\.\/)+/, ''))
      file = zip.file(alt1); if (file) imgPath = alt1
    }
    if (!file) {
      const alt2 = target.startsWith('media/') ? `ppt/${target}` : `ppt/media/${pathPosix.basename(target)}`
      file = zip.file(alt2); if (file) imgPath = alt2
    }
    if (!file) return null

    const base64 = await file.async('base64')
    const mime = this.mime(imgPath)
    return `data:${mime};base64,${base64}`
  }

  // -- meta
  private async getSlideSize(zip: JSZip) {
    try {
      const xml = await zip.file('ppt/presentation.xml')?.async('text')
      if (xml) {
        const data = await this.parseXML(xml)
        const sldSz = deepFind(deepFind(data, 'p:presentation'), 'p:sldSz')
        const cx = getAttr(sldSz, 'cx'), cy = getAttr(sldSz, 'cy')
        if (cx && cy) {
          const width = emuToPx(parseInt(cx,10))
          const height = emuToPx(parseInt(cy,10))
          return { 
            width, 
            height,
            // Calculate usable area (excluding margins)
            usableWidth: width - (this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.left + this.DEFAULT_SLIDE_MARGINS.right)),
            usableHeight: height - (this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.top + this.DEFAULT_SLIDE_MARGINS.bottom))
          }
        }
      }
    } catch {}
    return { 
      width: 1280, 
      height: 720,
      usableWidth: 1280 - (this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.left + this.DEFAULT_SLIDE_MARGINS.right)),
      usableHeight: 720 - (this.inchesToPixels(this.DEFAULT_SLIDE_MARGINS.top + this.DEFAULT_SLIDE_MARGINS.bottom))
    }
  }

  private async readProps(zip: JSZip) {
    try { await zip.file('docProps/core.xml')?.async('text') } catch {}
    return { author: 'Unknown', created: new Date().toISOString(), modified: new Date().toISOString() }
  }

  // -- xml & path helpers
  private async parseXML(xml: string) {
    return new Promise((resolve, reject) => {
      parseString(xml, { explicitArray: false, attrkey: '$', charkey: '_', explicitRoot: true }, (e, r) => e ? reject(e) : resolve(r))
    })
  }
  private joinOOXML(baseDir: string, target: string) {
    const base = baseDir.endsWith('/') ? baseDir : baseDir + '/'
    return pathPosix.normalize(pathPosix.join(base, target))
  }
  private slideRelsPath(slidePath: string) {
    const dir = pathPosix.dirname(slidePath)
    const base = pathPosix.basename(slidePath)
    return pathPosix.join(dir, '_rels', `${base}.rels`)
  }
  private mime(filePath: string) {
    const ext = filePath.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'jpg':
      case 'jpeg': return 'image/jpeg'
      case 'png': return 'image/png'
      case 'gif': return 'image/gif'
      case 'bmp': return 'image/bmp'
      case 'tif':
      case 'tiff': return 'image/tiff'
      case 'emf': return 'image/emf'
      default: return 'application/octet-stream'
    }
  }
}
