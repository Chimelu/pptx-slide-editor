import { PPTXDocument, Slide } from '../types/pptx'

export class PPTXApiService {
  private static baseUrl = '/api/pptx'

  static async parsePPTX(file: File): Promise<PPTXDocument> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/parse`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to parse PPTX: ${response.statusText}`)
    }

    return response.json()
  }

  static async getSlide(slideId: string): Promise<Slide | null> {
    const response = await fetch(`${this.baseUrl}/slides/${slideId}`)

    if (!response.ok) {
      throw new Error(`Failed to get slide: ${response.statusText}`)
    }

    return response.json()
  }

  static async exportPPTX(document: PPTXDocument): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ presentationData: document }),
    })

    if (!response.ok) {
      throw new Error(`Failed to export PPTX: ${response.statusText}`)
    }

    return response.blob()
  }
}
