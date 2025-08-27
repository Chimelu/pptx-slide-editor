# PPTX Editor

A lightweight web application for editing PowerPoint presentations in the browser. Built with Next.js, TypeScript, Tailwind CSS, and Fabric.js.

## 🎯 Features

### Core Functionality
- **Upload & Parse**: Accept .pptx files via drag & drop or file picker
- **Accurate Rendering**: Display slides with correct positions, sizes, rotation, and layering
- **Object Support**: Text boxes, images, rectangles, ellipses, lines, and grouped shapes
- **Interactive Editing**: Select, move, resize, and rotate objects
- **Text Editing**: Inline text editing with font preservation
- **State Management**: Undo/redo, history tracking, and document persistence

### User Experience
- **Intuitive Controls**: Drag & drop, keyboard shortcuts, and visual feedback
- **Zoom & Pan**: Navigate large presentations with smooth zoom and pan controls
- **Grid & Object Snapping**: Precise positioning with snap-to-grid and snap-to-object
- **Thumbnail Navigation**: Visual slide navigation with real-time updates
- **Responsive Design**: Modern, clean interface built with Tailwind CSS

### Technical Features
- **TypeScript**: Full type safety and modern JavaScript features
- **State Management**: Zustand for efficient state management
- **Canvas Rendering**: Fabric.js for high-performance canvas operations
- **File Parsing**: JSZip for PPTX file parsing and extraction
- **Testing**: Jest and React Testing Library for comprehensive testing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd pptx-editor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Canvas Library**: Fabric.js
- **File Parsing**: JSZip
- **Testing**: Jest + React Testing Library

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main page
│   └── globals.css     # Global styles
├── components/          # React components
│   ├── PPTXEditor.tsx  # Main editor component
│   ├── UploadArea.tsx  # File upload component
│   ├── Toolbar.tsx     # Editing toolbar
│   ├── SlideCanvas.tsx # Canvas rendering
│   └── ThumbnailRail.tsx # Slide navigation
├── store/              # State management
│   └── editorStore.ts  # Zustand store
├── types/              # TypeScript types
│   └── pptx.ts         # PPTX data types
├── utils/              # Utility functions
│   ├── pptxParser.ts   # PPTX parsing logic
│   └── common.ts       # Common utilities
└── __tests__/          # Test files
    └── PPTXEditor.test.tsx
```

### State Management
The application uses Zustand for state management with a centralized store that handles:
- Document data and slides
- Current selection and editing state
- Zoom, pan, and view settings
- Undo/redo history
- Grid and object snapping preferences

## 📁 File Format Support

### Supported Objects
- **Text Boxes**: Rich text with font properties
- **Images**: PNG, JPEG, and other common formats
- **Shapes**: Rectangles, ellipses, and lines
- **Groups**: Preserved grouping structure
- **Transformations**: Position, size, rotation, scaling, and flipping

### PPTX Parsing
The application implements a custom PPTX parser that:
- Extracts slide content from OOXML format
- Preserves object positioning and styling
- Handles text formatting and properties
- Maintains object hierarchy and grouping

## 🎨 User Interface

### Design Principles
- **Clean & Modern**: Minimalist design focused on content
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Keyboard navigation and ARIA support
- **Intuitive**: Familiar editing patterns and controls

### Key Components
- **Upload Area**: Drag & drop file upload with visual feedback
- **Toolbar**: Essential editing tools and keyboard shortcuts
- **Canvas**: Interactive slide editing with Fabric.js
- **Thumbnail Rail**: Visual slide navigation and management

## ⌨️ Keyboard Shortcuts

- **Delete/Backspace**: Remove selected objects
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Ctrl/Cmd + S**: Save document
- **Mouse Wheel**: Pan (hold Alt for zoom)

## 🧪 Testing

The application includes comprehensive testing with:
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Store and component interaction testing
- **Mocking**: Fabric.js and browser API mocking
- **Test Coverage**: Jest configuration for optimal testing

Run tests with:
```bash
npm test
```

## 🚧 Known Limitations

### Current Version
- Limited image format support (placeholder images for now)
- Basic shape rendering (rectangles, ellipses, lines)
- No advanced text formatting options
- Export functionality is placeholder

### Planned Improvements
- Full image support and manipulation
- Advanced shape and text tools
- Export to PNG/SVG/PDF
- Collaboration features
- Template system

## 🔧 Development

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for consistent formatting
- Component-based architecture

### Performance Considerations
- Canvas rendering optimization
- Debounced state updates
- Efficient object management
- Memory leak prevention

## 📱 Browser Support

- **Chrome**: Full support (primary target)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Fabric.js**: Canvas manipulation library
- **JSZip**: File compression library
- **Next.js**: React framework
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management library

## 📞 Support

For questions, issues, or contributions, please:
1. Check the existing issues
2. Create a new issue with detailed information
3. Provide sample PPTX files for bug reports

---

**Note**: This is a demonstration project. For production use, consider additional security measures, error handling, and performance optimizations.
