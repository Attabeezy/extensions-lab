(function() {
  'use strict';

  // State management
  let isEnabled = true;
  let isPageVisible = !document.hidden;
  let shouldActivatePiP = false;
  let pipActiveVideo = null;
  let debounceTimer = null;

  // Load settings
  chrome.storage.sync.get(['enabled'], (result) => {
    isEnabled = result.enabled !== false;
    if (isEnabled) {
      initialize();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      isEnabled = changes.enabled.newValue;
      if (!isEnabled && document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    }
  });

  function initialize() {
    console.log('[Auto PiP] Initializing...');
    
    // Monitor page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up video monitoring
    setupVideoMonitoring();
    
    // Watch for new videos
    observeVideos();
  }

  function handleVisibilityChange() {
    isPageVisible = !document.hidden;
    
    console.log(`[Auto PiP] Page visibility changed: ${isPageVisible ? 'visible' : 'hidden'}`);
    
    if (!isEnabled) return;
    
    if (!isPageVisible) {
      // Page became hidden - mark for PiP activation
      shouldActivatePiP = true;
      console.log('[Auto PiP] Page hidden - will activate PiP on next user interaction');
    } else {
      // Page became visible - cancel PiP intent
      shouldActivatePiP = false;
    }
  }

  function setupVideoMonitoring() {
    // Find all videos and attach listeners
    const videos = document.querySelectorAll('video');
    videos.forEach(video => attachVideoListeners(video));
  }

  function attachVideoListeners(video) {
    if (video.dataset.autoPipAttached) return;
    video.dataset.autoPipAttached = 'true';
    
    console.log('[Auto PiP] Attaching listeners to video:', video);
    
    // Listen for play events
    video.addEventListener('play', () => handleVideoPlay(video));
    
    // Listen for user interactions on video
    video.addEventListener('click', (e) => handleVideoInteraction(video, e), true);
    video.addEventListener('playing', () => handleVideoPlay(video));
    
    // Handle when video enters/exits PiP
    video.addEventListener('enterpictureinpicture', () => {
      console.log('[Auto PiP] Video entered PiP');
      pipActiveVideo = video;
    });
    
    video.addEventListener('leavepictureinpicture', () => {
      console.log('[Auto PiP] Video left PiP');
      pipActiveVideo = null;
      shouldActivatePiP = false;
    });
  }

  function handleVideoPlay(video) {
    // If page is hidden and video starts playing, try PiP
    if (!isPageVisible && isEnabled && shouldActivatePiP) {
      console.log('[Auto PiP] Video playing while page hidden, attempting PiP');
      attemptPiP(video);
    }
  }

  function handleVideoInteraction(video, event) {
    if (!isEnabled) return;
    
    // If we should activate PiP and user interacts with video
    if (shouldActivatePiP && !video.paused) {
      console.log('[Auto PiP] User interacted with video, activating PiP');
      shouldActivatePiP = false;
      attemptPiP(video);
    }
  }

  // Listen for ANY user interaction on the page
  function setupGlobalInteractionListener() {
    const interactionHandler = (event) => {
      if (!isEnabled || !shouldActivatePiP) return;
      
      // Debounce to prevent multiple rapid attempts
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('[Auto PiP] User interaction detected, attempting PiP');
        const video = findBestVideo();
        if (video && !video.paused) {
          attemptPiP(video);
        }
      }, 100);
    };
    
    // Capture phase to get event before it's consumed
    document.addEventListener('click', interactionHandler, true);
    document.addEventListener('keydown', interactionHandler, true);
    document.addEventListener('mousedown', interactionHandler, true);
    document.addEventListener('touchstart', interactionHandler, true);
  }

  setupGlobalInteractionListener();

  function attemptPiP(video) {
    // Check if PiP is supported
    if (!document.pictureInPictureEnabled) {
      console.log('[Auto PiP] PiP not supported');
      return;
    }

    // Check if already in PiP
    if (document.pictureInPictureElement) {
      console.log('[Auto PiP] Already in PiP mode');
      return;
    }

    // Check if video is valid
    if (!video || video.readyState < 2 || video.disablePictureInPicture) {
      console.log('[Auto PiP] Video not ready for PiP');
      return;
    }

    // Request PiP
    video.requestPictureInPicture()
      .then(() => {
        console.log('[Auto PiP] ✓ PiP activated successfully');
        shouldActivatePiP = false;
      })
      .catch((error) => {
        console.log('[Auto PiP] ✗ Failed to activate PiP:', error.message);
      });
  }

  function findBestVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    
    if (videos.length === 0) return null;

    // Filter valid videos
    const validVideos = videos.filter(video => {
      const rect = video.getBoundingClientRect();
      const style = window.getComputedStyle(video);
      
      return rect.width >= 200 &&
             rect.height >= 150 &&
             video.readyState >= 2 &&
             style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             !video.disablePictureInPicture &&
             video.duration > 0;
    });

    if (validVideos.length === 0) return videos[0];

    // Prioritize playing videos
    const playingVideos = validVideos.filter(v => !v.paused);
    const candidates = playingVideos.length > 0 ? playingVideos : validVideos;

    // Return largest video
    candidates.sort((a, b) => {
      const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
      const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
      return areaB - areaA;
    });

    return candidates[0];
  }

  function observeVideos() {
    const observer = new MutationObserver(() => {
      setupVideoMonitoring();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize if document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
