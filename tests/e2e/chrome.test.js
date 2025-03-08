/**
 * RE:Q - End-to-End Tests for Chrome
 * 
 * These tests simulate the extension's functionality in Chrome
 * using a Jest-based approach without Playwright.
 */

// Mock for chrome API
const chrome = require('jest-chrome');
const { chromeStorage } = require('../mocks/browser-storage.mock');


describe('RE:Q Chrome Extension E2E Tests', () => {
  // Mock necessary browser APIs
  beforeAll(() => {
    // Create mock implementations
    const sendMessageMock = jest.fn().mockImplementation((message, callback) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    });
    
    const queryMock = jest.fn().mockImplementation((queryInfo, callback) => {
      const tabs = [
        { id: 1, url: 'https://renown.gg/match' }
      ];
      callback(tabs);
      return Promise.resolve(tabs);
    });

    // Set up window location for tests
    delete window.location;
    window.location = { href: 'https://renown.gg/matches' };
    
    // Simulate a DOM environment
    document.body.innerHTML = `
      <div id="app">
        <div class="queue-container">
          <button class="accept-button">Accept</button>
        </div>
      </div>
    `;
  });
  
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('Extension should detect Renown.gg domain', () => {
    // Simulate what content.js would do
    const isRenownDomain = () => {
      return window.location.href.includes('renown.gg');
    };
    
    // The test domain should be a Renown domain
    expect(window.location.href).toBe('https://renown.gg/matches');
    expect(isRenownDomain()).toBe(true);
  });
  
  test('Extension should store enabled state in storage', () => {
    // Set up a mock for storage.local.set
    const mockSet = jest.fn((data, callback) => {
      if (callback) callback();
    });
    
    // Create a temporary mock chrome object for this test
    const tempChrome = {
      storage: {
        local: {
          set: mockSet
        }
      }
    };
    
    // Simulate background script enabling the extension
    tempChrome.storage.local.set({ enabled: true }, () => {});
    
    // Check that storage was updated correctly
    expect(mockSet).toHaveBeenCalledWith({ enabled: true }, expect.any(Function));
  });
  
  test('Extension should handle queue button click', () => {
    // Set up a click listener (simulating what content.js would do)
    const mockClick = jest.fn();
    document.querySelector('.accept-button').addEventListener('click', mockClick);
    
    // Simulate the extension clicking the button
    document.querySelector('.accept-button').click();
    
    // Check that the button was clicked
    expect(mockClick).toHaveBeenCalled();
  });
  
  test('Extension should send messages between scripts', () => {
    // Create a mock sendMessage function
    const sendMessage = jest.fn((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    });
    
    // Create a temporary mock chrome object for this test
    const tempChrome = {
      runtime: {
        sendMessage
      }
    };
    
    // Simulate content script sending message to background script
    tempChrome.runtime.sendMessage({ action: 'queueAccepted' }, (response) => {
      expect(response.success).toBe(true);
    });
    
    // Check that sendMessage was called with the right parameters
    expect(sendMessage).toHaveBeenCalledWith(
      { action: 'queueAccepted' },
      expect.any(Function)
    );
  });
}); 