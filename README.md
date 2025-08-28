# 🎯 Advanced PPTX Parser & Editor

A powerful PowerPoint presentation parser and editor built with Next.js, featuring advanced image extraction, text positioning, and smooth auto-scrolling navigation.

## ✨ Features

### 🖼️ **Advanced Image Parsing**
- **Accurate positioning** extraction from PPTX files
- **EMU to pixel conversion** for precise layout
- **Multiple image format support** (PNG, JPEG, SVG)
- **Relationship resolution** for embedded media

### 📝 **Text Extraction & Styling**
- **Text positioning** with exact coordinates
- **Font properties** extraction (size, family, color, alignment)
- **Multi-paragraph support** with proper formatting
- **Editable text objects** in the canvas

### 🎯 **Smart Navigation**
- **Auto-scrolling thumbnail navigation**
- **Active slide centering** for optimal viewing
- **Smooth scrolling animations**
- **No manual scrolling required**

### 📏 **Intelligent Layout**
- **Automatic slide dimension scaling**
- **Aspect ratio preservation**
- **Content overflow prevention**
- **Responsive design**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pptx-parser.git
cd pptx-parser

# Install dependencies
npm install

# Build the project
npm run build

# Start the development server
npm run dev
```

### Usage
1. **Upload PPTX file** via drag & drop or file picker
2. **Navigate slides** using the auto-scrolling sidebar
3. **Edit content** directly on the canvas
4. **Export** your modified presentation

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Canvas**: Fabric.js for interactive editing
- **File Processing**: JSZip for PPTX extraction
- **XML Parsing**: xml2js for slide content parsing
- **Styling**: Tailwind CSS for modern UI
- **State Management**: Zustand for application state

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   │   └── pptx/          # PPTX processing APIs
│   └── page.tsx           # Main application page
├── components/             # React components
│   ├── PPTXEditor.tsx     # Main editor component
│   ├── SlideCanvas.tsx    # Fabric.js canvas wrapper
│   ├── ThumbnailRail.tsx  # Auto-scrolling navigation
│   └── UploadArea.tsx     # File upload interface
├── services/               # Business logic
│   └── pptxApi.ts         # PPTX processing service
├── store/                  # State management
│   └── editorStore.ts     # Zustand store
└── types/                  # TypeScript definitions
    └── pptx.ts            # PPTX data structures
```

## 🔧 API Endpoints

### `POST /api/pptx/parse`
Parses uploaded PPTX files and extracts:
- Slide layouts and dimensions
- Image objects with positioning
- Text content with styling
- Media relationships

### `GET /api/pptx/slides/[slideId]`
Retrieves individual slide data for editing

### `POST /api/pptx/export`
Exports modified presentations (coming soon)

## 🎨 Key Components

### PPTXService
Core parsing logic that handles:
- ZIP file extraction
- XML content parsing
- Coordinate conversion (EMU → pixels)
- Media relationship resolution

### SlideCanvas
Interactive canvas powered by Fabric.js:
- Editable text objects
- Image positioning
- Transform controls
- Real-time editing

### ThumbnailRail
Smart navigation sidebar:
- Auto-scrolling to active slide
- Smooth animations
- Responsive layout

## 🚧 Roadmap

- [ ] **Export functionality** for modified presentations
- [ ] **Real-time collaboration** features
- [ ] **Advanced text formatting** options
- [ ] **Shape and drawing** tools
- [ ] **Presentation templates** support
- [ ] **Mobile responsiveness** improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Fabric.js** for the interactive canvas
- **JSZip** for PPTX file processing
- **Next.js** for the modern React framework
- **Tailwind CSS** for the beautiful UI components

---

**Built with ❤️ for better presentation editing**
