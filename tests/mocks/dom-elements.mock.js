/**
 * DOM Elements Mock File
 * 
 * This file contains mocks for various DOM elements used in testing.
 * These are particularly important for content.js tests.
 */

// Create a mock for the Accept button
function createMockAcceptButton(visible = true) {
  const button = document.createElement('button');
  button.className = 'primary-button md gradient';
  button.textContent = 'Accept';
  button.click = jest.fn();
  
  // Mock computed style for visibility checks
  Object.defineProperty(button, 'getBoundingClientRect', {
    value: jest.fn().mockReturnValue({
      width: visible ? 100 : 0,
      height: visible ? 40 : 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0
    })
  });
  
  // Add to DOM
  document.body.appendChild(button);
  
  // Set computed style properties
  jest.spyOn(window, 'getComputedStyle').mockReturnValue({
    display: visible ? 'block' : 'none',
    visibility: visible ? 'visible' : 'hidden'
  });
  
  return button;
}

// Create a mock for the Renown.gg page content with queue indicators
function createMockQueuePage(inQueue = true) {
  // Clean document body first
  document.body.innerHTML = '';
  
  // Create main content
  const mainContent = document.createElement('div');
  mainContent.className = 'renown-content';
  
  if (inQueue) {
    // Add queue indicators
    const queueText = document.createElement('div');
    queueText.className = 'queue-status';
    queueText.textContent = 'Looking for a match... In queue for 0:23';
    mainContent.appendChild(queueText);
  }
  
  document.body.appendChild(mainContent);
  
  return {
    mainContent,
    addAcceptButton: (visible = true) => createMockAcceptButton(visible)
  };
}

// Create mock popup UI elements
function createMockPopupUI() {
  document.body.innerHTML = `
    <div class="status">
      <span class="status-indicator" id="statusIndicator"></span>
      <span id="statusText">Checking status...</span>
    </div>
    
    <div class="domain-info" id="domainInfo">
      Checking for Renown.gg tabs...
    </div>
    
    <div class="browser-info">
      <span>Browser:</span>
      <span id="browserInfo">Detecting...</span>
    </div>
    
    <div class="settings">
      <div class="setting-item">
        <span class="setting-label">Enable Auto Accept</span>
        <label class="toggle">
          <input type="checkbox" id="enableToggle" checked>
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      <div class="setting-item">
        <span class="setting-label">Debug Mode</span>
        <label class="toggle">
          <input type="checkbox" id="debugToggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `;
  
  return {
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    enableToggle: document.getElementById('enableToggle'),
    debugToggle: document.getElementById('debugToggle'),
    domainInfo: document.getElementById('domainInfo'),
    browserInfo: document.getElementById('browserInfo')
  };
}

// Helper to cleanup mocks after tests
function cleanupMocks() {
  document.body.innerHTML = '';
  jest.restoreAllMocks();
}

module.exports = {
  createMockAcceptButton,
  createMockQueuePage,
  createMockPopupUI,
  cleanupMocks
}; 