/**
 * Utility functions for handling URL parameters
 * Helps educators load personalized content through URL parameters
 */

const URLUtils = {
    /**
     * Get a URL parameter value
     * @param {string} paramName - The name of the parameter
     * @returns {string|null} The parameter value or null if not found
     */
    getParam: function(paramName) {
        const params = new URLSearchParams(window.location.search);
        return params.get(paramName);
    },

    /**
     * Get all URL parameters as an object
     * @returns {object} Object containing all parameters
     */
    getAllParams: function() {
        const params = new URLSearchParams(window.location.search);
        const obj = {};
        params.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    },

    /**
     * Check if a parameter exists
     * @param {string} paramName - The name of the parameter
     * @returns {boolean} True if parameter exists
     */
    hasParam: function(paramName) {
        return new URLSearchParams(window.location.search).has(paramName);
    },

    /**
     * Generate a tool URL with parameters
     * @param {string} toolPath - Path to the tool directory
     * @param {object} params - Object with parameters
     * @returns {string} Full URL with parameters
     */
    generateToolUrl: function(toolPath, params) {
        const queryString = new URLSearchParams(params).toString();
        return toolPath + (queryString ? '?' + queryString : '');
    },

    /**
     * Check if a URL is a Google Sheets published CSV
     * @param {string} url - The URL to check
     * @returns {boolean} True if it's a Google Sheets URL
     */
    isGoogleSheetsUrl: function(url) {
        return url && url.includes('docs.google.com/spreadsheets');
    },

    /**
     * Normalize a Google Sheets URL to ensure CSV export
     * Adds or updates the output=csv parameter if needed
     * @param {string} url - The Google Sheets URL
     * @returns {string} Normalized CSV export URL
     */
    normalizeGoogleSheetsUrl: function(url) {
        if (!this.isGoogleSheetsUrl(url)) {
            return url;
        }

        // Remove any existing output parameter
        let normalized = url.replace(/[&?]output=csv/g, '');
        
        // Ensure URL ends with parameters properly
        if (!normalized.includes('?')) {
            normalized += '?';
        } else if (!normalized.endsWith('&') && !normalized.endsWith('?')) {
            normalized += '&';
        }

        // Add CSV output parameter if not present
        if (!normalized.includes('output=csv')) {
            // Remove trailing & or ? if present and re-add with proper format
            normalized = normalized.replace(/[&?]+$/, '');
            normalized += normalized.includes('?') ? '&' : '?';
            normalized += 'output=csv';
        }

        return normalized;
    },

    /**
     * Fetch CSV content from URL with support for Google Sheets and regular URLs
     * @param {string} csvUrl - The CSV URL (can be regular or Google Sheets)
     * @returns {Promise<string>} The CSV content as text
     */
    fetchCSV: async function(csvUrl) {
        if (!csvUrl) {
            throw new Error('No CSV URL provided');
        }

        // Normalize Google Sheets URLs
        const url = this.isGoogleSheetsUrl(csvUrl) 
            ? this.normalizeGoogleSheetsUrl(csvUrl)
            : csvUrl;

        try {
            // Add a simple cache‑buster to the URL so that repeated fetches always
            // hit the server rather than a stale browser/proxy cache.  We also
            // instruct fetch not to use any cached data in case intermediaries
            // ignore query parameters.
            const cacheBuster = `_=${Date.now()}`;
            const fetchUrl = url + (url.includes('?') ? '&' : '?') + cacheBuster;

            const response = await fetch(fetchUrl, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text')) {
                throw new Error('Response is not CSV/text content. Received: ' + contentType);
            }

            return await response.text();
        } catch (error) {
            // Enhanced error message for Google Sheets
            if (this.isGoogleSheetsUrl(csvUrl)) {
                throw new Error(
                    `Failed to load Google Sheet: ${error.message}. ` +
                    `Make sure the sheet is published (File → Share → Publish to web)`
                );
            }
            throw error;
        }
    }
};
