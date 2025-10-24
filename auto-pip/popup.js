document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');

  // Load the current state from storage and update the UI
  chrome.storage.sync.get(['enabled'], (result) => {
    const isEnabled = result.enabled !== false; // Default to true
    toggleSwitch.checked = isEnabled;
    updateStatus(isEnabled);
  });

  // Handle switch change
  toggleSwitch.addEventListener('change', () => {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ enabled: isEnabled }, () => {
      updateStatus(isEnabled);
    });
  });

  function updateStatus(isEnabled) {
    statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
  }
});
