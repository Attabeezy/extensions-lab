(function() {
  'use strict';

  // State management
  let isEnabled = true;
  let isPageVisible = !document.hidden;
  let shouldActivatePiP = false;
  let pipActiveVideo = null;
  let debounceTimer = null;
  let debugMode = false;
  let debugIndicator = null;
  let interactionCount = 0;
  let lastInteractionType = null;

  // Debug logging utility
  function debugLog(message, data = null, level = 'info') {
    const prefix = '[Auto PiP Debug]';
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = `${prefix} [${timestamp}] ${message}`;
    
    if (debugMode) {
      // Always log in debug mode
      if (level === 'error') {
        console.error(fullMessage, data || '');
      } else if (level === 'warn') {
        console.warn(fullMessage, data || '');
      } else {
        console.log(fullMessage, data || '');
      }
      
      // Update visual indicator
      updateDebugIndicator(message, level);
    } else if (level === 'error') {
      // Always log errors even when debug mode is off
      console.error(fullMessage, data || '');
    }
  }

  // Visual debug indicator
  function createDebugIndicator() {
    if (debugIndicator) return;
    
    // Check if body exists
    if (!document.body) {
      console.warn('[Auto PiP] Cannot create debug indicator - document.body not ready');
      return;
    }
    
    debugIndicator = document.createElement('div');
    debugIndicator.id = 'auto-pip-debug';
    debugIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      padding: 10px 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 999999;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      pointer-events: none;
    `;
    
    try {
      document.body.appendChild(debugIndicator);
      debugLog('Debug indicator created');
    } catch (error) {
      console.error('[Auto PiP] Failed to create debug indicator:', error);
    }
  }

  function updateDebugIndicator(message, level = 'info') {
    if (!debugMode || !debugIndicator) return;
    
    const color = level === 'error' ? '#f00' : level === 'warn' ? '#ff0' : '#0f0';
    const timestamp = new Date().toLocaleTimeString();
    
    debugIndicator.innerHTML = `
      <div style="color: #0ff; margin-bottom: 5px; font-weight: bold;">Auto PiP Debug</div>
      <div style="color: ${color};">${timestamp}: ${message}</div>
      <div style="margin-top: 5px; color: #aaa; font-size: 10px;">
        Enabled: ${isEnabled} | Visible: ${isPageVisible} | Should PiP: ${shouldActivatePiP}<br>
        Interactions: ${interactionCount} | Last: ${lastInteractionType || 'none'}
      </div>
    `;
  }

  function removeDebugIndicator() {
    if (debugIndicator) {
      debugIndicator.remove();
      debugIndicator = null;
    }
  }

  // Load settings
  chrome.storage.sync.get(['enabled', 'debugMode'], (result) => {
    isEnabled = result.enabled !== false;
    debugMode = result.debugMode === true;
    
    console.log(`[Auto PiP] Settings loaded - enabled: ${isEnabled}, debugMode: ${debugMode}`);
    
    if (debugMode && document.body) {
      createDebugIndicator();
    }
    
    if (isEnabled) {
      initialize();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      isEnabled = changes.enabled.newValue;
      debugLog(`Extension ${isEnabled ? 'enabled' : 'disabled'}`);
      
      if (!isEnabled && document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    }
    
    if (changes.debugMode) {
      debugMode = changes.debugMode.newValue;
      debugLog(`Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
      
      if (debugMode) {
        createDebugIndicator();
      } else {
        removeDebugIndicator();
      }
    }
  });

  function initialize() {
    // Wait for body to be ready
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
      } else {
        // Body should exist, wait a bit and retry
        setTimeout(initialize, 100);
      }
      return;
    }
    
    debugLog('Initializing extension...');
    
    // Monitor page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up global interaction listeners FIRST
    setupGlobalInteractionListener();
    
    // Set up video monitoring
    setupVideoMonitoring();
    
    // Watch for new videos
    observeVideos();
    
    debugLog(`Initialization complete. Found ${document.querySelectorAll('video').length} videos`);
  }

  function handleVisibilityChange() {
    isPageVisible = !document.hidden;

    debugLog(`Page visibility changed: ${isPageVisible ? 'VISIBLE' : 'HIDDEN'}`, null, 'warn');

    if (!isEnabled) return;

    if (!isPageVisible) {
      // Page became hidden - mark for PiP activation (only if not already in PiP)
      if (!document.pictureInPictureElement) {
        shouldActivatePiP = true;
        interactionCount = 0; // Reset interaction counter
        debugLog('Page hidden - PiP will activate on next user interaction', null, 'warn');
      } else {
        debugLog('Page hidden but already in PiP mode');
      }
    } else {
      // Page became visible - keep shouldActivatePiP flag so next interaction can trigger PiP
      debugLog(`Page visible - shouldActivatePiP: ${shouldActivatePiP}`);
    }
  }

  function setupVideoMonitoring() {
    // Find all videos and attach listeners
    const videos = document.querySelectorAll('video');
    debugLog(`Setting up monitoring for ${videos.length} video(s)`);
    videos.forEach(video => attachVideoListeners(video));
  }

  function attachVideoListeners(video) {
    if (video.dataset.autoPipAttached) return;
    video.dataset.autoPipAttached = 'true';
    
    debugLog(`Attaching listeners to video: ${video.src || 'embedded video'}`);
    
    // Listen for play events
    video.addEventListener('play', () => handleVideoPlay(video));
    
    // Listen for user interactions on video (backup mechanism)
    video.addEventListener('click', (e) => handleVideoInteraction(video, e), true);
    video.addEventListener('playing', () => handleVideoPlay(video));
    
    // Handle when video enters/exits PiP
    video.addEventListener('enterpictureinpicture', () => {
      debugLog('✓ Video entered PiP successfully', null, 'warn');
      pipActiveVideo = video;
    });
    
    video.addEventListener('leavepictureinpicture', () => {
      debugLog('Video left PiP', null, 'warn');
      pipActiveVideo = null;
      shouldActivatePiP = false;
    });
  }

  function handleVideoPlay(video) {
    debugLog(`Video playing (paused: ${video.paused})`);
    
    // If page is hidden and video starts playing, try PiP
    if (!isPageVisible && isEnabled && shouldActivatePiP) {
      debugLog('Video playing while page hidden, attempting PiP immediately');
      attemptPiP(video);
    }
  }

  function handleVideoInteraction(video, event) {
    if (!isEnabled) return;

    debugLog(`Direct video interaction detected: ${event.type}`);

    // If we should activate PiP and user interacts with video
    if (shouldActivatePiP && !video.paused) {
      debugLog('Activating PiP from direct video interaction');
      attemptPiP(video);
    }
  }

  // Listen for ANY user interaction on the page - THIS IS THE KEY FIX
  function setupGlobalInteractionListener() {
    debugLog('Setting up global interaction listeners');
    
    const interactionHandler = (event) => {
      if (!isEnabled || !shouldActivatePiP) return;
      
      interactionCount++;
      lastInteractionType = event.type;
      
      debugLog(`User interaction #${interactionCount} detected: ${event.type} on ${event.target.tagName}`, null, 'warn');
      
      // NO DEBOUNCING - immediate response is critical for gesture capture
      const video = findBestVideo();
      
      if (!video) {
        debugLog('No suitable video found', null, 'error');
        return;
      }
      
      if (video.paused) {
        debugLog('Best video is paused, skipping PiP attempt', null, 'warn');
        return;
      }
      
      debugLog(`Attempting PiP with ${event.type} gesture`, null, 'warn');
      attemptPiP(video);
    };
    
    // Capture phase to get event before it's consumed
    // Multiple event types to maximize gesture capture success
    document.addEventListener('click', interactionHandler, true);
    document.addEventListener('keydown', interactionHandler, true);
    document.addEventListener('mousedown', interactionHandler, true);
    document.addEventListener('touchstart', interactionHandler, true);
    
    debugLog('Global interaction listeners attached (click, keydown, mousedown, touchstart)');
  }

  function attemptPiP(video) {
    debugLog('=== Starting PiP attempt ===', null, 'warn');
    
    // Check if PiP is supported
    if (!document.pictureInPictureEnabled) {
      debugLog('✗ PiP not supported by browser', null, 'error');
      return;
    }

    // Check if already in PiP
    if (document.pictureInPictureElement) {
      debugLog('Already in PiP mode', null, 'warn');
      shouldActivatePiP = false; // Clear flag since PiP is already active
      return;
    }

    // Check if video is valid
    if (!video) {
      debugLog('✗ No video provided', null, 'error');
      return;
    }
    
    debugLog(`Video state: readyState=${video.readyState}, paused=${video.paused}, disablePiP=${video.disablePictureInPicture}`);
    
    if (video.readyState < 2) {
      debugLog('✗ Video not ready (readyState < 2)', null, 'error');
      return;
    }
    
    if (video.disablePictureInPicture) {
      debugLog('✗ PiP disabled on this video', null, 'error');
      return;
    }

    // Request PiP
    debugLog('Requesting PiP...', null, 'warn');
    video.requestPictureInPicture()
      .then(() => {
        debugLog('✓✓✓ PiP activated successfully! ✓✓✓', null, 'warn');
        shouldActivatePiP = false;
      })
      .catch((error) => {
        debugLog(`✗✗✗ Failed to activate PiP: ${error.name} - ${error.message}`, error, 'error');
        
        // Provide helpful debugging info
        if (error.name === 'NotAllowedError') {
          debugLog('NotAllowedError: User gesture may not have been properly captured', null, 'error');
        } else if (error.name === 'InvalidStateError') {
          debugLog('InvalidStateError: Video may not be in playable state', null, 'error');
        }
      });
  }

  function findBestVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    
    debugLog(`Searching for best video among ${videos.length} candidate(s)`);
    
    if (videos.length === 0) {
      debugLog('No videos found on page', null, 'error');
      return null;
    }

    // Filter valid videos
    const validVideos = videos.filter(video => {
      const rect = video.getBoundingClientRect();
      const style = window.getComputedStyle(video);
      
      const isValid = rect.width >= 200 &&
             rect.height >= 150 &&
             video.readyState >= 2 &&
             style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             !video.disablePictureInPicture &&
             video.duration > 0;
      
      if (!isValid) {
        debugLog(`Video filtered out: ${rect.width}x${rect.height}, readyState=${video.readyState}, display=${style.display}`);
      }
      
      return isValid;
    });

    debugLog(`Found ${validVideos.length} valid video(s) after filtering`);
    
    if (validVideos.length === 0) {
      debugLog('No valid videos found after filtering', null, 'warn');
      return videos[0]; // Fallback to first video
    }

    // Prioritize playing videos
    const playingVideos = validVideos.filter(v => !v.paused);
    const candidates = playingVideos.length > 0 ? playingVideos : validVideos;

    debugLog(`${playingVideos.length} playing video(s), using ${candidates.length} candidate(s)`);

    // Return largest video
    candidates.sort((a, b) => {
      const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
      const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
      return areaB - areaA;
    });

    const bestVideo = candidates[0];
    const rect = bestVideo.getBoundingClientRect();
    debugLog(`Selected best video: ${rect.width}x${rect.height}, paused=${bestVideo.paused}`);
    
    return bestVideo;
  }

  function observeVideos() {
    // Check if body exists
    if (!document.body) {
      console.warn('[Auto PiP] Cannot observe videos - document.body not ready');
      // Retry when body is available
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeVideos, { once: true });
      }
      return;
    }
    
    const observer = new MutationObserver(() => {
      debugLog('DOM mutation detected, re-scanning for videos');
      setupVideoMonitoring();
    });

    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      debugLog('MutationObserver initialized for dynamic video detection');
    } catch (error) {
      console.error('[Auto PiP] Failed to initialize MutationObserver:', error);
    }
  }

  // Note: Initialization is triggered by chrome.storage.sync.get callback
  // when settings are loaded (see lines 87-101)

})();
