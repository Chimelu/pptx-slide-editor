import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const { presentationData } = await request.json()
    
    if (!presentationData) {
      return NextResponse.json(
        { error: 'No presentation data provided' },
        { status: 400 }
      )
    }

    console.log('🚧 Exporting PPTX (placeholder)')
    
    // Placeholder export logic - you can implement full PPTX generation here
    const zip = new JSZip()
    zip.file("doc.txt", JSON.stringify(presentationData, null, 2))
    const content = await zip.generateAsync({ type: "nodebuffer" })
    
    // Return the file as a downloadable response
    return new NextResponse(content as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    })
    
  } catch (error) {
    console.error('❌ Error exporting PPTX:', error)
    return NextResponse.json(
      { error: 'Failed to export PPTX file' },
      { status: 500 }
    )
  }
}
