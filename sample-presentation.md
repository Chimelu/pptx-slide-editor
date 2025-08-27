# Sample PPTX Files for Testing

Since we can't include actual PPTX files in the repository, here are some suggestions for testing the PPTX Editor:

## Test Files to Create

### 1. Simple Text Presentation
Create a PowerPoint with:
- 2-3 slides
- Text boxes with different fonts and sizes
- Basic formatting (bold, italic, colors)

### 2. Shapes and Images Presentation
Create a PowerPoint with:
- Rectangles, circles, and lines
- Some images (PNG/JPG)
- Mixed content types

### 3. Complex Layout Presentation
Create a PowerPoint with:
- Multiple objects per slide
- Different object positions and rotations
- Grouped shapes (if possible)

## How to Test

1. **Start the application**: `npm run dev`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Upload a PPTX file**: Drag and drop or click to browse
4. **Test editing features**:
   - Select objects
   - Move objects around
   - Resize objects
   - Rotate objects
   - Edit text inline
   - Use keyboard shortcuts (Ctrl+Z, Delete, etc.)
   - Test zoom and pan
   - Test grid snapping

## Expected Behavior

- PPTX files should parse and display correctly
- Objects should be selectable and editable
- Changes should be saved to history (undo/redo)
- Thumbnails should update after edits
- Export should save current state as JSON

## Known Limitations

- Image support is currently placeholder (shows gray boxes)
- Advanced text formatting is basic
- Export functionality is placeholder
- Some complex PPTX features may not parse perfectly

## Browser Compatibility

- **Chrome**: Full support (primary target)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Performance Notes

- 10-20 slide presentations should load in a few seconds
- Editing should remain smooth at 60fps
- Large files may take longer to parse initially

