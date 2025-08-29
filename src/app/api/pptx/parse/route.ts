import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { parseString } from 'xml2js'
import crypto from 'node:crypto'
import pathPosix from 'node:path/posix'

export const runtime = 'nodejs' // ensure Node runtime for Buffer/form-data

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting PPTX parsing...')
    console.log('🔍 Environment:', process.env.NODE_ENV)
    console.log('🔍 Runtime:', process.env.NEXT_RUNTIME)
    
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      console.log('❌ Invalid content type:', contentType)
      return NextResponse.json({ error: 'Send multipart/form-data with field "file"' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json({ error: 'No file provided (expect field "file")' }, { status: 400 })
    }

    console.log('📁 Processing file:', file.name, 'Size:', file.size, 'bytes')

    // Check file size limit for Vercel (reduced to 2MB for safety)
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2MB for Vercel deployment.' 
      }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('📦 Buffer created, size:', buffer.length)

    // Add memory usage logging
    const memUsage = process.memoryUsage()
    console.log('🧠 Memory usage before parsing:', {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    })

    const pptxService = new PPTXService()
    
    // Add timeout wrapper for Vercel
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Parsing timeout - function took too long')), 50000) // 50 second timeout
    })
    
    const parsingPromise = pptxService.parsePPTX(buffer)
    
    const presentation = await Promise.race([parsingPromise, timeoutPromise])

    console.log('✅ Parsing completed successfully')
    
    // Log final memory usage
    const finalMemUsage = process.memoryUsage()
    console.log('🧠 Memory usage after parsing:', {
      rss: Math.round(finalMemUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(finalMemUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(finalMemUsage.heapTotal / 1024 / 1024) + 'MB'
    })
    
    return NextResponse.json(presentation)
  } catch (error) {
    console.error('❌ Error parsing PPTX file:', error)
    
          // Provide more specific error messages
      if (error instanceof Error) {
        const errorResponse: any = {
          error: 'Failed to parse PPTX file',
          details: error.message,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          runtime: process.env.NEXT_RUNTIME || 'unknown'
        }
        
        // Add stack trace in development
        if (process.env.NODE_ENV === 'development') {
          errorResponse.stack = error.stack
        }
        
        console.error('❌ Detailed error response:', errorResponse)
        return NextResponse.json(errorResponse, { status: 500 })
      }
    
    return NextResponse.json({ 
      error: 'Failed to parse PPTX file',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

class PPTXService {
  private parsedPresentations: Map<string, any> = new Map()

  async parsePPTX(buffer: Buffer): Promise<any> {
    try {
      console.log('🔍 Starting PPTX parsing with buffer size:', buffer.length)
      
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Empty or invalid buffer provided')
      }
      
      // Check if buffer is too large for serverless
      if (buffer.length > 2 * 1024 * 1024) { // 2MB
        throw new Error(`Buffer too large: ${buffer.length} bytes (max: 2MB)`)
      }
      
      const zip = await JSZip.loadAsync(buffer)
      console.log('📦 JSZip loaded successfully')

      // Debug inventory
      const fileNames = Object.keys(zip.files)
      console.log('🔍 PPTX zip contents count:', fileNames.length)
      
      // Check if this looks like a valid PPTX
      if (!fileNames.some(name => name.startsWith('ppt/'))) {
        throw new Error('Invalid PPTX file: missing ppt/ directory')
      }
      
      for (const fileName of fileNames) {
        if (fileName.startsWith('ppt/media/')) console.log(`🖼️  media: ${fileName}`)
        else if (fileName.includes('/_rels/') && fileName.endsWith('.rels')) console.log(`🔗 rels: ${fileName}`)
        else if (fileName.startsWith('ppt/slides/slide')) console.log(`📄 slide: ${fileName}`)
      }

      const slides = await this.readSlides(zip)
      console.log('📊 Slides parsed:', slides.length)
      
      if (slides.length === 0) {
        console.warn('⚠️ No slides found in PPTX file')
      }
      
      const properties = await this.readPresentationProps(zip)
      console.log('📋 Properties parsed')

      const presentation = {
        id: this.generateId(),
        name: 'Imported Presentation',
        slides,
        metadata: properties,
      }

      this.parsedPresentations.set(presentation.id, presentation)
      console.log('✅ Presentation object created successfully')
      return presentation
    } catch (error) {
      console.error('❌ Error in parsePPTX:', error)
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message)
        console.error('❌ Error stack:', error.stack)
        
        // Provide more specific error messages for common issues
        if (error.message.includes('JSZip')) {
          throw new Error('Failed to read PPTX file - file may be corrupted or not a valid PPTX')
        }
        if (error.message.includes('XML')) {
          throw new Error('Failed to parse PPTX content - file structure may be invalid')
        }
        if (error.message.includes('memory') || error.message.includes('Memory')) {
          throw new Error('Parsing failed due to memory constraints - try a smaller file')
        }
      }
      throw error
    }
  }

  async getSlide(slideId: string): Promise<any | null> {
    const presentations = Array.from(this.parsedPresentations.values())
    for (const presentation of presentations) {
      const slide = presentation.slides.find((s: any) => s.id === slideId)
      if (slide) return slide
    }
    return null
  }

  async exportPPTX(presentationData: any): Promise<Buffer> {
    const zip = new JSZip()
    zip.file('doc.txt', JSON.stringify(presentationData, null, 2))
    return await zip.generateAsync({ type: 'nodebuffer' })
  }

  private async readSlides(zip: JSZip): Promise<any[]> {
    const slides: any[] = []
    try {
      const presentationXml = await zip.file('ppt/presentation.xml')?.async('text')
      if (!presentationXml) {
        console.warn('No presentation.xml found.')
        return slides
      }

      const presentationData = await this.parseXML(presentationXml)
      const presentation = this.findElement(presentationData, 'p:presentation')
      if (!presentation) {
        console.warn('❌ No p:presentation element found')
        return slides
      }

      const sldIdLst = this.findElement(presentation, 'p:sldIdLst')
      if (!sldIdLst) {
        console.warn('❌ No p:sldIdLst in presentation')
        return slides
      }

      const sldIds = this.findElements(sldIdLst, 'p:sldId')
      // Read presentation-level relationships (slide targets)
      const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text')
      const presRels = relsXml ? await this.parseXML(relsXml) : null
      const relationships = presRels ? this.findElements(presRels.Relationships, 'Relationship') : []

      for (let i = 0; i < sldIds.length; i++) {
        const sldId = sldIds[i]
        const rId = this.getAttribute(sldId, 'r:id')
        if (!rId) continue

        // Resolve slide target path, e.g., "slides/slide1.xml"
        let slideTarget: string | null = null
        for (const rel of relationships) {
          if (this.getAttribute(rel, 'Id') === rId) {
            slideTarget = this.getAttribute(rel, 'Target')
            break
          }
        }
        if (!slideTarget) continue

        const slideFilePath = this.resolveOOXMLPath('ppt/', slideTarget) // -> e.g., 'ppt/slides/slide1.xml'
        const slide = await this.parseSlide(zip, slideFilePath, i + 1)
        if (slide) slides.push(slide)
      }
    } catch (error) {
      console.error('❌ Error reading slides:', error)
    }

    console.log(`📊 Total slides loaded: ${slides.length}`)
    return slides
  }

  private async parseSlide(zip: JSZip, slideFilePath: string, slideNumber: number): Promise<any | null> {
    try {
      const slideFile = zip.file(slideFilePath)
      if (!slideFile) {
        console.warn(`Slide file not found: ${slideFilePath}`)
        return null
      }
      const slideContent = await slideFile.async('text')
      const slideData = await this.parseXML(slideContent)
      const objects = await this.extractSlideObjects(slideData, zip, slideNumber, slideFilePath)
      
      // Get slide dimensions from presentation properties or use standard PPTX dimensions
      const slideDimensions = await this.getSlideDimensions(zip)
      
      // Calculate scale factor for positioning (assuming original was 2560x1440)
      const originalWidth = 2560
      const originalHeight = 1440
      const scaleX = slideDimensions.width / originalWidth
      const scaleY = slideDimensions.height / originalHeight
      
      // Scale down all object positions to match the new slide dimensions
      const scaledObjects = objects.map(obj => {
        if (obj.position) {
          return {
            ...obj,
            position: {
              left: Math.round(obj.position.left * scaleX),
              top: Math.round(obj.position.top * scaleY),
              width: Math.round(obj.position.width * scaleX),
              height: Math.round(obj.position.height * scaleY),
              raw: obj.position.raw
            }
          }
        }
        return obj
      })
      
      return {
        id: this.generateId(),
        slideNumber,
        width: slideDimensions.width,
        height: slideDimensions.height,
        objects: scaledObjects,
        rawData: slideData,
      }
    } catch (error) {
      console.error(`Error parsing slide ${slideNumber}:`, error)
      return null
    }
  }

  private async extractSlideObjects(
    slideData: any,
    zip: JSZip,
    slideNumber: number,
    slideFilePath: string
  ): Promise<any[]> {
    const objects: any[] = []

    const slide = this.findElement(slideData, 'p:sld')
    if (!slide) return objects
    const cSld = this.findElement(slide, 'p:cSld')
    if (!cSld) return objects
    const spTree = this.findElement(cSld, 'p:spTree')
    if (!spTree) return objects

    const allShapes = [
      ...this.findElements(spTree, 'p:sp'),
      ...this.findElements(spTree, 'p:grpSp'),
      ...this.findElements(spTree, 'p:pic'),
    ]

    for (let i = 0; i < allShapes.length; i++) {
      const shape = allShapes[i]
      const obj = await this.extractBasicShape(shape, i, zip, slideNumber, slideFilePath)
      if (obj) objects.push(obj)
    }

    return objects
  }

  private async extractBasicShape(
    shape: any,
    index: number,
    zip: JSZip,
    slideNumber: number,
    slideFilePath: string
  ): Promise<any | null> {
    try {
      const nvSpPr = this.findElement(shape, 'p:nvSpPr')
      const cNvPr = this.findElement(nvSpPr, 'p:cNvPr')
      const name = this.getAttribute(cNvPr, 'name') || `Shape ${index + 1}`

      const isPicture =
        !!shape['p:pic'] || !!shape['p:nvPicPr'] || !!shape['p:picPr'] || !!this.findBlipFillRecursively(shape)

      if (isPicture) {
        const imageObject = await this.extractImage(shape, zip, slideNumber, slideFilePath)
        if (imageObject) return imageObject
      }

      const txBody = this.findElement(shape, 'p:txBody')
      let textContent = ''
      let textStyle = {}
      
      if (txBody) {
        textContent = this.extractTextContent(txBody)
        textStyle = this.extractTextStyle(txBody)
      }

      // Extract positioning information
      const position = this.extractTextPosition(shape)

      return {
        id: this.generateId(),
        type: 'text',
        name,
        text: textContent,
        style: textStyle,
        position,
        rawData: shape,
      }
    } catch (error) {
      console.error(`Error extracting basic shape ${index}:`, error)
      return null
    }
  }

  private extractTextContent(txBody: any): string {
    try {
      const paragraphs = this.findElements(txBody, 'a:p')
      let text = ''
      for (const p of paragraphs) {
        const runs = this.findElements(p, 'a:r')
        for (const r of runs) {
          const t = this.findElement(r, 'a:t')
          if (!t) continue
          if (typeof t === 'string') text += t
          else if (t._) text += t._
          else if (t.$?.val) text += t.$.val
        }
        text += '\n'
      }
      return text.trim()
    } catch {
      return ''
    }
  }

  private async extractImage(
    shape: any,
    zip: JSZip,
    slideNumber: number,
    slideFilePath: string
  ): Promise<any | null> {
    console.log(`🔍 Starting image extraction for slide ${slideNumber}`)
    console.log(`🔍 Shape structure:`, JSON.stringify(shape, null, 2))
    
    // 1) Find r:embed (relationship id) from <a:blip r:embed="rIdX">
    let rId: string | null = null

    // Method 1: p:pic branch
    if (shape['p:pic']) {
      console.log(`🔍 Found p:pic, checking for blipFill`)
      const blipFill = this.findElement(shape['p:pic'], 'a:blipFill')
      if (blipFill) {
        const blip = this.findElement(blipFill, 'a:blip')
        if (blip) {
          rId = this.getAttribute(blip, 'r:embed')
          console.log(`🔍 Found rId from p:pic: ${rId}`)
        }
      }
    }
    
    // Method 2: nvPicPr/picPr branch
    if (!rId && shape['p:nvPicPr']) {
      console.log(`🔍 Found p:nvPicPr, checking for picPr`)
      const picPr = this.findElement(shape, 'p:picPr')
      if (picPr) {
        const blipFill = this.findElement(picPr, 'a:blipFill')
        if (blipFill) {
          const blip = this.findElement(blipFill, 'a:blip')
          if (blip) {
            rId = this.getAttribute(blip, 'r:embed')
            console.log(`🔍 Found rId from p:nvPicPr: ${rId}`)
          }
        }
      }
      
      // Also check if blipFill is directly in the shape (not in picPr)
      if (!rId && shape['p:blipFill']) {
        console.log(`🔍 Found p:blipFill directly in shape with p:nvPicPr`)
        const blip = this.findElement(shape['p:blipFill'], 'a:blip')
        if (blip) {
          rId = this.getAttribute(blip, 'r:embed')
          console.log(`🔍 Found rId from direct blipFill: ${rId}`)
        }
      }
    }
    
    // Method 3: Check for blipFill anywhere in the shape
    if (!rId) {
      console.log(`🔍 Checking for blipFill anywhere in shape`)
      const anyBlipFill = this.findBlipFillRecursively(shape)
      if (anyBlipFill) {
        const blip = this.findElement(anyBlipFill, 'a:blip')
        if (blip) {
          rId = this.getAttribute(blip, 'r:embed')
          console.log(`🔍 Found rId from recursive search: ${rId}`)
        }
      }
    }
    
    // Method 3.5: Check for blipFill directly in the shape (common case)
    if (!rId && shape['p:blipFill']) {
      console.log(`🔍 Found p:blipFill directly in shape`)
      const blip = this.findElement(shape['p:blipFill'], 'a:blip')
      if (blip) {
        rId = this.getAttribute(blip, 'r:embed')
        console.log(`🔍 Found rId from direct shape blipFill: ${rId}`)
      }
    }
    
    // Method 4: Check for different image storage methods
    if (!rId) {
      console.log(`🔍 Checking for alternative image storage methods`)
      
      // Look for graphicFrame elements
      if (shape['p:graphicFrame']) {
        console.log(`🔍 Found p:graphicFrame, checking for blipFill`)
        const blipFill = this.findBlipFillRecursively(shape['p:graphicFrame'])
        if (blipFill) {
          const blip = this.findElement(blipFill, 'a:blip')
          if (blip) {
            rId = this.getAttribute(blip, 'r:embed')
            console.log(`🔍 Found rId from graphicFrame: ${rId}`)
          }
        }
      }
      
      // Look for oleObj elements
      if (!rId && shape['p:oleObj']) {
        console.log(`🔍 Found p:oleObj, checking for blipFill`)
        const blipFill = this.findBlipFillRecursively(shape['p:oleObj'])
        if (blipFill) {
          const blip = this.findElement(blipFill, 'a:blip')
          if (blip) {
            rId = this.getAttribute(blip, 'r:embed')
            console.log(`🔍 Found rId from oleObj: ${rId}`)
          }
        }
      }
    }

    if (!rId) {
      console.log(`❌ No r:embed found for image on slide ${slideNumber}`)
      console.log(`🔍 Shape keys:`, Object.keys(shape))
      
      // Debug: Log all attributes to see what we might be missing
      if (shape.$) {
        console.log(`🔍 Shape attributes:`, shape.$)
      }
      
      // Check if this might be a different type of image container
      const allKeys = this.getAllKeysRecursively(shape)
      console.log(`🔍 All keys found in shape:`, allKeys)
      
      return null
    }

    console.log(`✅ Found image with rId: ${rId}`)

    // 2) Resolve image Target via slide relationships
    const relsPath = this.slideRelsPath(slideFilePath)
    const relsXml = await zip.file(relsPath)?.async('text')
    if (!relsXml) {
      console.log(`❌ No relationships for slide at ${relsPath}`)
      return null
    }

    const relsData = await this.parseXML(relsXml)
    const relationships = this.findElements(relsData.Relationships, 'Relationship')
    let target: string | null = null
    
    console.log(`🔍 Found ${relationships.length} relationships in slide ${slideNumber}`)
    
    for (const rel of relationships) {
      if (this.getAttribute(rel, 'Id') === rId) {
        target = this.getAttribute(rel, 'Target')
        console.log(`✅ Found matching relationship: ${rId} -> ${target}`)
        break
      }
    }
    
    if (!target) {
      console.log(`❌ No Target found for image rId ${rId}`)
      return null
    }

    // 3) Normalize OOXML relative path (handles '../media/image1.png')
    const slideDir = pathPosix.dirname(slideFilePath) + '/'
    const imagePath = this.resolveOOXMLPath(slideDir, target)

    // 4) Fetch image bytes (with a couple of safe fallbacks)
    const triedPaths = [imagePath]
    let imageFile = zip.file(imagePath)

    if (!imageFile) {
      // Try common alternate: many PPTX store images under 'ppt/media/*'
      const alt1 = this.resolveOOXMLPath('ppt/', target.replace(/^(\.\.\/)+/, ''))
      triedPaths.push(alt1)
      imageFile = zip.file(alt1)
    }
    if (!imageFile) {
      // Last resort: if target already points into media, ensure prefix
      const alt2 = target.startsWith('media/') ? `ppt/${target}` : `ppt/media/${pathPosix.basename(target)}`
      triedPaths.push(alt2)
      imageFile = zip.file(alt2)
    }

    if (!imageFile) {
      console.log(`❌ Image file not found at paths:`, triedPaths)
      return null
    }

    const base64 = await imageFile.async('base64')
    if (!base64) return null

    const mime = this.getImageMimeType(imageFile.name)
    console.log(`✅ Successfully extracted image: ${imageFile.name}, size: ${base64.length} bytes`)
    
    // Extract positioning and layout information
    const position = this.extractImagePosition(shape)
    console.log(`🔍 Extracted position data:`, position)
    
    return {
      id: this.generateId(),
      type: 'image',
      name: pathPosix.basename(imageFile.name),
      src: `data:${mime};base64,${base64}`,
      position, // Add positioning data
      rawData: shape,
    }
  }

  private slideRelsPath(slideFilePath: string): string {
    // 'ppt/slides/slideX.xml' -> 'ppt/slides/_rels/slideX.xml.rels'
    const dir = pathPosix.dirname(slideFilePath)
    const base = pathPosix.basename(slideFilePath)
    return pathPosix.join(dir, '_rels', `${base}.rels`)
  }

  private resolveOOXMLPath(baseDir: string, target: string): string {
    // OOXML uses POSIX-like relative paths; normalize "../" segments
    // Ensure baseDir ends with '/'
    const base = baseDir.endsWith('/') ? baseDir : `${baseDir}/`
    return pathPosix.normalize(pathPosix.join(base, target))
  }

  private getImageMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'bmp':
        return 'image/bmp'
      case 'tiff':
      case 'tif':
        return 'image/tiff'
      case 'emf':
        return 'image/emf'
      default:
        return 'application/octet-stream'
    }
  }

  private async readPresentationProps(zip: JSZip): Promise<any> {
    try {
      const coreProps = zip.file('docProps/core.xml')
      if (coreProps) {
        const content = await coreProps.async('text')
        // You can parse `content` if needed; return placeholders for now
        return {
          author: 'Unknown',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        }
      }
    } catch (error) {
      console.error('Error reading presentation properties:', error)
    }
    return {}
  }

  private generateId(): string {
    return crypto.randomUUID()
  }

  private async parseXML(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (!xmlString || typeof xmlString !== 'string') {
          reject(new Error('Invalid XML string provided'))
          return
        }
        
        console.log('🔍 Parsing XML, length:', xmlString.length)
        
        parseString(
          xmlString,
          {
            explicitArray: false,
            // preserve attributes in .$ and content in ._
            attrkey: '$',
            charkey: '_',
            xmlns: false,
            explicitRoot: true,
          },
          (err, result) => {
            if (err) {
              console.error('❌ XML parsing error:', err)
              reject(err)
            } else {
              console.log('✅ XML parsed successfully')
              resolve(result)
            }
          }
        )
      } catch (error) {
        console.error('❌ Error in parseXML wrapper:', error)
        reject(error)
      }
    })
  }

  private findElement(data: any, tagName: string): any {
    if (!data) return undefined
    // Try namespaced key (e.g., 'p:sld') then non-namespaced ('sld')
    if (data[tagName] !== undefined) return data[tagName]
    const plain = tagName.includes(':') ? tagName.split(':')[1] : tagName
    if (data[plain] !== undefined) return data[plain]
    return undefined
  }

  private findElements(data: any, tagName: string): any[] {
    const el = this.findElement(data, tagName)
    if (!el) return []
    return Array.isArray(el) ? el : [el]
  }

  private getAttribute(element: any, attrName: string): string | null {
    if (!element || !element.$) return null
    return element.$[attrName] ?? null
  }

  private findBlipFillRecursively(obj: any): any {
    if (!obj || typeof obj !== 'object') return null
    if (obj['a:blipFill']) return obj['a:blipFill']
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if (v && typeof v === 'object') {
        const found = this.findBlipFillRecursively(v)
        if (found) return found
      }
    }
    return null
  }

  private getAllKeysRecursively(obj: any): string[] {
    const keys: string[] = []
    for (const key in obj) {
      keys.push(key)
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...this.getAllKeysRecursively(obj[key]))
      }
    }
    return keys
  }

  private extractImagePosition(shape: any): any {
    try {
      const spPr = this.findElement(shape, 'p:spPr')
      if (!spPr) return null
      
      const xfrm = this.findElement(spPr, 'a:xfrm')
      if (!xfrm) return null
      
      const off = this.findElement(xfrm, 'a:off')
      const ext = this.findElement(xfrm, 'a:ext')
      
      if (!off || !ext) return null
      
      // Extract position and size (these are in EMUs - English Metric Units)
      const x = parseInt(this.getAttribute(off, 'x') || '0')
      const y = parseInt(this.getAttribute(off, 'y') || '0')
      const cx = parseInt(this.getAttribute(ext, 'cx') || '0')
      const cy = parseInt(this.getAttribute(ext, 'cy') || '0')
      
      // Convert EMUs to pixels (1 inch = 914400 EMUs, assuming 96 DPI)
      const emuToPixels = 96 / 914400
      
      const position = {
        left: Math.round(x * emuToPixels),
        top: Math.round(y * emuToPixels),
        width: Math.round(cx * emuToPixels),
        height: Math.round(cy * emuToPixels),
        // Keep raw EMU values for reference
        raw: { x, y, cx, cy }
      }
      
      console.log(`🔍 Converted EMU to pixels:`, position)
      return position
      
    } catch (error) {
      console.error('Error extracting image position:', error)
      return null
    }
  }

  private extractTextStyle(txBody: any): any {
    try {
      const style: any = {}
      
      // Extract default paragraph properties
      const defPPr = this.findElement(txBody, 'a:defPPr')
      if (defPPr) {
        const algn = this.findElement(defPPr, 'a:algn')
        if (algn) {
          style.textAlign = this.getAttribute(algn, 'val') || 'left'
        }
      }
      
      // Extract text run properties for font information
      const paragraphs = this.findElements(txBody, 'a:p')
      if (paragraphs.length > 0) {
        const firstP = paragraphs[0]
        const runs = this.findElements(firstP, 'a:r')
        if (runs.length > 0) {
          const firstRun = runs[0]
          const rPr = this.findElement(firstRun, 'a:rPr')
          if (rPr) {
            const sz = this.findElement(rPr, 'a:sz')
            if (sz) {
              style.fontSize = parseInt(this.getAttribute(sz, 'val') || '18') / 100 // Convert from centipoints
            }
            
            const latin = this.findElement(rPr, 'a:latin')
            if (latin) {
              style.fontFamily = this.getAttribute(latin, 'typeface') || 'Arial'
            }
            
            const solidFill = this.findElement(rPr, 'a:solidFill')
            if (solidFill) {
              const srgbClr = this.findElement(solidFill, 'a:srgbClr')
              if (srgbClr) {
                style.color = '#' + (this.getAttribute(srgbClr, 'val') || '000000')
              }
            }
          }
        }
      }
      
      return style
    } catch (error) {
      console.error('Error extracting text style:', error)
      return {}
    }
  }

  private extractTextPosition(shape: any): any {
    try {
      const spPr = this.findElement(shape, 'p:spPr')
      if (!spPr) return null
      
      const xfrm = this.findElement(spPr, 'a:xfrm')
      if (!xfrm) return null
      
      const off = this.findElement(xfrm, 'a:off')
      const ext = this.findElement(xfrm, 'a:ext')
      
      if (!off || !ext) return null
      
      // Extract position and size (these are in EMUs - English Metric Units)
      const x = parseInt(this.getAttribute(off, 'x') || '0')
      const y = parseInt(this.getAttribute(off, 'y') || '0')
      const cx = parseInt(this.getAttribute(ext, 'cx') || '0')
      const cy = parseInt(this.getAttribute(ext, 'cy') || '0')
      
      // Convert EMUs to pixels (1 inch = 914400 EMUs, assuming 96 DPI)
      const emuToPixels = 96 / 914400
      
      const position = {
        left: Math.round(x * emuToPixels),
        top: Math.round(y * emuToPixels),
        width: Math.round(cx * emuToPixels),
        height: Math.round(cy * emuToPixels),
        // Keep raw EMU values for reference
        raw: { x, y, cx, cy }
      }
      
      console.log(`🔍 Converted text position EMU to pixels:`, position)
      return position
      
    } catch (error) {
      console.error('Error extracting text position:', error)
      return null
    }
  }

  private async getSlideDimensions(zip: JSZip): Promise<{ width: number; height: number }> {
    try {
      // Try to get dimensions from presentation properties first
      const presentationProps = await zip.file('ppt/presentation.xml')?.async('text')
      if (presentationProps) {
        const presData = await this.parseXML(presentationProps)
        const presentation = this.findElement(presData, 'p:presentation')
        if (presentation) {
          const sldSz = this.findElement(presentation, 'p:sldSz')
          if (sldSz) {
            const cx = this.getAttribute(sldSz, 'cx')
            const cy = this.getAttribute(sldSz, 'cy')
            if (cx && cy) {
              // Convert EMUs to pixels (1 inch = 914400 EMUs, assuming 96 DPI)
              const emuToPixels = 96 / 914400
              const rawWidth = Math.round(parseInt(cx) * emuToPixels)
              const rawHeight = Math.round(parseInt(cy) * emuToPixels)
              
              // Scale down to a reasonable display size while maintaining aspect ratio
              // Target max dimension of 1200px
              const maxDimension = 1200
              const scale = Math.min(maxDimension / rawWidth, maxDimension / rawHeight)
              const width = Math.round(rawWidth * scale)
              const height = Math.round(rawHeight * scale)
              
              console.log(`🔍 Found slide dimensions from presentation: ${rawWidth}x${rawHeight} pixels`)
              console.log(`🔍 Scaled down to: ${width}x${height} pixels (scale: ${scale.toFixed(3)})`)
              return { width, height }
            }
          }
        }
      }
      
      // Fallback to standard PowerPoint dimensions
      // Standard PowerPoint: 13.33" x 7.5" at 96 DPI = 1280 x 720 pixels
      // Widescreen: 13.33" x 7.5" at 96 DPI = 1280 x 720 pixels
      // Standard 4:3: 10" x 7.5" at 96 DPI = 960 x 720 pixels
      
      console.log(`🔍 Using standard PowerPoint dimensions: 1280x720 pixels`)
      return { width: 1280, height: 720 }
      
    } catch (error) {
      console.error('Error getting slide dimensions:', error)
      // Fallback to standard dimensions
      return { width: 1280, height: 720 }
    }
  }
}
