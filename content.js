/**
 * RE:Q - Content Script
 * 
 * This script monitors Renown.gg for the appearance of the "Accept" button
 * and automatically clicks it when detected, even when the tab is not in focus.
 * 
 * Community-made project, not affiliated with Renown.
 */

// Feature detection - check which browser APIs are available
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const isFirefox = typeof browser !== 'undefined' && navigator.userAgent.includes('Firefox');
const isChromium = !isFirefox;

// Configuration
const config = {
  // Button selector to watch for
  buttonSelector: 'button.primary-button.md.gradient',
  // Text that should be inside the button
  buttonText: 'Accept',
  // Polling interval in milliseconds
  pollingInterval: 500,
  // More aggressive polling when in a queue (milliseconds)
  queuePollingInterval: 200,
  // Enabled state
  enabled: true,
  // Enable logging
  debug: false,
  // Flag to track if we're likely in a queue
  inQueue: false,
  // Browser-specific settings
  firefoxSpecific: {
    useDirectEvents: true  // Firefox may need direct event dispatching
  }
};

// Logger function that respects debug setting
const log = (...args) => {
  if (config.debug) {
    console.log('[RE:Q]', ...args);
  }
};

/**
 * Check if we're on a Renown.gg domain
 */
function isRenownDomain() {
  return window.location.hostname.includes('renown.gg');
}

/**
 * Click the accept button if it exists and is visible
 * @returns {boolean} Whether a button was found and clicked
 */
function clickAcceptButton() {
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
        
        log('Accept button clicked');
        
        // Flag that we're likely in a queue
        config.inQueue = true;
        
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Click a button using the best method for the current browser
 * @param {HTMLElement} button The button to click
 */
function clickUsingBestMethod(button) {
  // First try the standard click method
  button.click();
  
  // For Firefox, we may need more direct event dispatching
  if (isFirefox && config.firefoxSpecific.useDirectEvents) {
    try {
      // Create and dispatch mousedown event
      button.dispatchEvent(new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      }));
      
      // Create and dispatch mouseup event
      button.dispatchEvent(new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      }));
      
      // Create and dispatch click event
      button.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      }));
    } catch (e) {
      log('Error dispatching direct Firefox events:', e);
    }
  }
  
  // Also try using the more generalized approach
  try {
    // Note: Some browsers need a bit more direct approach
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: Math.floor(button.getBoundingClientRect().x + button.offsetWidth / 2),
      clientY: Math.floor(button.getBoundingClientRect().y + button.offsetHeight / 2),
      buttons: 1
    });
    button.dispatchEvent(clickEvent);
  } catch (e) {
    log('Error dispatching click event:', e);
  }
}

/**
 * Check for queue status indicators to adjust polling frequency
 */
function checkQueueStatus() {
  // Look for common indicators that we're in a queue
  const queueIndicators = [
    'queue',
    'matchmaking',
    'searching',
    'looking for game',
    'finding match',
    'in queue'
  ];
  
  // Get all visible text on the page
  const pageText = document.body.innerText.toLowerCase();
  
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
}

/**
 * Set up mutation observer to watch for DOM changes
 * This is more efficient than constant polling
 */
function setupMutationObserver() {
  if (!isRenownDomain()) {
    return null;
  }
  
  log('Setting up mutation observer for Renown.gg');
  
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    if (!config.enabled) return;
    
    // For each mutation, check if we should look for the button
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        if (clickAcceptButton()) {
          // No need to check other mutations if we found and clicked a button
          break;
        }
      }
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden']
  });
  
  return observer;
}

/**
 * Set up a fallback polling mechanism
 * This ensures we don't miss buttons even if they're added without triggering mutations
 */
function setupPolling() {
  if (!isRenownDomain()) {
    return null;
  }
  
  log('Setting up fallback polling for Renown.gg');
  
  // Different polling strategies based on browser
  if (isFirefox) {
    log('Using Firefox-specific polling strategy');
  }
  
  // Set up recurring check
  const intervalId = setInterval(() => {
    if (!config.enabled) return;
    
    // Check for queue status to adjust polling frequency
    checkQueueStatus();
    
    // Check for the accept button
    clickAcceptButton();
    
    // Adjust the interval based on whether we think we're in a queue
    if (intervalId && config.inQueue) {
      clearInterval(intervalId);
      // Start more aggressive polling
      return setInterval(() => {
        if (!config.enabled) return;
        clickAcceptButton();
      }, config.queuePollingInterval);
    }
  }, config.pollingInterval);
  
  return intervalId;
}

/**
 * Initialize the extension functionality
 */
function initialize() {
  // Skip initialization if not on Renown.gg
  if (!isRenownDomain()) {
    log('Not on Renown.gg domain, skipping initialization');
    return null;
  }
  
  log('Initializing RE:Q on', window.location.hostname);
  log('Running in', isFirefox ? 'Firefox' : 'Chromium-based browser');
  
  // Immediately check if the button already exists
  clickAcceptButton();
  
  // Set up primary detection method - mutation observer
  const observer = setupMutationObserver();
  
  // Set up fallback method - polling
  const intervalId = setupPolling();
  
  // Return cleanup function if needed
  return () => {
    if (observer) observer.disconnect();
    if (intervalId) clearInterval(intervalId);
  };
}

// Only initialize on Renown.gg domains
if (isRenownDomain()) {
  // Initialize when the content script loads
  const cleanup = initialize();

  // Listen for messages from the popup/background script
  browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ping') {
      // Respond to ping to indicate content script is active
      sendResponse({ status: 'active', browser: isFirefox ? 'firefox' : 'chromium' });
    } else if (message.action === 'getStatus') {
      sendResponse({ 
        status: 'running',
        domain: window.location.hostname,
        inQueue: config.inQueue,
        enabled: config.enabled,
        browser: isFirefox ? 'firefox' : 'chromium'
      });
    } else if (message.action === 'updateStatus') {
      config.enabled = message.enabled;
      log('Extension ' + (config.enabled ? 'enabled' : 'disabled'));
      
      // If we're enabling and on Renown.gg, check for the button immediately
      if (config.enabled && isRenownDomain()) {
        clickAcceptButton();
      }
      
      sendResponse({ status: 'success', enabled: config.enabled });
    } else if (message.action === 'toggleDebug') {
      config.debug = message.debug;
      log('Debug mode ' + (config.debug ? 'enabled' : 'disabled'));
      sendResponse({ status: 'success', debug: config.debug });
    }
    
    return true; // Indicates we will respond asynchronously
  });
}
