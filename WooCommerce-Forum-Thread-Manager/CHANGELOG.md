# Changelog

All notable changes to the WooCommerce Forum Thread Manager project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.3] - 2024-12-19

### Fixed
- **MailPoet Forum Detection**: Fixed critical issue where MailPoet forum was not being detected due to forum loading logic
- **Forum Loading**: Enhanced `loadSettings` function to ensure all default forums are always available, even if user had saved settings from before new forums were added
- **Settings Merging**: Improved forum settings merging to preserve user preferences while ensuring new default forums are included

### Technical
- **Forum Detection Logic**: Completely rewrote forum loading to merge saved settings with default forums instead of replacing them
- **Backward Compatibility**: Ensured users with old saved settings automatically get new forums without losing their customizations

## [5.2] - 2024-12-19

### Added
- **MailPoet Support**: Added full support for MailPoet forum (`https://wordpress.org/support/plugin/mailpoet/`)
- **GPT-4o Integration**: Updated default AI model to GPT-4o for better quality responses
- **Frustration Detection**: Added intelligent detection of user frustration to prevent inappropriate thread closures
- **Automatic Resolution**: Added capability to automatically close simple cases without human review
- **Accessibility Timer Control**: Added option to disable countdown timer for accessibility
- **Enhanced Button Design**: Improved button styling with icons and better mobile/laptop compatibility

### Changed
- **Default AI Model**: Changed from GPT-3.5-turbo to GPT-4o for better quality
- **Model Options**: Removed GPT-3.5 Turbo from available options, kept GPT-4o Mini for cost-effective usage
- **Timer Settings**: Simplified timer setting text for better clarity
- **Script Name**: Changed to "WooCommerce Forum Thread Manager" for better branding
- **Author Attribution**: Added chrism245 as script author

### Enhanced
- **Thread Analysis**: Improved analysis logic with detailed reasoning for manual review decisions
- **UI/UX**: Better button design with icons and improved responsive layout
- **Error Messages**: Updated generic error messages to be forum-agnostic instead of WooCommerce-specific

## [5.1] - 2024-12-19

### Fixed
- **Multi-Page Thread Navigation**: Fixed issue where script wasn't analyzing the latest page of multi-page threads
- **Skip Thread Functionality**: Fixed skip thread to properly navigate to next thread or return to main page when queue is empty
- **Resolved Thread Handling**: Added logic to detect already resolved threads after manual editing and offer skip/cancel options

### Added
- **No Threads Warning**: Added user-friendly warning when no threads are found within date range
- **Enhanced Logging**: Added detailed logging for AI message generation and manual review reasons
- **Cross-Page State Management**: Improved state persistence across page navigations

### Changed
- **Warning Messages**: Improved wording of "no threads found" warning messages
- **Logging Enhancement**: Added configuration details to exported logs

## [5.0] - 2024-12-19

### Added
- **Multi-Forum Support**: Complete rewrite to support 20+ WordPress.org support forums
- **AI-Powered Responses**: Integration with OpenAI GPT models for generating closing messages
- **Human Review System**: Optional human-in-the-loop review before closing threads
- **Queue Management**: Advanced queue system for processing multiple threads
- **Comprehensive Logging**: Detailed logging system with export capabilities
- **Rate Limiting**: Built-in rate limiting for OpenAI API calls
- **Settings Panel**: Full-featured settings panel with forum management
- **Test Mode**: Testing mode for safe experimentation

### Enhanced
- **Thread Analysis**: Smart analysis to determine if threads are safe to close
- **Error Handling**: Robust error detection and reporting
- **Cross-Page Navigation**: Maintains script state across page navigations
- **Accessibility**: Configurable timer settings and improved UI

### Technical
- **Complete Rewrite**: Entire script rewritten from scratch with modern JavaScript
- **Modular Architecture**: Better code organization and maintainability
- **Storage Management**: Improved GM storage handling for settings and logs

## [4.0] - 2024-12-19

### Added
- **Human Review System**: Added manual review step before closing threads
- **Rate Limiting**: Implemented rate limiting for API calls
- **Enhanced Logging**: Improved logging system with storage capabilities

### Fixed
- **Queue Management**: Fixed various queue-related issues
- **Navigation**: Improved page navigation and state management
- **Progress Tracking**: Enhanced progress tracking across pages

## [3.5] - 2024-12-19

### Added
- **Enhanced Debugging**: Improved debugging capabilities
- **Queue Validation**: Added queue validation and error handling
- **Simplified Queue**: Streamlined queue management system

### Fixed
- **Queue Issues**: Fixed various queue processing problems
- **Execution Control**: Improved script execution control

## [3.3] - 2024-12-19

### Added
- **Beta Features**: Initial beta release with core functionality
- **Basic Thread Processing**: Fundamental thread analysis and closing capabilities

---

## Version History Summary

- **v5.3**: Fixed MailPoet forum detection and forum loading issues
- **v5.2**: Added MailPoet support, GPT-4o integration, frustration detection
- **v5.1**: Fixed multi-page threads, skip functionality, resolved thread handling
- **v5.0**: Complete rewrite with multi-forum support and AI integration
- **v4.0**: Added human review system and rate limiting
- **v3.5**: Enhanced debugging and queue management
- **v3.3**: Initial beta release

## Future Plans

- **GPT-5 Integration**: Support for GPT-5 when available
- **Additional Forums**: Support for more WordPress.org forums
- **Advanced Analytics**: Enhanced analytics and reporting features
- **Community Features**: User community and sharing capabilities
