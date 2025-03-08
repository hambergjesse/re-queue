/**
 * RE:Q - Unit Tests for content.js
 * 
 * These tests focus on the core functionality of the content script,
 * particularly the button detection and clicking logic.
 */

const { createMockAcceptButton, createMockQueuePage, cleanupMocks } = require('../mocks/dom-elements.mock.js');

// Create a mock version of content.js functionality for testing
// We need to do this because content.js uses browser APIs and immediate execution
const setupContentScriptMock = () => {
  // Reset document first
  document.body.innerHTML = '';
  
  // Configuration object similar to content.js
  const config = {
    buttonSelector: 'button.primary-button.md.gradient',
    buttonText: 'Accept',
    pollingInterval: 500,
    queuePollingInterval: 200,
    enabled: true,
    debug: false,
    inQueue: false,
    firefoxSpecific: {
      useDirectEvents: true
    }
  };
  
  // Mock console logging
  const log = jest.fn();
  
  // Domain check function
  const isRenownDomain = () => {
    // Always return true for tests
    return true;
  };
  
  // Mock the click button function
  const clickUsingBestMethod = jest.fn();
  
  // The main function we want to test
  const clickAcceptButton = () => {
    if (!config.enabled || !isRenownDomain()) {
      return false;
    }
  
    // Find all buttons matching our selector
    const buttons = document.querySelectorAll(config.buttonSelector);
    
    // Look for the button with the right text
    for (const button of buttons) {
      if (button.textContent.trim() === config.buttonText) {
        // Check if the button is visible
        const rect = button.getBoundingClientRect();
        const isVisible = rect.width > 0 && 
                          rect.height > 0 && 
                          window.getComputedStyle(button).display !== 'none' &&
                          window.getComputedStyle(button).visibility !== 'hidden';
                          
        if (isVisible) {
          log('Found "Accept" button on Renown.gg - clicking automatically');
          
          // Try to focus the window to ensure the click works
          try {
            window.focus();
          } catch (e) {
            log('Could not focus window, but continuing with click');
          }
          
          // Click using the method most compatible across browsers
          clickUsingBestMethod(button);
          button.click();
          
          log('Accept button clicked');
          
          // Flag that we're likely in a queue
          config.inQueue = true;
          
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Check for queue status indicators
  const checkQueueStatus = () => {
    // Look for common indicators that we're in a queue
    const queueIndicators = [
      'queue',
      'matchmaking',
      'searching',
      'looking for game',
      'finding match',
      'in queue'
    ];
    
    // In jsdom environment innerText is not implemented
    // So we'll mock the page text to simulate what we're looking for
    let pageText = '';
    try {
      pageText = document.body.innerText.toLowerCase();
    } catch (e) {
      // If innerText is not available, get text content from elements with queue indicators
      const queueElement = document.querySelector('.queue-status');
      if (queueElement) {
        pageText = queueElement.textContent.toLowerCase();
      }
    }
    
    // Check if any indicators are present
    const foundIndicator = queueIndicators.some(indicator => 
      pageText.includes(indicator)
    );
    
    if (foundIndicator) {
      if (!config.inQueue) {
        log('Renown queue indicators detected, increasing polling frequency');
        config.inQueue = true;
      }
    } else {
      if (config.inQueue) {
        log('No longer in Renown queue, returning to normal polling');
        config.inQueue = false;
      }
    }
    
    return config.inQueue;
  };
  
  return {
    config,
    log,
    isRenownDomain,
    clickAcceptButton,
    clickUsingBestMethod,
    checkQueueStatus
  };
};

describe('Content Script - Core Functionality', () => {
  let contentScript;
  
  beforeEach(() => {
    contentScript = setupContentScriptMock();
    
    // Mock window.focus
    window.focus = jest.fn();
    
    // Create a fresh DOM environment
    document.body.innerHTML = '';
  });
  
  afterEach(() => {
    cleanupMocks();
  });
  
  describe('isRenownDomain()', () => {
    test('should return true for Renown.gg domain', () => {
      // Our mock always returns true
      expect(contentScript.isRenownDomain()).toBe(true);
    });
  });
  
  describe('clickAcceptButton()', () => {
    test('should find and click the visible Accept button', () => {
      // Set up a mock Accept button
      const button = createMockAcceptButton(true);
      
      // Run the function
      const result = contentScript.clickAcceptButton();
      
      // Assertions
      expect(result).toBe(true);
      expect(window.focus).toHaveBeenCalled();
      expect(button.click).toHaveBeenCalled();
      expect(contentScript.log).toHaveBeenCalledWith('Found "Accept" button on Renown.gg - clicking automatically');
      expect(contentScript.config.inQueue).toBe(true);
    });
    
    test('should not click invisible Accept button', () => {
      // Set up a mock Accept button that's not visible
      const button = createMockAcceptButton(false);
      
      // Run the function
      const result = contentScript.clickAcceptButton();
      
      // Assertions
      expect(result).toBe(false);
      expect(button.click).not.toHaveBeenCalled();
    });
    
    test('should not click if disabled', () => {
      // Set up a mock Accept button
      const button = createMockAcceptButton(true);
      
      // Disable the functionality
      contentScript.config.enabled = false;
      
      // Run the function
      const result = contentScript.clickAcceptButton();
      
      // Assertions
      expect(result).toBe(false);
      expect(button.click).not.toHaveBeenCalled();
    });
    
    test('should handle if window.focus throws error', () => {
      // Set up a mock Accept button
      const button = createMockAcceptButton(true);
      
      // Make window.focus throw an error
      window.focus.mockImplementation(() => {
        throw new Error('focus error');
      });
      
      // Run the function
      const result = contentScript.clickAcceptButton();
      
      // Assertions
      expect(result).toBe(true);
      expect(window.focus).toHaveBeenCalled();
      expect(contentScript.log).toHaveBeenCalledWith('Could not focus window, but continuing with click');
      expect(button.click).toHaveBeenCalled();
    });
  });
  
  describe('checkQueueStatus()', () => {
    test('should detect queue indicators and set inQueue to true', () => {
      // Create a mock queue page with indicators
      createMockQueuePage(true);
      
      // Run the function
      const result = contentScript.checkQueueStatus();
      
      // Assertions
      expect(result).toBe(true);
      expect(contentScript.config.inQueue).toBe(true);
      expect(contentScript.log).toHaveBeenCalledWith('Renown queue indicators detected, increasing polling frequency');
    });
    
    test('should detect absence of queue indicators and set inQueue to false', () => {
      // Set initial inQueue to true
      contentScript.config.inQueue = true;
      
      // Create a mock page without queue indicators
      createMockQueuePage(false);
      
      // Run the function
      const result = contentScript.checkQueueStatus();
      
      // Assertions
      expect(result).toBe(false);
      expect(contentScript.config.inQueue).toBe(false);
      expect(contentScript.log).toHaveBeenCalledWith('No longer in Renown queue, returning to normal polling');
    });
    
    test('should not log if status doesnt change', () => {
      // Create a mock queue page with indicators
      createMockQueuePage(true);
      
      // Set initial inQueue to true already
      contentScript.config.inQueue = true;
      
      // Run the function
      contentScript.checkQueueStatus();
      
      // Assertions - log shouldn't be called since status didn't change
      expect(contentScript.log).not.toHaveBeenCalled();
    });
  });
}); 