/**
 * Utility functions for handling Short Task IDs
 * 
 * Mechanism:
 * We use a deterministic approach to convert the first 6 characters of the UUID (base-16)
 * into a decimal number (base-10). This creates a shorter, numeric-like ID.
 * 
 * Example:
 * UUID: bbeceefb-5ab1-471b-b531-63addc51d41b
 * Prefix (6 chars): bbecee
 * Decimal (Short ID): 12308206
 */

// Generate a Short ID from a UUID
export const uuidToShortId = (uuid) => {
    if (!uuid || typeof uuid !== 'string') return '';
    // Take first 6 characters of UUID which is typically enough uniqueness for display (16^6 combinations)
    const prefix = uuid.replace(/-/g, '').substring(0, 6);
    // Convert hex to decimal
    return parseInt(prefix, 16).toString();
};

// Get the UUID prefix (hex) from a Short ID
export const shortIdToUuidPrefix = (shortId) => {
    if (!shortId) return '';
    try {
        // Convert decimal string back to hex
        let hex = parseInt(shortId, 10).toString(16);
        // Pad with leading zeros if necessary (though rare for 6 chars)
        while (hex.length < 6) {
            hex = '0' + hex;
        }
        return hex;
    } catch (e) {
        console.error('Error converting short ID to prefix:', e);
        return '';
    }
};

// Check if an ID string looks like a Short ID (numeric, < 10 chars) 
// vs a UUID (alphanumeric, > 20 chars)
export const isShortId = (id) => {
    if (!id) return false;
    // Check if numeric and reasonable length for our mechanism (6 hex chars max value is 16777215, so 8 digits max)
    return /^\d+$/.test(id) && id.length < 15;
};
