let previousTabId = null;
let extensionEnabled = true;

// Load settings from storage
chrome.storage.sync.get(['enabled'], (result) => {
  extensionEnabled = result.enabled !== false;
  updateIcon(extensionEnabled);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    extensionEnabled = changes.enabled.newValue;
    updateIcon(extensionEnabled);
  }
});

// Update extension icon based on state
function updateIcon(enabled) {
  const iconPath = enabled ? {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  } : {
    "16": "icons/icon16-disabled.png",
    "48": "icons/icon48-disabled.png",
    "128": "icons/icon128-disabled.png"
  };

  chrome.action.setIcon({ path: iconPath }).catch(() => {
    // Fallback if disabled icons don't exist
  });
}

// Listen for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!extensionEnabled) return;

  // If there was a previous tab and it's different from the current one
  if (previousTabId !== null && previousTabId !== activeInfo.tabId) {
    try {
      const previousTab = await chrome.tabs.get(previousTabId);

      // Check if the previous tab is valid
      if (previousTab &&
          previousTab.url &&
          !previousTab.url.startsWith('chrome://') &&
          !previousTab.url.startsWith('chrome-extension://') &&
          !previousTab.url.startsWith('about:') &&
          !previousTab.url.startsWith('edge://')) {

        // Small delay to ensure content script is ready
        setTimeout(() => {
          chrome.tabs.sendMessage(previousTabId, {
            action: 'enablePiP',
            reason: 'tabSwitch'
          }).catch(err => {
            console.log('Could not send message to tab:', err.message);
          });
        }, 50);
      }
    } catch (error) {
      console.log('Previous tab no longer exists:', error.message);
    }
  }

  previousTabId = activeInfo.tabId;
});

// Listen for window focus changes (detect minimize/app switch)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!extensionEnabled) return;

  // windowId === -1 means no window is focused (minimized or switched to another app)
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    try {
      // Get the currently active tab
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

      if (activeTab &&
          activeTab.url &&
          !activeTab.url.startsWith('chrome://') &&
          !activeTab.url.startsWith('chrome-extension://') &&
          !activeTab.url.startsWith('about:') &&
          !activeTab.url.startsWith('edge://')) {

        setTimeout(() => {
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'enablePiP',
            reason: 'windowBlur'
          }).catch(err => {
            console.log('Could not send message to tab:', err.message);
          });
        }, 50);
      }
    } catch (error) {
      console.log('Error handling window focus change:', error.message);
    }
  }
});

// Listen for tab updates (when tab is reloaded or URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id === tabId) {
        previousTabId = tabId;
      }
    });
  }
});

// Handle extension icon click (toggle on/off)
chrome.action.onClicked.addListener(async (tab) => {
  extensionEnabled = !extensionEnabled;
  await chrome.storage.sync.set({ enabled: extensionEnabled });
  updateIcon(extensionEnabled);

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Auto Picture-in-Picture',
    message: extensionEnabled ? 'Enabled' : 'Disabled',
    priority: 0
  });

  // Clear notification after 2 seconds
  setTimeout(() => {
    chrome.notifications.clear();
  }, 2000);
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true });
  updateIcon(true);
});
