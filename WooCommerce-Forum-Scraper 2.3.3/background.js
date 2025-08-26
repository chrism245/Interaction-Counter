const forums = {
  'woocommerce': { name: 'WooCommerce', url: 'https://wordpress.org/support/plugin/woocommerce/' },
  'woocommerce-payments': { name: 'WooCommerce Payments', url: 'https://wordpress.org/support/plugin/woocommerce-payments/' },
  'google-listings-and-ads': { name: 'Google for WooCommerce', url: 'https://wordpress.org/support/plugin/google-listings-and-ads/' },
  'woocommerce-gateway-stripe': { name: 'WooCommerce Stripe Gateway', url: 'https://wordpress.org/support/plugin/woocommerce-gateway-stripe/' },
  'woocommerce-square': { name: 'WooCommerce Square', url: 'https://wordpress.org/support/plugin/woocommerce-square/' }
};

function updateStatus(message) {
  chrome.runtime.sendMessage({ action: 'updateStatus', status: message });
}

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

// Helper function to extract text content between tags
function extractTextBetween(html, startTag, endTag) {
  const startIndex = html.indexOf(startTag);
  if (startIndex === -1) return '';
  const endIndex = html.indexOf(endTag, startIndex + startTag.length);
  if (endIndex === -1) return '';
  return html.substring(startIndex + startTag.length, endIndex).trim();
}

async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error('Error fetching page:', url, error);
    return null;
  }
}

function extractThreadsFromHTML(html) {
  const threads = [];
  const topicsRegex = /<li[^>]*class="[^"]*bbp-topic[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
  const titleRegex = /<a[^>]*class="bbp-topic-permalink"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/;
  const authorRegex = /<span class="bbp-topic-started-by">[\s\S]*?<a[^>]*class="bbp-author-link"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/span>/;
  
  let match;
  while ((match = topicsRegex.exec(html)) !== null) {
    const topicHtml = match[1];
    const titleMatch = titleRegex.exec(topicHtml);
    const authorMatch = authorRegex.exec(topicHtml);
    const isResolved = topicHtml.includes('class="resolved"');
    
    if (titleMatch) {
      threads.push({
        title: titleMatch[2].replace(/<[^>]*>/g, '').trim(),
        link: titleMatch[1],
        author: authorMatch ? authorMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown',
        resolved: isResolved
      });
    }
  }
  
  return threads;
}

function hasNextPage(html) {
  const hasNext = html.includes('class="page-numbers next"');
  console.log('Checking for next page:', hasNext);
  return hasNext;
}

// Robust review request detection function
async function checkThreadForReviewLink(threadUrl, reviewLink) {
  try {
    const response = await fetch(threadUrl);
    const text = await response.text();
    // Check for the original review link (with #new-post)
    if (text.includes(reviewLink)) {
      return true;
    }
    // Check for the review link in support staff responses (without #new-post)
    const baseReviewLink = reviewLink.replace('#new-post', '');
    const relativePath = baseReviewLink.split('wordpress.org')[1];
    const textWithoutNav = text.replace(/<ul class="[^"]*">.*?<\/ul>/gs, '');
    // Look for the review link in a paragraph or response section
    const reviewLinkPattern = new RegExp(
      `<p>.*?(?:${baseReviewLink.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}|${relativePath.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}).*?<\/p>|` +
      `<div class="bbp-reply-content">.*?(?:${baseReviewLink.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}|${relativePath.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}).*?<\/div>|` +
      `<p>.*?leave a review.*?<\/p>|` +
      `<p>.*?share your feedback.*?<\/p>`,
      'i'
    );
    const hasReviewLinkInResponse = reviewLinkPattern.test(textWithoutNav);
    return hasReviewLinkInResponse;
  } catch (e) {
    console.warn('Failed to fetch thread:', threadUrl, e);
    return false;
  }
}

async function createSpreadsheet(token, folderId, title) {
  const metadata = {
    name: title,
    mimeType: 'application/vnd.google-apps.spreadsheet',
    parents: folderId ? [folderId] : []
  };

  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create spreadsheet: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return { spreadsheetId: data.id, spreadsheetUrl: data.webViewLink };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    return {};
  }
}

// Add a simple auth test function
async function testAuth() {
  try {
    console.log('Testing authentication...');
    const token = await getAuthToken();
    console.log('Auth test successful, token length:', token ? token.length : 0);
    return true;
  } catch (error) {
    console.error('Auth test failed:', error);
    return false;
  }
}

function extractAllUsernamesFromThreads(threads) {
  const usernames = [];
  
  threads.forEach(thread => {
    if (thread.author && thread.author !== 'Unknown') {
      usernames.push(thread.author);
    }
  });
  
  // Remove duplicates
  const uniqueUsernames = [...new Set(usernames)];
  console.log(`Found ${uniqueUsernames.length} unique usernames from forum threads:`, uniqueUsernames);
  
  return uniqueUsernames;
}

function findMatchingAuthors(threadUsernames, reviewAuthors) {
  const matches = [];
  
  threadUsernames.forEach(username => {
    if (reviewAuthors.includes(username)) {
      matches.push(username);
    }
  });
  
  console.log(`Found ${matches.length} authors who have both forum threads and reviews:`, matches);
  return matches;
}

function extractReviewsFromHTML(html) {
  const reviews = [];
  
  console.log('Starting review extraction...');
  console.log('HTML length:', html.length);
  
  // Check if HTML contains expected content
  console.log('Contains "wporg-ratings":', html.includes('wporg-ratings'));
  console.log('Contains "bbp-author-name":', html.includes('bbp-author-name'));
  
  // Find all author names that are in review topics
  const authorRegex = /<span class="bbp-author-name">([^<]+)<\/span>/g;
  const ratingRegex = /<div class='wporg-ratings' title='([^']*)'/g;
  const titleRegex = /<a[^>]*class="bbp-topic-permalink"[^>]*>([^<]+)<div class='wporg-ratings'/g;
  const dateRegex = /<a[^>]*title="([^"]*)"[^>]*>[^<]*ago<\/a>/g;
  
  // Extract all authors
  const authors = [];
  let authorMatch;
  while ((authorMatch = authorRegex.exec(html)) !== null) {
    authors.push(authorMatch[1].trim());
  }
  
  // Extract all ratings
  const ratings = [];
  let ratingMatch;
  while ((ratingMatch = ratingRegex.exec(html)) !== null) {
    ratings.push(ratingMatch[1].trim());
  }
  
  // Extract all titles
  const titles = [];
  let titleMatch;
  while ((titleMatch = titleRegex.exec(html)) !== null) {
    titles.push(titleMatch[1].trim());
  }
  
  // Extract all dates
  const dates = [];
  let dateMatch;
  while ((dateMatch = dateRegex.exec(html)) !== null) {
    dates.push(dateMatch[1].trim());
  }
  
  console.log(`Found ${authors.length} authors, ${ratings.length} ratings, ${titles.length} titles, ${dates.length} dates`);
  
  // Match them up (assuming they're in the same order)
  const maxLength = Math.min(authors.length, ratings.length, titles.length, dates.length);
  
  for (let i = 0; i < maxLength; i++) {
    const author = authors[i];
    const rating = ratings[i];
    const title = titles[i];
    const date = dates[i];
    
    console.log(`Review ${i + 1}: ${author} - ${rating} - ${title} - ${date}`);
    
    reviews.push({
      author: author,
      rating: rating,
      date: date,
      title: title
    });
  }
  
  console.log(`Successfully extracted ${reviews.length} reviews`);
  return reviews;
}

let lastReviewAuthors = [];

async function startScraping(forum, pageFrom, pageTo) {
  updateStatus('Authenticating...');
  const token = await getAuthToken();
  if (!token) {
    updateStatus('Authentication failed. Please check settings.');
    return;
  }

  updateStatus('Getting folder info...');
  const { selectedFolderId: folderId } = await chrome.storage.local.get('selectedFolderId');

  const forumDetails = forums[forum];
  const title = `${forumDetails.name} - ${new Date().toISOString().slice(0, 10)}`;
  
  updateStatus('Creating spreadsheet...');
  const { spreadsheetId, spreadsheetUrl } = await createSpreadsheet(token, folderId, title);
  if (!spreadsheetId) {
    updateStatus('Failed to create spreadsheet.');
    return;
  }

  updateStatus(`Scraping ${forumDetails.name}...`);
  let allThreads = [];

  for (let i = pageFrom; i <= pageTo; i++) {
    updateStatus(`Scraping page ${i} of ${pageTo}...`);
    try {
      const threads = await scrapeForumPage(forumDetails.url, i, forum);
      if (threads.length === 0 && i > 1) {
        updateStatus(`No more threads found at page ${i}. Stopping.`);
        break; 
      }
      allThreads.push(...threads);
    } catch (error) {
      console.error(`Error scraping page ${i} for ${forum}:`, error);
      updateStatus(`Error on page ${i}. Check console. Skipping.`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (allThreads.length === 0) {
    updateStatus('No threads found. Nothing to save.');
    chrome.storage.local.set({ isScraping: false });
    return;
  }

  updateStatus(`Writing ${allThreads.length} threads to spreadsheet...`);
  const success = await writeToSpreadsheet(token, spreadsheetId, allThreads);

  if (success) {
    updateStatus('Adding conditional formatting...');
    await addConditionalFormatting(token, spreadsheetId);
    let statusMessage = `All done! ${allThreads.length} threads saved to your Google Drive.`;
    updateStatus(statusMessage);
    chrome.tabs.create({ url: spreadsheetUrl });
    chrome.storage.local.set({ isScraping: false });
  } else {
    updateStatus('Failed to write data to spreadsheet.');
    chrome.storage.local.set({ isScraping: false, scrapeError: 'Failed to write data.' });
  }
}

async function scrapeForumPage(url, page, forumKey) {
  const pageUrl = `${url}page/${page}/`;
  const html = await fetchPage(pageUrl);
  if (!html) return [];

  const threads = [];
  const topicsRegex = /<li[^>]*class="[^\"]*bbp-topic[^\"]*"[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  while ((match = topicsRegex.exec(html)) !== null) {
    const topicHtml = match[1];
    const titleMatch = topicHtml.match(/<a[^>]*class="bbp-topic-permalink"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    const authorMatch = topicHtml.match(/<a[^>]*class="bbp-author-link"[^>]*>([\s\S]*?)<\/a>/);
    const lastActivityMatch = topicHtml.match(/<p class="bbp-topic-meta">[\s\S]*?freshness">([\s\S]*?)<\/a>/);
    
    if (titleMatch) {
      threads.push({
        title: titleMatch[2].replace(/<[^>]*>/g, '').trim(),
        link: titleMatch[1],
        author: authorMatch ? authorMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown',
        resolved: topicHtml.includes('class="resolved"'),
        hasReviewLink: false, // Will update below
        lastActivity: lastActivityMatch ? lastActivityMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown'
      });
    }
  }

  // Use robust review request detection for each thread
  const forumReviewLink = forums[forumKey].url + 'reviews/#new-post';
  for (let thread of threads) {
    thread.hasReviewLink = await checkThreadForReviewLink(thread.link, forumReviewLink);
  }

  return threads;
}

async function writeToSpreadsheet(token, spreadsheetId, threads) {
  const header = ['Thread Link', 'Resolved', 'Contains Review Link', 'Author', 'Left Review?', 'Review Author'];
  
  const rows = threads.map((thread, index) => {
    const rowNum = index + 2; // +2 because header is row 1 and it's 1-indexed.
    const formula = `=IF(ISNUMBER(MATCH(D${rowNum}, F:F, 0)), "Yes", "No")`;
    return [
      thread.link,
      thread.resolved ? 'Yes' : 'No',
      thread.hasReviewLink ? 'Yes' : 'No',
      thread.author,
      formula,
      ''
    ];
  });

  const body = { values: [header, ...rows] };

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (error) {
    console.error('Failed to write to spreadsheet:', error);
    return false;
  }
}

async function addConditionalFormatting(token, spreadsheetId) {
  const requests = [
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [{
            sheetId: 0,
            startRowIndex: 1,
            startColumnIndex: 4,
            endColumnIndex: 5,
          }],
          booleanRule: {
            condition: {
              type: 'CUSTOM_FORMULA',
              values: [{ userEnteredValue: '=E2="Yes"' }]
            },
            format: {
              backgroundColor: {
                red: 0.7137255,
                green: 0.84313726,
                blue: 0.65882355
              }
            }
          }
        },
        index: 0
      }
    },
    // New rule for column C (Contains Review Link)
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [{
            sheetId: 0,
            startRowIndex: 1,
            startColumnIndex: 2,
            endColumnIndex: 3,
          }],
          booleanRule: {
            condition: {
              type: 'CUSTOM_FORMULA',
              values: [{ userEnteredValue: '=C2="Yes"' }]
            },
            format: {
              backgroundColor: {
                red: 0.7137255,
                green: 0.84313726,
                blue: 0.65882355
              }
            }
          }
        },
        index: 0
      }
    }
  ];

  const body = { requests };

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    console.log('Successfully added conditional formatting.');
    return true;
  } catch (error) {
    console.error('Failed to add conditional formatting:', error);
    return false;
  }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScraping') {
    chrome.storage.local.set({ isScraping: true, scrapeError: null });
    startScraping(message.forum, message.pageFrom, message.pageTo)
      .catch(e => {
        console.error('Scraping failed:', e);
        updateStatus(`Error: ${e.message}. Please check logs.`);
        chrome.storage.local.set({ isScraping: false, scrapeError: e.message });
      });
    sendResponse({ status: 'Scraping started...' });
  } else if (message.action === 'checkAuth') {
    getAuthToken()
      .then(token => sendResponse({ token: token }))
      .catch(err => sendResponse({ error: err.message }));
  } else if (message.action === 'reviewAuthors') {
    console.log('Received review authors from content script:', message.authors);
    lastReviewAuthors = message.authors;
    updateStatus('Review authors scraped. Now you can scrape forum threads and save to Google Sheets.');
    return;
  }
  return true;
});

// Function to inject content script into the reviews tab
async function injectReviewScraper(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content-reviews.js']
    });
    console.log('Injected content-reviews.js into tab', tabId);
  } catch (e) {
    console.error('Failed to inject content script:', e);
  }
}

// When scraping reviews, open the reviews page and inject the content script
async function startReviewScrapingInTab(forumKey) {
  const reviewUrl = forums[forumKey].url + 'reviews/';
  if (!reviewUrl) {
    updateStatus('No review URL found for this forum.');
    return;
  }
  // Open the reviews page in a new tab
  chrome.tabs.create({ url: reviewUrl, active: true }, (tab) => {
    // Wait for the tab to finish loading, then inject the script
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        injectReviewScraper(tabId);
      }
    });
  });
} 