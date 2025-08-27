import JSZip from 'jszip'
import { PPTXDocument, Slide, ShapeObject, Transform, TextStyle } from '@/types/pptx'

export class PPTXParser {
  private zip: JSZip | null = null

  async parseFile(file: File): Promise<PPTXDocument> {
    try {
      console.log('Starting PPTX parsing...')
      
      // Load the ZIP file
      this.zip = await JSZip.loadAsync(file)
      console.log('ZIP file loaded successfully')
      
      // List all files for debugging
      const fileNames = Object.keys(this.zip.files)
      console.log('Files in ZIP:', fileNames)
      
      // Parse the document
      const slides = await this.readSlides()
      const properties = await this.readPresentationProps()
      
      console.log('Parsing completed successfully')
      
      return {
        id: crypto.randomUUID(),
        name: file.name.replace('.pptx', ''),
        slides,
        metadata: properties,
      }
    } catch (error) {
      console.error('Error parsing PPTX file:', error)
      throw error
    }
  }

  private async readPresentationProps(): Promise<{ author?: string }> {
    try {
      const coreProps = this.zip?.file('docProps/core.xml')
      if (coreProps) {
        const content = await coreProps.async('text')
        const parser = new DOMParser()
        const xml = parser.parseFromString(content, 'text/xml')
        
        const authorElement = xml.querySelector('dc\\:creator, creator')
        return {
          author: authorElement?.textContent || undefined
        }
      }
    } catch (error) {
      console.warn('Could not read presentation properties:', error)
    }
    
    return {}
  }

  private async readSlides(): Promise<Slide[]> {
    const slides: Slide[] = []
    
    try {
      // Get slide count from presentation.xml
      const presentation = this.zip?.file('ppt/presentation.xml')
      if (presentation) {
        const content = await presentation.async('text')
        console.log('Presentation XML content:', content.substring(0, 500) + '...')
        
        const parser = new DOMParser()
        const xml = parser.parseFromString(content, 'text/xml')
        
        // Try multiple approaches to find slides
        let slideIds = xml.getElementsByTagName('sldId')
        console.log(`Found ${slideIds.length} slides using 'sldId' tag`)
        
        // If no slides found, try alternative approaches
        if (slideIds.length === 0) {
          // Try looking for slides in the slides folder directly
          const slideFiles = Object.keys(this.zip?.files || {})
            .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
            .sort()
          
          console.log('Found slide files directly:', slideFiles)
          
          if (slideFiles.length > 0) {
            // Create slides from the files we found
            for (let i = 0; i < slideFiles.length; i++) {
              const slideFile = slideFiles[i]
              const slideNumber = i + 1
              console.log(`Processing slide file: ${slideFile}`)
              
              const slide = await this.readSlideFromFile(slideFile, slideNumber)
              if (slide) {
                slides.push(slide)
                console.log(`Successfully loaded slide ${slideNumber} from file`)
              }
            }
          }
        } else {
          // Process slides using the traditional method
          for (let i = 0; i < slideIds.length; i++) {
            const slideId = slideIds[i].getAttribute('r:id')
            console.log(`Processing slide ${i + 1} with ID: ${slideId}`)
            if (slideId) {
              const slide = await this.readSlide(slideId, i + 1)
              if (slide) {
                slides.push(slide)
                console.log(`Successfully loaded slide ${i + 1}`)
              } else {
                console.warn(`Failed to load slide ${i + 1}`)
              }
            }
          }
        }
      } else {
        console.warn('Could not find presentation.xml')
      }
    } catch (error) {
      console.error('Error reading slides:', error)
      // Create a default slide if parsing fails
      slides.push(this.createDefaultSlide())
    }
    
    console.log(`Total slides loaded: ${slides.length}`)
    return slides.length > 0 ? slides : [this.createDefaultSlide()]
  }

  private async readSlide(slideId: string, slideNumber: number): Promise<Slide | null> {
    try {
      // Try to find the slide file directly first
      let slideFile = this.zip?.file(`ppt/slides/slide${slideNumber}.xml`)
      
      // If not found, try to find it through relationships
      if (!slideFile) {
        const slideRel = this.zip?.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`)
        if (slideRel) {
          const relContent = await slideRel.async('text')
          const relParser = new DOMParser()
          const relXml = relParser.parseFromString(relContent, 'text/xml')
          
          const slideTarget = relXml.querySelector(`Relationship[Id="${slideId}"]`)?.getAttribute('Target')
          if (slideTarget) {
            const slidePath = `ppt/slides/${slideTarget.split('/').pop()}`
            slideFile = this.zip?.file(slidePath)
          }
        }
      }
      
      // If still not found, try to find any slide file
      if (!slideFile) {
        const slideFiles = Object.keys(this.zip?.files || {})
          .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
          .sort()
        
        if (slideFiles.length > 0) {
          const targetSlide = slideFiles[slideNumber - 1] || slideFiles[0]
          slideFile = this.zip?.file(targetSlide)
        }
      }
      
      if (!slideFile) {
        console.warn(`Could not find slide file for slide ${slideNumber}`)
        return null
      }
      
      const slideContent = await slideFile.async('text')
      const slideParser = new DOMParser()
      const slideXml = slideParser.parseFromString(slideContent, 'text/xml')
      
      // Extract slide dimensions
      const sldSz = slideXml.getElementsByTagName('sldSz')[0]
      const width = parseInt(sldSz?.getAttribute('cx') || '9144000') / 12700 // Convert EMUs to pixels
      const height = parseInt(sldSz?.getAttribute('cy') || '6858000') / 12700
      
      // Extract shapes
      const objects = await this.extractShapes(slideXml, slideNumber)
      
      return {
        id: crypto.randomUUID(),
        name: `Slide ${slideNumber}`,
        width,
        height,
        objects,
      }
    } catch (error) {
      console.error(`Error reading slide ${slideNumber}:`, error)
      return null
    }
  }

  private async readSlideFromFile(slideFilePath: string, slideNumber: number): Promise<Slide | null> {
    try {
      const slideFile = this.zip?.file(slideFilePath)
      if (!slideFile) {
        console.warn(`Could not find slide file: ${slideFilePath}`)
        return null
      }
      
      const slideContent = await slideFile.async('text')
      console.log(`Slide ${slideNumber} XML content:`, slideContent.substring(0, 1000) + '...')
      
      const slideParser = new DOMParser()
      const slideXml = slideParser.parseFromString(slideContent, 'text/xml')
      
      // Extract slide dimensions with better namespace handling
      let sldSz = slideXml.getElementsByTagName('sldSz')[0]
      if (!sldSz) {
        sldSz = slideXml.getElementsByTagName('p:sldSz')[0]
      }
      
      let width = 800, height = 600 // Default dimensions
      if (sldSz) {
        const cx = sldSz.getAttribute('cx')
        const cy = sldSz.getAttribute('cy')
        console.log(`Slide ${slideNumber} dimensions from XML:`, { cx, cy })
        
        if (cx && cy) {
          // Convert EMUs to pixels
          const emuToPixel = 96 / 914400
          width = parseInt(cx) * emuToPixel
          height = parseInt(cy) * emuToPixel
          console.log(`Slide ${slideNumber} converted dimensions:`, { width, height })
        }
      } else {
        console.warn(`No sldSz found in slide ${slideNumber}, using defaults`)
      }
      
      // Extract shapes
      const objects = await this.extractShapes(slideXml, slideNumber)
      
      return {
        id: crypto.randomUUID(),
        name: `Slide ${slideNumber}`,
        width: Math.max(width, 800), // Minimum width
        height: Math.max(height, 600), // Minimum height
        objects,
      }
    } catch (error) {
      console.error(`Error reading slide from file ${slideFilePath}:`, error)
      return null
    }
  }

  private async extractShapes(slideXml: Document, slideNumber: number): Promise<ShapeObject[]> {
    const objects: ShapeObject[] = []
    
    try {
      console.log(`Extracting shapes from slide ${slideNumber}`)
      
      // Try multiple approaches to find shapes
      
      // Approach 1: Look for spTree > sp (traditional structure)
      // Use a more robust approach to handle namespaces
      let spTree = this.findElementByTagName(slideXml, 'spTree')
      if (spTree) {
        const textBoxes = this.findElementsByTagName(spTree, 'sp')
        console.log(`Found ${textBoxes.length} shape elements in spTree`)
        
        for (let i = 0; i < textBoxes.length; i++) {
          const textBox = textBoxes[i]
          console.log(`Processing shape ${i + 1}:`, textBox.tagName, textBox.getAttribute('id'), textBox.getAttribute('name'))
          
          // Check if this is a placeholder
          const nvPr = this.findElementByTagName(textBox, 'nvPr')
          const ph = nvPr ? this.findElementByTagName(nvPr, 'ph') : null
          if (ph) {
            const phType = ph.getAttribute('type')
            console.log(`Shape ${i + 1} is a placeholder of type: ${phType}`)
          }
          
          // Check if this is a grouped shape
          const grpSp = this.findElementByTagName(textBox, 'grpSp')
          if (grpSp) {
            console.log(`Shape ${i + 1} is a grouped shape, extracting group`)
            const groupObject = this.extractGroupedShape(grpSp, slideNumber, i)
            if (groupObject) {
              objects.push(groupObject)
              console.log(`Successfully extracted grouped shape ${i + 1} with ${groupObject.children?.length || 0} children`)
            }
            continue
          }
          
          // Check if this is a text shape
          const txBody = this.findElementByTagName(textBox, 'txBody')
          const hasText = txBody && this.findElementsByTagName(txBody, 't').length > 0
          
          if (hasText) {
            // For text shapes, extract individual text elements instead of the main shape
            console.log(`Shape ${i + 1} has text, extracting individual text elements`)
            const textObjects = this.extractIndividualTextElements(textBox, slideNumber, i)
            objects.push(...textObjects)
            console.log(`Extracted ${textObjects.length} text objects from shape ${i + 1}`)
          } else {
            // For non-text shapes, extract as basic shape
            console.log(`Shape ${i + 1} has no text, extracting as basic shape`)
            const shape = this.extractBasicShape(textBox, slideNumber, i)
            if (shape) {
              objects.push(shape)
              console.log(`Successfully extracted basic shape ${i + 1}:`, shape.type)
            }
          }
        }
      } else {
        console.warn('No spTree found in slide')
      }
      
      // Approach 2: Look for shapes directly in the slide
      if (objects.length === 0) {
        console.log('Trying alternative shape extraction...')
        
        // Look for any sp elements anywhere in the slide
        const allSpElements = this.findElementsByTagName(slideXml, 'sp')
        console.log(`Found ${allSpElements.length} sp elements in slide`)
        
        for (let i = 0; i < allSpElements.length; i++) {
          const spElement = allSpElements[i]
          console.log(`Processing sp element ${i + 1}:`, spElement.tagName, spElement.getAttribute('id'))
          
          // Check for grouped shapes first
          const grpSp = this.findElementByTagName(spElement, 'grpSp')
          if (grpSp) {
            console.log(`SP element ${i + 1} is a grouped shape`)
            const groupObject = this.extractGroupedShape(grpSp, slideNumber, i)
            if (groupObject) {
              objects.push(groupObject)
            }
            continue
          }
          
          const txBody = this.findElementByTagName(spElement, 'txBody')
          const hasText = txBody && this.findElementsByTagName(txBody, 't').length > 0
          
          if (hasText) {
            const textObjects = this.extractIndividualTextElements(spElement, slideNumber, i)
            objects.push(...textObjects)
          } else {
            const shape = this.extractBasicShape(spElement, slideNumber, i)
            if (shape) {
              objects.push(shape)
            }
          }
        }
      }
      
      // Approach 3: Look for text elements directly
      if (objects.length === 0) {
        console.log('Trying direct text extraction...')
        
        const textElements = this.findElementsByTagName(slideXml, 't')
        console.log(`Found ${textElements.length} text elements directly in slide`)
        
        if (textElements.length > 0) {
          // Create a simple text object from the first text element
          const firstText = textElements[0]
          const textContent = firstText.textContent || 'Text'
          console.log(`Creating text object with content: "${textContent}"`)
          
          const textObject: ShapeObject = {
            id: crypto.randomUUID(),
            type: 'text',
            transform: {
              left: 100,
              top: 100,
              width: 300,
              height: 100,
              angle: 0,
              scaleX: 1,
              scaleY: 1,
              flipX: false,
              flipY: false,
            },
            style: {
              fontFamily: 'Arial',
              fontSize: 18,
              fontWeight: 'normal',
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#000000',
              textAlign: 'left',
              lineHeight: 1.2,
            },
            content: textContent,
          }
          
          objects.push(textObject)
          console.log('Created fallback text object')
        }
      }
      
      // Extract images
      const images = this.findElementsByTagName(slideXml, 'pic')
      console.log(`Found ${images.length} image elements`)
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const shape = await this.extractImage(image, slideNumber, i)
        if (shape) {
          objects.push(shape)
          console.log(`Successfully extracted image ${i + 1}`)
        }
      }
      
      console.log(`Total objects extracted: ${objects.length}`)
      console.log('Final objects:', objects.map(obj => ({ type: obj.type, content: obj.content, transform: obj.transform })))
    } catch (error) {
      console.error('Error extracting shapes:', error)
    }
    
    return objects
  }

  // Helper methods to handle XML namespaces
  private findElementByTagName(parent: Element | Document, tagName: string): Element | null {
    // Try multiple approaches to find the element
    let element = parent.getElementsByTagName(tagName)[0]
    if (element) return element
    
    // If not found, try with common namespace prefixes
    const prefixes = ['p:', 'a:', 'r:', '']
    for (const prefix of prefixes) {
      const fullTagName = prefix + tagName
      element = parent.getElementsByTagName(fullTagName)[0]
      if (element) return element
    }
    
    // Last resort: search by partial tag name
    const allElements = parent.getElementsByTagName('*')
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i]
      if (el.tagName.endsWith(tagName) || el.tagName.includes(tagName)) {
        return el
      }
    }
    
    return null
  }

  private findElementsByTagName(parent: Element | Document, tagName: string): Element[] {
    // Try multiple approaches to find elements
    let elements = Array.from(parent.getElementsByTagName(tagName))
    if (elements.length > 0) return elements
    
    // If not found, try with common namespace prefixes
    const prefixes = ['p:', 'a:', 'r:', '']
    for (const prefix of prefixes) {
      const fullTagName = prefix + tagName
      elements = Array.from(parent.getElementsByTagName(fullTagName))
      if (elements.length > 0) return elements
    }
    
    // Last resort: search by partial tag name
    const allElements = parent.getElementsByTagName('*')
    const matchingElements: Element[] = []
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i]
      if (el.tagName.endsWith(tagName) || el.tagName.includes(tagName)) {
        matchingElements.push(el)
      }
    }
    
    return matchingElements
  }

  private async extractImage(image: Element, slideNumber: number, index: number): Promise<ShapeObject | null> {
    try {
      console.log(`Extracting actual image ${index} from slide ${slideNumber}`)
      
      const spPr = this.findElementByTagName(image, 'spPr')
      if (!spPr) return null
      
      const transform = this.extractTransform(spPr)
      
      // Extract the actual image data from the PPTX
      const blipFill = this.findElementByTagName(image, 'blipFill')
      if (blipFill) {
        const blip = this.findElementByTagName(blipFill, 'blip')
        if (blip) {
          const embed = blip.getAttribute('r:embed')
          const link = blip.getAttribute('r:link')
          
          console.log(`Image ${index} has embed: ${embed}, link: ${link}`)
          
          if (embed || link) {
            // Try to find the actual image file
            const imageId = embed || link
            const imageFile = await this.findImageFile(imageId)
            
            if (imageFile) {
              console.log(`Found actual image file: ${imageFile.name}`)
              
              // Convert image to data URL
              const imageData = await imageFile.async('base64')
              const mimeType = this.getMimeType(imageFile.name)
              const dataUrl = `data:${mimeType};base64,${imageData}`
              
              return {
                id: crypto.randomUUID(),
                type: 'image',
                transform,
                style: {},
                src: dataUrl,
              }
            }
          }
        }
      }
      
      // If we can't extract the actual image, create a better placeholder
      console.warn(`Could not extract actual image data for image ${index}, creating placeholder`)
      return {
        id: crypto.randomUUID(),
        type: 'image',
        transform,
        style: {},
        src: `data:image/svg+xml;base64,${btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ccc"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-size="12">Image</text></svg>')}`,
      }
    } catch (error) {
      console.error(`Error extracting image ${index}:`, error)
      return null
    }
  }

  private async findImageFile(imageId: string): Promise<JSZip.JSZipObject | null> {
    try {
      // First try to find the relationship file
      const relsFile = this.zip?.file('ppt/_rels/presentation.xml.rels')
      if (relsFile) {
        const relsContent = await relsFile.async('text')
        const relsParser = new DOMParser()
        const relsXml = relsParser.parseFromString(relsContent, 'text/xml')
        
        const relationship = relsXml.querySelector(`Relationship[Id="${imageId}"]`)
        if (relationship) {
          const target = relationship.getAttribute('Target')
          if (target) {
            // Convert relative path to absolute
            const imagePath = target.startsWith('/') ? target.slice(1) : `ppt/${target}`
            const imageFile = this.zip?.file(imagePath)
            if (imageFile) {
              console.log(`Found image file via relationships: ${imagePath}`)
              return imageFile
            }
          }
        }
      }
      
      // Try common image paths
      const commonPaths = [
        `ppt/media/image${imageId}.png`,
        `ppt/media/image${imageId}.jpg`,
        `ppt/media/image${imageId}.jpeg`,
        `ppt/media/image${imageId}.gif`,
        `ppt/media/image${imageId}.bmp`,
      ]
      
      for (const path of commonPaths) {
        const imageFile = this.zip?.file(path)
        if (imageFile) {
          console.log(`Found image file via common path: ${path}`)
          return imageFile
        }
      }
      
      // Search through all files for images
      const allFiles = Object.keys(this.zip?.files || {})
      const imageFiles = allFiles.filter(name => 
        name.includes('media') && 
        (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.bmp'))
      )
      
      console.log(`Found ${imageFiles.length} image files in media folder:`, imageFiles)
      
      // Try to find the image by ID in the filename
      for (const imagePath of imageFiles) {
        if (imagePath.includes(imageId) || imagePath.includes(`image${imageId}`)) {
          const imageFile = this.zip?.file(imagePath)
          if (imageFile) {
            console.log(`Found image file by ID search: ${imagePath}`)
            return imageFile
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding image file:', error)
      return null
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'png': return 'image/png'
      case 'jpg':
      case 'jpeg': return 'image/jpeg'
      case 'gif': return 'image/gif'
      case 'bmp': return 'image/bmp'
      case 'svg': return 'image/svg+xml'
      default: return 'image/png'
    }
  }

  private async extractGroupedShape(grpSp: Element, slideNumber: number, index: number): Promise<ShapeObject | null> {
    try {
      console.log(`Extracting grouped shape ${index} from slide ${slideNumber}`)
      
      // Extract the group's transform
      const grpSpPr = this.findElementByTagName(grpSp, 'grpSpPr')
      const transform = grpSpPr ? this.extractTransform(grpSpPr) : {
        left: 0,
        top: 0,
        width: 400,
        height: 300,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false,
      }
      
      // Extract child shapes from the group
      const children: ShapeObject[] = []
      
      // Look for sp elements within the group
      const childSpElements = this.findElementsByTagName(grpSp, 'sp')
      console.log(`Found ${childSpElements.length} child shapes in group ${index}`)
      
      for (let i = 0; i < childSpElements.length; i++) {
        const childSp = childSpElements[i]
        console.log(`Processing child shape ${i + 1} in group ${index}`)
        
        // Check if child has text
        const txBody = this.findElementByTagName(childSp, 'txBody')
        const hasText = txBody && this.findElementsByTagName(txBody, 't').length > 0
        
        if (hasText) {
          // Extract text objects from child
          const textObjects = this.extractIndividualTextElements(childSp, slideNumber, i)
          children.push(...textObjects)
        } else {
          // Extract as basic shape
          const childShape = this.extractBasicShape(childSp, slideNumber, i)
          if (childShape) {
            children.push(childShape)
          }
        }
      }
      
      // Look for pic elements within the group
      const childPicElements = this.findElementsByTagName(grpSp, 'pic')
      console.log(`Found ${childPicElements.length} child images in group ${index}`)
      
      for (let i = 0; i < childPicElements.length; i++) {
        const childPic = childPicElements[i]
        const childImage = await this.extractImage(childPic, slideNumber, i)
        if (childImage) {
          children.push(childImage)
        }
      }
      
      // Create the group object
      const groupObject: ShapeObject = {
        id: crypto.randomUUID(),
        type: 'group',
        transform,
        style: {},
        children,
        groupId: `group-${slideNumber}-${index}`,
      }
      
      console.log(`Successfully created group object with ${children.length} children`)
      return groupObject
      
    } catch (error) {
      console.error(`Error extracting grouped shape ${index}:`, error)
      return null
    }
  }

  private extractBasicShape(shape: Element, slideNumber: number, index: number): ShapeObject | null {
    try {
      console.log(`Extracting basic shape ${index + 1} from slide ${slideNumber}`)
      
      const spPr = this.findElementByTagName(shape, 'spPr')
      if (!spPr) {
        console.warn(`No spPr found in basic shape ${index + 1}`)
        return null
      }
      
      const transform = this.extractTransform(spPr)
      
      // Get the actual shape type from the XML with better detection
      let prstGeom = this.findElementByTagName(spPr, 'prstGeom')
      let shapeType: 'rectangle' | 'ellipse' | 'line' = 'rectangle'
      
      if (prstGeom) {
        const prst = prstGeom.getAttribute('prst')
        console.log(`Found shape type in XML: ${prst}`)
        
        // Enhanced shape type detection
        switch (prst) {
          case 'rect':
          case 'roundRect':
          case 'snip1Rect':
          case 'snip2Rect':
          case 'snipRoundRect':
          case 'round1Rect':
          case 'round2Rect':
            shapeType = 'rectangle'
            break
          case 'ellipse':
          case 'oval':
            shapeType = 'ellipse'
            break
          case 'line':
          case 'straightConnector1':
          case 'straightConnector2':
          case 'straightConnector3':
          case 'straightConnector4':
          case 'straightConnector5':
          case 'straightConnector6':
          case 'bentConnector2':
          case 'bentConnector3':
          case 'bentConnector4':
          case 'bentConnector5':
            shapeType = 'line'
            break
          default:
            console.log(`Unknown shape type: ${prst}, defaulting to rectangle`)
            shapeType = 'rectangle'
        }
      } else {
        // Try to determine shape type from other properties
        const custGeom = this.findElementByTagName(spPr, 'custGeom')
        if (custGeom) {
          console.log('Found custom geometry, defaulting to rectangle')
          shapeType = 'rectangle'
        } else {
          console.log('No geometry found, defaulting to rectangle')
          shapeType = 'rectangle'
        }
      }
      
      console.log(`Extracted basic shape: type=${shapeType}, transform=`, transform)
      
      // For basic shapes, we might still have some text content (like placeholders)
      let content = ''
      const txBody = this.findElementByTagName(shape, 'txBody')
      if (txBody) {
        content = this.extractTextContent(shape)
      }
      
      // Check if this is a placeholder
      const nvPr = this.findElementByTagName(shape, 'nvPr')
      const ph = nvPr ? this.findElementByTagName(nvPr, 'ph') : null
      if (ph) {
        const phType = ph.getAttribute('type')
        if (phType === 'title') {
          content = 'Title Placeholder'
        } else if (phType === 'body') {
          content = 'Body Placeholder'
        } else if (phType === 'pic') {
          content = 'Picture Placeholder'
        } else {
          content = 'Content Placeholder'
        }
      }
      
      // Get shape name for better identification
      const cNvPr = this.findElementByTagName(shape, 'cNvPr')
      const shapeName = cNvPr?.getAttribute('name') || `Shape ${index + 1}`
      console.log(`Shape name: ${shapeName}`)
      
      // Enhanced styling based on shape type
      const style: any = {
        fill: shapeType === 'line' ? 'transparent' : '#e5e7eb', // Default light gray fill for shapes
        stroke: '#6b7280', // Default border color
        strokeWidth: shapeType === 'line' ? 2 : 1,
      }
      
      // Add corner radius for rounded rectangles
      if (shapeType === 'rectangle' && prstGeom?.getAttribute('prst')?.includes('round')) {
        style.rx = 10
        style.ry = 10
      }
      
      return {
        id: crypto.randomUUID(),
        type: shapeType,
        transform,
        style,
        content: content || undefined, // Only include content if it exists
      }
    } catch (error) {
      console.error('Error extracting basic shape:', error)
      return null
    }
  }

  private extractTransform(spPr: Element): Transform {
    // Debug the spPr element structure
    console.log('Extracting transform from spPr:', spPr.outerHTML.substring(0, 500) + '...')
    
    // Try to find xfrm element with better namespace handling
    let xfrm = spPr.getElementsByTagName('xfrm')[0]
    if (!xfrm) {
      // Try with namespace prefixes
      xfrm = spPr.getElementsByTagName('a:xfrm')[0]
    }
    if (!xfrm) {
      // Try searching by partial tag name
      const allElements = spPr.getElementsByTagName('*')
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i]
        if (el.tagName.includes('xfrm')) {
          xfrm = el
          break
        }
      }
    }
    
    console.log('Found xfrm element:', xfrm?.outerHTML)
    
    if (xfrm) {
      // Find offset, extent, and rotation with better namespace handling
      let off = xfrm.getElementsByTagName('off')[0]
      if (!off) off = xfrm.getElementsByTagName('a:off')[0]
      
      let ext = xfrm.getElementsByTagName('ext')[0]
      if (!ext) ext = xfrm.getElementsByTagName('a:ext')[0]
      
      let rot = xfrm.getElementsByTagName('rot')[0]
      if (!rot) rot = xfrm.getElementsByTagName('a:rot')[0]
      
      console.log('Transform elements - off:', off?.outerHTML, 'ext:', ext?.outerHTML, 'rot:', rot?.outerHTML)
      
      // Convert EMUs to pixels with better scaling
      // 1 EMU = 1/914400 inch, 1 inch = 96 pixels (standard DPI)
      // So 1 EMU = 96/914400 = 0.000105 pixels
      // For better visibility, we'll scale this up
      const emuToPixel = 96 / 914400
      const scaleFactor = 1 // Adjust this to make shapes bigger/smaller
      
      const left = parseInt(off?.getAttribute('x') || '0') * emuToPixel * scaleFactor
      const top = parseInt(off?.getAttribute('y') || '0') * emuToPixel * scaleFactor
      const width = parseInt(ext?.getAttribute('cx') || '1000000') * emuToPixel * scaleFactor
      const height = parseInt(ext?.getAttribute('cy') || '1000000') * emuToPixel * scaleFactor
      const angle = parseInt(rot?.getAttribute('val') || '0') / 60000 // Convert 60kths to degrees
      
      const transform = {
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: Math.max(50, width), // Minimum width of 50px
        height: Math.max(50, height), // Minimum height of 50px
        angle,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false,
      }
      
      console.log('Extracted transform (EMU values):', {
        emuLeft: off?.getAttribute('x'),
        emuTop: off?.getAttribute('y'),
        emuWidth: ext?.getAttribute('cx'),
        emuHeight: ext?.getAttribute('cy')
      })
      console.log('Converted transform (pixels):', transform)
      return transform
    }
    
    console.warn('No xfrm found, using default transform')
    return {
      left: 100,
      top: 100,
      width: 200,
      height: 150,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      flipX: false,
      flipY: false,
    }
  }

  private extractTextContent(textBox: Element): string {
    // Try multiple approaches to find text content
    let content = ''
    
    // First try: look for text in txBody > p > r > t
    const txBody = this.findElementByTagName(textBox, 'txBody')
    if (txBody) {
      const paragraphs = this.findElementsByTagName(txBody, 'p')
      console.log(`Found ${paragraphs.length} paragraphs in text box`)
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i]
        const textRuns = this.findElementsByTagName(paragraph, 'r')
        console.log(`Paragraph ${i + 1} has ${textRuns.length} text runs`)
        
        let paragraphText = ''
        for (let j = 0; j < textRuns.length; j++) {
          const textRun = textRuns[j]
          const textElement = this.findElementByTagName(textRun, 't')
          if (textElement && textElement.textContent) {
            paragraphText += textElement.textContent
            console.log(`Text run ${j + 1}: "${textElement.textContent}"`)
          }
        }
        
        // Add paragraph text to content
        if (paragraphText) {
          if (content) content += '\n' // Add line break between paragraphs
          content += paragraphText
        }
      }
    }
    
    // Second try: look for text directly in the textBox
    if (!content) {
      const textElements = this.findElementsByTagName(textBox, 't')
      console.log(`Found ${textElements.length} text elements directly in text box`)
      
      for (let i = 0; i < textElements.length; i++) {
        const element = textElements[i]
        if (element.textContent) {
          if (content) content += '\n'
          content += element.textContent
          console.log(`Direct text element ${i + 1}: "${element.textContent}"`)
        }
      }
    }
    
    // Third try: look for any text content in the element
    if (!content) {
      content = textBox.textContent || ''
      console.log(`Fallback text content: "${content}"`)
    }
    
    console.log(`Final extracted text content: "${content}"`)
    return content || 'Text Box'
  }

  private extractTextStyle(textBox: Element): Partial<TextStyle> {
    const defRPr = this.findElementByTagName(textBox, 'defRPr')
    
    if (defRPr) {
      return {
        fontFamily: defRPr.getAttribute('typeface') || 'Arial',
        fontSize: parseInt(defRPr.getAttribute('sz') || '1800') / 100, // Convert 100ths to points
        fontWeight: defRPr.getAttribute('b') === '1' ? 'bold' : 'normal',
        fontStyle: defRPr.getAttribute('i') === '1' ? 'italic' : 'normal',
        textDecoration: defRPr.getAttribute('u') === '1' ? 'underline' : 'none',
        color: this.extractColor(defRPr),
        textAlign: 'left',
        lineHeight: 1.2,
      }
    }
    
    return {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.2,
    }
  }

  private extractColor(defRPr: Element): string {
    const solidFill = this.findElementByTagName(defRPr, 'solidFill')
    if (solidFill) {
      const srgbClr = this.findElementByTagName(solidFill, 'srgbClr')
      if (srgbClr) {
        const val = srgbClr.getAttribute('val')
        if (val) {
          return `#${val}`
        }
      }
    }
    return '#000000'
  }

  private determineShapeType(spPr: Element): 'rectangle' | 'ellipse' | 'line' {
    // Try to find prstGeom element with better namespace handling
    let prstGeom = spPr.getElementsByTagName('prstGeom')[0]
    if (!prstGeom) {
      prstGeom = spPr.getElementsByTagName('a:prstGeom')[0]
    }
    
    if (prstGeom) {
      const prst = prstGeom.getAttribute('prst')
      console.log(`Found shape type: ${prst}`)
      
      switch (prst) {
        case 'rect':
        case 'roundRect':
          return 'rectangle'
        case 'ellipse':
        case 'oval':
          return 'ellipse'
        case 'line':
        case 'straightConnector1':
          return 'line'
        default:
          console.log(`Unknown shape type: ${prst}, defaulting to rectangle`)
          return 'rectangle'
      }
    }
    
    // If no prstGeom found, try to determine from other properties
    console.log('No prstGeom found, defaulting to rectangle')
    return 'rectangle'
  }

  private createDefaultSlide(): Slide {
    return {
      id: crypto.randomUUID(),
      name: 'Slide 1',
      width: 960,
      height: 540,
      objects: [
        {
          id: crypto.randomUUID(),
          type: 'text',
          transform: {
            left: 100,
            top: 100,
            width: 300,
            height: 100,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            flipX: false,
            flipY: false,
          },
          style: {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
          },
          content: 'Welcome to PPTX Editor',
        }
      ],
    }
  }

  private extractIndividualTextElements(textBox: Element, slideNumber: number, shapeIndex: number): ShapeObject[] {
    const textObjects: ShapeObject[] = []
    
    try {
      const txBody = this.findElementByTagName(textBox, 'txBody')
      if (!txBody) return textObjects
      
      // Get the base transform from the shape
      const spPr = this.findElementByTagName(textBox, 'spPr')
      const baseTransform = spPr ? this.extractTransform(spPr) : {
        left: 100,
        top: 100,
        width: 300,
        height: 150,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false,
      }
      
      const paragraphs = this.findElementsByTagName(txBody, 'p')
      console.log(`Extracting ${paragraphs.length} individual text elements from shape ${shapeIndex + 1}`)
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i]
        const textRuns = this.findElementsByTagName(paragraph, 'r')
        
        for (let j = 0; j < textRuns.length; j++) {
          const textRun = textRuns[j]
          const textElement = this.findElementByTagName(textRun, 't')
          
          if (textElement && textElement.textContent && textElement.textContent.trim()) {
            const textContent = textElement.textContent.trim()
            console.log(`Creating individual text object: "${textContent}"`)
            
            // Get text style from this specific run
            const rPr = this.findElementByTagName(textRun, 'rPr')
            const textStyle = rPr ? this.extractTextStyleFromRun(rPr) : this.extractTextStyle(textBox)
            
            // Calculate position based on paragraph and text run index
            // This creates a more natural text layout
            const textLeft = baseTransform.left + (i * 10)
            const textTop = baseTransform.top + (i * 30) + (j * 20)
            const textWidth = Math.max(200, textContent.length * 8) // Width based on text length
            const textHeight = 30
            
            // Create a separate text object for this text element
            const textObject: ShapeObject = {
              id: crypto.randomUUID(),
              type: 'text',
              transform: {
                left: textLeft,
                top: textTop,
                width: textWidth,
                height: textHeight,
                angle: baseTransform.angle,
                scaleX: baseTransform.scaleX,
                scaleY: baseTransform.scaleY,
                flipX: baseTransform.flipX,
                flipY: baseTransform.flipY,
              },
              style: textStyle,
              content: textContent,
            }
            
            textObjects.push(textObject)
          }
        }
      }
    } catch (error) {
      console.error('Error extracting individual text elements:', error)
    }
    
    return textObjects
  }
  
  private extractTextStyleFromRun(rPr: Element): Partial<TextStyle> {
    return {
      fontFamily: rPr.getAttribute('typeface') || 'Arial',
      fontSize: parseInt(rPr.getAttribute('sz') || '1800') / 100,
      fontWeight: rPr.getAttribute('b') === '1' ? 'bold' : 'normal',
      fontStyle: rPr.getAttribute('i') === '1' ? 'italic' : 'normal',
      textDecoration: rPr.getAttribute('u') === '1' ? 'underline' : 'none',
      color: this.extractColor(rPr),
      textAlign: 'left',
      lineHeight: 1.2,
    }
  }
}

