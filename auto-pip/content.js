// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enablePiP') {
    enablePictureInPicture();
  }
});

/**
 * Find and enable picture-in-picture for the active video
 */
function enablePictureInPicture() {
  // Check if PiP is supported
  if (!document.pictureInPictureEnabled) {
    console.log('Picture-in-Picture is not supported in this browser');
    return;
  }

  // Check if PiP is already active
  if (document.pictureInPictureElement) {
    console.log('Picture-in-Picture is already active');
    return;
  }

  // Find all video elements on the page
  const videos = Array.from(document.querySelectorAll('video'));
  
  if (videos.length === 0) {
    console.log('No video elements found on page');
    return;
  }

  // Find the best video to use for PiP
  const targetVideo = findBestVideo(videos);
  
  if (!targetVideo) {
    console.log('No suitable video found for PiP');
    return;
  }

  // Request picture-in-picture
  targetVideo.requestPictureInPicture()
    .then(() => {
      console.log('Picture-in-Picture enabled successfully');
    })
    .catch((error) => {
      console.log('Failed to enable Picture-in-Picture:', error.message);
    });
}

/**
 * Find the best video element for PiP
 * Priority: currently playing > largest > first
 */
function findBestVideo(videos) {
  // Filter out videos that are too small or hidden
  const visibleVideos = videos.filter(video => {
    const rect = video.getBoundingClientRect();
    return rect.width >= 200 && rect.height >= 150 && 
           video.readyState >= 2 && // Has enough data
           !video.paused && // Is currently playing
           video.duration > 0; // Has valid duration
  });

  if (visibleVideos.length === 0) {
    // If no playing videos, try to find any visible video
    return videos.find(video => {
      const rect = video.getBoundingClientRect();
      return rect.width >= 200 && rect.height >= 150 && video.readyState >= 2;
    });
  }

  // Sort by size (area) and return the largest playing video
  visibleVideos.sort((a, b) => {
    const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
    const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
    return areaB - areaA;
  });

  return visibleVideos[0];
}

// Optional: Listen for video elements added dynamically
const observer = new MutationObserver((mutations) => {
  // This helps handle single-page applications that load videos dynamically
  // We don't need to do anything here, just be ready when the message comes
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});