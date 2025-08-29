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
      // Try to get detailed error message from response
      let errorMessage = `Failed to parse PPTX: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`
          }
        }
      } catch (e) {
        // If we can't parse the error response, use the status text
        console.warn('Could not parse error response:', e)
      }

      // Create a more descriptive error based on status code
      if (response.status === 413) {
        errorMessage = 'File too large for processing. Maximum size is 4MB.'
      } else if (response.status === 404) {
        errorMessage = 'Service temporarily unavailable. Please try again.'
      } else if (response.status === 400) {
        errorMessage = 'Invalid file format or request. Please check your file.'
      }

      throw new Error(errorMessage)
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
