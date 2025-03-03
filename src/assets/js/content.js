// BrowserAPI compatibility check for browser.*/chrome.*
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let filters = {
  hideWords: false,
  blockWords: [],
  hideURL: false,
  blockURL: [],
  hideUsername: false,
  blockUsername: [],
  useAI: true
};

function matchWord(words, pattern) {
  try {
    // Normalize word and pattern
    const normalizedWord = words.toLowerCase().trim();
    const normalizedPattern = pattern.toLowerCase().trim().replace(/\*+/g, '*');
    
    const wordMatch = normalizedWord.split(/[\s\n\r\t]+/).filter(word => word.length > 0);
    
    // Log for debugging
    console.log('CleansingX: Matching word pattern:', normalizedPattern);
    console.log('CleansingX: Found words:', wordMatch.length);
    console.log('CleansingX: First 5 words:', wordMatch.slice(0, 5));

    // Handle different wildcard patterns
    if (normalizedPattern.startsWith('*') && normalizedPattern.endsWith('*')) {
      const core = normalizedPattern.slice(1, -1);
      return wordMatch.some(word => word.includes(core));
    }
    if (normalizedPattern.startsWith('*')) {
      const core = normalizedPattern.slice(1);
      return wordMatch.some(word => word.endsWith(core));
    } 
    if (normalizedPattern.endsWith('*')) {
      const core = normalizedPattern.slice(0, -1);
      return wordMatch.some(word => word.startsWith(core));
    }
    return wordMatch.some(word => word === normalizedPattern);
  
  } catch (error) {
    console.error('CleansingX: Error in matchWord:', error);
    return false;
  }
}

function matchURL(urls, pattern) {
  try {
    // Normalize url and pattern
    const normalizedUrl = urls;
    const normalizedPattern = pattern.toLowerCase().trim().replace(/\*+/g, '*');

    // Log for debugging
    console.log('CleansingX: Matching url pattern:', normalizedPattern);
    console.log('CleansingX: Found url:', normalizedUrl.length);
    console.log('CleansingX: First 5 url:', normalizedUrl.slice(0, 5));

    // Filter url to keep only http/https url
    const urlOnly = urls.filter(url => url.startsWith('http://') || url.startsWith('https://'));

    if (urlOnly.length === 0) {
      return false;
    }
    // Clean url by removing protocols and www
    const urlMatch = urlOnly.map(url => 
      url.replace(/^https?:\/\/(www\.)?/i, '')
    );

    // Log for debugging
    console.log('CleansingX: Cleaned URLs:', urlMatch);

    // Handle different wildcard patterns
    if (normalizedPattern.startsWith('*') && normalizedPattern.endsWith('*')) {
      const core = normalizedPattern.slice(1, -1);
      return urlMatch.some(user => user.includes(core));
    }
    if (normalizedPattern.startsWith('*')) {
      const core = normalizedPattern.slice(1);
      return urlMatch.some(user => user.endsWith(core));
    }
    if (normalizedPattern.endsWith('*')) {
      const core = normalizedPattern.slice(0, -1);
      return urlMatch.some(user => user.startsWith(core));
    }
    return urlMatch.some(user => user === normalizedPattern);

  } catch (error) {
    console.error('CleansingX: Error in matchUsername:', error);
    return false;
  }
}

function matchUsername(usernames, pattern) {
  try {
    // Normalize usernames and pattern
    const normalizedUsername = usernames
    const normalizedPattern = pattern.toLowerCase().trim()

    // Log for debugging
    console.log('CleansingX: Matching username pattern:', normalizedPattern);
    console.log('CleansingX: Found usernames:', normalizedUsername.length);
    console.log('CleansingX: First 5 username:', normalizedUsername.slice(0, 5));

    // Handle username and url matching
    const usernameMatch = normalizedUsername.some(username => username === normalizedPattern);
    
    if (!usernameMatch) {
      return false;
    }
 
    // Convert @username to https://x.com/username
    const normalizedPatternUrl = normalizedPattern.replace('@', 'https://x.com/');
     
    // Log for debugging
    console.log('CleansingX: Generated pattern username link:', normalizedPatternUrl);
     
    // Check if url exists in usernames array
    const urlMatch = normalizedUsername.some(username => username === normalizedPatternUrl);
    return urlMatch;
    
  } catch (error) {
    console.error('CleansingX: Error in matchUsername:', error);
    return false;
  }
}

// Add this new function for batch processing
async function analyzeTextsWithAI(texts) {
  try {
    // Make parallel API calls, 10 at a time
    const batchResults = await Promise.all(
      texts.map(text => 
        browserAPI.runtime.sendMessage({
          type: 'analyzeText',
          text
        })
      )
    );
    return batchResults.map(r => r.shouldFilter);
  } catch (error) {
    console.error('CleansingX: Error in batch AI analysis:', error);
    return texts.map(() => false);
  }
}

// Modify filterArticles to use batch processing
async function filterArticles() {
  try {
    const articles = document.getElementsByTagName('article');
    console.log('CleansingX: Found articles:', articles.length);

    // Prepare batches of 10 articles
    const articleBatches = [];
    const batchSize = 10;
    
    for (let i = 0; i < articles.length; i += batchSize) {
      articleBatches.push(Array.from(articles).slice(i, i + batchSize));
    }

    // Process each batch
    for (const batch of articleBatches) {
      const textsToAnalyze = batch.map(article => 
        Array.from(article.getElementsByTagName('span'))
          .map(el => el.textContent)
          .join(' ')
      );

      // First check regular filters
      const shouldHideRegular = batch.map((article, i) => {
        if (!article?.textContent) return false;
        
        // Word check
        if (filters.hideWords && filters.blockWords.length > 0) {
          const words = textsToAnalyze[i];
          if (filters.blockWords.some(word => matchWord(words, word))) {
            return true;
          }
        }

        // URL check
        if (filters.hideURL && filters.blockURL.length > 0) {
          const urls = Array.from(article.getElementsByTagName('a'))
            .map(el => (el.textContent || el.href).toLowerCase().trim())
            .filter(text => text.length > 0);
          
          if (filters.blockURL.some(user => matchURL(urls, user))) {
            return true;
          }
        }

        // Username check
        if (filters.hideUsername && filters.blockUsername.length > 0) {
          const usernames = Array.from(article.getElementsByTagName('a'))
            .map(el => (el.textContent || el.href).toLowerCase().trim())
            .filter(text => text.length > 0);
          
          if (filters.blockUsername.some(user => matchUsername(usernames, user))) {
            return true;
          }
        }

        return false;
      });

      // Then check AI filter for articles that weren't already filtered
      let aiResults = [];
      if (filters.useAI) {
        
      }
      const textsForAI = textsToAnalyze.filter((_, i) => !shouldHideRegular[i]);
      console.log('CleansingX: Analysing with AI');
      aiResults = await analyzeTextsWithAI(textsForAI);
      console.log(aiResults)

      // Apply visibility
      let aiIndex = 0;
      batch.forEach((article, i) => {
        const shouldHide = shouldHideRegular[i] || !aiResults[aiIndex++];
        
        // article.style.display = shouldHide ? 'none' : '';
        
        // Don't change the display, just make content transparent
        if (shouldHide) {
          article.style.opacity = '0.35';
        } else {
          article.style.opacity = '1';
        }
      });
    }
  } catch (error) {
    console.error('CleansingX: Error in filterArticles:', error);
  }
}

// Update filters based on message
function updateFilters(message) {
  try {
    const filterUpdates = {
      hideWords: [message.hideWords, 'hideWords'],
      blockWords: [message.blockWords, 'blockWords'],
      hideURL: [message.hideURL, 'hideURL'],
      blockURL: [message.blockURL, 'blockURL'],
      hideUsername: [message.hideUsername, 'hideUsername'],
      blockUsername: [message.blockUsername, 'blockUsername'],
      useAI: [message.useAI, 'useAI']
    };

    Object.entries(filterUpdates).forEach(([key, [value, logKey]]) => {
      if (message.hasOwnProperty(key)) {
        filters[key] = Array.isArray(value) ? value || [] : value;
        console.log(`CleansingX: ${logKey} set to:`, filters[key]);
      }
    });

    debouncedFilterArticles();
  } catch (error) {
    console.error('CleansingX: Error in updateFilters:', error);
  }
}

function initializeFilters() {
  try {
    browserAPI.storage.local.get([
      'hideWords', 'blockWords', 
      'hideURL', 'blockURL', 
      'hideUsername', 'blockUsername',
      'useAI'
    ])
    .then((result) => {
      console.log('CleansingX: Storage result:', result);
      filters.hideWords = result.hideWords || false;
      filters.blockWords = result.savedBlockWords || [];
      filters.hideURL = result.hideURL || false; 
      filters.blockURL = result.blockURL || [];
      filters.hideUsername = result.hideUsername || false;
      filters.blockUsername = result.blockUsername || [];
      filters.useAI = result.useAI || false;
      console.log('CleansingX: Initial state:', filters);

      if (filters.hideWords || filters.useAI) {
        debouncedFilterArticles();
      }
    });
  } catch (error) {
    console.error('CleansingX: Error in initializeFilters:', error);
  }
}

// Add debouncing utility
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// DOM Observer
function startObserver() {
  try {
    const targetNode = document.body;
    const config = { 
      childList: true, 
      subtree: true 
    };
    observer.observe(targetNode, config);
  } catch (error) {
    console.error('CleansingX: Error starting observer:', error);
  }
}

// Create debounced version of filterArticles
const debouncedFilterArticles = debounce(() => {
  filterArticles().catch(error => {
    console.error('CleansingX: Error in debouncedFilterArticles:', error);
  });
}, 100);

// Update observer to use debounced function
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      debouncedFilterArticles();
    }
  });
});

// Start observing as early as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}

// Listen for messages from background script
browserAPI.runtime.onMessage.addListener((message) => {
  console.log('CleansingX: Received message:', message);
  updateFilters(message);
});

// Call initialization
initializeFilters();