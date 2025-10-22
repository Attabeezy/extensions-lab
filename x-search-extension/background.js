chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const [command, ...rest] = text.trim().split(" ");
  const query = rest.join(" ");

  const commands = [
    "chatgpt",
    "youtube",
    "github",
    "reddit",
    "stackoverflow",
    "arxiv"
  ];

  const suggestions = [];

  for (let cmd of commands) {
    if (cmd.startsWith(command.toLowerCase())) {
      suggestions.push({
        content: `${cmd} ${query}`,
        description: `Search ${cmd.charAt(0).toUpperCase() + cmd.slice(1)} for "${query}"`
      });
    }
  }

  suggest(suggestions);
});

chrome.omnibox.onInputEntered.addListener((input) => {
  const [command, ...rest] = input.trim().split(" ");
  const query = rest.join(" ");
  let url = "";

  switch (command.toLowerCase()) {
    case "chatgpt":
      url = `https://chat.openai.com/?q=${encodeURIComponent(query)}`;
      break;
    case "youtube":
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      break;
    case "github":
      url = `https://github.com/search?q=${encodeURIComponent(query)}`;
      break;
    case "reddit":
      url = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`;
      break;
    case "stackoverflow":
      url = `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`;
      break;
    case "arxiv":
      url = `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all`;
      break;
    default:
      url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }

  chrome.tabs.create({ url });
});
