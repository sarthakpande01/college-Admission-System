// Google OAuth Configuration
// Replace these values with your actual Google OAuth credentials

const GOOGLE_CONFIG = {
    // Your Google OAuth Client ID
    // Get this from: https://console.developers.google.com/
    CLIENT_ID: '452260251255-4mil8ci3nr4oiethmmom3nr4oiethmmom3lrgl3vg4aqc.apps.googleusercontent.com',
    
    // OAuth scopes
    SCOPES: [
        'openid',
        'profile', 
        'email'
    ],
    
    // Redirect URI (your domain)
    REDIRECT_URI: window.location.origin,
    
    // Auto select user
    AUTO_SELECT: false,
    
    // Cancel on tap outside
    CANCEL_ON_TAP_OUTSIDE: true,
    
    // Local testing origins
    LOCAL_ORIGINS: [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    
    // Check if current environment supports Google OAuth
    isSupportedEnvironment: function() {
        const currentOrigin = window.location.origin;
        const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
        const isFileProtocol = currentOrigin === 'null' || currentOrigin === 'file://';
        
        return isLocalhost && !isFileProtocol;
    },
    
    // Get appropriate login URI based on environment
    getLoginUri: function() {
        if (this.isSupportedEnvironment()) {
            return window.location.origin;
        }
        return 'http://localhost:8000'; // Default fallback
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOOGLE_CONFIG;
} else {
    window.GOOGLE_CONFIG = GOOGLE_CONFIG;
}
