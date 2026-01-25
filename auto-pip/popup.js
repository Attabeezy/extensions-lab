// Get elements
const enableToggle = document.getElementById('enableToggle');
const debugToggle = document.getElementById('debugToggle');
const statusDiv = document.getElementById('status');

// Load current state from storage
chrome.storage.sync.get(['enabled', 'debugMode'], (result) => {
  const isEnabled = result.enabled !== false;
  const debugMode = result.debugMode === true;
  
  enableToggle.checked = isEnabled;
  debugToggle.checked = debugMode;
  
  updateStatus(isEnabled, debugMode);
});

// Listen for enable toggle changes
enableToggle.addEventListener('change', async () => {
  const isEnabled = enableToggle.checked;
  const debugMode = debugToggle.checked;
  
  // Save to storage
  await chrome.storage.sync.set({ enabled: isEnabled });
  
  // Update status display
  updateStatus(isEnabled, debugMode);
  
  // Reload all tabs to apply changes
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      chrome.tabs.reload(tab.id).catch(() => {});
    }
  });
});

// Listen for debug toggle changes
debugToggle.addEventListener('change', async () => {
  const debugMode = debugToggle.checked;
  const isEnabled = enableToggle.checked;
  
  // Save to storage
  await chrome.storage.sync.set({ debugMode: debugMode });
  
  // Update status display
  updateStatus(isEnabled, debugMode);
  
  // Reload all tabs to apply debug mode
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      chrome.tabs.reload(tab.id).catch(() => {});
    }
  });
});

/**
 * Update the status message and styling
 */
function updateStatus(isEnabled, debugMode) {
  if (isEnabled) {
    statusDiv.className = 'status enabled';
    statusDiv.textContent = debugMode 
      ? '✓ Auto PiP enabled (Debug Mode ON)' 
      : '✓ Auto PiP is enabled';
  } else {
    statusDiv.className = 'status disabled';
    statusDiv.textContent = '✗ Auto PiP is disabled';
  }
}