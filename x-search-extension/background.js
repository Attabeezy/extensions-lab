const searchProviders = {
  chatgpt: {
    searchUrl: "https://chat.openai.com/",
    homeUrl: "https://chat.openai.com/"
  },
  youtube: {
    searchUrl: "https://www.youtube.com/results?search_query=",
    homeUrl: "https://www.youtube.com/"
  },
  github: {
    searchUrl: "https://github.com/search?q=",
    homeUrl: "https://github.com/"
  },
  reddit: {
    searchUrl: "https://www.reddit.com/search/?q=",
    homeUrl: "https://www.reddit.com/"
  },
  stackoverflow: {
    searchUrl: "https://stackoverflow.com/search?q=",
    homeUrl: "https://stackoverflow.com/"
  },
  arxiv: {
    searchUrl: "https://arxiv.org/search/?query=",
    homeUrl: "https://arxiv.org/"
  },
  default: {
    searchUrl: "https://www.google.com/search?q="
  }
};

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const [command, ...rest] = text.trim().split(" ");
  const query = rest.join(" ");
  const suggestions = [];

  for (let cmd in searchProviders) {
    if (cmd.startsWith(command.toLowerCase())) {
      const provider = searchProviders[cmd];
      if (query) {
        suggestions.push({
          content: `${cmd} ${query}`,
          description: `Search ${cmd.charAt(0).toUpperCase() + cmd.slice(1)} for "${query}"`
        });
      } else {
        suggestions.push({
          content: `${cmd}`,
          description: `Go to ${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`
        });
      }
    }
  }
  suggest(suggestions);
});

chrome.omnibox.onInputEntered.addListener((input) => {
  let [command, ...rest] = input.trim().split(" ");
  let query = rest.join(" ");
  let url;

  const provider = searchProviders[command.toLowerCase()];

  if (provider) {
    if (query) {
      if (command.toLowerCase() === 'chatgpt') {
        url = provider.homeUrl;
      } else if (command.toLowerCase() === 'arxiv') {
        url = provider.searchUrl + encodeURIComponent(query) + '&searchtype=all';
      }
      else {
        url = provider.searchUrl + encodeURIComponent(query);
      }
    } else {
      url = provider.homeUrl;
    }
  } else {
    url = searchProviders.default.searchUrl + encodeURIComponent(input);
  }

  chrome.tabs.create({ url });
});
