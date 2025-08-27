import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { parseString } from 'xml2js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📁 Processing file:', file.name)
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parse the PPTX file
    const pptxService = new PPTXService()
    const presentation = await pptxService.parsePPTX(buffer)
    
    console.log('✅ Parsing completed successfully')
    return NextResponse.json(presentation)
    
  } catch (error) {
    console.error('❌ Error parsing PPTX file:', error)
    return NextResponse.json(
      { error: 'Failed to parse PPTX file' },
      { status: 500 }
    )
  }
}

// PPTX Service class (moved from backend)
class PPTXService {
  private parsedPresentations: Map<string, any> = new Map()

  async parsePPTX(buffer: Buffer): Promise<any> {
    try {
      const zip = await JSZip.loadAsync(buffer)
      
      const slides = await this.readSlides(zip)
      const properties = await this.readPresentationProps(zip)

      const presentation = {
        id: this.generateId(),
        name: 'Imported Presentation',
        slides,
        metadata: properties,
      }
      
      this.parsedPresentations.set(presentation.id, presentation)
      console.log('✅ Parsing completed successfully')
      return presentation
    } catch (error) {
      console.error('❌ Error parsing PPTX file:', error)       
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
    // Placeholder for export logic
    console.log('🚧 Exporting PPTX (placeholder)')
    const zip = new JSZip()
    zip.file("doc.txt", JSON.stringify(presentationData, null, 2))
    const content = await zip.generateAsync({ type: "nodebuffer" })
    return content
  }

  private async readSlides(zip: JSZip): Promise<any[]> {
    const slides: any[] = []
    try {
      const presentationXml = await zip.file('ppt/presentation.xml')?.async('text')
      if (!presentationXml) {
        console.warn('No presentation.xml found.')
        return []
      }
      
      console.log('📄 Found presentation.xml, length:', presentationXml.length)
      
      // Parse XML using xml2js
      const presentationData = await this.parseXML(presentationXml)
      console.log('🔍 Parsed presentation data:', JSON.stringify(presentationData, null, 2))
      
      // Navigate to the presentation element first
      const presentation = this.findElement(presentationData, 'p:presentation')
      if (!presentation) {
        console.warn('❌ No presentation element found')
        return []
      }
      
      const sldIdList = this.findElement(presentation, 'p:sldIdLst')
      console.log('📋 Found sldIdList:', sldIdList)
      
      if (sldIdList) {
        const sldIds = this.findElements(sldIdList, 'p:sldId')
        console.log(`🔢 Found ${sldIds.length} slide IDs:`, sldIds)
        
        for (let i = 0; i < sldIds.length; i++) {
          const sldId = sldIds[i]
          const rId = this.getAttribute(sldId, 'r:id')
          console.log(`📝 Slide ${i + 1} has rId:`, rId)
          
          if (rId) {
            const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text')
            if (relsXml) {
              console.log('🔗 Found relationships file, length:', relsXml.length)
              const relsData = await this.parseXML(relsXml)
              console.log('🔗 Parsed relationships data:', JSON.stringify(relsData, null, 2))
              
              // Find the relationship that matches this slide's rId
              const relationships = this.findElements(relsData.Relationships, 'Relationship')
              let target = null
              
              console.log(`🔍 Looking for relationship with Id: ${rId}`)
              console.log(`🔍 Found ${relationships.length} relationships:`, relationships)
              
              for (const rel of relationships) {
                const relId = this.getAttribute(rel, 'Id')
                console.log(`🔍 Checking relationship Id: ${relId}`)
                
                if (relId === rId) {
                  target = this.getAttribute(rel, 'Target')
                  console.log(`✅ Found matching relationship! Target: ${target}`)
                  break
                }
              }
              
              console.log('🎯 Final relationship target:', target)
              
              if (target) {
                const slideFilePath = `ppt/${target}`
                console.log('📁 Slide file path:', slideFilePath)
                
                const slide = await this.parseSlide(zip, slideFilePath, i + 1)
                if (slide) {
                  console.log(`✅ Successfully parsed slide ${i + 1}:`, slide)
                  slides.push(slide)
                } else {
                  console.warn(`❌ Failed to parse slide ${i + 1}`)
                }
              }
            } else {
              console.warn('❌ No relationships file found')
            }
          }
        }
      } else {
        console.warn('❌ No sldIdList found in presentation data')
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
      console.log(`📄 Slide ${slideNumber} XML content length: ${slideContent.length}`)

      // Parse the slide XML content
      const slideData = await this.parseXML(slideContent)
      const objects = await this.extractSlideObjects(slideData, zip, `ppt/slides/_rels/slide${slideNumber}.xml.rels`)
      
      // Return basic slide structure - frontend will handle rendering
      return {
        id: this.generateId(),
        slideNumber,
        width: 800,
        height: 600,
        objects,
        // Store raw slide XML for frontend processing
        rawData: slideData
      }
    } catch (error) {
      console.error(`Error parsing slide ${slideNumber}:`, error)
      return null
    }
  }

  private async extractSlideObjects(slideData: any, zip: JSZip, slideRelsPath: string): Promise<any[]> {
    const objects: any[] = []
    
    try {
      console.log('🔍 Extracting objects from slide data')
      
      // Navigate the correct XML structure: p:sld -> p:cSld -> p:spTree
      const slide = this.findElement(slideData, 'p:sld')
      if (!slide) {
        console.warn('❌ No p:sld found in slide data')
        return objects
      }
      
      const cSld = this.findElement(slide, 'p:cSld')
      if (!cSld) {
        console.warn('❌ No p:cSld found in slide')
        return objects
      }
      
      // Find the shape tree
      const spTree = this.findElement(cSld, 'p:spTree')
      if (!spTree) {
        console.warn('❌ No spTree found in slide')
        return objects
      }

      // Extract all shapes (both individual and grouped)
      const allShapes = [
        ...this.findElements(spTree, 'p:sp'),
        ...this.findElements(spTree, 'p:grpSp')
      ]
      
      console.log(`🔷 Found ${allShapes.length} total shapes in slide`)

      for (let i = 0; i < allShapes.length; i++) {
        const shape = allShapes[i]
        const shapeObject = await this.extractBasicShape(shape, i, zip, slideRelsPath)
        if (shapeObject) {
          objects.push(shapeObject)
        }
      }

    } catch (error) {
      console.error('❌ Error extracting slide objects:', error)
    }

    console.log(`📊 Total objects extracted: ${objects.length}`)
    return objects
  }

  private async extractBasicShape(shape: any, index: number, zip: JSZip, slideRelsPath: string): Promise<any | null> {
    try {
      // Get basic shape info
      const nvSpPr = this.findElement(shape, 'p:nvSpPr')
      const cNvPr = this.findElement(nvSpPr, 'p:cNvPr')
      const name = this.getAttribute(cNvPr, 'name') || `Shape ${index + 1}`
      
      // Check if it's a group
      const isGroup = shape['p:grpSpPr'] !== undefined
      
      // Check if it's a picture
      const isPicture = shape['p:nvPicPr'] !== undefined
      
      if (isPicture) {
        console.log(`🔍 Found picture shape: ${name}`)
        const imageObject = await this.extractImage(shape, zip, slideRelsPath)
        if (imageObject) {
          return imageObject
        }
      }
      
      // Extract text content if present
      const txBody = this.findElement(shape, 'p:txBody')
      let textContent = ''
      if (txBody) {
        textContent = this.extractTextContent(txBody)
      }

      // Basic shape object - let frontend handle the details
      return {
        id: this.generateId(),
        type: isGroup ? 'group' : 'shape',
        name,
        text: textContent,
        // Store raw XML data for frontend processing
        rawData: shape
      }
    } catch (error) {
      console.error(`Error extracting basic shape ${index}:`, error)
      return null
    }
  }

  private extractTextContent(txBody: any): string {
    try {
      console.log('🔍 Extracting text from txBody:', JSON.stringify(txBody, null, 2))
      console.log('🔍 txBody keys:', Object.keys(txBody))
      
      const paragraphs = this.findElements(txBody, 'a:p')
      console.log('🔍 Found paragraphs:', paragraphs)
      let text = ''
      
      for (const paragraph of paragraphs) {
        const textRuns = this.findElements(paragraph, 'a:r')
        console.log('🔍 Found text runs:', textRuns)
        for (const textRun of textRuns) {
          const textElement = this.findElement(textRun, 'a:t')
          console.log('🔍 Found text element:', textElement)
          
          // Handle different text content formats from xml2js
          if (textElement) {
            if (typeof textElement === 'string') {
              // Direct string content
              text += textElement
            } else if (textElement._) {
              // Content in _ property
              text += textElement._
            } else if (textElement.$ && textElement.$.val) {
              // Content in attribute
              text += textElement.$.val
            } else {
              // Try to find any text content
              console.log('🔍 Text element structure:', textElement)
              const textKeys = Object.keys(textElement)
              for (const key of textKeys) {
                if (key !== '$' && typeof textElement[key] === 'string') {
                  text += textElement[key]
                  break
                }
              }
            }
          }
        }
        text += '\n'
      }
      
      console.log('🔍 Final extracted text:', text)
      return text.trim()
    } catch (error) {
      console.error('Error extracting text content:', error)
      return ''
    }
  }

  private async extractImage(shape: any, zip: JSZip, slideRelsPath: string): Promise<any | null> {
    try {
      // Check if this is a picture shape
      const nvPicPr = this.findElement(shape, 'p:nvPicPr')
      if (!nvPicPr) {
        return null // Not a picture shape
      }

      // Get the picture properties
      const picPr = this.findElement(shape, 'p:picPr')
      if (!picPr) {
        return null
      }

      // Find the image reference
      const blipFill = this.findElement(picPr, 'a:blipFill')
      if (!blipFill) {
        return null
      }

      const blip = this.findElement(blipFill, 'a:blip')
      if (!blip) {
        return null
      }

      // Get the relationship ID for the image
      const rId = this.getAttribute(blip, 'r:embed')
      if (!rId) {
        console.log('❌ No r:embed found for image')
        return null
      }

      console.log(`🔍 Found image with rId: ${rId}`)

      // Find the image file path from relationships
      const slideRelsXml = await zip.file(slideRelsPath)?.async('text')
      
      if (slideRelsXml) {
        const relsData = await this.parseXML(slideRelsXml)
        const relationships = this.findElements(relsData.Relationships, 'Relationship')
        
        for (const rel of relationships) {
          const relId = this.getAttribute(rel, 'Id')
          if (relId === rId) {
            const target = this.getAttribute(rel, 'Target')
            if (target) {
              const imagePath = `ppt/${target}`
              console.log(`🔍 Found image file: ${imagePath}`)
              
              // Check if the image file exists
              const imageFile = zip.file(imagePath)
              if (imageFile) {
                // Get image data as base64
                const imageData = await imageFile.async('base64')
                const imageType = this.getImageMimeType(imagePath)
                
                return {
                  id: this.generateId(),
                  type: 'image',
                  name: 'Image',
                  src: `data:${imageType};base64,${imageData}`,
                  rawData: shape
                }
              }
            }
            break
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error extracting image:', error)
      return null
    }
  }

  private getImageMimeType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase()
    switch (extension) {
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
        return 'image/tiff'
      default:
        return 'image/jpeg' // Default fallback
    }
  }

  private async readPresentationProps(zip: JSZip): Promise<any> {
    try {
      const coreProps = zip.file('docProps/core.xml')
      if (coreProps) {
        const content = await coreProps.async('text')
        // Parse XML content here if needed
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
      parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  private findElement(data: any, tagName: string): any {
    try {
      const parts = tagName.split(':')
      if (parts.length === 2) {
        const namespace = parts[0]
        const element = parts[1]
        const fullTag = `${namespace}:${element}`
        
        // Try different approaches to find the element
        if (data[fullTag]) {
          console.log(`✅ Found element ${fullTag} directly`)
          return data[fullTag]
        }
        
        if (data[element]) {
          console.log(`✅ Found element ${element} without namespace`)
          return data[element]
        }
        
        // Check if it's nested in a different structure
        for (const key in data) {
          if (key.includes(element) || key.includes(namespace)) {
            console.log(`🔍 Potential match found: ${key}`)
          }
        }
        
        console.log(`❌ Element ${fullTag} not found in data keys:`, Object.keys(data))
        return undefined
      }
      
      // For non-namespaced elements, try direct access
      if (data[tagName]) {
        console.log(`✅ Found element ${tagName} directly`)
        return data[tagName]
      }
      
      console.log(`❌ Element ${tagName} not found in data keys:`, Object.keys(data))
      return undefined
    } catch (error) {
      console.error(`Error in findElement for ${tagName}:`, error)
      return undefined
    }
  }

  private findElements(data: any, tagName: string): any[] {
    const element = this.findElement(data, tagName)
    if (!element) {
      console.log(`❌ No elements found for ${tagName}`)
      return []
    }
    return Array.isArray(element) ? element : [element]
  }

  private getAttribute(element: any, attrName: string): string | null {
    try {
      if (!element || !element.$) {
        console.log(`❌ Element or attributes not found for ${attrName}:`, element)
        return null
      }
      
      const value = element.$[attrName]
      console.log(`🔍 Attribute ${attrName}:`, value)
      return value || null
    } catch (error) {
      console.error(`Error getting attribute ${attrName}:`, error)
      return null
    }
  }
}
