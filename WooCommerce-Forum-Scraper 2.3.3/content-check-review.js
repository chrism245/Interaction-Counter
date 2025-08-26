// content-check-review.js
(function() {
  console.log('[ContentCheckReview] Script loaded');
  function hasReviewRequest() {
    // Try to find all message content elements
    const posts = Array.from(document.querySelectorAll('.bbp-post-content'));
    if (posts.length === 0) return false;
    const reviewPhrases = [
      /leave (us )?a review/i,
      /please review/i,
      /rate this plugin/i,
      /give us a review/i,
      /share your experience/i,
      /your feedback/i,
      /5-star review/i,
      /rate.*support/i
    ];
    const urlWithReviewsRegex = /https?:\/\/[^\s"'>]*\/reviews[^\s"'>]*/i;
    for (const post of posts) {
      // 1. Check for <a href=".../reviews...">
      const links = post.querySelectorAll('a[href*="/reviews"]');
      if (links.length > 0) return true;
      // 2. Check for plain text URLs with /reviews
      const text = post.textContent;
      if (urlWithReviewsRegex.test(text)) return true;
      // 3. Check for review request phrases
      if (reviewPhrases.some(rx => rx.test(text))) return true;
    }
    return false;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkReviewRequest') {
      const result = hasReviewRequest();
      console.log('[ContentCheckReview] Received checkReviewRequest, result:', result);
      sendResponse({ hasReviewRequest: result });
    }
  });
})(); 