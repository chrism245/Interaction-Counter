document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start').addEventListener('click', () => {
    const forumSelect = document.getElementById('forum-select');
    const pageFrom = parseInt(document.getElementById('page-from').value) || 1;
    const pageTo = parseInt(document.getElementById('page-to').value) || 5;
    
    if (!forumSelect.value) {
      document.getElementById('status').textContent = 'Please select a forum to scrape';
      return;
    }
    
    if (pageFrom < 1 || pageTo < pageFrom || pageTo > 50) {
      document.getElementById('status').textContent = 'Please enter a valid page range (1-50)';
      return;
    }
    
    console.log('Sending startScraping message with forum:', forumSelect.value, 'options:', { pageFrom, pageTo });
    document.getElementById('status').textContent = 'Starting...';
    chrome.runtime.sendMessage({ 
      action: 'startScraping',
      forum: forumSelect.value,
      pageFrom: pageFrom,
      pageTo: pageTo
    });
  });

  // Load saved scraping preferences when popup opens
  chrome.storage.local.get(['selectedFolderId', 'selectedFolderName'], (result) => {
    if (result.selectedFolderId && result.selectedFolderName) {
      document.getElementById('selected-folder').textContent = result.selectedFolderName;
    }
  });

  chrome.storage.local.get(['selectedForum'], (result) => {
    if (result.selectedForum) {
      document.getElementById('forum-select').value = result.selectedForum;
    }
  });

  chrome.storage.local.get(['pageFrom', 'pageTo'], (result) => {
    if (result.pageFrom) {
      document.getElementById('page-from').value = result.pageFrom;
    }
    if (result.pageTo) {
      document.getElementById('page-to').value = result.pageTo;
    }
  });

  document.getElementById('copy-review-script').addEventListener('click', () => {
    const scriptText = `// Get all elements containing "Started by: "
const startedByElements = Array.from(document.querySelectorAll('*'))
  .filter(el => el.textContent.includes('Started by: '));

// Extract usernames using regex
const usernames = startedByElements.map(el => {
  const match = el.textContent.match(/Started by: (\\S+)/); // Change to \\S+ to match non-whitespace characters
  return match ? match[1] : null;
}).filter(Boolean);

// Remove duplicates
const uniqueUsernames = [...new Set(usernames)];

// Prepare CSV content with header
const csvContent = "Username\\n" + uniqueUsernames.join('\\n'); // Use \\n for proper CSV format

// Create a Blob and trigger download
const blob = new Blob([csvContent], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'usernames.csv';
document.body.appendChild(a); // Required for Firefox
a.click();
document.body.removeChild(a); // Clean up
URL.revokeObjectURL(url); // Free memory
`;
    navigator.clipboard.writeText(scriptText).then(() => {
      const button = document.getElementById('copy-review-script');
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.innerHTML = '<span style="font-size:15px;">📋</span> Copy Review Snippet';
      }, 2000);
    });
  });

  document.getElementById('page-from').addEventListener('change', (e) => {
    chrome.storage.local.set({ pageFrom: parseInt(e.target.value) || 1 });
  });

  document.getElementById('page-to').addEventListener('change', (e) => {
    chrome.storage.local.set({ pageTo: parseInt(e.target.value) || 5 });
  });

  document.getElementById('forum-select').addEventListener('change', (e) => {
    chrome.storage.local.set({ selectedForum: e.target.value });
  });

  document.getElementById('auth').addEventListener('click', () => {
    const authStatus = document.getElementById('auth-status');
    const apiKey = apiKeyInput.value.trim();
    const extId = extIdInput.value.trim();
    // Check API key is not empty
    if (!apiKey) {
      authStatus.textContent = 'API key is required.';
      setTimeout(() => { authStatus.textContent = ''; }, 3000);
      return;
    }
    // Check extension ID matches actual extension ID
    if (extId !== chrome.runtime.id) {
      authStatus.textContent = 'Extension ID does not match this extension.';
      setTimeout(() => { authStatus.textContent = ''; }, 4000);
      return;
    }
    authStatus.textContent = 'Validating API key...';
    // Validate API key by making a request to Google Drive API
    fetch(`https://www.googleapis.com/drive/v3/about?fields=user&key=${apiKey}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          let msg = 'API key is invalid.';
          if (err && err.error && err.error.message) msg += ' ' + err.error.message;
          authStatus.textContent = msg;
          setTimeout(() => { authStatus.textContent = ''; }, 4000);
          return;
        }
        // API key is valid, proceed to authenticate
        authStatus.textContent = 'Checking...';
        chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
          if (response && response.token) {
            authStatus.textContent = 'Authenticated!';
          } else {
            authStatus.textContent = 'Authentication failed.';
          }
          setTimeout(() => { authStatus.textContent = ''; }, 3000);
        });
      })
      .catch(() => {
        authStatus.textContent = 'API key validation failed (network error).';
        setTimeout(() => { authStatus.textContent = ''; }, 4000);
      });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStatus') {
      document.getElementById('status').textContent = message.status;
    }
  });

  document.getElementById('choose-drive-folder').addEventListener('click', async () => {
    const pickerContainer = document.getElementById('drive-picker-container');
    if (pickerContainer.style.display === 'none' || !pickerContainer.style.display) {
      pickerContainer.style.display = 'block';
      chooseFolderBtn.innerHTML = '<span style="font-size:15px;">📁</span> Hide Folder Selection';
      chrome.storage.local.get(['selectedFolderId', 'selectedFolderName', 'selectedFolderType'], async (result) => {
        if (result.selectedFolderId && result.selectedFolderType) {
          const token = await getAuthToken();
          if (token) {
            try {
              const parent = await fetchParentFolder(token, result.selectedFolderId);
              if (parent) {
                renderDriveTree(result.selectedFolderType, parent.id, parent.name || 'My Drive');
              } else {
                renderDriveTree(result.selectedFolderType, null, result.selectedFolderType === 'mydrive' ? 'My Drive' : 'Shared drives');
              }
            } catch (e) {
              console.error('Error loading saved folder:', e);
              renderDriveTree('mydrive', null, 'My Drive');
            }
          }
        } else {
          renderDriveTree('mydrive', null, 'My Drive');
        }
      });
    } else {
      pickerContainer.style.display = 'none';
      chooseFolderBtn.innerHTML = '<span style="font-size:15px;">📁</span> Choose Google Drive Folder';
    }
  });

  // Settings panel toggle
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  settingsToggle.addEventListener('click', () => {
    if (settingsPanel.style.display === 'none' || !settingsPanel.style.display) {
      settingsPanel.style.display = 'block';
      settingsToggle.classList.add('active');
    } else {
      settingsPanel.style.display = 'none';
      settingsToggle.classList.remove('active');
    }
  });

  // API Key & Extension ID logic (now inside settings panel)
  const apiKeyInput = document.getElementById('api-key');
  const extIdInput = document.getElementById('ext-id');
  const saveBtn = document.getElementById('save-keys');
  const saveStatus = document.getElementById('save-status');
  const editBtn = document.getElementById('edit-api-config');
  const resetBtn = document.getElementById('reset-api-config');
  const chooseFolderBtn = document.getElementById('choose-drive-folder');
  const selectedFolderDiv = document.getElementById('selected-folder');

  function updateApiConfigVisibility() {
    chrome.storage.local.get(['apiKey', 'extId'], (result) => {
      const apiConfigDiv = document.getElementById('api-config');
      if (result.apiKey && result.extId) {
        apiKeyInput.type = 'password';
        extIdInput.type = 'password';
        apiKeyInput.setAttribute('readonly', 'readonly');
        extIdInput.setAttribute('readonly', 'readonly');
        saveBtn.style.display = 'none';
        editBtn.style.display = 'inline-block';
        resetBtn.style.display = 'inline-block';
      } else {
        apiKeyInput.type = 'text';
        extIdInput.type = 'text';
        apiKeyInput.removeAttribute('readonly');
        extIdInput.removeAttribute('readonly');
        saveBtn.style.display = 'inline-block';
        editBtn.style.display = 'none';
        resetBtn.style.display = 'none';
      }
    });
  }

  editBtn.addEventListener('click', () => {
    apiKeyInput.type = 'text';
    extIdInput.type = 'text';
    apiKeyInput.removeAttribute('readonly');
    extIdInput.removeAttribute('readonly');
    saveBtn.style.display = 'inline-block';
    editBtn.style.display = 'none';
    resetBtn.style.display = 'none';
  });

  resetBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['apiKey', 'extId'], () => {
      apiKeyInput.value = '';
      extIdInput.value = '';
      apiKeyInput.type = 'text';
      extIdInput.type = 'text';
      apiKeyInput.removeAttribute('readonly');
      extIdInput.removeAttribute('readonly');
      saveBtn.style.display = 'inline-block';
      editBtn.style.display = 'none';
      resetBtn.style.display = 'none';
      // Clear cached OAuth token
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            saveStatus.textContent = 'Reset! Please enter your API key and Extension ID.';
            setTimeout(() => { saveStatus.textContent = ''; }, 2500);
            document.getElementById('auth-status').textContent = '';
            document.getElementById('auth').disabled = true;
          });
        } else {
          saveStatus.textContent = 'Reset! Please enter your API key and Extension ID.';
          setTimeout(() => { saveStatus.textContent = ''; }, 2500);
          document.getElementById('auth-status').textContent = '';
          document.getElementById('auth').disabled = true;
        }
      });
    });
  });

  // Disable auth button if either field is empty
  function updateAuthButtonState() {
    const apiKey = apiKeyInput.value.trim();
    const extId = extIdInput.value.trim();
    document.getElementById('auth').disabled = !(apiKey && extId);
  }
  apiKeyInput.addEventListener('input', updateAuthButtonState);
  extIdInput.addEventListener('input', updateAuthButtonState);
  updateAuthButtonState();

  chrome.storage.local.get(['apiKey', 'extId'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.extId) extIdInput.value = result.extId;
  });

  updateApiConfigVisibility();

  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const extId = extIdInput.value.trim();
    chrome.storage.local.set({ apiKey, extId }, () => {
      // Clear cached OAuth token
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            saveStatus.textContent = 'Saved! Please re-authenticate.';
            setTimeout(() => { saveStatus.textContent = ''; }, 2500);
            updateApiConfigVisibility();
          });
        } else {
          saveStatus.textContent = 'Saved! Please re-authenticate.';
          setTimeout(() => { saveStatus.textContent = ''; }, 2500);
          updateApiConfigVisibility();
        }
      });
    });
  });

  // --- Google Drive Sidebar Tree Picker ---
  const folderTreeDiv = document.getElementById('folder-tree');
  const myDriveRoot = document.getElementById('my-drive-root');
  const sharedDrivesRoot = document.getElementById('shared-drives-root');
  const sharedWithMeRoot = document.getElementById('shared-with-me-root');

  function updateSelectedFolder(id, name, type = 'mydrive') {
    chrome.storage.local.set({ 
      selectedFolderId: id, 
      selectedFolderName: name,
      selectedFolderType: type
    }, () => {
      selectedFolderDiv.textContent = name;
      document.getElementById('drive-picker-container').style.display = 'none';
      document.getElementById('choose-drive-folder').innerHTML = '<span style="font-size:15px;">📁</span> Choose Google Drive Folder';
    });
  }

  myDriveRoot.addEventListener('click', () => {
    renderDriveTree('mydrive', null, 'My Drive').catch(err => {
      folderTreeDiv.textContent = 'Authentication failed.';
      console.error('Auth error:', err);
    });
  });

  sharedDrivesRoot.addEventListener('click', async () => {
    folderTreeDiv.textContent = 'Loading shared drives...';
    let token;
    try {
      token = await getAuthToken();
    } catch (err) {
      folderTreeDiv.textContent = 'Authentication failed.';
      console.error('Auth error:', err);
      return;
    }
    let drives = [];
    try {
      drives = await fetchSharedDrives(token);
    } catch (e) {
      folderTreeDiv.textContent = 'Failed to load shared drives.';
      return;
    }
    if (!Array.isArray(drives) || drives.length === 0) {
      folderTreeDiv.textContent = 'No shared drives found.';
      return;
    }
    folderTreeDiv.innerHTML = '<div style="font-weight:bold;">Shared drives</div>' +
      drives.map(d => `<div class="shared-drive" data-id="${d.id}" style="cursor:pointer; margin-left:10px;">${d.name}</div>`).join('');
    Array.from(folderTreeDiv.getElementsByClassName('shared-drive')).forEach(el => {
      el.addEventListener('click', () => {
        renderDriveTree('shared', el.dataset.id, el.textContent).catch(err => {
          folderTreeDiv.textContent = 'Authentication failed.';
          console.error('Auth error:', err);
        });
      });
    });
  });
  
  sharedWithMeRoot.addEventListener('click', async () => {
    renderDriveTree('sharedWithMe', null, 'Shared with me').catch(err => {
      folderTreeDiv.textContent = 'Authentication failed.';
      console.error('Auth error:', err);
    });
  });

  async function renderDriveTree(type, parentId, driveName) {
    folderTreeDiv.innerHTML = `<div style="font-weight:bold;">Loading...</div>`;
    let token;
    try {
      token = await getAuthToken();
    } catch (err) {
      folderTreeDiv.innerHTML = 'Authentication failed.';
      console.error('Auth error:', err);
      return;
    }
    
    let folders = [];
    try {
      if (type === 'sharedWithMe') {
        folders = await fetchSharedWithMeFolders(token);
        renderFlatFolderList(folders, 'Shared with me');
        return;
      } else {
        folders = await fetchDriveFolders(token, parentId, type === 'shared');
      }
    } catch (e) {
      folderTreeDiv.innerHTML = 'Failed to load folders.';
      return;
    }

    let parentLink = '';
    if (parentId) {
      try {
        const parentFolder = await fetchParentFolder(token, parentId, type);
        if (parentFolder && parentFolder.id) {
          parentLink = `<div class="drive-folder" data-id="${parentFolder.id}" data-type="${type}" style="cursor:pointer;">.. (Up)</div>`;
        }
      } catch (e) {
        console.error('Could not fetch parent folder for breadcrumb', e);
      }
    }
    
    folderTreeDiv.innerHTML = 
      `<div style="font-weight:bold; margin-bottom:5px;">${driveName}</div>` +
      parentLink +
      folders.map(f => `<div class="drive-folder" data-id="${f.id}" data-type="${type}" style="cursor:pointer; margin-left:10px;">${f.name}</div>`).join('') +
      `<button class="select-folder-btn" data-id="${parentId || 'root'}" data-name="${driveName}" style="margin-top:10px;">Select this folder</button>`;

    Array.from(folderTreeDiv.getElementsByClassName('drive-folder')).forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        renderDriveTree(el.dataset.type, el.dataset.id, el.textContent.replace('.. (Up)', '').trim());
      });
    });
    Array.from(folderTreeDiv.getElementsByClassName('select-folder-btn')).forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        updateSelectedFolder(el.dataset.id, el.dataset.name, type);
      });
    });
  }
  
  function renderFlatFolderList(folders, label) {
    folderTreeDiv.innerHTML =
      `<div style="font-weight:bold; margin-bottom:5px;">${label}</div>` +
      folders.map(f => `<div class="drive-folder" data-id="${f.id}" data-type="sharedWithMe" style="cursor:pointer; margin-left:10px;">${f.name}</div>`).join('');
    
    Array.from(folderTreeDiv.getElementsByClassName('drive-folder')).forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        updateSelectedFolder(el.dataset.id, el.textContent, 'sharedWithMe');
      });
    });
  }

  async function fetchDriveFolders(token, parentId, isSharedDrive = false) {
    const query = `'${parentId || 'root'}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', query);
    url.searchParams.set('fields', 'files(id, name)');
    if (isSharedDrive) {
      url.searchParams.set('corpora', 'drive');
      url.searchParams.set('driveId', parentId);
      url.searchParams.set('includeItemsFromAllDrives', 'true');
      url.searchParams.set('supportsAllDrives', 'true');
    }
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).files;
  }
  
  async function fetchSharedDrives(token) {
    const res = await fetch('https://www.googleapis.com/drive/v3/drives', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).drives;
  }
  
  async function fetchSharedWithMeFolders(token) {
    const res = await fetch("https://www.googleapis.com/drive/v3/files?q=sharedWithMe=true and mimeType='application/vnd.google-apps.folder'", {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).files;
  }

  async function fetchParentFolder(token, folderId, type) {
    if (!folderId || folderId === 'root') return null;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=parents`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.parents ? { id: data.parents[0] } : null;
  }

  async function getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
          const errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No token';
          reject(errMsg);
        } else {
          resolve(token);
        }
      });
    });
  }
}); 