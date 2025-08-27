import { render, screen, fireEvent } from '@testing-library/react'
import { PPTXEditor } from '@/components/PPTXEditor'

// Mock the store
jest.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
    document: null,
    setDocument: jest.fn(),
    clearDocument: jest.fn(),
  }),
}))

describe('PPTXEditor', () => {
  it('renders upload area when no document is loaded', () => {
    render(<PPTXEditor />)
    
    expect(screen.getByText('PPTX Editor')).toBeInTheDocument()
    expect(screen.getByText('Upload PowerPoint Presentation')).toBeInTheDocument()
    expect(screen.getByText('Create New Presentation')).toBeInTheDocument()
  })

  it('handles file upload', () => {
    render(<PPTXEditor />)
    
    const uploadArea = screen.getByText('Upload PowerPoint Presentation').closest('div')
    expect(uploadArea).toBeInTheDocument()
  })

  it('shows create new presentation button', () => {
    render(<PPTXEditor />)
    
    const newButton = screen.getByText('Create New Presentation')
    expect(newButton).toBeInTheDocument()
  })
})

