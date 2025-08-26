// ==UserScript==
// @name         WooCommerce Forum Thread Manager
// @namespace    http://tampermonkey.net/
// @version      5.3
// @author       chrism245
// @description  Enhanced WooCommerce thread management with human-in-the-loop review, OpenAI-powered responses, and smart analysis
// @match        https://wordpress.org/support/plugin/woocommerce/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-google-analytics-integration/unresolved*
// @match        https://wordpress.org/support/plugin/woo-gutenberg-products-block/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-admin/unresolved*
// @match        https://wordpress.org/support/plugin/pinterest-for-woocommerce/unresolved*
// @match        https://wordpress.org/support/plugin/action-scheduler/unresolved*
// @match        https://wordpress.org/support/theme/storefront/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-payments/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-gateway-stripe/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-gateway-eway/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-gateway-paypal-express-checkout/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-paypal-here-gateway/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-payfast-gateway/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-square/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-services/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-shipstation-integration/unresolved*
// @match        https://wordpress.org/support/plugin/google-listings-and-ads/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-gateway-paypal-powered-by-braintree/unresolved*
// @match        https://wordpress.org/support/plugin/woocommerce-shipping/unresolved*
// @match        https://wordpress.org/support/plugin/mailpoet/unresolved*
// @match        https://wordpress.org/support/topic/*
// @grant        GM.openInTab
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function() {
    'use strict';
    
    // Basic script loading confirmation
    console.log('=== WOOCOMMERCE FORUM THREAD MANAGER SCRIPT LOADED ===');
    console.log('Script version: 5.2');
    console.log('Current URL:', window.location.href);

    // Global logging system
    const Logger = {
        logs: [],
        
        // Add a log entry
        log: function(level, message, data = null) {
            if (!CONFIG.debugMode) return;
            
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp: timestamp,
                level: level,
                message: message,
                data: data,
                url: window.location.href,
                pageType: this.getPageType(),
                userAgent: navigator.userAgent,
                sessionId: this.getSessionId()
            };
            
            // Add to memory
            this.logs.push(logEntry);
            
            // Keep only the last maxLogEntries
            if (this.logs.length > CONFIG.maxLogEntries) {
                this.logs = this.logs.slice(-CONFIG.maxLogEntries);
            }
            
            // Console output based on log level
            const consoleMethod = level === 'ERROR' ? 'error' : 
                                 level === 'WARN' ? 'warn' : 
                                 level === 'INFO' ? 'info' : 'log';
            
            console[consoleMethod](`[${level}] ${message}`, data || '');
            
            // Store in GM storage if enabled
            if (CONFIG.logToStorage) {
                this.saveLogsToStorage();
            }
        },
        
        // Get current page type for context
        getPageType: function() {
            const url = window.location.href;
            console.log('getPageType - Current URL:', url);
            
            if (url.includes('/unresolved/')) {
                console.log('getPageType - Detected: unresolved-list');
                return 'unresolved-list';
            } else if (url.includes('/support/topic/') || url.includes('/topic/') || document.querySelector('.bbp-topic-title, .bbp-reply-content, .bbp-topic-content')) {
                console.log('getPageType - Detected: thread-page');
                return 'thread-page';
            } else {
                console.log('getPageType - Detected: other');
                return 'other';
            }
        },
        
        // Generate or get session ID for tracking across pages
        getSessionId: function() {
            let sessionId = sessionStorage.getItem('woocommerce_script_session');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('woocommerce_script_session', sessionId);
            }
            return sessionId;
        },
        
        // Convenience methods
        debug: function(message, data) { this.log('DEBUG', message, data); },
        info: function(message, data) { this.log('INFO', message, data); },
        warn: function(message, data) { this.log('WARN', message, data); },
        error: function(message, data) { this.log('ERROR', message, data); },
        
        // Save logs to storage
        saveLogsToStorage: async function() {
            try {
                await GM.setValue('scriptLogs', JSON.stringify(this.logs));
            } catch (error) {
                console.error('Failed to save logs to storage:', error);
            }
        },
        
        // Load logs from storage
        loadLogsFromStorage: async function() {
            try {
                const storedLogs = await GM.getValue('scriptLogs', '[]');
                this.logs = JSON.parse(storedLogs);
            } catch (error) {
                console.error('Failed to load logs from storage:', error);
                this.logs = [];
            }
        },
        
            // Export logs as text
    exportLogs: function() {
        let exportText = '=== WOOCOMMERCE THREAD SCRIPT DEBUG LOGS ===\n';
        exportText += `Generated: ${new Date().toISOString()}\n`;
        exportText += `Current URL: ${window.location.href}\n`;
        exportText += `User Agent: ${navigator.userAgent}\n`;
        exportText += `Total Log Entries: ${this.logs.length}\n`;
        exportText += `OpenAI API Key: ${CONFIG.openaiApiKey && CONFIG.openaiApiKey !== 'YOUR_OPENAI_API_KEY_HERE' ? 'Configured' : 'Not configured'}\n`;
        exportText += `OpenAI Model: ${CONFIG.openaiModel}\n`;
        exportText += `Test Mode: ${CONFIG.testMode}\n`;
        exportText += `Debug Mode: ${CONFIG.debugMode}\n\n`;
            
            // Group logs by session and page
            const sessionGroups = {};
            this.logs.forEach(entry => {
                if (!sessionGroups[entry.sessionId]) {
                    sessionGroups[entry.sessionId] = [];
                }
                sessionGroups[entry.sessionId].push(entry);
            });
            
            Object.keys(sessionGroups).forEach(sessionId => {
                exportText += `=== SESSION: ${sessionId} ===\n`;
                
                // Group by page type
                const pageGroups = {};
                sessionGroups[sessionId].forEach(entry => {
                    if (!pageGroups[entry.pageType]) {
                        pageGroups[entry.pageType] = [];
                    }
                    pageGroups[entry.pageType].push(entry);
                });
                
                Object.keys(pageGroups).forEach(pageType => {
                    exportText += `\n--- PAGE TYPE: ${pageType.toUpperCase()} ---\n`;
                    pageGroups[pageType].forEach(entry => {
                        exportText += `[${entry.timestamp}] [${entry.level}] ${entry.message}\n`;
                        exportText += `  URL: ${entry.url}\n`;
                        if (entry.data) {
                            exportText += `  Data: ${JSON.stringify(entry.data, null, 2)}\n`;
                        }
                        exportText += '\n';
                    });
                });
                
                exportText += '\n';
            });
            
            return exportText;
        },
        
        // Clear logs
        clearLogs: function() {
            this.logs = [];
            if (CONFIG.logToStorage) {
                this.saveLogsToStorage();
            }
        }
    };

    // Configuration object
    const CONFIG = {
        // Date range settings (in weeks)
        minWeeks: 1,
        maxWeeks: 8,
        
        // Forum configuration - default WooCommerce forums
        forums: [
            {
                name: 'WooCommerce',
                slug: 'woocommerce',
                url: 'https://wordpress.org/support/plugin/woocommerce/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Google Analytics Integration',
                slug: 'woocommerce-google-analytics-integration',
                url: 'https://wordpress.org/support/plugin/woocommerce-google-analytics-integration/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-google-analytics-integration/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Gutenberg Products Block',
                slug: 'woo-gutenberg-products-block',
                url: 'https://wordpress.org/support/plugin/woo-gutenberg-products-block/',
                reviewUrl: 'https://wordpress.org/support/plugin/woo-gutenberg-products-block/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Admin',
                slug: 'woocommerce-admin',
                url: 'https://wordpress.org/support/plugin/woocommerce-admin/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-admin/reviews/',
                enabled: true
            },
            {
                name: 'Pinterest for WooCommerce',
                slug: 'pinterest-for-woocommerce',
                url: 'https://wordpress.org/support/plugin/pinterest-for-woocommerce/',
                reviewUrl: 'https://wordpress.org/support/plugin/pinterest-for-woocommerce/reviews/',
                enabled: true
            },
            {
                name: 'Action Scheduler',
                slug: 'action-scheduler',
                url: 'https://wordpress.org/support/plugin/action-scheduler/',
                reviewUrl: 'https://wordpress.org/support/plugin/action-scheduler/reviews/',
                enabled: true
            },
            {
                name: 'Storefront Theme',
                slug: 'storefront',
                url: 'https://wordpress.org/support/theme/storefront/',
                reviewUrl: 'https://wordpress.org/support/theme/storefront/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Payments',
                slug: 'woocommerce-payments',
                url: 'https://wordpress.org/support/plugin/woocommerce-payments/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-payments/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Stripe Gateway',
                slug: 'woocommerce-gateway-stripe',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-stripe/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-stripe/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce eWAY Gateway',
                slug: 'woocommerce-gateway-eway',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-eway/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-eway/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayPal Express Checkout',
                slug: 'woocommerce-gateway-paypal-express-checkout',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-express-checkout/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-express-checkout/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayPal Here Gateway',
                slug: 'woocommerce-paypal-here-gateway',
                url: 'https://wordpress.org/support/plugin/woocommerce-paypal-here-gateway/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-paypal-here-gateway/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayFast Gateway',
                slug: 'woocommerce-payfast-gateway',
                url: 'https://wordpress.org/support/plugin/woocommerce-payfast-gateway/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-payfast-gateway/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Square',
                slug: 'woocommerce-square',
                url: 'https://wordpress.org/support/plugin/woocommerce-square/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-square/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Services',
                slug: 'woocommerce-services',
                url: 'https://wordpress.org/support/plugin/woocommerce-services/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-services/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce ShipStation Integration',
                slug: 'woocommerce-shipstation-integration',
                url: 'https://wordpress.org/support/plugin/woocommerce-shipstation-integration/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-shipstation-integration/reviews/',
                enabled: true
            },
            {
                name: 'Google Listings and Ads',
                slug: 'google-listings-and-ads',
                url: 'https://wordpress.org/support/plugin/google-listings-and-ads/',
                reviewUrl: 'https://wordpress.org/support/plugin/google-listings-and-ads/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayPal Powered by Braintree',
                slug: 'woocommerce-gateway-paypal-powered-by-braintree',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-powered-by-braintree/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-powered-by-braintree/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Shipping',
                slug: 'woocommerce-shipping',
                url: 'https://wordpress.org/support/plugin/woocommerce-shipping/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-shipping/reviews/',
                enabled: true
            },
            {
                name: 'MailPoet - Newsletters, Email Marketing, and Automation',
                slug: 'mailpoet',
                url: 'https://wordpress.org/support/plugin/mailpoet/',
                reviewUrl: 'https://wordpress.org/support/plugin/mailpoet/reviews/',
                enabled: true
            }
        ],
        
        // Debug and logging settings
        debugMode: true, // Set to false to disable debug logging
        logToStorage: true, // Store logs in GM storage for retrieval
        maxLogEntries: 1000, // Maximum number of log entries to keep
        logLevel: 'INFO', // DEBUG, INFO, WARN, ERROR
        
        // Example closing messages for AI reference (not used directly)
        exampleClosingMessages: [
            "Since we haven't received any updates from you, I'll mark this as resolved for now. If you need further assistance, you're welcome to start a new thread.",
            "It seems we haven't heard back from you for a while, so I'll go ahead and mark this thread as resolved. Feel free to reach out whenever you're ready to continue.",
            "Since there's been no recent activity on this thread, I'm marking it as resolved. Don't hesitate to start a new thread if you need help in the future.",
            "We haven't heard back from you in a while, so I'm going to mark this as resolved – we'll be here if and/or when you are ready to continue.",
            "I'm going to mark this as resolved, as we haven't heard back from you in a while. Please open a new thread if you need further assistance."
        ],
        
        // OpenAI API settings
        openaiApiKey: 'YOUR_OPENAI_API_KEY_HERE', // Replace with your OpenAI API key
        openaiEndpoint: 'https://api.openai.com/v1/chat/completions',
        openaiModel: 'gpt-4o', // Best quality model currently available
        
        // Thread analysis keywords
        userQuestionKeywords: ['help', 'issue', 'problem', 'error', 'not working', 'broken', 'fix', 'support', 'question', 'how', 'what', 'why', 'please', 'urgent', 'critical'],
        resolutionKeywords: ['thanks', 'thank you', 'worked', 'solved', 'resolved', 'fixed', 'great', 'perfect', 'awesome', 'excellent', 'working now', 'all good', 'sorted'],
        frustrationKeywords: ['frustrated', 'frustrating', 'annoying', 'ridiculous', 'useless', 'waste of time', 'terrible', 'awful', 'horrible', 'disappointed', 'angry', 'mad', 'fed up', 'tired of', 'sick of'],
        
        // Test mode settings
        testMode: false,
        
        // Human review settings
        enableHumanReview: true, // Set to false to disable human review
        reviewTimeout: 30000, // 30 seconds timeout for human review
        autoContinueAfterTimeout: true, // Continue automatically if no response within timeout
        enableReviewTimer: true, // Set to false to disable the countdown timer for accessibility
        
        // Rate limiting settings for OpenAI API
        rateLimitDelay: 1000, // 1 second between AI requests (OpenAI allows 3,500 RPM)
        maxRequestsPerMinute: 60, // Conservative limit for OpenAI
        maxRequestsPerDay: 1000, // Conservative daily limit
        enableRateLimiting: true // Set to false to disable rate limiting
    };

    // Settings panel
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 380px;
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 12px;
            padding: 0;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: none;
            overflow: hidden;
        `;

        panel.innerHTML = `
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7f54b3 0%, #9b6dff 100%); color: white; padding: 16px; text-align: center;">
                <h2 style="margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.3px;">Reviewer Thread Manager</h2>
                <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.9;">Review and resolve support threads faster</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 16px; max-height: 70vh; overflow-y: auto;">
                
                <!-- Date Range Section -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Date Range</h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #646970; font-weight: 500;">Minimum Weeks</label>
                            <input type="number" id="min-weeks" value="${CONFIG.minWeeks}" min="1" max="52" style="width: 100%; padding: 8px; border: 1px solid #dcdcde; border-radius: 6px; font-size: 12px; box-sizing: border-box;">
                        </div>
                        <span style="color: #646970; font-weight: 500; font-size: 11px;">to</span>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #646970; font-weight: 500;">Maximum Weeks</label>
                            <input type="number" id="max-weeks" value="${CONFIG.maxWeeks}" min="1" max="52" style="width: 100%; padding: 8px; border: 1px solid #dcdcde; border-radius: 6px; font-size: 12px; box-sizing: border-box;">
                        </div>
                    </div>
                </div>
                
                <!-- OpenAI Configuration -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">AI Configuration</h3>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #646970; font-weight: 500;">OpenAI API Key</label>
                        <input type="password" id="openai-api-key" value="${CONFIG.openaiApiKey}" placeholder="Enter your OpenAI API key" style="width: 100%; padding: 8px; border: 1px solid #dcdcde; border-radius: 6px; font-size: 12px; box-sizing: border-box;">
                        <button id="test-api" style="margin-top: 6px; padding: 6px 12px; background: #00a32a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Test Connection</button>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #646970; font-weight: 500;">AI Model</label>
                        <select id="openai-model" style="width: 100%; padding: 8px; border: 1px solid #dcdcde; border-radius: 6px; font-size: 12px; box-sizing: border-box; background: white;">
                            <option value="gpt-4o" ${CONFIG.openaiModel === 'gpt-4o' ? 'selected' : ''}>GPT-4o (Best Quality)</option>
                            <option value="gpt-4o-mini" ${CONFIG.openaiModel === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o Mini (Fast & Cost-effective)</option>
                            <option value="gpt-4-turbo" ${CONFIG.openaiModel === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo (Legacy)</option>
                            <option value="gpt-4" ${CONFIG.openaiModel === 'gpt-4' ? 'selected' : ''}>GPT-4 (Legacy)</option>
                            <option value="gpt-5" ${CONFIG.openaiModel === 'gpt-5' ? 'selected' : ''}>GPT-5 (Future - When Available)</option>
                        </select>
                    </div>
                </div>
                
                <!-- Test Mode -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Test Mode</h3>
                    
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="test-mode" ${CONFIG.testMode ? 'checked' : ''} style="margin: 0; transform: scale(1.1);">
                        <label for="test-mode" style="margin-left: 8px; font-size: 11px; color: #1d2327;">Enable test mode for manual thread testing</label>
                    </div>
                    
                    <div id="test-url-section" style="display: ${CONFIG.testMode ? 'block' : 'none'};">
                        <input type="url" id="test-thread-url" placeholder="Enter thread URL to test" style="width: 100%; padding: 8px; border: 1px solid #dcdcde; border-radius: 6px; font-size: 12px; box-sizing: border-box; margin-bottom: 6px;">
                        <button id="test-thread" style="padding: 6px 12px; background: #dba617; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Test Thread</button>
                    </div>
                </div>
                
                <!-- Accessibility Settings -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Accessibility & Automation</h3>
                    
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="enable-review-timer" ${CONFIG.enableReviewTimer ? 'checked' : ''} style="margin: 0; transform: scale(1.1);">
                        <label for="enable-review-timer" style="margin-left: 8px; font-size: 11px; color: #1d2327;">Show countdown timer during review</label>
                    </div>
                    
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="enable-human-review" ${CONFIG.enableHumanReview ? 'checked' : ''} style="margin: 0; transform: scale(1.1);">
                        <label for="enable-human-review" style="margin-left: 8px; font-size: 11px; color: #1d2327;">Enable human review (disable for fully automatic operation)</label>
                    </div>
                </div>
                
                <!-- Forum Management -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Forum Management</h3>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; color: #646970; font-weight: 500;">Active Forums</label>
                        <div id="forum-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #dcdcde; border-radius: 6px; background: white;">
                            ${CONFIG.forums.map(forum => `
                                <div style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #f0f0f1;">
                                    <input type="checkbox" id="forum-${forum.slug}" ${forum.enabled ? 'checked' : ''} style="margin: 0; transform: scale(1.0);">
                                    <label for="forum-${forum.slug}" style="flex: 1; margin-left: 8px; font-size: 11px; color: #1d2327; cursor: pointer;">${forum.name}</label>
                                    <button class="edit-forum-btn" data-slug="${forum.slug}" style="padding: 4px 8px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; font-weight: 500;">Edit</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button id="add-forum" style="padding: 6px 12px; background: #00a32a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Add Forum</button>
                        <button id="import-forums" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Import</button>
                        <button id="reset-forums" style="padding: 6px 12px; background: #dba617; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Reset Default</button>
                        <button id="export-forums" style="padding: 6px 12px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Export</button>
                    </div>
                </div>
                
                <!-- Debug & Logging -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Debug & Logging</h3>
                    
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <input type="checkbox" id="debug-mode" ${CONFIG.debugMode ? 'checked' : ''} style="margin: 0; transform: scale(1.1);">
                            <label for="debug-mode" style="margin-left: 8px; font-size: 11px; color: #1d2327;">Enable detailed logging</label>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #646970; font-weight: 500;">Log Level</label>
                            <select id="log-level" style="width: 100%; padding: 8px; border: 1px solid #dcdcde; border-radius: 6px; font-size: 12px; box-sizing: border-box; background: white;">
                                <option value="DEBUG" ${CONFIG.logLevel === 'DEBUG' ? 'selected' : ''}>DEBUG - All messages</option>
                                <option value="INFO" ${CONFIG.logLevel === 'INFO' ? 'selected' : ''}>INFO - Info and above</option>
                                <option value="WARN" ${CONFIG.logLevel === 'WARN' ? 'selected' : ''}>WARN - Warnings and errors</option>
                                <option value="ERROR" ${CONFIG.logLevel === 'ERROR' ? 'selected' : ''}>ERROR - Errors only</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button id="view-logs" style="padding: 6px 12px; background: #00a32a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">View Logs</button>
                        <button id="export-logs" style="padding: 6px 12px; background: #dba617; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Export Logs</button>
                        <button id="clear-logs" style="padding: 6px 12px; background: #d63638; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">Clear Logs</button>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="padding: 12px 16px; background: #f6f7f7; border-top: 1px solid #dcdcde; display: flex; gap: 8px;">
                <button id="save-settings" style="flex: 1; padding: 10px; background: #7f54b3; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: background-color 0.2s;">Save Settings</button>
                <button id="close-settings" style="flex: 1; padding: 10px; background: #646970; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: background-color 0.2s;">Close</button>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

        // Load settings from storage
    async function loadSettings() {
        const settings = await GM.getValue('userSettings', {});
        CONFIG.minWeeks = settings.minWeeks || CONFIG.minWeeks;
        CONFIG.maxWeeks = settings.maxWeeks || CONFIG.maxWeeks;
        CONFIG.openaiApiKey = settings.openaiApiKey || CONFIG.openaiApiKey;
        CONFIG.openaiModel = settings.openaiModel || CONFIG.openaiModel;
        CONFIG.testMode = settings.testMode || CONFIG.testMode;
        CONFIG.debugMode = settings.debugMode !== undefined ? settings.debugMode : CONFIG.debugMode;
        CONFIG.logLevel = settings.logLevel || CONFIG.logLevel;
        CONFIG.enableReviewTimer = settings.enableReviewTimer !== undefined ? settings.enableReviewTimer : CONFIG.enableReviewTimer;
        CONFIG.enableHumanReview = settings.enableHumanReview !== undefined ? settings.enableHumanReview : CONFIG.enableHumanReview;
        
        // Load forum settings
        if (settings.forums && settings.forums.length > 0) {
            // Merge saved forums with default forums to ensure all defaults are available
            const savedForums = settings.forums;
            const defaultForums = [
                {
                    name: 'WooCommerce',
                    slug: 'woocommerce',
                    url: 'https://wordpress.org/support/plugin/woocommerce/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Google Analytics Integration',
                    slug: 'woocommerce-google-analytics-integration',
                    url: 'https://wordpress.org/support/plugin/woocommerce-google-analytics-integration/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-google-analytics-integration/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Gutenberg Products Block',
                    slug: 'woo-gutenberg-products-block',
                    url: 'https://wordpress.org/support/plugin/woo-gutenberg-products-block/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woo-gutenberg-products-block/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Admin',
                    slug: 'woocommerce-admin',
                    url: 'https://wordpress.org/support/plugin/woocommerce-admin/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-admin/reviews/',
                    enabled: true
                },
                {
                    name: 'Pinterest for WooCommerce',
                    slug: 'pinterest-for-woocommerce',
                    url: 'https://wordpress.org/support/plugin/pinterest-for-woocommerce/',
                    reviewUrl: 'https://wordpress.org/support/plugin/pinterest-for-woocommerce/reviews/',
                    enabled: true
                },
                {
                    name: 'Action Scheduler',
                    slug: 'action-scheduler',
                    url: 'https://wordpress.org/support/plugin/action-scheduler/',
                    reviewUrl: 'https://wordpress.org/support/plugin/action-scheduler/reviews/',
                    enabled: true
                },
                {
                    name: 'Storefront Theme',
                    slug: 'storefront',
                    url: 'https://wordpress.org/support/theme/storefront/',
                    reviewUrl: 'https://wordpress.org/support/theme/storefront/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Payments',
                    slug: 'woocommerce-payments',
                    url: 'https://wordpress.org/support/plugin/woocommerce-payments/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-payments/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Stripe Gateway',
                    slug: 'woocommerce-gateway-stripe',
                    url: 'https://wordpress.org/support/plugin/woocommerce-gateway-stripe/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-stripe/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce eWAY Gateway',
                    slug: 'woocommerce-gateway-eway',
                    url: 'https://wordpress.org/support/plugin/woocommerce-gateway-eway/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-eway/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce PayPal Express Checkout',
                    slug: 'woocommerce-gateway-paypal-express-checkout',
                    url: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-express-checkout/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-express-checkout/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce PayPal Here Gateway',
                    slug: 'woocommerce-paypal-here-gateway',
                    url: 'https://wordpress.org/support/plugin/woocommerce-paypal-here-gateway/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-paypal-here-gateway/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce PayFast Gateway',
                    slug: 'woocommerce-payfast-gateway',
                    url: 'https://wordpress.org/support/plugin/woocommerce-payfast-gateway/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-payfast-gateway/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Square',
                    slug: 'woocommerce-square',
                    url: 'https://wordpress.org/support/plugin/woocommerce-square/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-square/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Services',
                    slug: 'woocommerce-services',
                    url: 'https://wordpress.org/support/plugin/woocommerce-services/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-services/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce ShipStation Integration',
                    slug: 'woocommerce-shipstation-integration',
                    url: 'https://wordpress.org/support/plugin/woocommerce-shipstation-integration/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-shipstation-integration/reviews/',
                    enabled: true
                },
                {
                    name: 'Google Listings and Ads',
                    slug: 'google-listings-and-ads',
                    url: 'https://wordpress.org/support/plugin/google-listings-and-ads/',
                    reviewUrl: 'https://wordpress.org/support/plugin/google-listings-and-ads/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce PayPal Powered by Braintree',
                    slug: 'woocommerce-gateway-paypal-powered-by-braintree',
                    url: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-powered-by-braintree/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-powered-by-braintree/reviews/',
                    enabled: true
                },
                {
                    name: 'WooCommerce Shipping',
                    slug: 'woocommerce-shipping',
                    url: 'https://wordpress.org/support/plugin/woocommerce-shipping/',
                    reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-shipping/reviews/',
                    enabled: true
                },
                {
                    name: 'MailPoet - Newsletters, Email Marketing, and Automation',
                    slug: 'mailpoet',
                    url: 'https://wordpress.org/support/plugin/mailpoet/',
                    reviewUrl: 'https://wordpress.org/support/plugin/mailpoet/reviews/',
                    enabled: true
                }
            ];
            
            // Create a map of saved forums by slug for quick lookup
            const savedForumsMap = new Map(savedForums.map(forum => [forum.slug, forum]));
            
            // Merge default forums with saved forums, preserving saved settings
            const mergedForums = defaultForums.map(defaultForum => {
                const savedForum = savedForumsMap.get(defaultForum.slug);
                if (savedForum) {
                    // Use saved forum settings but ensure all required properties exist
                    return {
                        ...defaultForum,
                        ...savedForum,
                        enabled: savedForum.enabled !== undefined ? savedForum.enabled : defaultForum.enabled
                    };
                } else {
                    // Add new default forum that wasn't in saved settings
                    console.log('Adding new default forum:', defaultForum.name);
                    return defaultForum;
                }
            });
            
            // Add any custom forums that aren't in the defaults
            const defaultSlugs = new Set(defaultForums.map(f => f.slug));
            const customForums = savedForums.filter(forum => !defaultSlugs.has(forum.slug));
            
            CONFIG.forums = [...mergedForums, ...customForums];
            console.log('Merged forums:', CONFIG.forums.length, 'total (', mergedForums.length, 'defaults +', customForums.length, 'custom)');
        } else {
            // If no saved forums, ensure we have the default forums
            console.log('No saved forums found, using default forums');
            console.log('Default forums:', CONFIG.forums);
        }
        
        // Load logs from storage
        await Logger.loadLogsFromStorage();
        
        // Log that settings were loaded
        Logger.info('Settings loaded', { 
            debugMode: CONFIG.debugMode, 
            logLevel: CONFIG.logLevel,
            testMode: CONFIG.testMode,
            forumsCount: CONFIG.forums.length,
            enabledForums: CONFIG.forums.filter(f => f.enabled).length
        });
    }

    // Save settings to storage
    async function saveSettings() {
        // Save forum settings
        const updatedForums = CONFIG.forums.map(forum => ({
            ...forum,
            enabled: document.getElementById(`forum-${forum.slug}`).checked
        }));
        
        const settings = {
            minWeeks: parseInt(document.getElementById('min-weeks').value),
            maxWeeks: parseInt(document.getElementById('max-weeks').value),
            openaiApiKey: document.getElementById('openai-api-key').value,
            openaiModel: document.getElementById('openai-model').value,
            testMode: document.getElementById('test-mode').checked,
            debugMode: document.getElementById('debug-mode').checked,
            logLevel: document.getElementById('log-level').value,
            enableReviewTimer: document.getElementById('enable-review-timer').checked,
            enableHumanReview: document.getElementById('enable-human-review').checked,
            forums: updatedForums
        };
        
        await GM.setValue('userSettings', settings);
        
        // Update CONFIG
        Object.assign(CONFIG, settings);
        
        // Hide settings panel
        document.getElementById('settings-panel').style.display = 'none';
        
        Logger.info('Settings saved', {
            forumsCount: CONFIG.forums.length,
            enabledForums: CONFIG.forums.filter(f => f.enabled).length
        });
    }

    // Forum management functions
    function addForum() {
        const name = prompt('Enter forum name:');
        if (!name) return;
        
        const slug = prompt('Enter forum slug (e.g., "my-plugin"):');
        if (!slug) return;
        
        const url = prompt('Enter forum URL:');
        if (!url) return;
        
        const reviewUrl = prompt('Enter review URL:');
        if (!reviewUrl) return;
        
        const newForum = {
            name: name,
            slug: slug,
            url: url,
            reviewUrl: reviewUrl,
            enabled: true
        };
        
        CONFIG.forums.push(newForum);
        updateForumList();
        
        Logger.info('Forum added', { forum: newForum });
    }

    function editForum(slug) {
        const forum = CONFIG.forums.find(f => f.slug === slug);
        if (!forum) return;
        
        const name = prompt('Enter forum name:', forum.name);
        if (!name) return;
        
        const newSlug = prompt('Enter forum slug:', forum.slug);
        if (!newSlug) return;
        
        const url = prompt('Enter forum URL:', forum.url);
        if (!url) return;
        
        const reviewUrl = prompt('Enter review URL:', forum.reviewUrl);
        if (!reviewUrl) return;
        
        // Update forum
        forum.name = name;
        forum.slug = newSlug;
        forum.url = url;
        forum.reviewUrl = reviewUrl;
        
        updateForumList();
        
        Logger.info('Forum edited', { forum: forum });
    }

    function resetForums() {
        if (!confirm('Reset all forums to default configuration? This will remove any custom forums you\'ve added.')) {
            return;
        }
        
        // Reset to default forums
        CONFIG.forums = [
            {
                name: 'WooCommerce',
                slug: 'woocommerce',
                url: 'https://wordpress.org/support/plugin/woocommerce/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Google Analytics Integration',
                slug: 'woocommerce-google-analytics-integration',
                url: 'https://wordpress.org/support/plugin/woocommerce-google-analytics-integration/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-google-analytics-integration/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Gutenberg Products Block',
                slug: 'woo-gutenberg-products-block',
                url: 'https://wordpress.org/support/plugin/woo-gutenberg-products-block/',
                reviewUrl: 'https://wordpress.org/support/plugin/woo-gutenberg-products-block/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Admin',
                slug: 'woocommerce-admin',
                url: 'https://wordpress.org/support/plugin/woocommerce-admin/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-admin/reviews/',
                enabled: true
            },
            {
                name: 'Pinterest for WooCommerce',
                slug: 'pinterest-for-woocommerce',
                url: 'https://wordpress.org/support/plugin/pinterest-for-woocommerce/',
                reviewUrl: 'https://wordpress.org/support/plugin/pinterest-for-woocommerce/reviews/',
                enabled: true
            },
            {
                name: 'Action Scheduler',
                slug: 'action-scheduler',
                url: 'https://wordpress.org/support/plugin/action-scheduler/',
                reviewUrl: 'https://wordpress.org/support/plugin/action-scheduler/reviews/',
                enabled: true
            },
            {
                name: 'Storefront Theme',
                slug: 'storefront',
                url: 'https://wordpress.org/support/theme/storefront/',
                reviewUrl: 'https://wordpress.org/support/theme/storefront/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Payments',
                slug: 'woocommerce-payments',
                url: 'https://wordpress.org/support/plugin/woocommerce-payments/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-payments/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Stripe Gateway',
                slug: 'woocommerce-gateway-stripe',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-stripe/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-stripe/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce eWAY Gateway',
                slug: 'woocommerce-gateway-eway',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-eway/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-eway/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayPal Express Checkout',
                slug: 'woocommerce-gateway-paypal-express-checkout',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-express-checkout/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-express-checkout/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayPal Here Gateway',
                slug: 'woocommerce-paypal-here-gateway',
                url: 'https://wordpress.org/support/plugin/woocommerce-paypal-here-gateway/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-paypal-here-gateway/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayFast Gateway',
                slug: 'woocommerce-payfast-gateway',
                url: 'https://wordpress.org/support/plugin/woocommerce-payfast-gateway/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-payfast-gateway/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Square',
                slug: 'woocommerce-square',
                url: 'https://wordpress.org/support/plugin/woocommerce-square/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-square/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Services',
                slug: 'woocommerce-services',
                url: 'https://wordpress.org/support/plugin/woocommerce-services/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-services/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce ShipStation Integration',
                slug: 'woocommerce-shipstation-integration',
                url: 'https://wordpress.org/support/plugin/woocommerce-shipstation-integration/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-shipstation-integration/reviews/',
                enabled: true
            },
            {
                name: 'Google Listings and Ads',
                slug: 'google-listings-and-ads',
                url: 'https://wordpress.org/support/plugin/google-listings-and-ads/',
                reviewUrl: 'https://wordpress.org/support/plugin/google-listings-and-ads/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce PayPal Powered by Braintree',
                slug: 'woocommerce-gateway-paypal-powered-by-braintree',
                url: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-powered-by-braintree/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-gateway-paypal-powered-by-braintree/reviews/',
                enabled: true
            },
            {
                name: 'WooCommerce Shipping',
                slug: 'woocommerce-shipping',
                url: 'https://wordpress.org/support/plugin/woocommerce-shipping/',
                reviewUrl: 'https://wordpress.org/support/plugin/woocommerce-shipping/reviews/',
                enabled: true
            },
            {
                name: 'MailPoet - Newsletters, Email Marketing, and Automation',
                slug: 'mailpoet',
                url: 'https://wordpress.org/support/plugin/mailpoet/',
                reviewUrl: 'https://wordpress.org/support/plugin/mailpoet/reviews/',
                enabled: true
            }
        ];
        
        updateForumList();
        
        Logger.info('Forums reset to default', { forumsCount: CONFIG.forums.length });
    }

    function exportForums() {
        const config = {
            forums: CONFIG.forums,
            exportDate: new Date().toISOString(),
            version: '5.0'
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'woocommerce-forums-config.json';
        link.click();
        
        Logger.info('Forum configuration exported');
    }

    function importForums() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    if (config.forums && Array.isArray(config.forums)) {
                        if (confirm(`Import ${config.forums.length} forums? This will replace your current forum configuration.`)) {
                            CONFIG.forums = config.forums;
                            updateForumList();
                            Logger.info('Forum configuration imported', { forumsCount: config.forums.length });
                            alert(`Successfully imported ${config.forums.length} forums!`);
                        }
                    } else {
                        alert('Invalid configuration file. Please select a valid forum configuration file.');
                    }
                } catch (error) {
                    console.error('Error parsing import file:', error);
                    alert('Error reading configuration file. Please make sure it\'s a valid JSON file.');
                }
            };
            
            reader.readAsText(file);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    // Make forum functions globally available
    window.addForum = addForum;
    window.editForum = editForum;
    window.resetForums = resetForums;
    window.exportForums = exportForums;
    window.importForums = importForums;
    window.skipCurrentThread = skipCurrentThread;

    function updateForumList() {
        const forumList = document.getElementById('forum-list');
        if (!forumList) return;
        
        forumList.innerHTML = CONFIG.forums.map(forum => `
            <div style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #f0f0f1;">
                <input type="checkbox" id="forum-${forum.slug}" ${forum.enabled ? 'checked' : ''} style="margin: 0; transform: scale(1.0);">
                <label for="forum-${forum.slug}" style="flex: 1; margin-left: 8px; font-size: 11px; color: #1d2327; cursor: pointer;">${forum.name}</label>
                <button class="edit-forum-btn" data-slug="${forum.slug}" style="padding: 4px 8px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; font-weight: 500;">Edit</button>
            </div>
        `).join('');
        
        // Re-add event listeners for edit buttons
        forumList.querySelectorAll('.edit-forum-btn').forEach(button => {
            button.addEventListener('click', function() {
                const slug = this.getAttribute('data-slug');
                editForum(slug);
            });
        });
    }

    // Google AI-powered response generation
    async function generateAIResponse(threadContent) {
        Logger.info('generateAIResponse called', {
            threadContentLength: threadContent.length,
            hasOpenAIKey: !!CONFIG.openaiApiKey,
            openAIModel: CONFIG.openaiModel
        });
        
        // Check rate limits before making API request
        const canProceed = await checkRateLimit();
        if (!canProceed) {
            Logger.warn('Rate limit reached - using fallback message', {
                rateLimitData: await GM.getValue('rateLimitData', {})
            });
            showRateLimitWarning();
            return getRandomClosingMessage();
        }
        
        // Create a simple hash of the thread content to help ensure uniqueness
        const contentHash = threadContent.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        Logger.info('Thread content hash for uniqueness:', { contentHash });
        
        if (!CONFIG.openaiApiKey || CONFIG.openaiApiKey === 'YOUR_OPENAI_API_KEY_HERE') {
            Logger.warn('No valid OpenAI API key provided, using fallback message', {
                hasKey: !!CONFIG.openaiApiKey,
                keyValue: CONFIG.openaiApiKey ? '***' + CONFIG.openaiApiKey.slice(-4) : 'none'
            });
            return getRandomClosingMessage();
        }

        try {
            Logger.info('Making OpenAI API request', {
                endpoint: CONFIG.openaiEndpoint,
                model: CONFIG.openaiModel,
                threadContentLength: threadContent.length,
                contentHash: contentHash
            });
            
            const response = await GM.xmlHttpRequest({
                method: 'POST',
                url: CONFIG.openaiEndpoint,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.openaiApiKey}`
                },
                data: JSON.stringify({
                    model: CONFIG.openaiModel,
                    messages: [{
                        role: 'system',
                        content: `You are a ${detectCurrentForum(window.location.href)?.name || 'WooCommerce'} support moderator. Create friendly, professional closing messages for INACTIVE support threads that haven\'t received recent updates. Focus on acknowledging the lack of recent activity, marking as resolved, and inviting future support. 

CRITICAL: Check the thread content for existing review requests. Look for:
- Any URLs containing "/reviews/" 
- Text mentioning "leave a review", "leave us a review", "review request"
- Previous review requests in the conversation

If you find ANY existing review requests, DO NOT include another review request. Only include a review request if none exist in the thread.`
                    }, {
                        role: 'user',
                        content: `Create a UNIQUE and PERSONALIZED closing message for this INACTIVE support thread. This is critical - each response must be different and tailored to the thread content.

IMPORTANT: Do NOT use generic responses. Each message must be unique and reference specific details from this thread.

Thread ID: ${contentHash}
Example closing message styles (for tone reference only - DO NOT copy these):
${CONFIG.exampleClosingMessages.map((msg, index) => `${index + 1}. "${msg}"`).join('\n')}

Thread content to analyze:
${threadContent}

Create a UNIQUE closing message for an INACTIVE thread that:
- Acknowledges that we haven't received recent updates from the user
- Explains that the thread is being marked as resolved due to inactivity
- References specific issues or details mentioned in this thread
- Uses different wording and structure from the examples
- Maintains professional, helpful tone
- Keeps it under 100 words
- Clearly indicates the thread is being marked as resolved
- Invites them to create a new thread if they need future assistance
- ONLY includes a review request if one doesn't already exist in the thread content
- Is completely different from any standard template

CRITICAL: Check the thread content for existing review requests. Look for:
- Any URLs containing "/reviews/" (like "https://wordpress.org/support/plugin/woocommerce/reviews/")
- Text mentioning "leave a review", "leave us a review", "review request", "reviews"
- Previous review requests in the conversation

If you find ANY existing review requests, DO NOT include another review request. Only include a review request if none exist in the thread.

Make this response unique to this specific thread by referencing actual content from the conversation.`
                    }],
                    max_tokens: 150,
                        temperature: 0.7,
                    system_message: `You are a ${detectCurrentForum(window.location.href)?.name || 'WooCommerce'} support moderator. Create friendly, professional closing messages for resolved support threads. Focus on acknowledging the resolution, thanking the user, and inviting future support. Avoid phrases like "Your understanding of this process is appreciated" as this is for resolved threads, not inactive ones.`
                })
            });

            // Check HTTP status first
            if (response.status !== 200) {
                Logger.error('OpenAI API HTTP error', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: response.responseText,
                    url: window.location.href
                });
                return getRandomClosingMessage();
            }

            const result = JSON.parse(response.responseText);
            
            // Log the full response for debugging
            Logger.info('OpenAI API response received', {
                hasChoices: !!result.choices,
                choicesLength: result.choices ? result.choices.length : 0,
                hasError: !!result.error,
                responseKeys: Object.keys(result)
            });
            
            // Check for API errors first
            if (result.error) {
                Logger.error('OpenAI API error', {
                    error: result.error,
                    errorMessage: result.error.message,
                    errorType: result.error.type,
                    errorCode: result.error.code
                });
                return getRandomClosingMessage();
            }
            
            // Extract the response text from OpenAI format
            let aiResponse = null;
            
            if (result.choices && result.choices.length > 0 && 
                result.choices[0].message && result.choices[0].message.content) {
                aiResponse = result.choices[0].message.content.trim();
                Logger.info('AI response extracted successfully', {
                    responseLength: aiResponse.length,
                    responsePreview: aiResponse.substring(0, 100) + '...'
                });
            } else {
                Logger.warn('Could not extract AI response from choices', {
                    hasChoices: !!result.choices,
                    choicesLength: result.choices ? result.choices.length : 0,
                    firstChoice: result.choices ? result.choices[0] : null,
                    hasMessage: result.choices && result.choices[0] ? !!result.choices[0].message : false,
                    hasContent: result.choices && result.choices[0] && result.choices[0].message ? !!result.choices[0].message.content : false
                });
            }
            
            if (aiResponse && aiResponse.trim().length > 0) {
                Logger.info('AI response is valid, returning', {
                    responseLength: aiResponse.length,
                    responsePreview: aiResponse.substring(0, 100) + '...'
                });
                return aiResponse;
            } else {
                Logger.error('AI response is empty or invalid', {
                    aiResponse: aiResponse,
                    responseLength: aiResponse ? aiResponse.length : 0,
                    resultKeys: Object.keys(result),
                    resultStructure: {
                        hasChoices: !!result.choices,
                        choicesLength: result.choices ? result.choices.length : 0,
                        hasError: !!result.error,
                        hasUsage: !!result.usage
                    }
                });
                return getRandomClosingMessage();
            }
        } catch (error) {
            Logger.error('OpenAI API request failed', {
                error: error.message,
                errorStack: error.stack,
                url: window.location.href,
                threadContentLength: threadContent.length
            });
            return getRandomClosingMessage();
        }
    }



    // Test OpenAI API connection
    async function testOpenAI() {
        console.log('Testing OpenAI API connection...');
        const apiKey = document.getElementById('openai-api-key').value.trim();
        const model = document.getElementById('openai-model').value;
        
        if (!apiKey) {
            alert('Please enter an OpenAI API key first');
            return false;
        }

        // Show loading state
        const testButton = document.getElementById('test-api');
        const originalText = testButton.textContent;
        testButton.textContent = 'Testing...';
        testButton.disabled = true;

        try {
            console.log('Making test API request to:', CONFIG.openaiEndpoint);
            const response = await GM.xmlHttpRequest({
                method: 'POST',
                url: CONFIG.openaiEndpoint,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                data: JSON.stringify({
                    model: model,
                    messages: [{
                        role: 'user',
                        content: "Say 'API test successful' in one word"
                    }],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });

            // Check HTTP status first
            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = JSON.parse(response.responseText);
            console.log('Test API response:', result);
            
            // Check for API errors
            if (result.error) {
                console.error('API Error in test:', result.error);
                throw new Error(`API Error: ${result.error.message || result.error.code || 'Unknown error'}`);
            }

            // Check for valid response structure
            if (!result.choices || !result.choices[0] || !result.choices[0].message || !result.choices[0].message.content) {
                throw new Error('Invalid response format from API');
            }

            const testResponse = result.choices[0].message.content.trim();
            
            if (testResponse) {
                alert(`✅ API Test Successful!\n\nResponse: "${testResponse}"\n\nYour OpenAI API key is working correctly with ${model}.`);
                return true;
            } else {
                throw new Error('Empty response from API');
            }

        } catch (error) {
            console.error('API Test Error:', error);
            
            let errorMessage = 'API Test Failed';
            
            if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = '❌ Invalid API Key\n\nPlease check your OpenAI API key and try again.';
            } else if (error.message.includes('429')) {
                errorMessage = '❌ Rate Limit Exceeded\n\nPlease wait a moment and try again.';
            } else if (error.message.includes('400')) {
                errorMessage = '❌ Bad Request\n\nThere was an issue with the API request.';
            } else if (error.message.includes('500')) {
                errorMessage = '❌ Server Error\n\nOpenAI service is temporarily unavailable.';
            } else {
                errorMessage = `❌ API Test Failed\n\nError: ${error.message}`;
            }
            
            alert(errorMessage);
            return false;
        } finally {
            // Restore button state
            testButton.textContent = originalText;
            testButton.disabled = false;
        }
    }

    // Test individual thread
    async function testIndividualThread() {
        const threadUrl = document.getElementById('test-thread-url').value.trim();
        
        if (!threadUrl) {
            alert('Please enter a thread URL to test');
            return;
        }

        if (!threadUrl.includes('wordpress.org/support/topic/')) {
            alert('Please enter a valid support thread URL');
            return;
        }

        // Show loading state
        const testButton = document.getElementById('test-thread');
        const originalText = testButton.textContent;
        testButton.textContent = 'Testing...';
        testButton.disabled = true;

        try {
            console.log('Opening thread URL:', threadUrl);
            // Open the thread in a new tab
            await GM.openInTab(threadUrl, false);
            console.log('Thread opened successfully');
            
            // Wait a moment for the page to load
            setTimeout(() => {
                // This will be handled by the main script when it detects a topic page
                alert('Thread opened in new tab. The analysis will run automatically if you have test mode enabled.');
            }, 1000);

        } catch (error) {
            console.error('Error opening thread:', error);
            alert(`Failed to open thread: ${error.message}`);
        } finally {
            // Restore button state
            testButton.textContent = originalText;
            testButton.disabled = false;
        }
    }

    // Extract review URL from plugin meta
    function getReviewUrl() {
        // Look for the plugin meta icon that contains the reviews link
        const reviewLink = document.querySelector('.plugin-meta-icon a[href*="/reviews/"]');
        
        if (reviewLink) {
            return reviewLink.href;
        }
        
        // Try to detect which forum we're on and get the appropriate review URL
        const currentUrl = window.location.href;
        const detectedForum = detectCurrentForum(currentUrl);
        
        if (detectedForum) {
            return detectedForum.reviewUrl;
        }
        
        // Fallback: try to construct the WooCommerce review URL
        if (currentUrl.includes('wordpress.org/support/plugin/woocommerce')) {
            return 'https://wordpress.org/support/plugin/woocommerce/reviews/';
        }
        
        // Default fallback
        return 'https://wordpress.org/support/plugin/woocommerce/reviews/';
    }

    // Detect which forum we're currently on
    function detectCurrentForum(url) {
        console.log('=== FORUM DETECTION DEBUG ===');
        console.log('Detecting forum for URL:', url);
        console.log('Available forums:', CONFIG.forums.map(f => ({ name: f.name, slug: f.slug, url: f.url })));
        
        // Check if we're on a thread page
        if (url.includes('/support/topic/')) {
            // Try to extract forum info from the page
            const breadcrumb = document.querySelector('.bbp-breadcrumb a[href*="/support/plugin/"], .bbp-breadcrumb a[href*="/support/theme/"]');
            if (breadcrumb) {
                const forumUrl = breadcrumb.href;
                console.log('Found breadcrumb forum URL:', forumUrl);
                const forum = CONFIG.forums.find(forum => forum.url === forumUrl);
                if (forum) {
                    console.log('Detected forum from breadcrumb:', forum.name);
                    return forum;
                }
            }
            
            // Fallback: try to match by URL pattern
            for (const forum of CONFIG.forums) {
                if (url.includes(forum.slug)) {
                    console.log('Detected forum from URL pattern:', forum.name);
                    return forum;
                }
            }
        }
        
        // Check if we're on an unresolved page
        for (const forum of CONFIG.forums) {
            console.log(`Checking forum: ${forum.name} (slug: ${forum.slug}, url: ${forum.url})`);
            console.log(`URL includes forum.url: ${url.includes(forum.url)}`);
            console.log(`URL includes forum.slug: ${url.includes(forum.slug)}`);
            if (url.includes(forum.url) || url.includes(forum.slug)) {
                console.log('Detected forum from unresolved page:', forum.name);
                return forum;
            }
        }
        
        console.log('No forum detected for URL:', url);
        console.log('Available forums:', CONFIG.forums.map(f => ({ name: f.name, slug: f.slug, url: f.url })));
        return null;
    }

    // Get random closing message with review URL (fallback when AI fails)
    function getRandomClosingMessage() {
        const randomMessage = CONFIG.exampleClosingMessages[Math.floor(Math.random() * CONFIG.exampleClosingMessages.length)];
        
        // Check for existing review requests in the thread
        const threadContent = Array.from(document.querySelectorAll('.bbp-reply-content, .bbp-topic-content'))
            .map(post => post.textContent.toLowerCase())
            .join(' ');
        
        // Check for review request patterns
        const reviewRequestPatterns = [
            /\/reviews\//i,
            /leave.*review/i,
            /leaving.*review/i,
            /review request/i,
            /leave us a review/i,
            /would love.*review/i,
            /appreciate.*review/i
        ];
        
        const hasExistingReviewRequest = reviewRequestPatterns.some(pattern => pattern.test(threadContent));
        
        if (hasExistingReviewRequest) {
            console.log('Existing review request found in thread, skipping review request in fallback message');
            return randomMessage;
        }
        
        // Add review request if none exists
        const reviewUrl = getReviewUrl();
        const variations = [
            `\n\nIf you have a few minutes, we'd love if you could leave us a review: ${reviewUrl}`,
            `\n\nWe'd really appreciate if you could take a moment to leave us a review: ${reviewUrl}`,
            `\n\nIf you have time, we'd be grateful for a review: ${reviewUrl}`,
            `\n\nYour feedback helps others - please consider leaving a review: ${reviewUrl}`,
            `\n\nWe'd love your feedback - please leave us a review: ${reviewUrl}`
        ];
        
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        return `${randomMessage}${randomVariation}`;
    }

    // Comprehensive thread analysis for test mode
    function analyzeThreadForTest() {
        console.log('analyzeThreadForTest function started');
        const analysis = {
            isValidThread: false,
            isWithinDateRange: false,
            hasReviewRequest: false,
            lastPostByUser: false,
            hasUserQuestions: false,
            canBeClosed: false,
            details: []
        };

        // Check if this is a valid support thread
        if (!window.location.href.includes('/support/topic/')) {
            analysis.details.push('❌ Not a valid support thread');
            return analysis;
        }
        
        // Check if we're on a supported forum
        const currentForum = detectCurrentForum(window.location.href);
        if (!currentForum) {
            analysis.details.push('❌ Not on a supported forum');
            return analysis;
        }
        
        if (!currentForum.enabled) {
            analysis.details.push(`❌ Forum "${currentForum.name}" is disabled`);
            return analysis;
        }
        
        analysis.isValidThread = true;
        analysis.details.push(`✅ Valid ${currentForum.name} support thread`);

        // Check date range
        const timeElement = document.querySelector('.bbp-topic-freshness a, .bbp-reply-post-date');
        if (timeElement) {
            const timeText = timeElement.textContent.trim();
            if (isWithinDateRange(timeText)) {
                analysis.isWithinDateRange = true;
                analysis.details.push(`✅ Within date range: ${timeText}`);
            } else {
                analysis.details.push(`❌ Outside date range: ${timeText}`);
            }
        } else {
            analysis.details.push('❌ Could not determine thread age');
        }

        // Check for existing review requests
        const allPosts = document.querySelectorAll('.bbp-reply-content, .bbp-topic-content');
        let hasReviewRequest = false;
        
        // Define review request patterns
        const reviewRequestPatterns = [
            // URL patterns (most important)
            /\/reviews\//i,
            /wordpress\.org.*\/reviews\//i,
            // Direct review requests
            /leave.*review/i,
            /leaving.*review/i,
            /share.*experience.*review/i,
            /share.*positive.*experience/i,
            /grateful.*review/i,
            /appreciate.*review/i,
            /would love.*review/i,
            /would be.*grateful.*review/i,
            /incredibly grateful.*review/i,
            /review request/i,
            /leave us a review/i,
            // WordPress.org specific patterns
            /wordpress\.org.*review/i,
            /support.*plugin.*review/i,
            // Rating patterns
            /leave.*rating/i,
            /star.*review/i,
            /5-star.*review/i,
            // Feedback patterns
            /leave.*feedback/i,
            /share.*feedback/i
        ];
        
        allPosts.forEach(post => {
            const postText = post.textContent.toLowerCase();
            
            // Check if any pattern matches
            if (reviewRequestPatterns.some(pattern => pattern.test(postText))) {
                hasReviewRequest = true;
                console.log('Review request detected in post:', postText.substring(0, 200) + '...');
            }
        });

        if (hasReviewRequest) {
            analysis.hasReviewRequest = true;
            analysis.details.push('❌ Review already requested in this thread');
        } else {
            analysis.details.push('✅ No review request found');
            // Additional debugging - show what we're looking for
            console.log('Review detection patterns checked:', reviewRequestPatterns.map(p => p.source));
        }

        // Check last post author and content
        const lastPost = allPosts[allPosts.length - 1];
        if (lastPost) {
            const lastPostText = lastPost.textContent.toLowerCase();
            
            // Find the author element for the last post
            const lastPostContainer = lastPost.closest('.bbp-reply, .bbp-topic');
            let lastPostAuthor = null;
            
            if (lastPostContainer) {
                // Look for author information in the post container
                lastPostAuthor = lastPostContainer.querySelector('.bbp-reply-author, .bbp-topic-author');
            }
            
            // Check if the last post is by a user (not moderator/support)
            const isLastPostByUser = lastPostAuthor && !isModeratorOrSupport(lastPostAuthor);
            
            if (isLastPostByUser) {
                analysis.lastPostByUser = true;
                analysis.details.push('❌ Last post is by user (not moderator)');
                
                // Check for user questions in last post
                const hasUserQuestion = CONFIG.userQuestionKeywords.some(keyword => 
                    lastPostText.includes(keyword)
                );

                if (hasUserQuestion) {
                    analysis.hasUserQuestions = true;
                    analysis.details.push('❌ User has asked a question in last post');
                } else {
                    analysis.details.push('✅ No user questions in last post');
                }
            } else {
                analysis.details.push('✅ Last post is by moderator/support');
            }
        } else {
            analysis.details.push('❌ No posts found');
        }

        // Determine if thread can be closed and provide specific reasons
        analysis.canBeClosed = analysis.isValidThread && 
                              analysis.isWithinDateRange && 
                              !analysis.hasReviewRequest && 
                              !analysis.lastPostByUser && 
                              !analysis.hasUserQuestions;

        if (analysis.canBeClosed) {
            analysis.details.push('✅ Thread is safe to close');
        } else {
            analysis.details.push('❌ Thread should not be closed');
            
            // Add specific reasons why it cannot be closed
            const reasons = [];
            if (!analysis.isValidThread) {
                reasons.push('Not a valid support thread');
            }
            if (!analysis.isWithinDateRange) {
                reasons.push('Thread is outside the configured date range');
            }
            if (analysis.hasReviewRequest) {
                reasons.push('Review has already been requested in this thread');
            }
            if (analysis.lastPostByUser) {
                reasons.push('Last post is by user (not moderator/support)');
            }
            if (analysis.hasUserQuestions) {
                reasons.push('User has asked questions that need responses');
            }
            
            if (reasons.length > 0) {
                analysis.details.push(`\nReasons: ${reasons.join(', ')}`);
            }
        }

        return analysis;
    }

    // Check if an author is a moderator or support staff
    function isModeratorOrSupport(authorElement) {
        if (!authorElement) return false;
        
        const authorText = authorElement.textContent.toLowerCase();
        const authorHTML = authorElement.innerHTML.toLowerCase();
        
        // Check for moderator/support indicators
        const moderatorIndicators = [
            'woo-hc',           // WooCommerce Happiness Engineer
            'plugin support',   // Plugin Support
            'moderator',        // Moderator
            'support',          // Support
            'admin',            // Admin
            'wordpress.org',    // WordPress.org staff
            'bbpress',          // bbPress staff
            'happiness engineer' // Happiness Engineer
        ];
        
        // Check if any moderator indicators are present
        return moderatorIndicators.some(indicator => 
            authorText.includes(indicator) || authorHTML.includes(indicator)
        );
    }

    // Analyze thread content to determine if it's safe to close (original function for production)
    function analyzeThreadSafety() {
        const posts = document.querySelectorAll('.bbp-reply-content, .bbp-topic-content');
        const lastPost = posts[posts.length - 1];
        
        if (!lastPost) return { safe: false, reason: 'No posts found' };

        const lastPostText = lastPost.textContent.toLowerCase();
        const allPostsText = Array.from(posts).map(post => post.textContent.toLowerCase()).join(' ');
        
        // Find the author element for the last post
        const lastPostContainer = lastPost.closest('.bbp-reply, .bbp-topic');
        let lastPostAuthor = null;
        
        if (lastPostContainer) {
            // Look for author information in the post container
            lastPostAuthor = lastPostContainer.querySelector('.bbp-reply-author, .bbp-topic-author');
        }
        
        // Check if the last post is by a user (not moderator/support)
        const isLastPostByUser = lastPostAuthor && !isModeratorOrSupport(lastPostAuthor);
        
        // Check for frustration indicators across all posts
        const hasFrustration = CONFIG.frustrationKeywords.some(keyword => 
            allPostsText.includes(keyword)
        );
        
        if (hasFrustration) {
            return { 
                safe: false, 
                reason: 'User expressed frustration in thread',
                details: ['❌ User frustration detected - requires human review']
            };
        }
        
        // Check if last post is by a user (not moderator)
        if (isLastPostByUser) {
            // Check for user questions in last post
            const hasUserQuestion = CONFIG.userQuestionKeywords.some(keyword => 
                lastPostText.includes(keyword)
            );

            if (hasUserQuestion) {
                return { 
                    safe: false, 
                    reason: 'User has asked a question in last post',
                    details: ['❌ User question detected in last post']
                };
            }

            // Check for resolution indicators
            const hasResolution = CONFIG.resolutionKeywords.some(keyword => 
                lastPostText.includes(keyword)
            );

            if (hasResolution) {
                return { 
                    safe: true, 
                    reason: 'User indicated resolution',
                    details: ['✅ User confirmed resolution']
                };
            }

            return { 
                safe: false, 
                reason: 'Last post is by user but no clear resolution',
                details: ['❌ Last post by user without clear resolution']
            };
        }

        // Check if thread is old enough
        const timeElement = document.querySelector('.bbp-topic-freshness a, .bbp-reply-post-date');
        if (timeElement) {
            const timeText = timeElement.textContent.trim();
            if (!isWithinDateRange(timeText)) {
                return { 
                    safe: false, 
                    reason: 'Thread not within configured date range',
                    details: [`❌ Thread date (${timeText}) outside configured range`]
                };
            }
        }

        return { 
            safe: true, 
            reason: 'Last post is by moderator/support and thread is within date range',
            details: ['✅ Last post by moderator/support', '✅ Thread within date range']
        };
    }

    // Create the main button
    function createButton() {
        const settingsPanel = createSettingsPanel();
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 9999;
        `;

        const mainButton = document.createElement('button');
        mainButton.innerHTML = '<span style="margin-right: 6px;">🔍</span>Review Threads';
        mainButton.style.cssText = `
            padding: 10px 16px;
            background: linear-gradient(135deg, #7f54b3 0%, #9b6dff 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 3px 12px rgba(127, 84, 179, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: -0.1px;
            transition: all 0.3s ease;
            min-width: 140px;
            max-width: 160px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        const settingsButton = document.createElement('button');
        settingsButton.innerHTML = '<span style="margin-right: 4px;">⚙️</span>Settings';
        settingsButton.style.cssText = `
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.95);
            color: #1d2327;
            border: 1px solid #dcdcde;
            border-radius: 6px;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 10px;
            font-weight: 500;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            min-width: 100px;
            max-width: 120px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Hover effects
        [mainButton, settingsButton].forEach(btn => {
            btn.addEventListener('mouseover', () => {
                btn.style.transform = 'scale(1.03)';
                btn.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            });
        });

        mainButton.addEventListener('click', () => {
            processThreads();
        });

        settingsButton.addEventListener('click', () => {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });

        // Settings panel event listeners
        document.getElementById('save-settings').addEventListener('click', saveSettings);
        document.getElementById('close-settings').addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });
        document.getElementById('test-api').addEventListener('click', testOpenAI);
        document.getElementById('test-thread').addEventListener('click', testIndividualThread);
        
        // Debug and logging event handlers
        document.getElementById('view-logs').addEventListener('click', showLogsDialog);
        document.getElementById('export-logs').addEventListener('click', exportLogs);
        document.getElementById('clear-logs').addEventListener('click', clearLogs);
        
        // Forum management event handlers
        document.getElementById('add-forum').addEventListener('click', addForum);
        document.getElementById('import-forums').addEventListener('click', importForums);
        document.getElementById('reset-forums').addEventListener('click', resetForums);
        document.getElementById('export-forums').addEventListener('click', exportForums);
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-forum-btn').forEach(button => {
            button.addEventListener('click', function() {
                const slug = this.getAttribute('data-slug');
                editForum(slug);
            });
        });
        
        // Test mode toggle
        const testModeCheckbox = document.getElementById('test-mode');
        if (testModeCheckbox) {
            testModeCheckbox.addEventListener('change', function() {
                const testUrlSection = document.getElementById('test-url-section');
                if (testUrlSection) {
                    testUrlSection.style.display = this.checked ? 'block' : 'none';
                }
            });
        }

        // Add hover effects
        mainButton.addEventListener('mouseenter', () => {
            mainButton.style.transform = 'translateY(-2px)';
            mainButton.style.boxShadow = '0 6px 20px rgba(127, 84, 179, 0.4)';
        });
        
        mainButton.addEventListener('mouseleave', () => {
            mainButton.style.transform = 'translateY(0)';
            mainButton.style.boxShadow = '0 4px 16px rgba(127, 84, 179, 0.3)';
        });
        
        settingsButton.addEventListener('mouseenter', () => {
            settingsButton.style.transform = 'translateY(-1px)';
            settingsButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        settingsButton.addEventListener('mouseleave', () => {
            settingsButton.style.transform = 'translateY(0)';
            settingsButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });

        buttonContainer.appendChild(mainButton);
        buttonContainer.appendChild(settingsButton);
        document.body.appendChild(buttonContainer);
    }

    // Enhanced thread marking function
    async function markAsResolved() {
            Logger.info('markAsResolved function started', { url: window.location.href });
        
        // Double-check that script is active before proceeding
        const scriptActive = await isScriptActive();
        if (!scriptActive) {
            console.log('Script not active in markAsResolved - aborting');
            return false;
        }
        
        // Check if this is a multi-page thread and navigate to the latest page
        await navigateToLatestPage();
        
        const threadId = window.location.pathname.split('/').filter(Boolean).pop();
        const processedKey = `processed_${threadId}`;
        console.log('Thread ID:', threadId, 'Processed key:', processedKey);

        // Check if thread was already processed, but allow human review if script is active
        const wasProcessed = localStorage.getItem(processedKey);
        if (wasProcessed && !CONFIG.enableHumanReview) {
            console.log('Thread already processed and human review disabled, skipping');
            return false;
        }

        // Check if thread is already marked as resolved (after manual editing)
        const resolvedStatus = checkThreadResolvedStatus();
        if (resolvedStatus.isResolved) {
            Logger.info('Thread already marked as resolved', { 
                reason: resolvedStatus.reason,
                url: window.location.href 
            });
            
            // Show dialog for resolved thread
            const userAction = await showResolvedThreadDialog(resolvedStatus.reason);
            
            switch (userAction) {
                case 'skip':
                    console.log('User chose to skip to next thread');
                    return true; // Continue to next thread
                case 'cancel':
                    console.log('User chose to cancel script');
                    await setScriptActive(false);
                    return false;
                default:
                    console.log('Unknown user action for resolved thread:', userAction);
                    return false;
            }
        }

        // Get thread content for analysis
        const threadContent = Array.from(document.querySelectorAll('.bbp-reply-content, .bbp-topic-content'))
            .map(post => post.textContent.trim())
            .join('\n\n');
        
        // Get last reply for human review
        const lastReply = Array.from(document.querySelectorAll('.bbp-reply-content'))
            .pop()?.textContent.trim() || 'No reply content available';
        
        // Get thread title
        const threadTitle = document.querySelector('.bbp-topic-title')?.textContent.trim() || 'Unknown Thread';
        
        // Analyze thread for resolution
        let analysis;
        let canResolve = false;
        let aiMessage = '';
        
        if (CONFIG.testMode) {
            console.log('Running in test mode with comprehensive analysis');
            analysis = analyzeThreadForTest();
            canResolve = analysis.canBeClosed;
        } else {
            console.log('Running in production mode with simple analysis');
            analysis = analyzeThreadSafety();
            canResolve = analysis.safe;
        }
        
        // Generate AI message if thread can be resolved
        if (canResolve) {
            Logger.info('Thread can be resolved, generating AI message', {
                threadContentLength: threadContent.length,
                hasOpenAIKey: !!CONFIG.openaiApiKey,
                openAIModel: CONFIG.openaiModel
            });
            
            aiMessage = await generateAIResponse(threadContent);
            
            if (!aiMessage || aiMessage.trim().length === 0) {
                Logger.warn('AI message generation failed or returned empty', {
                    aiMessage: aiMessage,
                    threadContentLength: threadContent.length,
                    hasOpenAIKey: !!CONFIG.openaiApiKey
                });
            } else {
                Logger.info('AI message generated successfully', {
                    messageLength: aiMessage.length,
                    messagePreview: aiMessage.substring(0, 100) + '...'
                });
            }
        } else {
            Logger.info('Thread cannot be resolved automatically', {
                analysis: analysis,
                reason: analysis ? (analysis.details ? analysis.details.filter(d => d.startsWith('❌')).join(', ') : analysis.reason) : 'Unknown'
            });
        }
        
        // Prepare thread data for human review
        const threadData = {
            title: threadTitle,
            url: window.location.href,
            canResolve: canResolve,
            lastReply: lastReply,
            aiMessage: aiMessage,
            analysis: analysis
        };
        
        // Check if thread can be automatically resolved without human review
        const canAutoResolve = canResolve && analysis && analysis.details && 
            analysis.details.some(detail => detail.includes('✅ User confirmed resolution'));
        
        if (canAutoResolve && !CONFIG.enableHumanReview) {
            Logger.info('Auto-resolving thread without human review', {
                reason: analysis.reason,
                details: analysis.details
            });
            console.log('Auto-resolving thread without human review...');
        } else if (CONFIG.enableHumanReview) {
            console.log('Showing human review dialog...');
            const userAction = await showHumanReviewDialog(threadData);
            
            switch (userAction) {
                case 'auto-resolve':
                    console.log('User chose to auto-resolve');
                    // Check if script is actively processing before auto-resolving
                    const scriptActive = await isScriptActive();
                    if (!scriptActive) {
                        console.log('Script not actively processing - cannot auto-resolve');
                return false;
            }
                    break;
                case 'manual-reply':
                    console.log('User chose manual reply - waiting for manual submission');
                    // Wait for manual reply submission
                    await waitForManualReply();
                    return true; // Return true to continue queue
                case 'skip':
                    console.log('User chose to skip thread');
                    return true; // Return true to continue queue
                case 'cancel':
                    console.log('User chose to cancel process');
                    await setScriptActive(false);
                    return false;
                case 'auto-continue':
                    console.log('Auto-continuing due to timeout');
                    // Check if script is actively processing before auto-continuing
                    const scriptActiveAuto = await isScriptActive();
                    if (!scriptActiveAuto) {
                        console.log('Script not actively processing - cannot auto-continue');
                return false;
            }
                    break;
                default:
                    console.log('Unknown user action:', userAction);
                return false;
            }
        }

        const resolvedDropdown = document.getElementById('topic-resolved');
        const updateButton = document.querySelector('input[type="submit"][name="submit"][value="Update"]');
        
        // Look for the "Reply and mark as resolved" checkbox
        const resolveCheckbox = document.querySelector('input[type="checkbox"][name="bbp_reply_mark_resolved"]');
        const submitButton = document.querySelector('button[type="submit"][id="bbp_reply_submit"]');
        
        console.log('Found elements:', {
            resolvedDropdown: !!resolvedDropdown,
            updateButton: !!updateButton,
            resolveCheckbox: !!resolveCheckbox,
            submitButton: !!submitButton
        });
        
        // Log the actual elements for debugging
        if (resolveCheckbox) console.log('Checkbox found:', resolveCheckbox.outerHTML);
        if (submitButton) console.log('Submit button found:', submitButton.outerHTML);
        
        // Try to find the block editor content area
        let editorBlock = document.querySelector('.block-editor-rich-text__editable.block-editor-block-list__block.wp-block.is-selected.wp-block-paragraph.rich-text');
        
        // If block editor is not found, try alternative selectors
        if (!editorBlock) {
            editorBlock = document.querySelector('.block-editor-rich-text__editable');
        }
        
        // If still not found, try to create a new block by clicking in the editor area
        if (!editorBlock) {
            const editorWrapper = document.querySelector('.editor-styles-wrapper.block-editor-writing-flow');
            if (editorWrapper) {
                // Click in the editor area to create a new block
                editorWrapper.click();
                // Wait a moment for the block to be created
                await new Promise(resolve => setTimeout(resolve, 500));
                editorBlock = document.querySelector('.block-editor-rich-text__editable');
            }
        }
        
        // If still not found, try the default block appender area
        if (!editorBlock) {
            const defaultAppender = document.querySelector('.block-editor-default-block-appender');
            if (defaultAppender) {
                // Click on the default appender to create a new block
                defaultAppender.click();
                // Wait a moment for the block to be created
                await new Promise(resolve => setTimeout(resolve, 500));
                editorBlock = document.querySelector('.block-editor-rich-text__editable');
            }
        }
        
        // If still not found, try to find any block editor element with content
        if (!editorBlock) {
            const allBlocks = document.querySelectorAll('.block-editor-rich-text__editable');
            if (allBlocks.length > 0) {
                // Use the first available block
                editorBlock = allBlocks[0];
            }
        }

        if ((resolvedDropdown && updateButton) || (resolveCheckbox && submitButton)) {
            console.log('Found required elements, proceeding with thread closure');
            localStorage.setItem(processedKey, 'true');

            // Get thread content for AI analysis
            const threadContent = Array.from(document.querySelectorAll('.bbp-reply-content, .bbp-topic-content'))
                .map(post => post.textContent.trim())
                .join('\n\n');
            console.log('Thread content length:', threadContent.length);

            // Generate closing message (AI or random)
            let fullMessage = await generateAIResponse(threadContent);
            console.log('Generated message:', fullMessage);
            
            // Validate the AI response
            if (!fullMessage || fullMessage.trim().length === 0) {
                console.error('AI response is empty or null, using fallback message');
                fullMessage = getRandomClosingMessage();
                console.log('Using fallback message:', fullMessage);
            }

            // Use the exact working method from your simple script
            console.log('Using your proven working method');
            
            // Find the reply textarea/form exactly like your script
            const replyForm = document.querySelector('form#replyform, form.reply-form, form#new-post');
            const textarea = document.querySelector('form textarea, form#replyform textarea, textarea#bbp_reply_content');
            
            console.log('Found elements:', { replyForm: !!replyForm, textarea: !!textarea });
            
            if (!replyForm || !textarea) {
                console.error('No reply form or textarea found');
                return false;
            }

            // Use the exact same method as your working script
            textarea.value = fullMessage;
            console.log('✅ Content inserted using your method');
            console.log('Textarea value:', textarea.value);
            
            // Make sure the textarea is visible and focused
            textarea.style.display = 'block';
            textarea.style.visibility = 'visible';
            textarea.focus();
            
            // Trigger a simple event to ensure the form recognizes the change
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Show a success message to confirm content was added
            console.log('✅ Content successfully added - automation will proceed in 1 second');
            
            // Success - no need for complex event dispatching
            console.log('Content insertion completed, proceeding with automation');
            
            // Automate the submission process
            console.log('=== AUTOMATION SECTION STARTED ===');
            console.log('Automating thread resolution and submission');
            console.log('Current queue state:', { currentThreadIndex, queueLength: threadQueue.length });
            console.log('Thread URL being processed:', window.location.href);
            console.log('Available elements for automation:', {
                resolveCheckbox: !!resolveCheckbox,
                submitButton: !!submitButton,
                resolvedDropdown: !!resolvedDropdown,
                updateButton: !!updateButton
            });
            
            if (resolveCheckbox && submitButton) {
                // Use the checkbox method (preferred)
                console.log('Using checkbox method for resolution');
                console.log('Checkbox before:', resolveCheckbox.checked);
                
                // Check the "Reply and mark as resolved" checkbox
                resolveCheckbox.checked = true;
                resolveCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('Checkbox after:', resolveCheckbox.checked);
                console.log('Checkbox checked for resolution');
                
                // Submit the form with delay
                setTimeout(() => {
                    console.log('Submitting the form with checkbox method...');
                    console.log('About to click submit button:', submitButton);
                    submitButton.click();
                    console.log('Submit button clicked');
                    
                    // Mark thread as completed and continue queue
                    console.log('About to call markThreadCompleted...');
                    markThreadCompleted();
                }, 1000);
                
            } else if (resolvedDropdown && updateButton) {
                // Fallback to dropdown method
                console.log('Using dropdown method for resolution');
                
                // Mark as resolved
                resolvedDropdown.value = 'yes';
                const changeEvent = new Event('change', { bubbles: true });
                resolvedDropdown.dispatchEvent(changeEvent);
                console.log('Thread marked as resolved via dropdown');

                // Submit the form with delay
                setTimeout(() => {
                    console.log('Submitting the form with dropdown method...');
                    updateButton.click();
                    
                    // Mark thread as completed and continue queue
                    console.log('About to call markThreadCompleted (dropdown method)...');
                    markThreadCompleted();
                }, 1000);
            } else {
                console.log('No automation elements found - manual intervention required');
                // Even if automation fails, try to continue queue
                setTimeout(() => {
                    console.log('About to call markThreadCompleted (fallback)...');
                    markThreadCompleted();
                }, 3000);
            }

            return true;
        }

        return false;
    }

    // Navigate to the latest page of a multi-page thread
    async function navigateToLatestPage() {
        // Prevent multiple executions
        if (window.navigateToLatestPageExecuting) {
            Logger.info('navigateToLatestPage already executing, skipping');
            return;
        }
        window.navigateToLatestPageExecuting = true;
        
        Logger.info('Checking for multi-page thread navigation', { currentUrl: window.location.href });
        
        // Check if we're already on a specific page
        const currentUrl = window.location.href;
        const pageMatch = currentUrl.match(/\/page\/(\d+)\//);
        
        if (pageMatch) {
            Logger.info('Already on a specific page', { pageNumber: pageMatch[1] });
            return; // Already on a specific page
        }
        
        // Look for pagination links to find the latest page
        const paginationSelectors = [
            '.bbp-pagination a[href*="/page/"]',
            '.bbp-pagination-links a[href*="/page/"]',
            '.pagination a[href*="/page/"]',
            'a[href*="/page/"]'
        ];
        
        let paginationLinks = [];
        for (const selector of paginationSelectors) {
            paginationLinks = document.querySelectorAll(selector);
            if (paginationLinks.length > 0) {
                Logger.info('Found pagination links with selector', { selector: selector, linkCount: paginationLinks.length });
                break;
            }
        }
        
        let maxPage = 1;
        
        if (paginationLinks.length > 0) {
            Logger.info('Processing pagination links', { linkCount: paginationLinks.length });
            
            // Extract page numbers from all pagination links
            for (const link of paginationLinks) {
                const href = link.href;
                const pageMatch = href.match(/\/page\/(\d+)\//);
                if (pageMatch) {
                    const pageNum = parseInt(pageMatch[1]);
                    if (pageNum > maxPage) {
                        maxPage = pageNum;
                    }
                }
            }
            
            // Also check for "Last" or "Next" links that might point to the latest page
            const lastLinks = document.querySelectorAll('a[href*="/page/"][title*="Last"], a[href*="/page/"][title*="last"], a[href*="/page/"][aria-label*="Last"], a[href*="/page/"][aria-label*="last"]');
            for (const link of lastLinks) {
                const href = link.href;
                const pageMatch = href.match(/\/page\/(\d+)\//);
                if (pageMatch) {
                    const pageNum = parseInt(pageMatch[1]);
                    if (pageNum > maxPage) {
                        maxPage = pageNum;
                    }
                }
            }
            
            Logger.info('Determined latest page', { maxPage: maxPage });
            
            // Additional check: look for reply count information
            const replyCountElements = document.querySelectorAll('.bbp-topic-reply-count, .bbp-reply-count, [class*="reply-count"], [class*="replies"]');
            let totalReplies = 0;
            
            for (const element of replyCountElements) {
                const text = element.textContent;
                const match = text.match(/(\d+)/);
                if (match) {
                    const count = parseInt(match[1]);
                    if (count > totalReplies) {
                        totalReplies = count;
                    }
                }
            }
            
            Logger.info('Reply count analysis', { totalReplies: totalReplies, maxPage: maxPage });
            
            // If there are multiple pages and we're not on the latest, navigate there
            if (maxPage > 1) {
                const latestPageUrl = currentUrl.replace(/\/$/, '') + `/page/${maxPage}/`;
                Logger.info('Navigating to latest page', { 
                    from: currentUrl, 
                    to: latestPageUrl,
                    pageNumber: maxPage 
                });
                
                // Navigate to the latest page
                window.location.href = latestPageUrl;
                
                // Wait for navigation to complete with timeout
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 50; // 5 seconds timeout
                    
                    const checkNavigation = () => {
                        attempts++;
                        if (window.location.href === latestPageUrl) {
                            Logger.info('Successfully navigated to latest page');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            Logger.warn('Navigation timeout, continuing with current page');
                            resolve();
                        } else {
                            setTimeout(checkNavigation, 100);
                        }
                    };
                    checkNavigation();
                });
                
                return;
            }
        }
        
        Logger.info('No multi-page navigation needed', { maxPage: maxPage });
        
        // Clear execution flag
        window.navigateToLatestPageExecuting = false;
    }

    // Check if thread is already marked as resolved
    function checkThreadResolvedStatus() {
        // Check for resolved status indicators (valid CSS selectors only)
        const resolvedIndicators = [
            // Check for resolved badge/status
            '.bbp-topic-status-resolved',
            '.bbp-topic-status .resolved',
            '.bbp-topic-status[title*="resolved"]',
            '.bbp-topic-status[title*="Resolved"]',
            // Check for resolved class on topic
            '.bbp-topic.resolved',
            '.bbp-topic-status-resolved'
        ];
        
        // Check each indicator
        for (const selector of resolvedIndicators) {
            const element = document.querySelector(selector);
            if (element) {
                return {
                    isResolved: true,
                    reason: 'Thread marked as resolved',
                    element: element
                };
            }
        }
        
        // Check for resolved text in various elements using proper DOM methods
        const resolvedTextSelectors = [
            '.bbp-topic-status',
            '.bbp-topic-title',
            '.bbp-breadcrumb',
            '.bbp-topic-meta'
        ];
        
        for (const selector of resolvedTextSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent.toLowerCase();
                if (text.includes('resolved') || text.includes('closed')) {
                    return {
                        isResolved: true,
                        reason: 'Thread appears to be resolved',
                        element: element
                    };
                }
            }
        }
        
        // Check if there's a "Mark as resolved" button (indicating thread is not resolved)
        const markResolvedButton = document.querySelector('input[name="bbp_reply_mark_resolved"], .bbp-topic-resolve-link');
        if (markResolvedButton) {
            return {
                isResolved: false,
                reason: 'Thread has resolve options available'
            };
        }
        
        return {
            isResolved: false,
            reason: 'No clear resolution status found'
        };
    }

    // Show dialog for resolved threads
    function showResolvedThreadDialog(reason) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.id = 'resolved-thread-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.3);
                backdrop-filter: blur(2px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            `;
            
            dialog.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 0;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                    border: 1px solid #e1e5e9;
                ">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 16px; text-align: center;">
                        <h2 style="margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.3px;">✅ Thread Already Resolved</h2>
                        <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.9;">This thread has been marked as resolved</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                            <p style="margin: 0 0 15px 0; color: #1d2327; font-size: 14px; line-height: 1.5;">
                                This thread has already been marked as resolved, likely after manual editing.
                            </p>
                            <div style="background: #f6f7f7; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                                <p style="margin: 0; color: #646970; font-size: 12px;">
                                    <strong>Reason:</strong> ${reason}
                                </p>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="skip-resolved-btn" style="
                                padding: 12px 20px;
                                background: #007cba;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                font-weight: 600;
                                transition: background-color 0.2s;
                            ">⏭️ Skip to Next Thread</button>
                            
                            <button id="cancel-resolved-btn" style="
                                padding: 12px 20px;
                                background: #d63638;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                font-weight: 600;
                                transition: background-color 0.2s;
                            ">❌ Cancel Script</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Button event handlers
            document.getElementById('skip-resolved-btn').onclick = async () => {
                dialog.remove();
                await skipCurrentThread();
                resolve('skip');
            };
            
            document.getElementById('cancel-resolved-btn').onclick = () => {
                dialog.remove();
                resolve('cancel');
            };
        });
    }

    // Check if thread is within configured date range
    function isWithinDateRange(timeText) {
        const weeks = timeText.match(/(\d+)\s+weeks?/);
        const months = timeText.match(/(\d+)\s+months?/);

        let totalWeeks = 0;

        if (weeks) {
            totalWeeks = parseInt(weeks[1]);
        }
        if (months) {
            totalWeeks = parseInt(months[1]) * 4;
        }

        return totalWeeks >= CONFIG.minWeeks && totalWeeks <= CONFIG.maxWeeks;
    }

    // Global thread queue management
    let threadQueue = [];
    let isProcessingQueue = false;
    let currentThreadIndex = 0;

    // Process threads with enhanced filtering
    async function processThreads() {
        console.log('=== PROCESS THREADS DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('CONFIG.forums length:', CONFIG.forums.length);
        console.log('CONFIG.forums:', CONFIG.forums);
        
        // Check if we're on a supported forum
        const currentForum = detectCurrentForum(window.location.href);
        console.log('Detected forum:', currentForum);
        
        if (!currentForum) {
            Logger.warn('Not on a supported forum', { url: window.location.href });
            alert('This script only works on supported forums. Please navigate to a supported forum page.');
            return;
        }
        
        if (!currentForum.enabled) {
            Logger.warn('Forum is disabled', { forum: currentForum.name });
            alert(`The forum "${currentForum.name}" is currently disabled. Please enable it in settings or use a different forum.`);
            return;
        }
        
        Logger.info('Processing threads for forum', { forum: currentForum.name });
        
        const threads = document.querySelectorAll('.bbp-topic-title');
        let openCount = 0;
        let solvedCount = 0;

        // Clear and populate thread queue
        threadQueue = [];
        currentThreadIndex = 0;

        for (let thread of threads) {
            const freshnessElement = thread.parentElement.querySelector('.bbp-topic-freshness a');
            if (freshnessElement) {
                const timeText = freshnessElement.textContent.trim();
                if (isWithinDateRange(timeText)) {
                    const threadLink = thread.querySelector('.bbp-topic-permalink').href;
                    threadQueue.push(threadLink);
                    openCount++;
                }
            }
        }

        Logger.info(`Found ${openCount} threads to process`, { 
            queueLength: threadQueue.length,
            threadUrls: threadQueue 
        });

        // Show warning if no threads found
        if (threadQueue.length === 0) {
            Logger.warn('No threads found within date range', { 
                minWeeks: CONFIG.minWeeks, 
                maxWeeks: CONFIG.maxWeeks 
            });
            
            // Show user-friendly warning dialog
            const warningDialog = document.createElement('div');
            warningDialog.id = 'no-threads-warning';
            warningDialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                padding: 25px;
                z-index: 10003;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                max-width: 450px;
                border: 1px solid #e1e5e9;
            `;
            
            warningDialog.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                    <h3 style="margin: 0 0 10px 0; color: #1d2327; font-size: 18px;">No Threads Found</h3>
                    <p style="margin: 0 0 15px 0; color: #646970; font-size: 14px; line-height: 1.5;">
                        No unresolved threads found in current date range.
                    </p>
                    <div style="background: #f6f7f7; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; color: #1d2327; font-size: 13px; font-weight: 600;">Current Date Range:</p>
                        <p style="margin: 0; color: #646970; font-size: 12px;">
                            ${CONFIG.minWeeks} to ${CONFIG.maxWeeks} weeks old
                        </p>
                    </div>
                    <p style="margin: 0; color: #646970; font-size: 13px;">
                        Adjust date range in settings to find more threads.
                    </p>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="open-settings-btn" style="
                        padding: 10px 20px;
                        background: #7f54b3;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 600;
                        transition: background-color 0.2s;
                    ">⚙️ Open Settings</button>
                    
                    <button id="close-warning-btn" style="
                        padding: 10px 20px;
                        background: #646970;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        transition: background-color 0.2s;
                    ">Close</button>
                </div>
            `;
            
            document.body.appendChild(warningDialog);
            
            // Add event listeners
            document.getElementById('open-settings-btn').addEventListener('click', () => {
                warningDialog.remove();
                // Open settings panel
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) {
                    settingsPanel.style.display = 'block';
                }
            });
            
            document.getElementById('close-warning-btn').addEventListener('click', () => {
                warningDialog.remove();
            });
            
            return;
        }

        // Validate queue before starting
        if (threadQueue.length !== openCount) {
            Logger.warn('Queue length mismatch!', { 
                expected: openCount, 
                actual: threadQueue.length 
            });
        }

        // Save queue to storage for persistence
        Logger.info('Saving queue to storage:', { 
            queueLength: threadQueue.length, 
            currentIndex: currentThreadIndex,
            queue: threadQueue 
        });
        await GM.setValue('threadQueue', threadQueue);
        await GM.setValue('currentThreadIndex', currentThreadIndex);
        Logger.info('Queue saved to storage successfully');

        // Set script as active when starting queue
        await setScriptActive(true);
        console.log('Script set as active for queue processing');
        
        // Reset solved count for new queue
        await GM.setValue('solvedThreads', 0);
        console.log('Reset solved count to 0 for new queue');
        
        // Save the current unresolved page URL for navigation back
        await GM.setValue('originalUnresolvedPageUrl', window.location.href);
        console.log('Saved original unresolved page URL:', window.location.href);
        
        // Clear any existing processed threads from localStorage to start fresh
        const processedKeys = Object.keys(localStorage).filter(key => key.startsWith('processed_'));
        processedKeys.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${processedKeys.length} previously processed thread records`);

        // Start processing the queue
        if (threadQueue.length > 0) {
            Logger.info('Starting queue processing...');
            Logger.info('Initial queue state:', { 
                currentThreadIndex, 
                queueLength: threadQueue.length,
                firstThread: threadQueue[currentThreadIndex]
            });
            
            // Log the complete queue order
            Logger.info('Complete queue order:', {
                totalThreads: threadQueue.length,
                queue: threadQueue.map((url, index) => `${index + 1}. ${url}`)
            });
            
            await processNextThread();
        } else {
            Logger.info('No threads to process');
            await setScriptActive(false);
        }

        // Don't show completion message here - it will be shown when queue actually completes
        console.log(`Queue created with ${openCount} threads. Processing will continue automatically.`);
    }

    // Process next thread in queue
    async function processNextThread() {
        Logger.info('=== processNextThread called ===');
        
        // Prevent multiple executions
        if (window.processNextThreadExecuting) {
            console.log('processNextThread already executing - skipping');
            return;
        }
        window.processNextThreadExecuting = true;
        
        try {
            Logger.info('Current state:', { currentThreadIndex, queueLength: threadQueue.length });
            Logger.info('Thread queue:', { queue: threadQueue });
            Logger.info('Script active state:', { active: await isScriptActive() });
        
        if (currentThreadIndex >= threadQueue.length) {
            Logger.info('All threads processed - queue complete');
            Logger.info('Final queue state:', { currentThreadIndex, queueLength: threadQueue.length });
            Logger.info('Setting script as inactive and clearing queue');
            await setScriptActive(false);
            await GM.setValue('threadQueue', []);
            await GM.setValue('currentThreadIndex', 0);
            return;
        }

        const threadUrl = threadQueue[currentThreadIndex];
        Logger.info(`=== PROCESSING THREAD ${currentThreadIndex + 1}/${threadQueue.length} ===`);
        Logger.info(`Thread URL: ${threadUrl}`);
        Logger.info(`Current index: ${currentThreadIndex}`);
        Logger.info(`About to navigate to: ${threadUrl}`);
        
        try {
            // Navigate directly to the thread URL
            Logger.info('Navigating to thread URL:', { 
                from: window.location.href,
                to: threadUrl,
                threadNumber: currentThreadIndex + 1,
                totalThreads: threadQueue.length
            });
            
            // Use direct navigation instead of tab management
            window.location.href = threadUrl;
            Logger.info(`Thread ${currentThreadIndex + 1} navigation initiated`);
            
            // Don't increment index here - let the thread processing complete first
            // The index will be incremented when markThreadCompleted is called
        } catch (error) {
            console.error('Error opening thread:', error);
            currentThreadIndex++;
            // Continue with next thread even if this one fails
            setTimeout(processNextThread, 2000);
        }
        } catch (error) {
            console.error('Error in processNextThread:', error);
        } finally {
            window.processNextThreadExecuting = false;
        }
    }



    // Show manual review warning for threads that shouldn't be closed automatically
    function showManualReviewWarning(analysis) {
        // Remove any existing warning
        const existingWarning = document.getElementById('manual-review-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        const warning = document.createElement('div');
        warning.id = 'manual-review-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 400px;
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-height: 80vh;
            overflow-y: auto;
        `;

        const reasons = analysis.details.filter(detail => detail.startsWith('❌'));
        const positiveChecks = analysis.details.filter(detail => detail.startsWith('✅'));

        warning.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #856404; font-size: 16px;">⚠️ Manual Review Required</h3>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #856404;">×</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 10px 0; color: #856404; font-weight: 500;">This thread requires manual review before closing:</p>
                
                <div style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
                    <strong style="color: #dc3545;">Issues Found:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px; color: #dc3545;">
                        ${reasons.map(reason => `<li>${reason.replace('❌', '').trim()}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
                    <strong style="color: #28a745;">Checks Passed:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px; color: #28a745;">
                        ${positiveChecks.map(check => `<li>${check.replace('✅', '').trim()}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="document.getElementById('manual-review-warning').remove(); skipCurrentThread();" style="flex: 1; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Skip & Continue</button>
                <button onclick="document.getElementById('manual-review-warning').remove();" style="flex: 1; padding: 8px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Review Manually</button>
            </div>
            
            <div style="margin-top: 10px; font-size: 11px; color: #6c757d;">
                <strong>Thread URL:</strong><br>
                <a href="${window.location.href}" target="_blank" style="color: #007cba; word-break: break-all;">${window.location.href}</a>
            </div>
        `;

        document.body.appendChild(warning);
        
        // Auto-remove after 30 seconds if not dismissed
        setTimeout(() => {
            if (document.getElementById('manual-review-warning')) {
                document.getElementById('manual-review-warning').remove();
            }
        }, 30000);
    }

    // Function to continue queue after manual review
    async function continueQueueAfterReview() {
        const warning = document.getElementById('manual-review-warning');
        if (warning) {
            warning.remove();
        }
        await markThreadCompleted();
    }

    // Validate queue state
    async function validateQueueState() {
        const savedQueue = await GM.getValue('threadQueue', []);
        const savedIndex = await GM.getValue('currentThreadIndex', 0);
        
        Logger.info('=== QUEUE STATE VALIDATION ===');
        Logger.info('Saved queue length:', { length: savedQueue.length });
        Logger.info('Saved index:', { index: savedIndex });
        Logger.info('Current threadQueue length:', { length: threadQueue.length });
        Logger.info('Current currentThreadIndex:', { index: currentThreadIndex });
        
        // Check for inconsistencies
        if (savedQueue.length !== threadQueue.length) {
            Logger.warn('⚠️ Queue length mismatch!', {
                savedLength: savedQueue.length,
                currentLength: threadQueue.length
            });
        }
        
        if (savedIndex !== currentThreadIndex) {
            Logger.warn('⚠️ Index mismatch!', {
                savedIndex: savedIndex,
                currentIndex: currentThreadIndex
            });
        }
        
        // Check for index out of bounds
        if (savedIndex >= savedQueue.length && savedQueue.length > 0) {
            Logger.warn('⚠️ Index out of bounds!', {
                index: savedIndex,
                queueLength: savedQueue.length,
                message: 'This indicates the queue is complete or corrupted'
            });
        }
        
        return { savedQueue, savedIndex };
    }

    // Check and continue queue when returning to unresolved page
    async function checkAndContinueQueue() {
        try {
            Logger.info('=== checkAndContinueQueue called ===');
            
            // Validate queue state first
            const { savedQueue, savedIndex } = await validateQueueState();
            
            Logger.info('Checking queue state:', { 
                savedQueueLength: savedQueue.length, 
                savedIndex,
                savedQueue: savedQueue
            });
            
            if (savedQueue.length > 0 && savedIndex < savedQueue.length) {
                Logger.info(`Found active queue: ${savedIndex}/${savedQueue.length} threads processed`);
                Logger.info('Continuing queue...');
                
                // Check if script is still active
                const scriptActive = await isScriptActive();
                if (!scriptActive) {
                    Logger.info('Script is not active - clearing queue');
                    await GM.setValue('threadQueue', []);
                    await GM.setValue('currentThreadIndex', 0);
                    return;
                }
                
                // Restore queue state
                threadQueue = savedQueue;
                currentThreadIndex = savedIndex;
                Logger.info('Restored queue state:', { 
                    queueLength: threadQueue.length, 
                    currentIndex: currentThreadIndex,
                    fullQueue: threadQueue,
                    nextThread: threadQueue[currentThreadIndex]
                });
                
                // Show visual indicator that queue is continuing
                const continueIndicator = document.createElement('div');
                continueIndicator.id = 'queue-continue-indicator';
                continueIndicator.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #17a2b8;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    z-index: 10002;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                continueIndicator.innerHTML = `
                    <h3>🔄 Continuing Queue</h3>
                    <p>Opening next thread in <span id="countdown">5</span> seconds...</p>
                    <p>Progress: ${savedIndex + 1}/${savedQueue.length}</p>
                `;
                document.body.appendChild(continueIndicator);
                
                // Countdown timer
                let countdown = 5;
                const countdownElement = document.getElementById('countdown');
                const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdownElement) {
                        countdownElement.textContent = countdown;
                    }
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                        if (continueIndicator.parentElement) {
                            continueIndicator.remove();
                        }
                        Logger.info('Starting processNextThread from checkAndContinueQueue');
                        Logger.info('Current queue state before processNextThread:', { 
                            currentThreadIndex, 
                            queueLength: threadQueue.length,
                            nextThreadUrl: threadQueue[currentThreadIndex]
                        });
                        processNextThread();
                    }
                }, 1000);
            } else {
                Logger.info('No active queue found or queue completed');
            }
        } catch (error) {
            Logger.error('Error checking queue:', { error: error.message });
        }
    }

    // Mark thread as completed and continue queue
    async function markThreadCompleted() {
        Logger.info('=== markThreadCompleted called ===');
        Logger.info('Before increment:', { 
            currentThreadIndex, 
            queueLength: threadQueue.length,
            currentUrl: window.location.href
        });
        Logger.info('Thread queue:', { queue: threadQueue });
        
        // Enhanced execution guard with timestamp
        const executionKey = `markThreadCompleted_${Date.now()}`;
        if (window.markThreadCompletedExecuting) {
            Logger.warn('markThreadCompleted already executing - skipping duplicate call', {
                existingExecution: window.markThreadCompletedExecuting,
                newExecution: executionKey,
                currentUrl: window.location.href
            });
            return;
        }
        window.markThreadCompletedExecuting = executionKey;
        Logger.info('markThreadCompleted execution guard set:', { executionKey });
        
        try {
                    // Get the thread URL that was just completed for better debugging
        const completedThreadUrl = window.location.href;
        const completedThreadIndex = currentThreadIndex;
        
        // Validate that we're not jumping ahead unexpectedly
        const expectedNextIndex = completedThreadIndex + 1;
        if (currentThreadIndex !== completedThreadIndex) {
            Logger.warn('Index mismatch detected!', {
                expected: completedThreadIndex,
                actual: currentThreadIndex,
                message: 'This might indicate multiple executions or state corruption'
            });
        }
        
        // Increment the current thread index since we're done with this thread
        currentThreadIndex = expectedNextIndex;
        Logger.info(`Completed thread ${completedThreadIndex + 1}/${threadQueue.length}`, {
            completedUrl: completedThreadUrl,
            nextIndex: currentThreadIndex,
            nextUrl: threadQueue[currentThreadIndex],
            progress: `${currentThreadIndex}/${threadQueue.length}`
        });
            
            // Save updated index to storage
            Logger.info('Saving updated index to storage:', { index: currentThreadIndex });
            await GM.setValue('currentThreadIndex', currentThreadIndex);
            Logger.info('Index saved successfully');
        
        if (currentThreadIndex >= threadQueue.length) {
            console.log('All threads processed - queue complete');
            
            // Show completion message
            const solvedCount = await GM.getValue('solvedThreads', 0);
            console.log(`=== PROCESS COMPLETED ===`);
            console.log(`Total threads processed: ${threadQueue.length}`);
            console.log(`Threads solved: ${solvedCount}`);
            
            // Show visual completion indicator
            showCompletionIndicator(threadQueue.length, solvedCount);
            
            // Clear queue from storage and set script as inactive
            await GM.setValue('threadQueue', []);
            await GM.setValue('currentThreadIndex', 0);
            await setScriptActive(false);
            console.log('Queue cleared from storage and script set as inactive');
            
            // Navigate back to the original unresolved page after completion
            setTimeout(async () => {
                const originalUnresolvedPageUrl = await GM.getValue('originalUnresolvedPageUrl', 'https://wordpress.org/support/plugin/woocommerce/unresolved/page/1/');
                console.log('=== NAVIGATING BACK TO ORIGINAL PAGE ===');
                console.log('Original page URL:', originalUnresolvedPageUrl);
                console.log('Current page URL:', window.location.href);
                window.location.href = originalUnresolvedPageUrl;
            }, 3000); // Wait 3 seconds to show completion message before navigating
            
            return;
        }
        
        // Navigate back to unresolved page to continue queue
        console.log('Navigating back to unresolved page to continue queue');
        console.log('Next thread URL will be:', threadQueue[currentThreadIndex]);
        setTimeout(async () => {
            // Navigate back to the original unresolved page where the script was started
            const originalUnresolvedPageUrl = await GM.getValue('originalUnresolvedPageUrl', 'https://wordpress.org/support/plugin/woocommerce/unresolved/page/1/');
            console.log('Navigating back to original unresolved page:', originalUnresolvedPageUrl);
            window.location.href = originalUnresolvedPageUrl;
        }, 2000);
        } catch (error) {
            console.error('Error in markThreadCompleted:', error);
        } finally {
            Logger.info('markThreadCompleted execution guard cleared:', { executionKey });
            window.markThreadCompletedExecuting = false;
        }
    }

    // Enhanced skip thread function that handles queue completion
    async function skipCurrentThread() {
        Logger.info('=== skipCurrentThread called ===');
        Logger.info('Current state before skip:', { 
            currentThreadIndex, 
            queueLength: threadQueue.length,
            currentUrl: window.location.href
        });
        
        // Check if this is the last thread in the queue
        if (currentThreadIndex >= threadQueue.length - 1) {
            Logger.info('Skipping last thread in queue - queue will be complete');
            
            // Show completion message for skipped last thread
            const solvedCount = await GM.getValue('solvedThreads', 0);
            console.log(`=== PROCESS COMPLETED (SKIPPED LAST THREAD) ===`);
            console.log(`Total threads processed: ${threadQueue.length}`);
            console.log(`Threads solved: ${solvedCount}`);
            
            // Show visual completion indicator
            showCompletionIndicator(threadQueue.length, solvedCount);
            
            // Clear queue from storage and set script as inactive
            await GM.setValue('threadQueue', []);
            await GM.setValue('currentThreadIndex', 0);
            await setScriptActive(false);
            console.log('Queue cleared from storage and script set as inactive');
            
            // Navigate back to the original unresolved page immediately
            setTimeout(async () => {
                const originalUnresolvedPageUrl = await GM.getValue('originalUnresolvedPageUrl', 'https://wordpress.org/support/plugin/woocommerce/unresolved/page/1/');
                console.log('=== NAVIGATING BACK TO ORIGINAL PAGE (SKIPPED LAST) ===');
                console.log('Original page URL:', originalUnresolvedPageUrl);
                console.log('Current page URL:', window.location.href);
                window.location.href = originalUnresolvedPageUrl;
            }, 2000);
            
            return;
        }
        
        // Regular skip - increment index and continue to next thread
        currentThreadIndex++;
        Logger.info(`Skipped thread ${currentThreadIndex}/${threadQueue.length}`, {
            nextUrl: threadQueue[currentThreadIndex],
            progress: `${currentThreadIndex + 1}/${threadQueue.length}`
        });
        
        // Save updated index to storage
        await GM.setValue('currentThreadIndex', currentThreadIndex);
        Logger.info('Skip index saved to storage');
        
        // Navigate back to unresolved page to continue queue
        setTimeout(async () => {
            const originalUnresolvedPageUrl = await GM.getValue('originalUnresolvedPageUrl', 'https://wordpress.org/support/plugin/woocommerce/unresolved/page/1/');
            console.log('Navigating back to original unresolved page after skip:', originalUnresolvedPageUrl);
            window.location.href = originalUnresolvedPageUrl;
        }, 1000);
    }

    // Show queue status on unresolved page
    async function showQueueStatus() {
        try {
            const savedQueue = await GM.getValue('threadQueue', []);
            const savedIndex = await GM.getValue('currentThreadIndex', 0);
            
            if (savedQueue.length > 0 && savedIndex < savedQueue.length) {
                const statusDiv = document.createElement('div');
                statusDiv.id = 'queue-status';
                statusDiv.style.cssText = `
                    position: fixed;
                    top: 60px;
                    left: 20px;
                    background: #d4edda;
                    border: 2px solid #28a745;
                    border-radius: 8px;
                    padding: 15px;
                    z-index: 10001;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 14px;
                `;
                
                // Get the actual solved count for accurate progress
                const solvedCount = await GM.getValue('solvedThreads', 0);
                
                statusDiv.innerHTML = `
                    <strong>🔄 Queue Active</strong><br>
                    Progress: ${savedIndex + 1}/${savedQueue.length} threads processed<br>
                    Solved: ${solvedCount} threads<br>
                    Remaining: ${savedQueue.length - savedIndex - 1} threads
                `;
                
                document.body.appendChild(statusDiv);
                
                // Auto-remove after 10 seconds
                setTimeout(() => {
                    if (document.getElementById('queue-status')) {
                        document.getElementById('queue-status').remove();
                    }
                }, 10000);
            }
        } catch (error) {
            console.error('Error showing queue status:', error);
        }
    }

    // Show completion indicator instead of popup
    function showCompletionIndicator(openCount, solvedCount) {
        const completionDiv = document.createElement('div');
        completionDiv.id = 'completion-indicator';
        completionDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #d1ecf1;
            border: 2px solid #17a2b8;
            border-radius: 8px;
            padding: 20px;
            z-index: 10002;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        completionDiv.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #0c5460;">✅ Process Completed</h3>
            <p style="margin: 0 0 10px 0;"><strong>Threads processed:</strong> ${openCount}</p>
            <p style="margin: 0 0 10px 0;"><strong>Threads solved:</strong> ${solvedCount}</p>
            <p style="margin: 0 0 15px 0; color: #6c757d; font-size: 12px;">Processed = opened and reviewed | Solved = actually resolved</p>
            <p style="margin: 0 0 15px 0; color: #17a2b8; font-size: 14px; font-weight: 500;">🔄 Returning to original page in 3 seconds...</p>
            <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        
        document.body.appendChild(completionDiv);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (document.getElementById('completion-indicator')) {
                document.getElementById('completion-indicator').remove();
            }
        }, 15000);
    }

    // Navigate back to unresolved page to continue queue
    function navigateToUnresolvedPage() {
        // Get the current page number from the queue context
        const currentUrl = window.location.href;
        let unresolvedPageUrl = 'https://wordpress.org/support/plugin/woocommerce/unresolved/page/1/';
        
        // Try to extract page number from current URL or use default
        const pageMatch = currentUrl.match(/\/unresolved\/page\/(\d+)\//);
        if (pageMatch) {
            unresolvedPageUrl = `https://wordpress.org/support/plugin/woocommerce/unresolved/page/${pageMatch[1]}/`;
        }
        
        console.log(`Navigating back to unresolved page: ${unresolvedPageUrl}`);
        window.location.href = unresolvedPageUrl;
    }

    // Show simple manual review warning for production mode
    function showSimpleManualReviewWarning(reason) {
        // Remove any existing warning
        const existingWarning = document.getElementById('manual-review-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        const warning = document.createElement('div');
        warning.id = 'manual-review-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 350px;
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        warning.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #856404; font-size: 16px;">⚠️ Manual Review Required</h3>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #856404;">×</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 10px 0; color: #856404; font-weight: 500;">This thread requires manual review:</p>
                
                <div style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
                    <strong style="color: #dc3545;">Reason:</strong><br>
                    <span style="color: #dc3545;">${reason}</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="document.getElementById('manual-review-warning').remove(); skipCurrentThread();" style="flex: 1; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Skip & Continue</button>
                <button onclick="document.getElementById('manual-review-warning').remove();" style="flex: 1; padding: 8px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Review Manually</button>
            </div>
            
            <div style="margin-top: 10px; font-size: 11px; color: #6c757d;">
                <strong>Thread URL:</strong><br>
                <a href="${window.location.href}" target="_blank" style="color: #007cba; word-break: break-all;">${window.location.href}</a>
            </div>
        `;

        document.body.appendChild(warning);
        
        // Auto-remove after 30 seconds if not dismissed
        setTimeout(() => {
            if (document.getElementById('manual-review-warning')) {
                document.getElementById('manual-review-warning').remove();
            }
        }, 30000);
    }

    function isValidPage() {
        // Check if we're on any unresolved page (not just main WooCommerce)
        const isValid = window.location.href.includes('/unresolved/');
        console.log('isValidPage check:', isValid, window.location.href);
        return isValid;
    }

    function isTopicPage() {
        // More comprehensive topic page detection
        const url = window.location.href;
        const isTopic = url.includes('/support/topic/') || 
                       url.includes('/topic/') || 
                       document.querySelector('.bbp-topic-title, .bbp-reply-content, .bbp-topic-content');
        
        console.log('Is topic page check:', {
            url: url,
            includesSupportTopic: url.includes('/support/topic/'),
            includesTopic: url.includes('/topic/'),
            hasTopicElements: !!document.querySelector('.bbp-topic-title, .bbp-reply-content, .bbp-topic-content'),
            isTopic: isTopic
        });
        
        return isTopic;
    }

    // Initialize
    async function initializeScript() {
        console.log('=== SCRIPT STARTING ===');
        console.log('Current URL:', window.location.href);
        console.log('Script file loaded successfully');
        
        // First, load settings and initialize Logger on every page
        await loadSettings();
        
        console.log('=== SCRIPT INITIALIZATION DEBUG ===');
        console.log('CONFIG.forums after loadSettings:', CONFIG.forums);
        console.log('CONFIG.forums length:', CONFIG.forums.length);
        
        Logger.info('=== WOOCOMMERCE THREAD SCRIPT STARTED ===');
        Logger.info('Script loaded, checking page type...');
        Logger.info('Current URL:', { url: window.location.href });
        Logger.info('Test mode setting:', { testMode: CONFIG.testMode });
        Logger.info('Document ready state:', { readyState: document.readyState });
        Logger.info('Page title:', { title: document.title });
        
        // Script loaded successfully
        console.log('WooCommerce Thread Script loaded successfully');
        
        // Determine page type for logging
        const isValidPageResult = isValidPage();
        const isTopicPageResult = isTopicPage();
        const pageType = isValidPageResult ? 'Unresolved' : isTopicPageResult ? 'Topic' : 'Other';
        console.log('Page type detection:', {
            isValidPage: isValidPageResult,
            isTopicPage: isTopicPageResult,
            pageType: pageType,
            url: window.location.href
        });
        
                        // Add a more visible test indicator - only show when script is actively processing
                const showScriptIndicator = async () => {
                    const scriptActive = await isScriptActive();
                    if (scriptActive) {
                        const testIndicator = document.createElement('div');
                        testIndicator.id = 'test-indicator';
                        testIndicator.style.cssText = `
                            position: fixed;
                            top: 70px;
                            left: 10px;
                            background: red;
                            color: white;
                            padding: 5px 10px;
                            border-radius: 3px;
                            font-size: 12px;
                            z-index: 10000;
                            font-family: Arial, sans-serif;
                            cursor: pointer;
                        `;
                        
                        // Get queue progress for the indicator
                        const savedQueue = await GM.getValue('threadQueue', []);
                        const savedIndex = await GM.getValue('currentThreadIndex', 0);
                        const solvedCount = await GM.getValue('solvedThreads', 0);
                        
                        if (savedQueue.length > 0) {
                            testIndicator.textContent = `Script Running: ${savedIndex + 1}/${savedQueue.length} (${solvedCount} solved) - ${new Date().toLocaleTimeString()}`;
                        } else {
                            testIndicator.textContent = `Script Running: ${new Date().toLocaleTimeString()}`;
                        }
                        
                        // Add click handler for force stop
                        testIndicator.addEventListener('click', async () => {
                            if (confirm('🛑 Force Stop Script?\n\nThis will immediately stop the script and clear all queue state.\n\nAre you sure you want to force stop?')) {
                                await forceStopScript();
                            }
                        });
                        
                        // Add hover effect to indicate it's clickable
                        testIndicator.title = 'Click to force stop script';
                        testIndicator.style.cursor = 'pointer';
                        
                        document.body.appendChild(testIndicator);
                    }
                };
                showScriptIndicator();
        
                // Settings are already loaded in initializeScript
        try {
            console.log('=== BUTTON CREATION CHECK ===');
            console.log('isValidPage() result:', isValidPage());
            console.log('Current URL:', window.location.href);
            
            if (isValidPage()) {
                Logger.info('Creating button for unresolved page');
                console.log('Creating button for unresolved page...');
                createButton();
                
                // Check if we have an active queue to continue (but not if we just started)
                const scriptActive = await isScriptActive();
                Logger.info('Checking for active queue on unresolved page:', { scriptActive });
                
                if (scriptActive) {
                    Logger.info('Script is active, checking for existing queue to continue...');
                    checkAndContinueQueue();
                } else {
                    Logger.info('Script not active, no queue to continue');
                }
                
                // Queue status is now handled by the red "Script Running" indicator
                // showQueueStatus(); // Removed to avoid duplicate indicators
            } else if (isTopicPage()) {
                Logger.info('Topic page detected');
                Logger.info('Topic page URL:', { url: window.location.href });
                Logger.info('Page title:', { title: document.title });
                Logger.info('DOM elements found:', {
                    hasTopicTitle: !!document.querySelector('.bbp-topic-title'),
                    hasReplyContent: !!document.querySelector('.bbp-reply-content'),
                    hasTopicContent: !!document.querySelector('.bbp-topic-content'),
                    hasReplyForm: !!document.querySelector('form#replyform, form.reply-form, form#new-post'),
                    hasTextarea: !!document.querySelector('form textarea, form#replyform textarea, textarea#bbp_reply_content')
                });
                
                // Check if script is actively processing before doing anything
                const scriptActive = await isScriptActive();
                Logger.info('Script active state:', { active: scriptActive });
                
                if (!scriptActive) {
                    Logger.info('Script not active - skipping thread processing');
                    return;
                }
                
                // Restore queue state from storage for thread pages
                const savedQueue = await GM.getValue('threadQueue', []);
                const savedIndex = await GM.getValue('currentThreadIndex', 0);
                threadQueue = savedQueue;
                currentThreadIndex = savedIndex;
                Logger.info('Restored queue state:', { 
                    queueLength: threadQueue.length, 
                    currentIndex: currentThreadIndex,
                    savedQueue: savedQueue,
                    savedIndex: savedIndex
                });
                
                // Validate the restored state
                await validateQueueState();
                
                // Only process if this is part of an active queue
                if (threadQueue.length > 0 && currentThreadIndex < threadQueue.length) {
                    Logger.info('Running thread analysis on topic page (active queue detected)', {
                        queueLength: threadQueue.length,
                        currentIndex: currentThreadIndex,
                        currentUrl: window.location.href,
                        expectedUrl: threadQueue[currentThreadIndex]
                    });
                    
                    // Prevent multiple executions on topic page
                    if (window.topicPageProcessing) {
                        console.log('Topic page already processing - skipping');
                        return;
                    }
                    window.topicPageProcessing = true;
                    
                // Single execution with shorter delay
                setTimeout(async () => {
                        Logger.info('Starting markAsResolved function...');
                        Logger.info('Current queue state before processing:', { currentThreadIndex, queueLength: threadQueue.length });
                        Logger.info('Script active state:', { active: await isScriptActive() });
                        Logger.info('Thread queue from storage:', { queue: await GM.getValue('threadQueue', []) });
                        
                    const wasSolved = await markAsResolved();
                        Logger.info('markAsResolved result:', { solved: wasSolved });
                        
                    if (wasSolved) {
                        const currentCount = await GM.getValue('solvedThreads', 0);
                        await GM.setValue('solvedThreads', currentCount + 1);
                            Logger.info('Thread solved, updated count:', { count: currentCount + 1 });
                        } else {
                            Logger.info('Thread was not solved');
                        }
                        
                        // markThreadCompleted is already called by markAsResolved function
                        // No need to call it again here
                        Logger.info('markAsResolved completed, markThreadCompleted will be called by markAsResolved');
                        
                        // Reset topic page processing flag
                        window.topicPageProcessing = false;
                    }, 1000); // Increased delay to ensure page is fully loaded
                            } else {
                    Logger.info('No active queue or queue completed - skipping thread processing', {
                        queueLength: threadQueue.length,
                        currentIndex: currentThreadIndex,
                        hasQueue: threadQueue.length > 0,
                        indexInBounds: currentThreadIndex < threadQueue.length,
                        currentUrl: window.location.href
                    });
                }
            } else {
                Logger.info('Not a supported page type');
                Logger.info('Current URL:', { url: window.location.href });
                Logger.info('Page validation results:', { 
                    isValidPage: isValidPage(), 
                    isTopicPage: isTopicPage() 
                });
            }
        } catch (error) {
            Logger.error('Error in initializeScript:', { error: error.message });
        }
    }

    // Simple initialization - only run once
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        // If DOM is already loaded, initialize immediately
        initializeScript();
    }
    
    // Also run when page is fully loaded (for dynamic content)
    window.addEventListener('load', () => {
        console.log('Window load event fired');
        console.log('Final URL:', window.location.href);
        console.log('Final page title:', document.title);
    });

    // Human review dialog for thread resolution
    function showHumanReviewDialog(threadData) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.id = 'human-review-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.3);
                backdrop-filter: blur(2px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            `;
            
            dialog.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 0;
                    max-width: 700px;
                    width: 90%;
                    max-height: 85vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                    border: 1px solid #e1e5e9;
                ">
                                        <!-- Header -->
                    <div style="background: linear-gradient(135deg, #7f54b3 0%, #9b6dff 100%); color: white; padding: 16px; text-align: center;">
                        <h2 style="margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.3px;">Thread Review</h2>
                        <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.9;">Review and resolve support threads faster</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 16px; max-height: 60vh; overflow-y: auto;">
                        <div style="margin-bottom: 20px; padding: 12px; background: #f6f7f7; border-radius: 8px; border-left: 4px solid ${threadData.canResolve ? '#00a32a' : '#d63638'};">
                            <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Thread Status</h4>
                            <p style="margin: 6px 0; font-size: 11px; color: #646970;"><strong>URL:</strong> <a href="${threadData.url}" target="_blank" style="color: #007cba; text-decoration: none;">${threadData.url}</a></p>
                            <p style="margin: 6px 0; font-size: 11px; color: #646970;"><strong>Analysis:</strong> <span style="color: ${threadData.canResolve ? '#00a32a' : '#d63638'}; font-weight: 600;">${threadData.canResolve ? 'Ready to Resolve' : 'Requires Manual Review'}</span></p>
                            ${!threadData.canResolve && threadData.analysis ? `
                                <div style="margin-top: 8px; padding: 8px; background: #fff; border-radius: 4px; border: 1px solid #ddd;">
                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #d63638; font-weight: 600;">Manual Review Required Because:</p>
                                    <ul style="margin: 0; padding-left: 15px; font-size: 10px; color: #d63638;">
                                        ${threadData.analysis.details ? 
                                            threadData.analysis.details.filter(d => d.startsWith('❌')).map(detail => `<li>${detail.replace('❌', '').trim()}</li>`).join('') :
                                            `<li>${threadData.analysis.reason || 'Unknown reason'}</li>`
                                        }
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Last Reply Preview</h4>
                            <div style="padding: 12px; background: #f6f7f7; border-left: 4px solid #007cba; border-radius: 6px; max-height: 120px; overflow-y: auto; font-size: 11px; line-height: 1.5; color: #1d2327;">
                                ${threadData.lastReply || 'No reply content available'}
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1d2327;">AI Generated Message</h4>
                            <div style="padding: 12px; background: #f0f6fc; border-left: 4px solid #00a32a; border-radius: 6px; max-height: 120px; overflow-y: auto; font-size: 11px; line-height: 1.5; color: #1d2327;">
                                ${threadData.aiMessage || 'No AI message generated'}
                            </div>
                            ${!threadData.aiMessage ? `
                                <div style="margin-top: 8px; padding: 8px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffc107;">
                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #856404; font-weight: 600;">AI Message Not Generated Because:</p>
                                    <ul style="margin: 0; padding-left: 15px; font-size: 10px; color: #856404;">
                                        ${!CONFIG.openaiApiKey || CONFIG.openaiApiKey === 'YOUR_OPENAI_API_KEY_HERE' ? '<li>No valid OpenAI API key configured</li>' : ''}
                                        ${threadData.canResolve ? '<li>Thread analysis failed or returned empty response</li>' : '<li>Thread cannot be resolved automatically</li>'}
                                        <li>Check browser console for detailed error logs</li>
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px;">
                        <button id="auto-resolve-btn" style="
                            padding: 12px 16px;
                            background: #00a32a;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        ">✅ Auto-Resolve</button>
                        
                        <button id="manual-reply-btn" style="
                            padding: 12px 16px;
                            background: #007cba;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        ">✏️ Manual Reply</button>
                        
                        <button id="skip-thread-btn" style="
                            padding: 12px 16px;
                            background: #dba617;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        ">⏭️ Skip Thread</button>
                        
                        <button id="cancel-process-btn" style="
                            padding: 12px 16px;
                            background: #d63638;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        ">❌ Cancel Process</button>
                        
                        <button id="force-stop-btn" style="
                            padding: 12px 16px;
                            background: #8B0000;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        ">🛑 Force Stop Script</button>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="padding: 12px 16px; background: #f6f7f7; border-top: 1px solid #dcdcde; text-align: center;">
                    ${CONFIG.enableReviewTimer ? `
                        <div style="color: #646970; font-size: 11px; margin-bottom: 2px;">
                            <span id="timeout-counter">Time remaining: <span id="timeout-seconds" style="font-weight: 600;">30</span>s</span>
                        </div>
                        <div style="color: #646970; font-size: 10px;">
                            ${CONFIG.autoContinueAfterTimeout ? 'Will auto-continue if no action taken' : 'Manual action required'}
                        </div>
                    ` : `
                        <div style="color: #646970; font-size: 11px;">
                            Timer disabled - take your time to review
                        </div>
                    `}
                </div>
            </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Timeout handling
            let timeoutInterval;
            if (CONFIG.enableReviewTimer) {
                let timeLeft = Math.floor(CONFIG.reviewTimeout / 1000);
                const timeoutCounter = document.getElementById('timeout-seconds');
                timeoutInterval = setInterval(() => {
                    timeLeft--;
                    if (timeoutCounter) {
                        timeoutCounter.textContent = timeLeft;
                    }
                    if (timeLeft <= 0) {
                        clearInterval(timeoutInterval);
                        if (CONFIG.autoContinueAfterTimeout) {
                            dialog.remove();
                            resolve('auto-continue');
                        }
                    }
                }, 1000);
            }
            
            // Button event handlers
            document.getElementById('auto-resolve-btn').onclick = () => {
                if (timeoutInterval) clearInterval(timeoutInterval);
                dialog.remove();
                resolve('auto-resolve');
            };
            
            document.getElementById('manual-reply-btn').onclick = () => {
                if (timeoutInterval) clearInterval(timeoutInterval);
                dialog.remove();
                resolve('manual-reply');
            };
            
            document.getElementById('skip-thread-btn').onclick = async () => {
                if (timeoutInterval) clearInterval(timeoutInterval);
                dialog.remove();
                await skipCurrentThread();
                resolve('skip');
            };
            
            document.getElementById('cancel-process-btn').onclick = () => {
                if (timeoutInterval) clearInterval(timeoutInterval);
                dialog.remove();
                resolve('cancel');
            };
            
            document.getElementById('force-stop-btn').onclick = async () => {
                if (timeoutInterval) clearInterval(timeoutInterval);
                dialog.remove();
                await forceStopScript();
                resolve('force-stop');
            };
        });
    }

    // Show continue dialog after manual reply
    function showContinueDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.id = 'continue-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                padding: 25px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                min-width: 300px;
            `;
            
            dialog.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: #333;">Manual Reply Submitted</h3>
                <p style="margin: 0 0 20px 0; color: #666;">Your manual reply has been submitted. What would you like to do next?</p>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="continue-queue-btn" style="
                        padding: 10px 20px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Continue Queue</button>
                    
                    <button id="stop-process-btn" style="
                        padding: 10px 20px;
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Stop Process</button>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            document.getElementById('continue-queue-btn').onclick = () => {
                dialog.remove();
                resolve('continue');
            };
            
            document.getElementById('stop-process-btn').onclick = () => {
                dialog.remove();
                resolve('stop');
            };
        });
    }

    // Check if script is actively processing
    async function isScriptActive() {
        return await GM.getValue('scriptActive', false);
    }

    // Set script active state
    async function setScriptActive(active) {
        Logger.info('Setting script active state:', { active: active });
        await GM.setValue('scriptActive', active);
        Logger.info('Script active state set successfully');
        
        // Update visual indicator based on active state
        const testIndicator = document.getElementById('test-indicator');
        if (testIndicator) {
            if (active) {
                testIndicator.style.display = 'block';
                
                // Get queue progress for the indicator
                const savedQueue = await GM.getValue('threadQueue', []);
                const savedIndex = await GM.getValue('currentThreadIndex', 0);
                const solvedCount = await GM.getValue('solvedThreads', 0);
                
                if (savedQueue.length > 0) {
                    testIndicator.textContent = `Script Running: ${savedIndex}/${savedQueue.length} (${solvedCount} solved) - ${new Date().toLocaleTimeString()}`;
                } else {
                    testIndicator.textContent = `Script Running: ${new Date().toLocaleTimeString()}`;
                }
            } else {
                testIndicator.remove();
                
                // If script is being deactivated and we're on a topic page, navigate back to original page
                if (!active && window.location.href.includes('/support/topic/')) {
                    console.log('Script deactivated on topic page - navigating back to original page');
                    setTimeout(async () => {
                        const originalUnresolvedPageUrl = await GM.getValue('originalUnresolvedPageUrl', 'https://wordpress.org/support/plugin/woocommerce/unresolved/page/1/');
                        console.log('Navigating back to original page after script deactivation:', originalUnresolvedPageUrl);
                        window.location.href = originalUnresolvedPageUrl;
                    }, 2000);
                }
            }
        }
    }

    // Debug functions
    function showLogsDialog() {
        const logs = Logger.exportLogs();
        
        const dialog = document.createElement('div');
        dialog.id = 'logs-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        
        dialog.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                max-width: 90%;
                max-height: 80vh;
                width: 800px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #333;">📋 Script Debug Logs</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">×</button>
                </div>
                
                <div style="flex: 1; overflow-y: auto; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 15px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4;">
                    <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${logs}</pre>
                </div>
                
                <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="copyLogsToClipboard()" style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy to Clipboard</button>
                    <button onclick="downloadLogs()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Download Logs</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    function exportLogs() {
        const logs = Logger.exportLogs();
        
        // Copy to clipboard
        navigator.clipboard.writeText(logs).then(() => {
            alert('✅ Logs copied to clipboard!\n\nYou can now paste them here for analysis.');
        }).catch(() => {
            // Fallback: show in dialog
            showLogsDialog();
        });
    }
    
    function clearLogs() {
        if (confirm('🗑️ Clear all debug logs?\n\nThis will remove all stored log entries.')) {
            Logger.clearLogs();
            alert('✅ All logs cleared!');
        }
    }
    
    // Helper functions for logs dialog
    window.copyLogsToClipboard = function() {
        const logs = Logger.exportLogs();
        navigator.clipboard.writeText(logs).then(() => {
            alert('✅ Logs copied to clipboard!');
        }).catch(() => {
            alert('❌ Failed to copy to clipboard. Please select and copy manually.');
        });
    };
    
    window.downloadLogs = function() {
        const logs = Logger.exportLogs();
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `woocommerce-script-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Force stop script function
    async function forceStopScript() {
        console.log('=== FORCE STOP SCRIPT INITIATED ===');
        
        // Show force stop indicator
        const forceStopIndicator = document.createElement('div');
        forceStopIndicator.id = 'force-stop-indicator';
        forceStopIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10003;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
        `;
        forceStopIndicator.innerHTML = `
            <h3>🛑 Script Force Stopped</h3>
            <p>All queue state has been cleared.</p>
            <p>You can start a new queue when ready.</p>
        `;
        document.body.appendChild(forceStopIndicator);
        
        // Clear all queue state
        await GM.setValue('threadQueue', []);
        await GM.setValue('currentThreadIndex', 0);
        await GM.setValue('solvedThreads', 0);
        await setScriptActive(false);
        
        // Clear any execution flags
        window.markThreadCompletedExecuting = false;
        window.processNextThreadExecuting = false;
        window.topicPageProcessing = false;
        
        // Remove any existing indicators
        const testIndicator = document.getElementById('test-indicator');
        if (testIndicator) testIndicator.remove();
        
        const queueStatus = document.getElementById('queue-status');
        if (queueStatus) queueStatus.remove();
        
        const queueContinueIndicator = document.getElementById('queue-continue-indicator');
        if (queueContinueIndicator) queueContinueIndicator.remove();
        
        console.log('Script force stopped - all state cleared');
        
        // Auto-remove force stop indicator after 5 seconds
        setTimeout(() => {
            if (document.getElementById('force-stop-indicator')) {
                document.getElementById('force-stop-indicator').remove();
            }
        }, 5000);
    }

    // Wait for manual reply submission
    async function waitForManualReply() {
        return new Promise((resolve) => {
            // Monitor for form submission
            const checkSubmission = () => {
                // Check if we're on a different page (submission successful)
                if (document.location.href !== window.location.href) {
                    resolve('submitted');
                    return;
                }
                
                // Check if form was submitted (page reload or redirect)
                if (document.readyState === 'loading') {
                    resolve('submitted');
                    return;
                }
                
                // Continue monitoring
                setTimeout(checkSubmission, 1000);
            };
            
            checkSubmission();
        });
    }

    // Rate limiting functions for Google AI API
    async function checkRateLimit() {
        if (!CONFIG.enableRateLimiting) {
            return true; // Rate limiting disabled
        }

        const now = Date.now();
        const today = new Date().toDateString();
        
        // Get current rate limit data
        const rateLimitData = await GM.getValue('rateLimitData', {
            requestsToday: 0,
            lastRequestTime: 0,
            today: today
        });

        // Reset daily counter if it's a new day
        if (rateLimitData.today !== today) {
            rateLimitData.requestsToday = 0;
            rateLimitData.today = today;
        }

        // Check daily limit
        if (rateLimitData.requestsToday >= CONFIG.maxRequestsPerDay) {
            console.log(`Daily rate limit reached: ${rateLimitData.requestsToday}/${CONFIG.maxRequestsPerDay}`);
            return false;
        }

        // Check if enough time has passed since last request
        const timeSinceLastRequest = now - rateLimitData.lastRequestTime;
        if (timeSinceLastRequest < CONFIG.rateLimitDelay) {
            const waitTime = CONFIG.rateLimitDelay - timeSinceLastRequest;
            console.log(`Rate limit: Waiting ${Math.ceil(waitTime / 1000)} seconds before next request`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Update rate limit data
        rateLimitData.requestsToday++;
        rateLimitData.lastRequestTime = now;
        await GM.setValue('rateLimitData', rateLimitData);

        console.log(`Rate limit: Request ${rateLimitData.requestsToday}/${CONFIG.maxRequestsPerDay} today`);
        return true;
    }

    // Show rate limit warning
    function showRateLimitWarning() {
        const warning = document.createElement('div');
        warning.id = 'rate-limit-warning';
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            z-index: 10003;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
        `;
        
        warning.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #856404;">⚠️ Rate Limit Reached</h3>
            <p style="margin: 0 0 15px 0; color: #856404;">
                You've reached the daily limit for OpenAI API requests (${CONFIG.maxRequestsPerDay} per day).
            </p>
            <p style="margin: 0 0 15px 0; color: #856404;">
                Consider upgrading your OpenAI plan or wait until tomorrow.
            </p>
            <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: #ffc107; color: #856404; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        
        document.body.appendChild(warning);
    }
})();

