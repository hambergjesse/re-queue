/**
 * RE:Q - Background Service Worker
 * 
 * Handles extension state management and communication for automatic
 * acceptance of match queues on Renown.gg. Community-made project,
 * not affiliated with Renown.
 */

// Import the polyfill in module contexts if needed
import './lib/browser-polyfill.min.js';

// Feature detection - check which browser APIs are available
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const isFirefox = typeof browser !== 'undefined' && browser.runtime.getBrowserInfo !== undefined;
const isChromium = !isFirefox;

// Store the extension state
let extensionState = {
  enabled: true,
  debug: false
};

// Load saved state on startup
browserAPI.storage.local.get(['enabled', 'debug']).then(result => {
  if (result.hasOwnProperty('enabled')) {
    extensionState.enabled = result.enabled;
  }
  if (result.hasOwnProperty('debug')) {
    extensionState.debug = result.debug;
  }
}).catch(error => {
  console.error('Error loading settings:', error);
});

/**
 * Toggle the enabled state of the extension
 */
function toggleExtension() {
  extensionState.enabled = !extensionState.enabled;
  
  // Save the new state
  browserAPI.storage.local.set({ enabled: extensionState.enabled })
    .catch(error => {
      console.error('Error saving enabled state:', error);
    });
  
  // Notify all content scripts
  updateContentScripts();
  
  return extensionState.enabled;
}

/**
 * Toggle the debug mode
 */
function toggleDebug() {
  extensionState.debug = !extensionState.debug;
  
  // Save the new state
  browserAPI.storage.local.set({ debug: extensionState.debug })
    .catch(error => {
      console.error('Error saving debug state:', error);
    });
  
  // Notify all content scripts
  notifyContentScriptsOfDebugChange();
  
  return extensionState.debug;
}

/**
 * Send status updates to all content scripts on Renown.gg domains
 */
function updateContentScripts() {
  browserAPI.tabs.query({url: "*://*.renown.gg/*"})
    .then(tabs => {
      tabs.forEach(tab => {
        browserAPI.tabs.sendMessage(tab.id, { 
          action: 'updateStatus',
          enabled: extensionState.enabled 
        }).catch(err => {
          // It's fine if the content script isn't ready yet or the tab is no longer available
          console.debug('Could not send message to tab:', err);
        });
      });
    })
    .catch(error => {
      console.error('Error querying tabs:', error);
    });
}

/**
 * Notify content scripts of debug mode change
 */
function notifyContentScriptsOfDebugChange() {
  browserAPI.tabs.query({url: "*://*.renown.gg/*"})
    .then(tabs => {
      tabs.forEach(tab => {
        browserAPI.tabs.sendMessage(tab.id, { 
          action: 'toggleDebug',
          debug: extensionState.debug 
        }).catch(err => {
          // It's fine if the content script isn't ready yet or the tab is no longer available
          console.debug('Could not send message to tab:', err);
        });
      });
    })
    .catch(error => {
      console.error('Error querying tabs:', error);
    });
}

/**
 * Check for Renown.gg tabs and ensure our content scripts are loaded
 */
async function checkForGameTabs() {
  try {
    const tabs = await browserAPI.tabs.query({url: "*://*.renown.gg/*"});
    
    if (tabs.length > 0) {
      console.debug(`Found ${tabs.length} Renown.gg tabs`);
      
      // Make sure each tab has our content script running
      for (const tab of tabs) {
        try {
          // Pinging the tab to see if content script is responding
          await browserAPI.tabs.sendMessage(tab.id, { action: 'ping' });
        } catch (err) {
          console.debug(`Content script not active in tab ${tab.id}, refreshing script`);
          
          // If we get an error, script isn't running, so execute it
          // Use different approach based on browser
          if (isChromium && browserAPI.scripting) {
            try {
              await browserAPI.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['lib/browser-polyfill.min.js', 'content.js']
              });
            } catch (error) {
              console.error(`Failed to inject content script in tab ${tab.id}:`, error);
            }
          } else if (isFirefox) {
            // Firefox uses a different approach
            try {
              await browserAPI.tabs.executeScript(tab.id, {
                file: 'lib/browser-polyfill.min.js'
              });
              await browserAPI.tabs.executeScript(tab.id, {
                file: 'content.js'
              });
            } catch (error) {
              console.error(`Failed to inject content script in tab ${tab.id}:`, error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking for Renown.gg tabs:', error);
  }
}

// Periodically check for Renown.gg tabs
setInterval(checkForGameTabs, 60000);  // Check every minute

// Also check on startup
checkForGameTabs();

// Listen for messages from the popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    sendResponse(extensionState);
    return true;
  } else if (message.action === 'toggleEnabled') {
    const newState = toggleExtension();
    sendResponse({ enabled: newState });
    return true;
  } else if (message.action === 'toggleDebug') {
    const newDebugState = toggleDebug();
    sendResponse({ debug: newDebugState });
    return true;
  }
  
  return true; // Indicates we will respond asynchronously
});

// Listen for tab updates
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // If a Renown.gg tab is fully loaded, make sure our content script is running
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('renown.gg')) {
    console.debug(`Renown.gg tab updated: ${tab.url}`);
    
    // Send current state to content script
    browserAPI.tabs.sendMessage(tabId, { 
      action: 'updateStatus',
      enabled: extensionState.enabled,
      debug: extensionState.debug
    }).catch(async err => {
      // If error, content script may not be injected yet
      console.debug(`Trying to inject content script in tab ${tabId}`);
      
      if (isChromium && browserAPI.scripting) {
        try {
          await browserAPI.scripting.executeScript({
            target: { tabId: tabId },
            files: ['lib/browser-polyfill.min.js', 'content.js']
          });
        } catch (error) {
          console.error(`Failed to inject content script in tab ${tabId}:`, error);
        }
      } else if (isFirefox) {
        try {
          await browserAPI.tabs.executeScript(tabId, {
            file: 'lib/browser-polyfill.min.js'
          });
          await browserAPI.tabs.executeScript(tabId, {
            file: 'content.js'
          });
        } catch (error) {
          console.error(`Failed to inject content script in tab ${tabId}:`, error);
        }
      }
    });
  }
});
