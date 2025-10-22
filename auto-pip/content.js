function findVideo() {
  const videos = document.querySelectorAll('video');
  for (const video of videos) {
    if (!video.hasAttribute('__pip__') && video.readyState >= 3 && video.videoHeight > 0) {
      return video;
    }
  }
  return null;
}

function startPictureInPicture() {
  const video = findVideo();
  if (video && !document.pictureInPictureElement) {
    video.requestPictureInPicture()
      .then(() => {
        video.setAttribute('__pip__', 'true');
      })
      .catch(error => {
        console.error('Error entering Picture-in-Picture:', error);
      });
  }
}

function exitPictureInPicture() {
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture()
      .catch(error => {
        console.error('Error exiting Picture-in-Picture:', error);
      });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "minimize") {
    startPictureInPicture();
  } else if (request.action === "unminimize") {
    exitPictureInPicture();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    startPictureInPicture();
  } else {
    exitPictureInPicture();
  }
});
