/**
 * RE:Q - Integration Tests for Background and Content Script Communication
 * 
 * These tests verify the communication between the background service worker
 * and content scripts.
 */

const { createMockAcceptButton, cleanupMocks } = require('../mocks/dom-elements.mock.js');
const { chromeStorage } = require('../mocks/browser-storage.mock');

// Mock partial implementation of the content script
const mockContentScript = {
  config: {
    enabled: true,
    debug: false,
    inQueue: false
  },
  initialized: false,
  
  // Mock message handler
  handleMessage: jest.fn((message, sender, sendResponse) => {
    if (message.action === 'ping') {
      sendResponse({ status: 'active' });
      return true;
    } else if (message.action === 'updateStatus') {
      mockContentScript.config.enabled = message.enabled;
      sendResponse({ status: 'success', enabled: mockContentScript.config.enabled });
      return true;
    } else if (message.action === 'toggleDebug') {
      mockContentScript.config.debug = message.debug;
      sendResponse({ status: 'success', debug: mockContentScript.config.debug });
      return true;
    }
    return true;
  })
};

// Mock partial implementation of the background script
const mockBackgroundScript = {
  extensionState: {
    enabled: true,
    debug: false
  },
  
  // Toggle extension state
  toggleExtension: function() {
    this.extensionState.enabled = !this.extensionState.enabled;
    this.updateContentScripts();
    return this.extensionState.enabled;
  },
  
  // Toggle debug state
  toggleDebug: function() {
    this.extensionState.debug = !this.extensionState.debug;
    this.notifyContentScriptsOfDebugChange();
    return this.extensionState.debug;
  },
  
  // Update content scripts
  updateContentScripts: jest.fn(function() {
    chrome.tabs.query({url: "*://*.renown.gg/*"}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateStatus',
          enabled: this.extensionState.enabled 
        });
      });
    });
  }),
  
  // Notify content scripts of debug change
  notifyContentScriptsOfDebugChange: jest.fn(function() {
    chrome.tabs.query({url: "*://*.renown.gg/*"}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'toggleDebug',
          debug: this.extensionState.debug 
        });
      });
    });
  }),
  
  // Handle runtime messages
  handleMessage: jest.fn((message, sender, sendResponse) => {
    if (message.action === 'getState') {
      sendResponse(mockBackgroundScript.extensionState);
      return true;
    } else if (message.action === 'toggleEnabled') {
      const newState = mockBackgroundScript.toggleExtension();
      sendResponse({ enabled: newState });
      return true;
    } else if (message.action === 'toggleDebug') {
      const newState = mockBackgroundScript.toggleDebug();
      sendResponse({ debug: newState });
      return true;
    }
    return true;
  })
};

describe('Background-Content Integration', () => {
  // Mock tab ID for testing
  const mockTabId = 123;
  
  beforeEach(() => {
    // Reset test state
    mockContentScript.config = { enabled: true, debug: false, inQueue: false };
    mockBackgroundScript.extensionState = { enabled: true, debug: false };
    
    // Set up the appropriate mocks
    jest.clearAllMocks();
    
    // Create mock implementations
    const mockTabsQuery = jest.fn((query, callback) => {
      const tabs = [{ id: mockTabId, url: 'https://renown.gg/match' }];
      callback(tabs);
    });
    
    const mockTabsSendMessage = jest.fn((tabId, message) => {
      // Simulate the message being received by the content script
      const sendResponse = jest.fn();
      mockContentScript.handleMessage(message, { tab: { id: tabId } }, sendResponse);
      return Promise.resolve(sendResponse.mock.calls[0][0]);
    });
    
    const mockRuntimeSendMessage = jest.fn((message) => {
      // Simulate the message being received by the background script
      const sendResponse = jest.fn();
      mockBackgroundScript.handleMessage(message, {}, sendResponse);
      return Promise.resolve(sendResponse.mock.calls[0][0]);
    });
    
    // Set up global chrome with our mocks
    global.chrome = {
      tabs: {
        query: mockTabsQuery,
        sendMessage: mockTabsSendMessage
      },
      runtime: {
        sendMessage: mockRuntimeSendMessage,
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      storage: chromeStorage
    };
  });
  
  afterEach(() => {
    cleanupMocks();
  });
  
  describe('Background to Content Communication', () => {
    test('should update content script when extension is toggled in background', async () => {
      // Initial state
      expect(mockContentScript.config.enabled).toBe(true);
      
      // Toggle the extension in the background
      mockBackgroundScript.toggleExtension();
      
      // Allow promises to resolve
      await new Promise(process.nextTick);
      
      // Check that the content script was updated
      expect(mockBackgroundScript.updateContentScripts).toHaveBeenCalled();
      expect(mockContentScript.handleMessage).toHaveBeenCalledWith(
        { action: 'updateStatus', enabled: false },
        expect.anything(),
        expect.any(Function)
      );
      expect(mockContentScript.config.enabled).toBe(false);
    });
    
    test('should update content script when debug is toggled in background', async () => {
      // Initial state
      expect(mockContentScript.config.debug).toBe(false);
      
      // Toggle debug in the background
      mockBackgroundScript.toggleDebug();
      
      // Allow promises to resolve
      await new Promise(process.nextTick);
      
      // Check that the content script was updated
      expect(mockBackgroundScript.notifyContentScriptsOfDebugChange).toHaveBeenCalled();
      expect(mockContentScript.handleMessage).toHaveBeenCalledWith(
        { action: 'toggleDebug', debug: true },
        expect.anything(),
        expect.any(Function)
      );
      expect(mockContentScript.config.debug).toBe(true);
    });
  });
  
  describe('Content to Background Communication', () => {
    test('should get extension state from background', async () => {
      // Set background state
      mockBackgroundScript.extensionState = { enabled: false, debug: true };
      
      // Content script requests state
      const response = await chrome.runtime.sendMessage({ action: 'getState' });
      
      // Check response
      expect(response).toEqual({ enabled: false, debug: true });
      expect(mockBackgroundScript.handleMessage).toHaveBeenCalledWith(
        { action: 'getState' },
        expect.anything(),
        expect.any(Function)
      );
    });
    
    test('should toggle extension state from content script', async () => {
      // Initial state
      expect(mockBackgroundScript.extensionState.enabled).toBe(true);
      
      // Content script toggles extension
      const response = await chrome.runtime.sendMessage({ action: 'toggleEnabled' });
      
      // Check response and state changes
      expect(response).toEqual({ enabled: false });
      expect(mockBackgroundScript.extensionState.enabled).toBe(false);
      expect(mockBackgroundScript.updateContentScripts).toHaveBeenCalled();
    });
  });
  
  describe('End-to-End Communication Flow', () => {
    test('full communication cycle for enabling/disabling extension', async () => {
      // 1. Start with everything enabled
      expect(mockBackgroundScript.extensionState.enabled).toBe(true);
      expect(mockContentScript.config.enabled).toBe(true);
      
      // 2. Toggle off from popup (sending message to background)
      const firstResponse = await chrome.runtime.sendMessage({ action: 'toggleEnabled' });
      
      // Background should have toggled state and sent updates to content
      expect(firstResponse).toEqual({ enabled: false });
      expect(mockBackgroundScript.extensionState.enabled).toBe(false);
      expect(mockBackgroundScript.updateContentScripts).toHaveBeenCalled();
      expect(mockContentScript.config.enabled).toBe(false);
      
      // 3. Toggle back on again
      const secondResponse = await chrome.runtime.sendMessage({ action: 'toggleEnabled' });
      
      // Background should have toggled state and sent updates to content again
      expect(secondResponse).toEqual({ enabled: true });
      expect(mockBackgroundScript.extensionState.enabled).toBe(true);
      expect(mockBackgroundScript.updateContentScripts).toHaveBeenCalledTimes(2);
      expect(mockContentScript.config.enabled).toBe(true);
    });
  });
}); 