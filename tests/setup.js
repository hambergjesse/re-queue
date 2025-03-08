// tests/setup.js
// This file sets up the test environment for Jest

// Import jest-dom assertions
require('@testing-library/jest-dom');

// Setup a mock browser API environment
const chrome = require('jest-chrome');

// Import our custom browser storage mock
const { chromeStorage } = require('./mocks/browser-storage.mock');

// Simulate the browser extension environment
global.chrome = {
  ...chrome,
  storage: chromeStorage
};
global.browser = null; // Will be conditionally set for Firefox tests

// Create mock for browser API based on environment
global.setupBrowserAPI = (browserType = 'chrome') => {
  if (browserType === 'firefox') {
    // Set up Firefox-specific mocks
    global.browser = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        },
        getBrowserInfo: jest.fn(),
        lastError: null
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
        executeScript: jest.fn()
      }
    };
  } else {
    // Ensure chrome is reset with our storage mock
    global.chrome = {
      ...chrome,
      storage: chromeStorage
    };
  }
};

// Mock DOM methods that might not be in JSDOM
global.HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 50,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  x: 0,
  y: 0
}));

// Mock window focus method
global.window.focus = jest.fn();

// Add mock console methods for debug logging tests
const originalConsole = { ...console };
global.mockConsole = () => {
  console.debug = jest.fn();
  console.log = jest.fn();
  console.error = jest.fn();
};

global.restoreConsole = () => {
  console = { ...originalConsole };
};

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Default to Chrome API
setupBrowserAPI('chrome'); 