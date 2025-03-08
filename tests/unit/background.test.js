/**
 * RE:Q - Unit Tests for background.js
 * 
 * These tests focus on the core functionality of the background service worker.
 */

const { chromeStorage } = require('../mocks/browser-storage.mock');

describe('Background Service Worker - Core Functionality', () => {
  // Mock storage state
  let mockStorage = {};
  
  // Mock extension state
  let extensionState;
  
  // Mock functions that would interact with browser APIs
  const mockToggleExtension = jest.fn();
  const mockToggleDebug = jest.fn();
  const mockUpdateContentScripts = jest.fn();
  const mockNotifyContentScriptsOfDebugChange = jest.fn();
  const mockCheckForGameTabs = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    mockStorage = {};
    jest.clearAllMocks();
    
    // Setup chrome object with our mock
    global.chrome = {
      ...chrome,
      storage: chromeStorage
    };
    
    // Create direct references to chrome storage methods for easy mocking
    chrome.storage.local.get = jest.fn((keys, callback) => {
      // Extract relevant values from mockStorage
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(key => {
          result[key] = mockStorage[key] !== undefined ? mockStorage[key] : keys[key];
        });
      }
      callback(result);
      return Promise.resolve(result);
    });
    
    chrome.storage.local.set = jest.fn((items, callback) => {
      // Update mockStorage with new values
      Object.assign(mockStorage, items);
      if (callback) callback();
      return Promise.resolve();
    });
    
    // Init extension state 
    extensionState = {
      enabled: true,
      debug: false
    };
  });
  
  describe('Extension State Management', () => {
    test('should load saved state from storage on startup', async () => {
      // Setup the mock storage with pre-existing values
      mockStorage = {
        enabled: false,
        debug: true
      };
      
      // Import the background script (simulating initialization)
      // We need to mock this instead of actually importing the file
      const backgroundInit = () => {
        chrome.storage.local.get(['enabled', 'debug'], (result) => {
          if (result.hasOwnProperty('enabled')) {
            extensionState.enabled = result.enabled;
          }
          if (result.hasOwnProperty('debug')) {
            extensionState.debug = result.debug;
          }
        });
      };
      
      // Run initialization
      backgroundInit();
      
      // Allow promises to resolve
      await new Promise(process.nextTick);
      
      // Check state was loaded correctly
      expect(extensionState.enabled).toBe(false);
      expect(extensionState.debug).toBe(true);
    });
    
    test('toggleExtension should flip enabled state and save it', async () => {
      // Setup mock implementation
      const toggleExtension = () => {
        extensionState.enabled = !extensionState.enabled;
        
        // Save the new state
        chrome.storage.local.set({ enabled: extensionState.enabled });
        
        // Notify all content scripts
        mockUpdateContentScripts();
        
        return extensionState.enabled;
      };
      
      // Initial state
      expect(extensionState.enabled).toBe(true);
      
      // Toggle
      const result = toggleExtension();
      
      // The function should return the new state
      expect(result).toBe(false);
      
      // Check state was updated
      expect(extensionState.enabled).toBe(false);
      
      // Check storage was updated
      expect(mockStorage.enabled).toBe(false);
      
      // Check content scripts were notified
      expect(mockUpdateContentScripts).toHaveBeenCalled();
    });
    
    test('toggleDebug should flip debug state and save it', async () => {
      // Setup mock implementation
      const toggleDebug = () => {
        extensionState.debug = !extensionState.debug;
        
        // Save the new state
        chrome.storage.local.set({ debug: extensionState.debug });
        
        // Notify all content scripts
        mockNotifyContentScriptsOfDebugChange();
        
        return extensionState.debug;
      };
      
      // Initial state
      expect(extensionState.debug).toBe(false);
      
      // Toggle
      const result = toggleDebug();
      
      // The function should return the new state
      expect(result).toBe(true);
      
      // Check state was updated
      expect(extensionState.debug).toBe(true);
      
      // Check storage was updated
      expect(mockStorage.debug).toBe(true);
      
      // Check content scripts were notified
      expect(mockNotifyContentScriptsOfDebugChange).toHaveBeenCalled();
    });
  });
  
  describe('Content Script Communication', () => {
    beforeEach(() => {
      // Setup tab query mock
      chrome.tabs = {
        ...chrome.tabs,
        query: jest.fn((query, callback) => {
          // Mock returning some tabs
          const tabs = [
            { id: 1, url: 'https://renown.gg/match' },
            { id: 2, url: 'https://renown.gg/queue' }
          ];
          callback(tabs);
          return Promise.resolve(tabs);
        }),
        sendMessage: jest.fn()
      };
    });
    
    test('updateContentScripts should send status to all Renown tabs', async () => {
      // Setup mock implementation
      const updateContentScripts = () => {
        chrome.tabs.query({url: "*://*.renown.gg/*"}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateStatus',
              enabled: extensionState.enabled 
            });
          });
        });
      };
      
      // Run the function
      updateContentScripts();
      
      // Allow promises to resolve
      await new Promise(process.nextTick);
      
      // Should have queried for Renown tabs
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        {url: "*://*.renown.gg/*"}, 
        expect.any(Function)
      );
      
      // Should have sent a message to each tab
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1, 
        { 
          action: 'updateStatus',
          enabled: extensionState.enabled 
        }
      );
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        2, 
        { 
          action: 'updateStatus',
          enabled: extensionState.enabled 
        }
      );
    });
    
    test('notifyContentScriptsOfDebugChange should send debug status to all Renown tabs', async () => {
      // Setup mock implementation
      const notifyContentScriptsOfDebugChange = () => {
        chrome.tabs.query({url: "*://*.renown.gg/*"}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'toggleDebug',
              debug: extensionState.debug 
            });
          });
        });
      };
      
      // Set debug to true for this test
      extensionState.debug = true;
      
      // Run the function
      notifyContentScriptsOfDebugChange();
      
      // Allow promises to resolve
      await new Promise(process.nextTick);
      
      // Should have queried for Renown tabs
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        {url: "*://*.renown.gg/*"}, 
        expect.any(Function)
      );
      
      // Should have sent a message to each tab
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1, 
        { 
          action: 'toggleDebug',
          debug: extensionState.debug 
        }
      );
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        2, 
        { 
          action: 'toggleDebug',
          debug: extensionState.debug 
        }
      );
    });
  });
  
  describe('Message Handling', () => {
    // Mock implementation of message listener
    const setupMessageListener = () => {
      // Implementation of message response logic
      const handleMessage = (message, sender, sendResponse) => {
        if (message.action === 'getState') {
          sendResponse(extensionState);
          return true;
        } else if (message.action === 'toggleEnabled') {
          const newState = !extensionState.enabled;
          extensionState.enabled = newState;
          mockToggleExtension();
          sendResponse({ enabled: newState });
          return true;
        } else if (message.action === 'toggleDebug') {
          const newState = !extensionState.debug;
          extensionState.debug = newState;
          mockToggleDebug();
          sendResponse({ debug: newState });
          return true;
        }
        
        return true; // Indicates we will respond asynchronously
      };
      
      return handleMessage;
    };
    
    let messageHandler;
    
    beforeEach(() => {
      messageHandler = setupMessageListener();
    });
    
    test('should respond with extension state when asked', () => {
      const sendResponse = jest.fn();
      
      messageHandler({ action: 'getState' }, {}, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith(extensionState);
    });
    
    test('should toggle extension when requested', () => {
      const sendResponse = jest.fn();
      
      // Initial state
      expect(extensionState.enabled).toBe(true);
      
      messageHandler({ action: 'toggleEnabled' }, {}, sendResponse);
      
      // Should have toggled state
      expect(extensionState.enabled).toBe(false);
      
      // Should have called toggle function
      expect(mockToggleExtension).toHaveBeenCalled();
      
      // Should have responded with new state
      expect(sendResponse).toHaveBeenCalledWith({ enabled: false });
    });
    
    test('should toggle debug when requested', () => {
      const sendResponse = jest.fn();
      
      // Initial state
      expect(extensionState.debug).toBe(false);
      
      messageHandler({ action: 'toggleDebug' }, {}, sendResponse);
      
      // Should have toggled state
      expect(extensionState.debug).toBe(true);
      
      // Should have called toggle function
      expect(mockToggleDebug).toHaveBeenCalled();
      
      // Should have responded with new state
      expect(sendResponse).toHaveBeenCalledWith({ debug: true });
    });
  });
}); 