# PPTX Slide Editor

A modern, web-based PowerPoint presentation editor built with Next.js, TypeScript, and Fabric.js. This application allows you to upload, parse, edit, and export PPTX files with a clean, intuitive interface.

## ✨ Features

### 🚀 PPTX Parsing
- **Clean, robust parsing** of PowerPoint (.pptx) files
- **Comprehensive object extraction**: text, images, shapes, groups, and charts
- **Theme and metadata support** including color schemes and font schemes
- **Relationship mapping** for accurate media file handling
- **Error handling and validation** with detailed error messages

### 🎨 Editor Capabilities
- **Real-time editing** of slides and objects
- **Multi-object selection** and manipulation
- **Text editing** with rich formatting options
- **Image manipulation** including cropping and positioning
- **Shape editing** with fill, stroke, and transform controls
- **Group operations** for complex object management

### 🖼️ Rendering
- **High-fidelity slide rendering** using Fabric.js
- **Responsive canvas** with zoom and pan controls
- **Thumbnail navigation** for easy slide browsing
- **Export capabilities** to various formats

## 🏗️ Architecture

### Backend (API Routes)
- **`/api/pptx/parse`** - PPTX file parsing and object extraction
- **`/api/pptx/export`** - Presentation export functionality
- **`/api/pptx/slides/[slideId]`** - Individual slide operations
- **`/api/test`** - Parser status and feature information

### Frontend Components
- **`PPTXEditor`** - Main application container
- **`UploadArea`** - File upload with drag & drop
- **`SlideCanvas`** - Interactive slide editing canvas
- **`ThumbnailRail`** - Slide navigation and preview
- **`Toolbar`** - Editing tools and controls

### State Management
- **Zustand store** for application state
- **History management** with undo/redo capabilities
- **Real-time updates** across components

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd pptx-slide-editor

# Install dependencies
npm install

# Run development server
npm run dev
```

### Usage
1. **Upload PPTX**: Drag and drop a .pptx file or use the file picker
2. **Edit Slides**: Click on objects to select and edit them
3. **Navigate**: Use the thumbnail rail to switch between slides
4. **Export**: Save your edited presentation

## 🔧 Technical Details

### PPTX Parser
The new parser is built with clean, maintainable code:

- **Modular design** with separate classes for different parsing concerns
- **Type safety** with comprehensive TypeScript interfaces
- **Error handling** at every level with graceful fallbacks
- **Performance optimized** with efficient XML parsing and relationship mapping

### Supported Object Types
- **Text**: Rich text with formatting, fonts, colors, and styles
- **Images**: JPEG, PNG, GIF, BMP, TIFF with cropping support
- **Shapes**: Geometric shapes with fill, stroke, and transform properties
- **Groups**: Nested object collections with hierarchical structure
- **Charts**: Basic chart object extraction (placeholder for future enhancement)

### File Format Support
- **Input**: PowerPoint (.pptx) files up to 10MB
- **Output**: Various export formats (planned)
- **Validation**: File type and size validation with helpful error messages

## 🧪 Testing

### API Testing
```bash
# Test the parser endpoint
curl -X GET http://localhost:3000/api/test

# Test file upload (replace with actual file path)
curl -X POST http://localhost:3000/api/pptx/parse \
  -F "file=@presentation.pptx"
```

### Development Testing
```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build verification
npm run build
```

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ PPTX parsing and object extraction
- ✅ Basic slide editing capabilities
- ✅ Text and image manipulation
- ✅ Shape editing and grouping

### Phase 2 (Planned)
- 🔄 Advanced text formatting
- 🔄 Chart data extraction and editing
- 🔄 Animation support
- 🔄 Master slide templates

### Phase 3 (Future)
- 🔄 Real-time collaboration
- 🔄 Cloud storage integration
- 🔄 Advanced export formats
- 🔄 Mobile responsiveness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **JSZip** for PPTX file handling
- **xml2js** for XML parsing
- **Fabric.js** for canvas manipulation
- **Next.js** for the application framework
- **Zustand** for state management

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the documentation
- Review the code examples

---

**Built with ❤️ using modern web technologies**
