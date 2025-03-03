// BrowserAPI compatibility check for browser.*/chrome.*
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', () => {
  const checkboxes = {
    hideWords: document.getElementById('hideWords'),
    hideURL: document.getElementById('hideURL'),
    hideUsername: document.getElementById('hideUsername'),
    useAI: document.getElementById('useAI')
  };

  const inputs = {
    blockWords: document.getElementById('blockWords'),
    blockURL: document.getElementById('blockURL'),
    blockUsername: document.getElementById('blockUsername')
  };

  const themeToggle = document.getElementById('themeToggle');

  // Load saved state
  browserAPI.storage.local.get([
    'hideWords', 'hideURL', 'hideUsername', 
    'blockWords', 'blockURL', 'blockUsername', 
    'darkTheme', 'useAI'
  ]).then((result) => {
    // Set checkbox states
    checkboxes.hideWords.checked = result.hideWords || false;
    checkboxes.hideURL.checked = result.hideURL || false;
    checkboxes.hideUsername.checked = result.hideUsername || false;
    checkboxes.useAI.checked = result.useAI || false;

    // Set input values
    inputs.blockWords.value = (result.blockWords || []).join(',');
    inputs.blockURL.value = (result.blockURL || []).join(',');
    inputs.blockUsername.value = (result.blockUsername || []).join(',');

    // Set theme
    if (result.darkTheme) {
      document.body.classList.add('dark-theme');
      themeToggle.textContent = '☀️';
    } else {
      themeToggle.textContent = '🌙';
    }
  });

  // Save state for checkboxes
  Object.keys(checkboxes).forEach(key => {
    checkboxes[key].addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      browserAPI.storage.local.set({ [key]: isEnabled });
      
      // Send message to content script
      browserAPI.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        browserAPI.tabs.sendMessage(tabs[0].id, { [key]: isEnabled });
      });
    });
  });

  // Handle filter inputs
  Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener('input', (e) => {
      // Split input by comma, trim whitespace, remove empty strings
      const filterValues = e.target.value
        .split(',')
        .map(value => value.trim())
        .filter(value => value !== '');
      
      // Save filter values
      browserAPI.storage.local.set({ [key]: filterValues });
      
      // Send message to content script
      browserAPI.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        browserAPI.tabs.sendMessage(tabs[0].id, { [key]: filterValues });
      });
    });
  });

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    browserAPI.storage.local.set({ darkTheme: isDark });
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });
});