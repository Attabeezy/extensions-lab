// Get elements
const enableToggle = document.getElementById('enableToggle');
const statusDiv = document.getElementById('status');

// Load current state from storage
chrome.storage.sync.get(['enabled'], (result) => {
  const isEnabled = result.enabled !== false; // Default to true
  enableToggle.checked = isEnabled;
  updateStatus(isEnabled);
});

// Listen for toggle changes
enableToggle.addEventListener('change', async () => {
  const isEnabled = enableToggle.checked;
  
  // Save to storage
  await chrome.storage.sync.set({ enabled: isEnabled });
  
  // Update status display
  updateStatus(isEnabled);
});

/**
 * Update the status message and styling
 */
function updateStatus(isEnabled) {
  if (isEnabled) {
    statusDiv.className = 'status enabled';
    statusDiv.textContent = '✓ Auto PiP is enabled';
  } else {
    statusDiv.className = 'status disabled';
    statusDiv.textContent = '✗ Auto PiP is disabled';
  }
}