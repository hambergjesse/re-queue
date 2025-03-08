/**
 * RE:Q - Popup Script
 * 
 * Handles the extension popup UI interactions for the Renown.gg queue
 * auto-accepter. Community-made project, not affiliated with Renown.
 */

// Feature detection - check which browser APIs are available
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const isFirefox = typeof browser !== 'undefined' && navigator.userAgent.includes('Firefox');
const isChromium = !isFirefox;

document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const enableToggle = document.getElementById('enableToggle');
  const debugToggle = document.getElementById('debugToggle');
  const domainInfo = document.getElementById('domainInfo');
  const browserInfo = document.getElementById('browserInfo');
  
  // Show browser info if element exists
  if (browserInfo) {
    browserInfo.textContent = isFirefox ? 'Firefox' : 'Chromium-based';
  }
  
  // Update UI based on the current extension state
  function updateUI(state) {
    // Update enabled status
    enableToggle.checked = state.enabled;
    
    if (state.enabled) {
      statusIndicator.classList.add('active');
      statusIndicator.classList.remove('inactive');
      statusText.textContent = 'Auto Accept is ACTIVE';
    } else {
      statusIndicator.classList.add('inactive');
      statusIndicator.classList.remove('active');
      statusText.textContent = 'Auto Accept is DISABLED';
    }
    
    // Update debug status
    debugToggle.checked = state.debug;
  }
  
  // Check for Renown.gg tabs and update domain info
  function updateDomainInfo() {
    browserAPI.tabs.query({url: "*://*.renown.gg/*"})
      .then(tabs => {
        if (tabs.length > 0) {
          domainInfo.textContent = `Active on ${tabs.length} Renown.gg tab(s)`;
          domainInfo.classList.add('found');
          domainInfo.classList.remove('not-found');
        } else {
          domainInfo.textContent = 'No Renown.gg tabs detected';
          domainInfo.classList.add('not-found');
          domainInfo.classList.remove('found');
        }
      })
      .catch(error => {
        console.error('Error querying tabs:', error);
        domainInfo.textContent = 'Error checking Renown.gg tab status';
        domainInfo.classList.add('not-found');
        domainInfo.classList.remove('found');
      });
  }
  
  // Get the initial state from the background script
  browserAPI.runtime.sendMessage({ action: 'getState' })
    .then(response => {
      if (response) {
        updateUI(response);
        updateDomainInfo();
      } else {
        // Handle error
        statusText.textContent = 'Error connecting to extension';
      }
    })
    .catch(error => {
      console.error('Error getting extension state:', error);
      statusText.textContent = 'Error connecting to extension';
    });
  
  // Handle toggle for enabling/disabling the extension
  enableToggle.addEventListener('change', () => {
    browserAPI.runtime.sendMessage({ action: 'toggleEnabled' })
      .then(response => {
        if (response) {
          updateUI({ enabled: response.enabled, debug: debugToggle.checked });
        }
      })
      .catch(error => {
        console.error('Error toggling extension:', error);
      });
  });
  
  // Handle toggle for debug mode
  debugToggle.addEventListener('change', () => {
    browserAPI.runtime.sendMessage({ action: 'toggleDebug' })
      .then(response => {
        if (response) {
          updateUI({ enabled: enableToggle.checked, debug: response.debug });
        }
      })
      .catch(error => {
        console.error('Error toggling debug mode:', error);
      });
  });
});
