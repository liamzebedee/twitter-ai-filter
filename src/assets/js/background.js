// BrowserAPI compatibility check for browser.*/chrome.*
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Add near the top after browserAPI definition
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Add rate limiting utility
const rateLimiter = {
  tokens: 50,  // Adjust based on your API limits
  lastRefill: Date.now(),
  refillRate: 50, // tokens per second
  maxTokens: 50,

  async getToken() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + timePassed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens < 1) {
      await new Promise(resolve => setTimeout(resolve, (1 - this.tokens) * 1000 / this.refillRate));
      return this.getToken();
    }

    this.tokens -= 1;
    return true;
  }
};

// Add response caching
const responseCache = new Map();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

async function analyzeTextWithAI(text) {
  try {
    // Check cache first
    const cacheKey = text.trim().toLowerCase();
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }

    // Get rate limit token
    await rateLimiter.getToken();

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `${require('./prompt.js').default} ${text}`
        }],
        max_tokens: 10
      })
    });

    const data = await response.json();
    const result = data.choices[0].message.content.toLowerCase().includes('true');

    // Cache the result
    responseCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('CleansingX: Error calling OpenAI:', error);
    return false;
  }
}

// Single initialization listener
browserAPI.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  browserAPI.storage.local.get([
    'hideWords', 'blockWords',
    'hideURL', 'blockURL',
    'hideUsername', 'blockUsernames'
  ])
  .then((result) => {
    if (!result.hideWords && !result.blockWords) {
      browserAPI.storage.local.set({
        hideWords: result.hideWords || false,
        blockWords: result.blockWords || [],
        hideURL: result.hideURL || false,
        blockURL: result.blockURL || [],
        hideUsername: result.hideUsername || false,
        blockUsernames: result.blockUsernames || [],
      });
    }
  });
  console.log('CleansingX: Extension initialized');
});

// Listen for tab updates
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('CleansingX: Tab updated:', tab.url);
    
    // Get stored filters
    browserAPI.storage.local.get([
      'hideWords', 
      'blockWords',
      'hideURL',
      'blockURL',
      'hideUsername',
      'blockUsernames'
    ])
    .then((result) => {
      // Send message to content script
      return browserAPI.tabs.sendMessage(tabId, {
        hideWords: result.hideWords || false,
        blockWords: result.blockWords || [],
        hideURL: result.hideURL || false,
        blockURL: result.blockURL || [],
        hideUsername: result.hideUsername || false,
        blockUsernames: result.blockUsernames || [],
        type: 'filterUpdate'
      });
    })
    .catch((error) => {
      console.error('CleansingX: Error in background script:', error);
    });
}
});

// Listen for filter updates from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'analyzeText') {
    analyzeTextWithAI(message.text)
      .then(result => sendResponse({ shouldFilter: result }));
    return true; // Required for async response
  }
  
  // Broadcast to all tabs
  browserAPI.tabs.query({})
    .then(tabs => {
      tabs.forEach(tab => {
        browserAPI.tabs.sendMessage(tab.id, {
          hideWords: message.hideWords,
          blockWords: message.blockWords,
          hideURL: message.hideURL,
          blockURL: message.blockURL,
          hideUsername: message.hideUsername,
          blockUsernames: message.blockUsernames,
          type: 'filterUpdate'
        }).catch(() => {
          // Ignore errors for inactive tabs
        });
      });
    });
});

// Establish connection with content script
browserAPI.runtime.onConnect.addListener((port) => {
  console.log('CleansingX: Connection established with content script');
});