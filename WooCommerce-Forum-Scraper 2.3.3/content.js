// Extract thread data from the WooCommerce support forum page
function extractThreads() {
  const threads = [];
  document.querySelectorAll('ul[id^="bbp-topic-"]').forEach(ul => {
    // Thread link
    const linkElem = ul.querySelector('.bbp-topic-title a.bbp-topic-permalink');
    const link = linkElem ? linkElem.href : '';
    // Resolved status: check for class 'topic-resolved' on the <ul>
    const resolved = ul.classList.contains('topic-resolved');
    // Author: first .bbp-author-name inside .bbp-topic-title
    const authorElem = ul.querySelector('.bbp-topic-title .bbp-author-name');
    const author = authorElem ? authorElem.textContent.trim() : '';
    if (link) {
      threads.push({ link, resolved, author });
    }
  });
  return threads;
}

// Expose extractThreads to window so it can be called by chrome.scripting.executeScript
window.extractThreads = extractThreads;

// Listen for messages from the background script (for future use)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractThreads') {
    sendResponse({ threads: extractThreads() });
  }
}); 