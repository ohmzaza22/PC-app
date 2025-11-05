/**
 * Common Helper Functions
 * Reusable utility functions used across the application
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const EARTH_RADIUS_METERS = 6371e3;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

/**
 * Parse location data from string or object
 * @param {string|object} location - Location data
 * @returns {object} Parsed location with latitude and longitude
 */
export const parseLocation = (location) => {
  if (!location) return null;
  return typeof location === 'string' ? JSON.parse(location) : location;
};

/**
 * Get database user ID from Clerk ID
 * @param {object} sql - SQL connection instance
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<number>} Database user ID
 */
export const getUserIdFromClerkId = async (sql, clerkId) => {
  const result = await sql`
    SELECT id FROM users WHERE clerk_id = ${clerkId}
  `;
  
  if (!result || result.length === 0) {
    throw new Error('User not found');
  }
  
  return result[0].id;
};

/**
 * Format file path for storage
 * @param {object} file - Multer file object
 * @returns {string|null} Formatted file path
 */
export const formatFilePath = (file) => {
  if (!file) return null;
  
  // Cloud storage (Cloudinary, S3, etc.)
  if (file.path && file.path.startsWith('http')) {
    return file.path;
  }
  
  // Local storage
  return file.filename ? `uploads/${file.filename}` : null;
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Validate required fields
 * @param {object} data - Data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @throws {Error} If required fields are missing
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

/**
 * Sanitize object by removing undefined/null values
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});
};
