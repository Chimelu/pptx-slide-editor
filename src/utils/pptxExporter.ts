import JSZip from 'jszip'
import { PPTXDocument, Slide, ShapeObject } from '@/types/pptx'

export class PPTXExporter {
  private zip: JSZip

  constructor() {
    this.zip = new JSZip()
  }

  async exportToPPTX(document: PPTXDocument): Promise<Blob> {
    // Create the basic PPTX structure
    this.createPPTXStructure()
    
    // Add presentation content
    this.addPresentationXML(document)
    this.addSlideXMLs(document.slides)
    this.addSlideLayouts()
    this.addSlideMasters()
    this.addThemes()
    this.addContentTypes()
    this.addRelationships()
    
    // Generate and return the PPTX file
    return await this.zip.generateAsync({ type: 'blob' })
  }

  private createPPTXStructure() {
    // Create the basic folder structure
    this.zip.folder('_rels')
    this.zip.folder('ppt')
    this.zip.folder('ppt/_rels')
    this.zip.folder('ppt/slides')
    this.zip.folder('ppt/slides/_rels')
    this.zip.folder('ppt/slideLayouts')
    this.zip.folder('ppt/slideMasters')
    this.zip.folder('ppt/theme')
    this.zip.folder('ppt/media')
    this.zip.folder('docProps')
  }

  private addPresentationXML(document: PPTXDocument) {
    const presentationXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${document.slides.map((slide, index) => 
      `<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`
    ).join('')}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`

    this.zip.file('ppt/presentation.xml', presentationXML)
  }

  private addSlideXMLs(slides: Slide[]) {
    slides.forEach((slide, index) => {
      const slideXML = this.generateSlideXML(slide)
      this.zip.file(`ppt/slides/slide${index + 1}.xml`, slideXML)
      
      // Add slide relationship
      const slideRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
      
      this.zip.file(`ppt/slides/_rels/slide${index + 1}.xml.rels`, slideRelsXML)
    })
  }

  private addSlideLayouts() {
    const slideLayoutXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="titleAndContent" preserve="1">
  <p:cSld name="Title and Content">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr>
            <p:ph type="title"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="365125"/>
            <a:ext cx="9144000" cy="1371600"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r>
              <a:rPr lang="en-US" sz="4400" b="1"/>
              <a:t>Click to edit Master title style</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content Placeholder"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr>
            <p:ph type="body" idx="1"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="1736725"/>
            <a:ext cx="9144000" cy="5486400"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="l"/>
            <a:r>
              <a:rPr lang="en-US" sz="1800"/>
              <a:t>• Click to edit Master text styles</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:pPr algn="l"/>
            <a:r>
              <a:rPr lang="en-US" sz="1800"/>
              <a:t>• Second level</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:pPr algn="l"/>
            <a:r>
              <a:rPr lang="en-US" sz="1800"/>
              <a:t>• Third level</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:pPr algn="l"/>
            <a:r>
              <a:rPr lang="en-US" sz="1800"/>
              <a:t>• Fourth level</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:pPr algn="l"/>
            <a:r>
              <a:rPr lang="en-US" sz="1800"/>
              <a:t>• Fifth level</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sldLayout>`

    this.zip.file('ppt/slideLayouts/slideLayout1.xml', slideLayoutXML)
  }

  private addSlideMasters() {
    const slideMasterXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill>
          <a:srgbClr val="FFFFFF"/>
        </a:solidFill>
      </p:bgPr>
    </p:bg>
  </p:cSld>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle>
      <a:lvl1pPr algn="ctr" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1" lnSpc="120">
        <a:lnSpc>
          <a:spcPct val="90000"/>
        </a:lnSpc>
        <a:spcBef>
          <a:spcPts val="0"/>
        </a:spcBef>
        <a:spcAft>
          <a:spcPts val="360000"/>
        </a:spcAft>
      </a:lvl1pPr>
    </p:titleStyle>
    <p:bodyStyle>
      <a:lvl1pPr algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1" lnSpc="120" marL="3429000" indent="-3429000">
        <a:lnSpc>
          <a:spcPct val="90000"/>
        </a:lnSpc>
        <a:spcBef>
          <a:spcPts val="0"/>
        </a:spcBef>
        <a:spcAft>
          <a:spcPts val="0"/>
        </a:spcAft>
      </a:lvl1pPr>
    </p:bodyStyle>
  </p:txStyles>
</p:sldMaster>`

    this.zip.file('ppt/slideMasters/slideMaster1.xml', slideMasterXML)
  }

  private addThemes() {
    const themeXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1>
        <a:srgbClr val="000000"/>
      </a:dk1>
      <a:lt1>
        <a:srgbClr val="FFFFFF"/>
      </a:lt1>
      <a:dk2>
        <a:srgbClr val="1F497D"/>
      </a:dk2>
      <a:lt2>
        <a:srgbClr val="EEECE1"/>
      </a:lt2>
      <a:accent1>
        <a:srgbClr val="4F81BD"/>
      </a:accent1>
      <a:accent2>
        <a:srgbClr val="C0504D"/>
      </a:accent2>
      <a:accent3>
        <a:srgbClr val="9BBB59"/>
      </a:accent3>
      <a:accent4>
        <a:srgbClr val="8064A2"/>
      </a:accent4>
      <a:accent5>
        <a:srgbClr val="4BACC6"/>
      </a:accent5>
      <a:accent6>
        <a:srgbClr val="F79646"/>
      </a:accent6>
      <a:hlink>
        <a:srgbClr val="0000FF"/>
      </a:hlink>
      <a:folHlink>
        <a:srgbClr val="800080"/>
      </a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont>
        <a:latin typeface="Calibri"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill>
          <a:schemeClr val="phClr"/>
        </a:solidFill>
        <a:gradFill>
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:tint val="50000"/>
                <a:satMod val="300000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="35000">
              <a:schemeClr val="phClr">
                <a:tint val="37000"/>
                <a:satMod val="300000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:tint val="15000"/>
                <a:satMod val="350000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="16200000" scaled="1"/>
        </a:gradFill>
        <a:gradFill>
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:tint val="40000"/>
                <a:satMod val="350000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="40000">
              <a:schemeClr val="phClr">
                <a:tint val="45000"/>
                <a:satMod val="350000"/>
                <a:shade val="99000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="60000">
              <a:schemeClr val="phClr">
                <a:tint val="60000"/>
                <a:satMod val="350000"/>
                <a:shade val="78000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:shade val="78000"/>
                <a:satMod val="300000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="16200000" scaled="0"/>
        </a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr">
              <a:shade val="95000"/>
              <a:satMod val="105000"/>
            </a:schemeClr>
          </a:solidFill>
          <a:prstDash val="solid"/>
        </a:ln>
        <a:ln w="25400" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
        </a:ln>
        <a:ln w="38100" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
        </a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle>
          <a:effectLst>
            <a:outerShdw blurRad="40000" dist="20000" dir="5400000" rotWithShape="0">
              <a:srgbClr val="000000">
                <a:alpha val="38000"/>
              </a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </a:effectStyle>
        <a:effectStyle>
          <a:effectLst>
            <a:outerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0">
              <a:srgbClr val="000000">
                <a:alpha val="35000"/>
              </a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </a:effectStyle>
        <a:effectStyle>
          <a:effectLst>
            <a:outerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0">
              <a:srgbClr val="000000">
                <a:alpha val="35000"/>
              </a:srgbClr>
            </a:outerShdw>
            <a:innerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0">
              <a:srgbClr val="000000">
                <a:alpha val="35000"/>
              </a:srgbClr>
            </a:innerShdw>
          </a:effectLst>
        </a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill>
          <a:schemeClr val="phClr"/>
        </a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:tint val="40000"/>
                <a:satMod val="350000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="40000">
              <a:schemeClr val="phClr">
                <a:tint val="45000"/>
                <a:satMod val="350000"/>
                <a:shade val="99000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="60000">
              <a:schemeClr val="phClr">
                <a:tint val="60000"/>
                <a:satMod val="350000"/>
                <a:shade val="78000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:shade val="78000"/>
                <a:satMod val="300000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:path path="circle">
            <a:fillToRect l="50000" t="50000" r="50000" b="50000"/>
          </a:path>
        </a:gradFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:tint val="80000"/>
                <a:satMod val="300000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:shade val="30000"/>
                <a:satMod val="200000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:path path="circle">
            <a:fillToRect l="50000" t="50000" r="50000" b="50000"/>
          </a:path>
        </a:gradFill>
      </a:bgFillStyleLst>
    </a:themeElements>
    <a:objectDefaults/>
    <a:extraClrSchemeLst/>
  </a:theme>`

    this.zip.file('ppt/theme/theme1.xml', themeXML)
  }

  private generateSlideXML(slide: Slide): string {
    const objectsXML = slide.objects.map(obj => this.generateObjectXML(obj)).join('')
    
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${objectsXML}
    </p:spTree>
  </p:cSld>
</p:sld>`
  }

  private generateObjectXML(obj: ShapeObject): string {
    switch (obj.type) {
      case 'text':
        return this.generateTextXML(obj)
      case 'rectangle':
        return this.generateRectangleXML(obj)
      case 'ellipse':
        return this.generateEllipseXML(obj)
      case 'line':
        return this.generateLineXML(obj)
      case 'image':
        return this.generateImageXML(obj)
      default:
        return ''
    }
  }

  private generateTextXML(obj: ShapeObject): string {
    const { transform, style, content } = obj
    const emuX = Math.round(transform.left * 914400 / 96) // Convert pixels to EMUs
    const emuY = Math.round(transform.top * 914400 / 96)
    const emuWidth = Math.round(transform.width * 914400 / 96)
    const emuHeight = Math.round(transform.height * 914400 / 96)
    
    return `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${obj.id}" name="Text Box"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr>
            <p:ph type="body"/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuWidth}" cy="${emuHeight}"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="${style.textAlign || 'l'}"/>
            <a:r>
              <a:rPr sz="${(style.fontSize || 18) * 100}" b="${style.fontWeight === 'bold' ? 1 : 0}" i="${style.fontStyle === 'italic' ? 1 : 0}">
                <a:solidFill>
                  <a:srgbClr val="${style.color?.replace('#', '') || '000000'}"/>
                </a:solidFill>
                <a:latin typeface="${style.fontFamily || 'Arial'}"/>
              </a:rPr>
              <a:t>${content || 'Text'}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>`
  }

  private generateRectangleXML(obj: ShapeObject): string {
    const { transform } = obj
    const emuX = Math.round(transform.left * 914400 / 96)
    const emuY = Math.round(transform.top * 914400 / 96)
    const emuWidth = Math.round(transform.width * 914400 / 96)
    const emuHeight = Math.round(transform.height * 914400 / 96)
    
    return `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${obj.id}" name="Rectangle"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuWidth}" cy="${emuHeight}"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
          <a:ln w="6350">
            <a:solidFill>
              <a:srgbClr val="000000"/>
            </a:solidFill>
          </a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:endParaRPr lang="en-US"/>
          </a:p>
        </p:txBody>
      </p:sp>`
  }

  private generateEllipseXML(obj: ShapeObject): string {
    const { transform } = obj
    const emuX = Math.round(transform.left * 914400 / 96)
    const emuY = Math.round(transform.top * 914400 / 96)
    const emuWidth = Math.round(transform.width * 914400 / 96)
    const emuHeight = Math.round(transform.height * 914400 / 96)
    
    return `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${obj.id}" name="Ellipse"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuWidth}" cy="${emuHeight}"/>
          </a:xfrm>
          <a:prstGeom prst="ellipse">
            <a:avLst/>
          </a:prstGeom>
          <a:ln w="6350">
            <a:solidFill>
              <a:srgbClr val="000000"/>
            </a:solidFill>
          </a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:endParaRpr lang="en-US"/>
          </a:p>
        </p:txBody>
      </p:sp>`
  }

  private generateLineXML(obj: ShapeObject): string {
    const { transform } = obj
    const emuX = Math.round(transform.left * 914400 / 96)
    const emuY = Math.round(transform.top * 914400 / 96)
    const emuWidth = Math.round(transform.width * 914400 / 96)
    const emuHeight = Math.round(transform.height * 914400 / 96)
    
    return `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${obj.id}" name="Line"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuWidth}" cy="${emuHeight}"/>
          </a:xfrm>
          <a:prstGeom prst="line">
            <a:avLst/>
          </a:prstGeom>
          <a:ln w="12700">
            <a:solidFill>
              <a:srgbClr val="000000"/>
            </a:solidFill>
          </a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:endParaRpr lang="en-US"/>
          </a:p>
        </p:txBody>
      </p:sp>`
  }

  private generateImageXML(obj: ShapeObject): string {
    const { transform } = obj
    const emuX = Math.round(transform.left * 914400 / 96)
    const emuY = Math.round(transform.top * 914400 / 96)
    const emuWidth = Math.round(transform.width * 914400 / 96)
    const emuHeight = Math.round(transform.height * 914400 / 96)
    
    return `
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="${obj.id}" name="Picture"/>
          <p:cNvPicPr>
            <a:picLocks noChangeAspect="1"/>
          </p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rId1"/>
          <a:stretch>
            <a:fillRect/>
          </a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuWidth}" cy="${emuHeight}"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
      </p:pic>`
  }

  private addContentTypes() {
    const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`

    this.zip.file('[Content_Types].xml', contentTypesXML)
  }

  private addRelationships() {
    const presentationRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`

    this.zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`)

    this.zip.file('ppt/_rels/presentation.xml.rels', presentationRelsXML)
    
    // Add slide layout relationship
    const slideLayoutRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
    
    this.zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', slideLayoutRelsXML)
    
    // Add slide master relationship
    const slideMasterRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
    
    this.zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', slideMasterRelsXML)
  }
}
