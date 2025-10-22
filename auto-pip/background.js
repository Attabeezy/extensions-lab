// Store the previously active tab
let previousTabId = null;
let extensionEnabled = true;

// Load settings from storage
chrome.storage.sync.get(['enabled'], (result) => {
  extensionEnabled = result.enabled !== false; // Default to true
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    extensionEnabled = changes.enabled.newValue;
  }
});

// Listen for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!extensionEnabled) return;

  // If there was a previous tab and it's different from the current one
  if (previousTabId !== null && previousTabId !== activeInfo.tabId) {
    try {
      // Get the previous tab info
      const previousTab = await chrome.tabs.get(previousTabId);
      
      // Check if the previous tab still exists and has a valid URL
      if (previousTab && previousTab.url && !previousTab.url.startsWith('chrome://')) {
        // Send message to the previous tab's content script to enable PiP
        chrome.tabs.sendMessage(previousTabId, { 
          action: 'enablePiP',
          reason: 'tabSwitch'
        }).catch(err => {
          // Silently handle errors (tab might be closed or not ready)
          console.log('Could not send message to tab:', err.message);
        });
      }
    } catch (error) {
      // Tab might have been closed
      console.log('Previous tab no longer exists:', error.message);
    }
  }
  
  // Update the previous tab ID
  previousTabId = activeInfo.tabId;
});

// Listen for tab updates (when tab is reloaded or URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Update previousTabId if the current active tab is updated
  if (changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id === tabId) {
        previousTabId = tabId;
      }
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Toggle extension state
  extensionEnabled = !extensionEnabled;
  await chrome.storage.sync.set({ enabled: extensionEnabled });
  
  // Update icon to reflect state
  const iconPath = extensionEnabled ? 'icons/icon48.png' : 'icons/icon48-disabled.png';
  chrome.action.setIcon({ path: iconPath });
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true });
});