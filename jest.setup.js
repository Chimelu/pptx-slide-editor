import '@testing-library/jest-dom'

// Mock fabric.js
global.fabric = {
  Canvas: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    renderAll: jest.fn(),
    setDimensions: jest.fn(),
    setZoom: jest.fn(),
    absolutePan: jest.fn(),
    centerObject: jest.fn(),
    getObjects: jest.fn(() => []),
    getActiveObjects: jest.fn(() => []),
    dispose: jest.fn(),
    isDragging: false,
    selection: true,
    defaultCursor: 'default',
  })),
  Text: jest.fn().mockImplementation(() => ({})),
  Image: jest.fn().mockImplementation(() => ({})),
  Rect: jest.fn().mockImplementation(() => ({})),
  Ellipse: jest.fn().mockImplementation(() => ({})),
  Line: jest.fn().mockImplementation(() => ({})),
  Point: jest.fn().mockImplementation(() => ({})),
}

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

