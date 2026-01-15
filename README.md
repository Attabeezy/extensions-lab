# Extensions Lab

A small collection of lightweight browser extensions and experiments. Each extension focuses on a single useful enhancement to the browsing experience — designed to be easy to install, inspect, and extend.

## Included extensions

- **AI Sidebar**  
  Quickly access popular AI tools from a persistent sidebar. Launch one-click shortcuts to AI services without leaving the page you're on.

- **Auto Picture-in-Picture**  
  Automatically moves video into Picture-in-Picture (PiP) when you switch away from a tab playing video, so you can keep watching while you work in another tab.

- **X-Search Omnibox**  
  A custom omnibox (address-bar) search trigger — use `x` to quickly search across multiple services such as ChatGPT, YouTube, GitHub, Reddit, Stack Overflow, and arXiv.

## Features & goals

- Minimal, focused extensions that solve one problem well.
- Easy to load/unpack for development and debugging.
- Clear, extensible code so others can fork and extend features.

## Installation

Note: These instructions assume Chromium-based browsers (Chrome, Edge) or Firefox. Steps for loading unpacked extensions are similar across browsers.

1. Clone the repository:
   git clone https://github.com/Attabeezy/extensions-lab.git
2. Open your browser's extensions page:
   - Chrome/Edge: chrome://extensions
   - Firefox: about:debugging#/runtime/this-firefox
3. Enable "Developer mode" (if required) and choose "Load unpacked" (Chrome/Edge) or "Load Temporary Add-on" (Firefox).
4. Select the folder of the extension you want to load (each extension is in its own directory).

If any extension is published in a store, you can install from the store directly — otherwise use the unpacked method above for testing and development.

## Usage

- AI Sidebar: Click the extension toolbar icon to open the sidebar, then pick an AI tool to open in the sidebar or a new tab.
- Auto Picture-in-Picture: Enable the extension and play a video. When you switch away from the tab, the extension will attempt to enable PiP for supported players.
- X-Search Omnibox: In the address bar type `x` then hit Tab (or space, depending on your browser) and enter your query; choose one of the configured search providers.

## Development

- Each extension contains its own manifest and source files.
- Typical development workflow:
  1. Edit files in the extension's folder.
  2. Reload the extension from the browser's extensions page.
  3. Use the browser devtools (background/service worker console, content script consoles) to debug.
- Consider adding build scripts (npm, webpack, esbuild) if you introduce compilation steps.

## Contributing

Contributions are welcome. Good contribution candidates:
- Bug fixes and stability improvements
- New useful browser utilities implemented as separate extensions
- Improved documentation and developer tooling

When contributing:
- Open an issue describing the planned change or improvement.
- Fork the repo, develop on a branch, and open a pull request with a clear description and rationale.

## Notes

- Keep extensions small and focused. If a feature grows large, consider splitting it into its own extension.
- Check browser permissions in each manifest before publishing to ensure minimal required privileges.

## License

See LICENSE (if present) in the repository. If no license is included, please add one to clarify reuse and distribution terms.

## Contact

For questions or suggestions, open an issue in this repository.
