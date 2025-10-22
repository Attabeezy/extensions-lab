document.addEventListener('DOMContentLoaded', async () => {
  const toolsList = document.getElementById('tools-list');
  const form = document.getElementById('ai-tool-form');

  const storedTool = await chrome.storage.sync.get('selectedTool');
  const selectedTool = storedTool.selectedTool;

  aiTools.forEach(tool => {
    const label = document.createElement('label');
    label.className = 'tool-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'aiTool';
    input.value = tool.id;

    if (tool.id === selectedTool) {
      input.checked = true;
    }

    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + tool.name));
    toolsList.appendChild(label);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selected = document.querySelector('input[name="aiTool"]:checked');

    if (!selected) {
      alert("Please select an AI tool.");
      return;
    }

    const tool = aiTools.find(t => t.id === selected.value);
    if (tool) {
      await chrome.storage.sync.set({ selectedTool: tool.id });
      chrome.tabs.create({ url: tool.url });
    }
  });
});
