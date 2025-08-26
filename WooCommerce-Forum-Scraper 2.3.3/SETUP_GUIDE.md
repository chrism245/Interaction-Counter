# Google API Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter a project name (e.g., "WooCommerce Scraper")
5. Click "Create"

## Step 2: Enable Required APIs

1. In your new project, go to **APIs & Services > Library**
2. Search for "Google Drive API" and click on it
3. Click "Enable"
4. Search for "Google Sheets API" and click on it
5. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose "External" user type
3. Fill in required information:
   - **App name**: WooCommerce Forum Scraper
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click "Save and Continue"
5. On "Scopes" page, click "Add or Remove Scopes"
6. Add these scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/spreadsheets`
7. Click "Save and Continue"
8. On "Test users" page, add your email address
9. Click "Save and Continue"

## Step 4: Get Your Extension ID

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked** and select your extension folder
4. Copy the extension ID (long string like `abcdefghijklmnopqrstuvwxyz123456`)

## Step 5: Create OAuth2 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Choose **Chrome App** as application type
4. Enter your extension ID from Step 4
5. Click "Create"
6. Copy the generated Client ID

## Step 6: Update Extension

1. Open `manifest.json` in your extension folder
2. Replace `"YOUR_CLIENT_ID.apps.googleusercontent.com"` with your actual Client ID
3. Save the file
4. Go back to `chrome://extensions/`
5. Click the refresh icon on your extension to reload it

## Step 7: Test Authentication

1. Click the extension icon in your browser
2. Click "Check Authentication"
3. You should see a Google sign-in popup
4. Sign in with your Google account
5. Grant the requested permissions

## Troubleshooting

### "Authentication failed" error:
- Make sure you've updated the client_id in manifest.json
- Ensure you've reloaded the extension after making changes
- Check that your Google Cloud project has the required APIs enabled
- Verify your extension ID matches the one in OAuth credentials

### "Invalid client" error:
- Double-check that the client_id in manifest.json matches exactly
- Make sure you're using the Chrome App client ID, not a web application ID

### Permission denied errors:
- Ensure you've added your email as a test user in the OAuth consent screen
- Check that the required scopes are added to the consent screen

## Important Notes

- The extension ID must match exactly between Chrome and your OAuth credentials
- You must reload the extension after changing manifest.json
- Test users must be added to the OAuth consent screen for external apps
- The extension will only work for users who are added as test users (until you publish the app) 