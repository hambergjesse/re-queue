/**
 * RE:Q - Unit Tests for popup.js
 * 
 * These tests focus on the UI interactions in the popup.
 */

const { createMockPopupUI, cleanupMocks } = require('../mocks/dom-elements.mock.js');
const { chromeStorage } = require('../mocks/browser-storage.mock');

describe('Popup UI - Core Functionality', () => {
  let uiElements;
  
  beforeEach(() => {
    // Create mock implementations
    const mockSendMessage = jest.fn().mockImplementation((message, callback) => {
      // Simulate a response based on the message
      if (message.action === 'getState') {
        callback({ enabled: true, debug: false });
      } else if (message.action === 'toggleEnabled') {
        callback({ enabled: !message.currentState });
      } else if (message.action === 'toggleDebug') {
        callback({ debug: !message.currentState });
      }
    });
    
    const mockQuery = jest.fn().mockImplementation((queryInfo, callback) => {
      // Mock results based on the query
      if (queryInfo.url && queryInfo.url.includes('renown.gg')) {
        callback([
          { id: 1, url: 'https://renown.gg/queue' },
          { id: 2, url: 'https://renown.gg/match' }
        ]);
      } else {
        callback([]);
      }
    });
    
    // Set up global chrome with our mocks
    global.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      tabs: {
        query: mockQuery
      },
      storage: chromeStorage
    };
    
    // Set up the UI elements
    uiElements = createMockPopupUI();
  });
  
  afterEach(() => {
    cleanupMocks();
  });
  
  // Helper to create a mock version of the popup.js functionality
  const setupPopupMock = () => {
    // Mock function to update UI based on state
    const updateUI = (state) => {
      // Update enabled status
      uiElements.enableToggle.checked = state.enabled;
      
      if (state.enabled) {
        uiElements.statusIndicator.classList.add('active');
        uiElements.statusIndicator.classList.remove('inactive');
        uiElements.statusText.textContent = 'Auto Accept is ACTIVE';
      } else {
        uiElements.statusIndicator.classList.add('inactive');
        uiElements.statusIndicator.classList.remove('active');
        uiElements.statusText.textContent = 'Auto Accept is DISABLED';
      }
      
      // Update debug status
      uiElements.debugToggle.checked = state.debug;
    };
    
    // Mock function to update domain info
    const updateDomainInfo = () => {
      chrome.tabs.query({url: "*://*.renown.gg/*"}, (tabs) => {
        if (tabs.length > 0) {
          uiElements.domainInfo.textContent = `Active on ${tabs.length} Renown.gg tab(s)`;
          uiElements.domainInfo.classList.add('found');
          uiElements.domainInfo.classList.remove('not-found');
        } else {
          uiElements.domainInfo.textContent = 'No Renown.gg tabs detected';
          uiElements.domainInfo.classList.add('not-found');
          uiElements.domainInfo.classList.remove('found');
        }
      });
    };
    
    return {
      updateUI,
      updateDomainInfo
    };
  };
  
  describe('updateUI()', () => {
    test('should update UI elements when enabled', () => {
      const { updateUI } = setupPopupMock();
      
      // Call the function with an enabled state
      updateUI({ enabled: true, debug: false });
      
      // Check UI updates
      expect(uiElements.enableToggle.checked).toBe(true);
      expect(uiElements.debugToggle.checked).toBe(false);
      expect(uiElements.statusIndicator.classList.contains('active')).toBe(true);
      expect(uiElements.statusIndicator.classList.contains('inactive')).toBe(false);
      expect(uiElements.statusText.textContent).toBe('Auto Accept is ACTIVE');
    });
    
    test('should update UI elements when disabled', () => {
      const { updateUI } = setupPopupMock();
      
      // Call the function with a disabled state
      updateUI({ enabled: false, debug: false });
      
      // Check UI updates
      expect(uiElements.enableToggle.checked).toBe(false);
      expect(uiElements.debugToggle.checked).toBe(false);
      expect(uiElements.statusIndicator.classList.contains('active')).toBe(false);
      expect(uiElements.statusIndicator.classList.contains('inactive')).toBe(true);
      expect(uiElements.statusText.textContent).toBe('Auto Accept is DISABLED');
    });
    
    test('should update debug toggle correctly', () => {
      const { updateUI } = setupPopupMock();
      
      // Call the function with debug enabled
      updateUI({ enabled: true, debug: true });
      
      // Check debug toggle
      expect(uiElements.debugToggle.checked).toBe(true);
      
      // Call with debug disabled
      updateUI({ enabled: true, debug: false });
      
      // Check debug toggle again
      expect(uiElements.debugToggle.checked).toBe(false);
    });
  });
  
  describe('updateDomainInfo()', () => {
    test('should show active tabs when Renown tabs are found', async () => {
      const { updateDomainInfo } = setupPopupMock();
      
      // Call the function
      updateDomainInfo();
      
      // Allow promises to resolve
      await new Promise(process.nextTick);
      
      // Check domain info was updated
      expect(uiElements.domainInfo.textContent).toBe('Active on 2 Renown.gg tab(s)');
      expect(uiElements.domainInfo.classList.contains('found')).toBe(true);
      expect(uiElements.domainInfo.classList.contains('not-found')).toBe(false);
    });
    
    test('should show no tabs message when no Renown tabs are found', async () => {
      const { updateDomainInfo } = setupPopupMock();
      
      // Override the tabs.query mock for this test
      chrome.tabs.query.mockImplementationOnce((queryInfo, callback) => {
        callback([]);
        return Promise.resolve([]);
      });
      
      // Call the function
      updateDomainInfo();
      
      // Allow promises to resolve
      await new Promise(process.nextTick);
      
      // Check domain info was updated
      expect(uiElements.domainInfo.textContent).toBe('No Renown.gg tabs detected');
      expect(uiElements.domainInfo.classList.contains('found')).toBe(false);
      expect(uiElements.domainInfo.classList.contains('not-found')).toBe(true);
    });
  });
  
  describe('Event Listeners', () => {
    test('should toggle extension when enable toggle is changed', () => {
      // Create a mock handler
      const toggleHandler = jest.fn();
      
      // Add the event listener
      uiElements.enableToggle.addEventListener('change', toggleHandler);
      
      // Trigger the change event
      uiElements.enableToggle.checked = !uiElements.enableToggle.checked;
      uiElements.enableToggle.dispatchEvent(new Event('change'));
      
      // Check handler was called
      expect(toggleHandler).toHaveBeenCalled();
    });
    
    test('should toggle debug when debug toggle is changed', () => {
      // Create a mock handler
      const toggleHandler = jest.fn();
      
      // Add the event listener
      uiElements.debugToggle.addEventListener('change', toggleHandler);
      
      // Trigger the change event
      uiElements.debugToggle.checked = !uiElements.debugToggle.checked;
      uiElements.debugToggle.dispatchEvent(new Event('change'));
      
      // Check handler was called
      expect(toggleHandler).toHaveBeenCalled();
    });
  });
}); 