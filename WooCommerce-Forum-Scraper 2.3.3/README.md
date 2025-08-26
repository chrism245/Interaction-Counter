# WooCommerce Forum Scraper Chrome Extension

A Chrome extension that scrapes WooCommerce forum threads and saves the data to a Google Sheets file, which is then opened automatically for review.

## Features

- **Forum Thread Scraping**: Extracts thread links, authors, resolved status, last activity, and whether it contains a review link.
- **Manual Review Author Extraction**: Provides a one-click tool to copy a JavaScript snippet for generating a CSV of review authors from a forum's review page.
- **Automated Spreadsheet with Formula**: Creates a Google Sheet with a formula pre-inserted to automatically check which forum authors have also left a review.
- **Google Drive Integration**: Saves spreadsheets to a user-selected Google Drive folder.
- **Secure Configuration**: All settings are managed in a collapsible panel, with API keys masked for security.
- **Auto-Open on Completion**: The generated Google Sheet is automatically opened in a new tab when the scraping is complete.

## Setup

1. **Google API Setup**:
   - Create a Google Cloud Project.
   - Enable the Google Drive API and Google Sheets API.
   - Create OAuth 2.0 credentials and add your extension's ID to the authorized origins.
   - In `manifest.json`, update the `oauth2.client_id` with your client ID.

2. **Extension Installation**:
   - Load the extension in Chrome in Developer Mode.
   - In the extension popup, open the "Settings" panel.
   - Enter your Google API key and Chrome Extension ID, then click "Save".
   - Authenticate with Google and choose a default Google Drive folder.

## Usage

1. **Scrape Forum Threads**:
   - Select a forum from the main dropdown menu.
   - Set the range of pages to scrape.
   - Click "Start Scraping".
   - The extension will create a Google Sheet and open it in a new tab.

2. **Generate Review Author List**:
   - Navigate to the "Reviews" page of the desired WordPress plugin forum.
   - Open the extension popup and click the "Copy Review Snippet" button.
   - Open your browser's developer console (Cmd/Ctrl + Shift + J), paste the copied code, and press Enter.
   - A `usernames.csv` file will be downloaded.

3. **Analyze Data**:
   - Open the downloaded `usernames.csv` file.
   - Copy the list of usernames from the CSV.
   - Paste the list into the "Review Author" (column F) of the Google Sheet that was automatically opened.
   - The "Left Review?" (column E) will automatically update to "Yes" for any forum author who is also in the review list.

## Supported Forums

- WooCommerce
- WooCommerce Payments
- Google for WooCommerce
- WooCommerce Stripe Gateway
- WooCommerce Square

## Changelog

### Version 2.3 - Finalized Workflow (2024-08-01)
- **Finalized Scraping Workflow**: The extension now exclusively scrapes forum threads, creating a spreadsheet designed for analyzing review participation.
- **New "Copy Review Snippet" Tool**: Replaced the automated review scraping with a button that copies a JavaScript snippet to the clipboard. This allows users to manually generate a CSV of review authors directly from the review page for pasting into the spreadsheet.
- **Updated Spreadsheet Structure**: The output now contains columns for `Thread Link`, `Resolved`, `Contains Review Link`, `Author`, `Left Review?`, and `Review Author`.
- **Automatic "Left Review?" Check**: A formula (`=IF(ISNUMBER(MATCH(D2, F:F, 0)), "Yes", "No")`) is automatically inserted into the "Left Review?" column to cross-reference thread authors with the manually pasted review authors.
- **Auto-Open Spreadsheet**: The Google Sheet now opens in a new tab automatically upon creation.
- **UI and Security Enhancements**:
    -   Moved all configuration into a collapsible "Settings" panel.
    -   API Key and Extension ID are now masked (`********`) for better security.
    -   Fixed all outstanding UI bugs, including icon rendering and the Google Drive folder picker.
- **Permissions and Stability Fixes**: Corrected all `host_permissions` issues in `manifest.json` and resolved multiple bugs in `background.js` to ensure stable and reliable performance.

### Version 2.2
- **Combined Scraping Interface**: Single interface for both forum threads and reviews.
- **Flexible Page Selection**: User can choose how many pages to scrape (1-50).
- **Checkbox Options**: Separate checkboxes for forum threads and reviews.
- **Unified Spreadsheet**: Both data types saved to the same spreadsheet with 5 columns.
- **Review Info Column**: Added fifth column for review rating, title, and date.
- **Improved UX**: Better interface layout and user preferences persistence.

### Version 2.1
- Added review scraping functionality.
- Added "Scrape Reviews" button.
- Created separate spreadsheets for reviews.
- Added review data extraction (author, rating, date, title).

### Version 2.0
- Added forum selection dropdown.
- Added folder picker for Google Drive.
- Improved error handling and progress updates.
- Added pagination support for multiple pages.
- Enhanced thread data extraction.

### Version 1.0
- Initial release.
- Basic forum thread scraping.
- Google Sheets integration.
- OAuth2 authentication.

### Version 2.3.1 - Spreadsheet Naming Update (2024-08-01)
- **Simplified Spreadsheet Naming**: The generated Google Sheets file is now named in the format `Forum Name - YYYY-MM-DD` (e.g., `WooCommerce Square - 2025-06-20`) for easier identification in Google Drive.

### Version 2.3.2 - Authentication & API Key Validation (2024-08-01)
- The extension now validates the Google API key by making a test request to the Google Drive API before allowing authentication.
- Authentication is only allowed if the entered Chrome Extension ID matches the actual extension ID.
- The UI prevents authentication if either value is missing or invalid, and provides clear error messages.
- Resetting the API key/extension ID disables authentication until both are re-entered and validated.

### Version 2.3.3 - Conditional Formatting & Detection Improvements (2024-08-01)
- **Conditional Formatting for Review Links**: Column C ('Contains Review Link') is now highlighted in light green when the value is 'Yes', matching the formatting for column E ('Left Review?').
- **Improved Review Request Detection**: The extension now uses robust logic to detect review requests and links in forum thread messages, ensuring accurate results in column C.

## Changelog (since Version 1.0)

- **Google Drive Integration**
  - You can now sign in with Google and pick any Drive folder (including shared drives) to save your spreadsheets.
  - The folder picker is easy to use and shows "My Drive", "Shared drives", and "Shared with me".

- **Forum Selection & Memory**
  - Choose which WooCommerce forum to scrape from a dropdown.
  - The extension remembers your last chosen forum and folder.

- **Better Scraping**
  - Scrapes more pages at once (you choose how many).
  - Scraping is faster and more reliable.
  - Shows clear progress messages while scraping.

- **Improved Spreadsheet Output**
  - Spreadsheet has columns for Thread Link, Resolved, Contains Review Link, Author, and Date.
  - The file is named with the forum and today's date.

- **Easier to Use**
  - Simpler, clearer interface for picking forums and folders.
  - You can easily update or reset your API key and extension ID.

- **Bug Fixes & Help**
  - Fixed problems with author names, file names, and Drive permissions.
  - Added more helpful error and debug messages.

- **Other Updates**
  - Updated the extension version.
  - Added a changelog to keep track of changes. 