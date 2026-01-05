let pipAttempts = 0;
const MAX_ATTEMPTS = 3;
let retryTimeout = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enablePiP') {
    pipAttempts = 0;
    clearTimeout(retryTimeout);
    enablePictureInPicture(request.reason);
  }
});

/**
 * Find and enable picture-in-picture for the active video
 */
function enablePictureInPicture(reason = 'manual') {
  // Check if PiP is supported
  if (!document.pictureInPictureEnabled) {
    console.log('[Auto PiP] Picture-in-Picture is not supported');
    return;
  }

  // Check if PiP is already active
  if (document.pictureInPictureElement) {
    console.log('[Auto PiP] Picture-in-Picture is already active');
    return;
  }

  // Find all video elements on the page
  const videos = Array.from(document.querySelectorAll('video'));

  if (videos.length === 0) {
    console.log('[Auto PiP] No video elements found on page');

    // Retry after a delay if we haven't exceeded max attempts
    if (pipAttempts < MAX_ATTEMPTS) {
      pipAttempts++;
      retryTimeout = setTimeout(() => {
        console.log(`[Auto PiP] Retry attempt ${pipAttempts}/${MAX_ATTEMPTS}`);
        enablePictureInPicture(reason);
      }, 500);
    }
    return;
  }

  // Find the best video to use for PiP
  const targetVideo = findBestVideo(videos);

  if (!targetVideo) {
    console.log('[Auto PiP] No suitable video found for PiP');

    // Retry after a delay
    if (pipAttempts < MAX_ATTEMPTS) {
      pipAttempts++;
      retryTimeout = setTimeout(() => {
        console.log(`[Auto PiP] Retry attempt ${pipAttempts}/${MAX_ATTEMPTS}`);
        enablePictureInPicture(reason);
      }, 500);
    }
    return;
  }

  // Request picture-in-picture
  targetVideo.requestPictureInPicture()
    .then(() => {
      console.log(`[Auto PiP] Picture-in-Picture enabled (reason: ${reason})`);
      pipAttempts = 0; // Reset attempts on success
    })
    .catch((error) => {
      console.log('[Auto PiP] Failed to enable Picture-in-Picture:', error.message);

      // Retry on certain errors
      if (pipAttempts < MAX_ATTEMPTS &&
          (error.name === 'NotAllowedError' || error.name === 'InvalidStateError')) {
        pipAttempts++;
        retryTimeout = setTimeout(() => {
          console.log(`[Auto PiP] Retry attempt ${pipAttempts}/${MAX_ATTEMPTS}`);
          enablePictureInPicture(reason);
        }, 500);
      }
    });
}

/**
 * Find the best video element for PiP
 * Priority: currently playing > largest > first
 */
function findBestVideo(videos) {
  // Filter out videos that are too small, hidden, or not ready
  const candidateVideos = videos.filter(video => {
    const rect = video.getBoundingClientRect();
    const style = window.getComputedStyle(video);

    return rect.width >= 200 &&
           rect.height >= 150 &&
           video.readyState >= 2 && // HAVE_CURRENT_DATA or better
           style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           video.duration > 0 &&
           !video.disablePictureInPicture;
  });

  if (candidateVideos.length === 0) {
    // Fallback: try to find any video with sufficient data
    return videos.find(video => {
      const rect = video.getBoundingClientRect();
      return rect.width >= 200 &&
             rect.height >= 150 &&
             video.readyState >= 2 &&
             !video.disablePictureInPicture;
    });
  }

  // Separate playing and paused videos
  const playingVideos = candidateVideos.filter(v => !v.paused);
  const pausedVideos = candidateVideos.filter(v => v.paused);

  // Prioritize playing videos
  const videosToSort = playingVideos.length > 0 ? playingVideos : pausedVideos;

  // Sort by size (area) and return the largest
  videosToSort.sort((a, b) => {
    const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
    const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
    return areaB - areaA;
  });

  return videosToSort[0];
}

// Watch for dynamically loaded videos
const observer = new MutationObserver(() => {
  // Videos may load dynamically on SPAs
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  clearTimeout(retryTimeout);
  observer.disconnect();
});

// Handle videos in iframes (for sites like Twitch)
// Note: This only works if the iframe is same-origin
try {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      if (iframe.contentDocument) {
        const iframeVideos = iframe.contentDocument.querySelectorAll('video');
        // Add these to our monitoring if accessible
      }
    } catch (e) {
      // Cross-origin iframe, can't access
    }
  });
} catch (e) {
  // Failed to check iframes
}
