import { PPTXExporter } from '@/utils/pptxExporter'
import { PPTXDocument } from '@/types/pptx'

describe('PPTXExporter', () => {
  let exporter: PPTXExporter

  beforeEach(() => {
    exporter = new PPTXExporter()
  })

  it('should export a simple document to PPTX format', async () => {
    const testDocument: PPTXDocument = {
      id: 'test-doc',
      name: 'Test Presentation',
      slides: [
        {
          id: 'slide-1',
          name: 'Test Slide',
          width: 960,
          height: 540,
          objects: [
            {
              id: 'text-1',
              type: 'text',
              transform: {
                left: 100,
                top: 100,
                width: 300,
                height: 80,
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
              content: 'Test Text',
            },
          ],
        },
      ],
      metadata: {
        author: 'Test User',
        created: new Date(),
        modified: new Date(),
        version: '1.0',
      },
    }

    const pptxBlob = await exporter.exportToPPTX(testDocument)
    
    expect(pptxBlob).toBeInstanceOf(Blob)
    expect(pptxBlob.type).toBe('application/octet-stream')
    expect(pptxBlob.size).toBeGreaterThan(0)
  })

  it('should handle documents with multiple slides', async () => {
    const testDocument: PPTXDocument = {
      id: 'test-doc-2',
      name: 'Multi-Slide Presentation',
      slides: [
        {
          id: 'slide-1',
          name: 'Slide 1',
          width: 960,
          height: 540,
          objects: [],
        },
        {
          id: 'slide-2',
          name: 'Slide 2',
          width: 960,
          height: 540,
          objects: [],
        },
      ],
      metadata: {
        author: 'Test User',
        created: new Date(),
        modified: new Date(),
        version: '1.0',
      },
    }

    const pptxBlob = await exporter.exportToPPTX(testDocument)
    
    expect(pptxBlob).toBeInstanceOf(Blob)
    expect(pptxBlob.size).toBeGreaterThan(0)
  })
})
