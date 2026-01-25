// Simple background script - just handle initialization
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ 
    enabled: true,
    debugMode: false,
    showNotifications: false
  });
  console.log('[Auto PiP] Extension installed with default settings');
});
