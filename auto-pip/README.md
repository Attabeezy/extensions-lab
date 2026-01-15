# Auto Picture-in-Picture Extension

Automatically enables picture-in-picture (PiP) mode for videos when you switch away from the tab.

## How It Works

1. **Play a video** on any website (YouTube, Vimeo, etc.)
2. **Switch to another tab** or minimize the browser
3. **Click anywhere** on the video tab when you return
4. **PiP activates automatically** - video floats on top of other windows

## Features

- ✅ Works with all video sites
- ✅ No manual PiP button clicking needed
- ✅ Smart video detection (ignores ads, selects main video)
- ✅ Uses native browser Page Visibility API
- ✅ Minimal permissions required
- ✅ Easy on/off toggle

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `auto-pip` folder
5. Extension is ready!

## Usage Tips

- The extension needs a **user interaction** (click/keypress) to activate PiP due to browser security
- When you switch tabs, the extension waits for your next click to trigger PiP
- You can disable/enable the extension from the popup at any time
- Works best with actively playing videos

## Technical Details

- Uses **Page Visibility API** to detect tab switches
- Captures user gestures to trigger PiP (required by Chrome)
- Monitors videos with MutationObserver for dynamic content
- Minimal background script for better performance

## Version

**2.0.0** - Complete rebuild with improved reliability

## Privacy

This extension:
- Does NOT collect any data
- Does NOT make network requests
- Only runs on pages with video elements
- All processing happens locally in your browser

## License

MIT License - Free to use and modify
