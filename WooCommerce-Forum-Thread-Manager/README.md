# WooCommerce Forum Thread Manager

A powerful Tampermonkey user script for managing and closing old unresolved threads across multiple WordPress.org support forums, with AI-powered responses and human-in-the-loop review.

## 🚀 Features

### Core Functionality
- **Multi-Forum Support**: Works with WooCommerce, MailPoet, and 20+ other WordPress.org support forums
- **Smart Thread Analysis**: Automatically detects if threads are safe to close based on user responses and frustration indicators
- **AI-Powered Responses**: Generates professional closing messages using OpenAI GPT models
- **Human Review System**: Optional human-in-the-loop review before closing threads
- **Queue Management**: Processes multiple threads in sequence with skip/cancel options
- **Multi-Page Thread Support**: Automatically navigates to the latest page of multi-page threads

### Advanced Features
- **Frustration Detection**: Identifies user frustration to prevent closing threads inappropriately
- **Automatic Resolution**: Can automatically close simple cases without human review
- **Rate Limiting**: Built-in rate limiting for OpenAI API calls
- **Comprehensive Logging**: Detailed logging system with export capabilities
- **Accessibility Options**: Configurable timer settings for users with disabilities
- **Cross-Page State Management**: Maintains script state across page navigations

### Supported Forums
- WooCommerce (Core)
- MailPoet - Newsletters, Email Marketing, and Automation
- WooCommerce Google Analytics Integration
- WooCommerce Gutenberg Products Block
- WooCommerce Admin
- Pinterest for WooCommerce
- Action Scheduler
- Storefront Theme
- WooCommerce Payments
- WooCommerce Stripe Gateway
- WooCommerce eWAY Gateway
- WooCommerce PayPal Express Checkout
- WooCommerce PayPal Here Gateway
- WooCommerce PayFast Gateway
- WooCommerce Square
- WooCommerce Services
- WooCommerce ShipStation Integration
- Google Listings and Ads
- WooCommerce PayPal Powered by Braintree
- WooCommerce Shipping

## 📦 Installation

### Prerequisites
- [Tampermonkey](https://www.tampermonkey.net/) browser extension
- OpenAI API key (for AI-powered responses)

### Installation Steps

1. **Install Tampermonkey**
   - Chrome/Edge: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Safari: [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)

2. **Install the Script**
   - Click the Tampermonkey icon in your browser
   - Select "Create a new script"
   - Copy and paste the entire contents of `WooCommerce-Forum-Thread-Manager-v5.3.user.js`
   - Save the script (Ctrl+S or Cmd+S)

3. **Configure OpenAI API**
   - Navigate to any supported forum's unresolved page
   - Click the "⚙️ Settings" button
   - Enter your OpenAI API key
   - Choose your preferred AI model (GPT-4o recommended)
   - Save settings

## 🎯 Usage

### Basic Usage

1. **Navigate to a Supported Forum**
   - Go to any supported forum's unresolved page (e.g., `https://wordpress.org/support/plugin/woocommerce/unresolved/`)
   - The script will automatically detect the forum and show the "🔍 Review Threads" button

2. **Configure Date Range**
   - Click "⚙️ Settings" to adjust the date range for thread filtering
   - Set minimum and maximum weeks to look back

3. **Start Review Process**
   - Click "🔍 Review Threads" to begin processing
   - The script will analyze each thread and present options

### Advanced Configuration

#### AI Model Selection
- **GPT-4o** (Default): Best quality responses, recommended for most users
- **GPT-4o Mini**: Faster and more cost-effective, good for high-volume usage
- **GPT-4 Turbo**: Legacy model, still effective
- **GPT-4**: Legacy model, high quality but slower
- **GPT-5**: Future model (when available)

#### Review Settings
- **Enable Human Review**: Toggle between fully automatic and human-in-the-loop operation
- **Show Countdown Timer**: Enable/disable the 30-second review timer for accessibility
- **Test Mode**: Enable for testing without making actual changes

#### Forum Management
- **Enable/Disable Forums**: Toggle which forums the script should process
- **Add Custom Forums**: Add support for additional WordPress.org forums
- **Import/Export Settings**: Backup and restore your configuration

## 🔧 Configuration

### Date Range Settings
- **Minimum Weeks**: Don't process threads newer than this (default: 2 weeks)
- **Maximum Weeks**: Don't process threads older than this (default: 8 weeks)

### AI Response Settings
- **API Key**: Your OpenAI API key for generating responses
- **Model Selection**: Choose the AI model for response generation
- **Rate Limiting**: Built-in delays to respect API limits

### Review Behavior
- **Human Review**: Enable to review each thread before closing
- **Auto-Resolution**: Automatically close threads that meet safety criteria
- **Timer Settings**: Configure the review countdown timer

## 📊 Logging and Debugging

### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General information about script operation
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failed operations

### Export Logs
- Access logs through the settings panel
- Export logs for troubleshooting or analysis
- Logs include timestamps, URLs, and detailed context

## 🛠️ Troubleshooting

### Common Issues

**Script not working on a forum page:**
- Ensure the forum is in the supported list
- Check that you're on the correct URL pattern
- Verify Tampermonkey is enabled

**AI responses not generating:**
- Verify your OpenAI API key is correct
- Check your API usage limits
- Ensure you have sufficient API credits

**Threads not being detected:**
- Adjust the date range settings
- Check if threads are within the configured time window
- Verify the forum is enabled in settings

### Debug Mode
Enable debug mode in settings to get detailed console output for troubleshooting.

## 🤝 Contributing

### Adding New Forums
To add support for a new WordPress.org forum:

1. Open the script settings
2. Click "Add Forum"
3. Enter the forum details:
   - Name: Display name
   - Slug: URL slug (e.g., "my-plugin")
   - URL: Forum support URL
   - Review URL: Forum review URL

### Reporting Issues
When reporting issues, please include:
- Browser and Tampermonkey version
- Script version
- Console logs (if available)
- Steps to reproduce the issue

## 📝 Changelog

### Version 5.3
- Fixed MailPoet forum detection issue
- Enhanced forum loading to ensure all default forums are available
- Improved settings merging for new forum additions

### Version 5.2
- Added MailPoet forum support
- Updated to GPT-4o as default AI model
- Removed GPT-3.5 Turbo from options
- Enhanced thread analysis with frustration detection
- Added automatic resolution capabilities
- Improved button design and accessibility

### Version 5.1
- Fixed multi-page thread navigation
- Enhanced logging and error reporting
- Improved skip thread functionality
- Added warning for no threads found

### Version 5.0
- Complete rewrite with enhanced features
- Multi-forum support
- AI-powered responses
- Human-in-the-loop review system
- Comprehensive logging and debugging

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built for WordPress.org support forum moderators
- Powered by OpenAI's GPT models
- Enhanced through community feedback and testing

## Bugs

For bugs, questions, or feature requests:
- Create an issue on GitHub
- Include detailed information about your setup
- Provide console logs if experiencing issues

---

**Note**: This script is designed for legitimate forum moderation purposes. Please use responsibly and in accordance with forum guidelines and terms of service.
