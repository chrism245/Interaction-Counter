# Quick Installation Guide

## Prerequisites
- [Tampermonkey](https://www.tampermonkey.net/) browser extension
- OpenAI API key (for AI-powered responses)

## Step-by-Step Installation

### 1. Install Tampermonkey
- **Chrome/Edge**: [Download from Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Download from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Safari**: [Download from App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### 2. Install the Script
1. Click the Tampermonkey icon in your browser toolbar
2. Select "Create a new script"
3. Delete any existing content in the editor
4. Copy the entire contents of `WooCommerce-Forum-Thread-Manager-v5.3.user.js`
5. Paste it into the Tampermonkey editor
6. Save the script (Ctrl+S or Cmd+S)

### 3. Configure the Script
1. Navigate to any supported forum's unresolved page:
   - WooCommerce: `https://wordpress.org/support/plugin/woocommerce/unresolved/`
   - MailPoet: `https://wordpress.org/support/plugin/mailpoet/unresolved/`
   - Or any other supported forum
2. Click the "⚙️ Settings" button that appears
3. Enter your OpenAI API key
4. Choose your preferred AI model (GPT-4o recommended)
5. Adjust date range settings as needed
6. Click "Save Settings"

### 4. Start Using
1. Navigate to a supported forum's unresolved page
2. Click the "🔍 Review Threads" button
3. The script will analyze threads and present options for closing

## Supported Forums
The script works with 20+ WordPress.org support forums including:
- WooCommerce (Core)
- MailPoet
- WooCommerce Payments
- WooCommerce Stripe Gateway
- And many more...

## Getting Help
- Check the main [README.md](README.md) for detailed documentation
- Enable debug mode in settings for troubleshooting
- Export logs if you encounter issues

## Updates
To update the script:
1. Open Tampermonkey dashboard
2. Find the script in the list
3. Click "Edit"
4. Replace the content with the new version
5. Save (Ctrl+S or Cmd+S)
