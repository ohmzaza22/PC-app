/**
 * Formatting Utilities
 * Common formatting functions for display
 */

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format time for display
 * @param {Date|string} time - Time to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time
 */
export const formatTime = (time, options = {}) => {
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(time).toLocaleTimeString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format date and time for display
 * @param {Date|string} datetime - DateTime to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (datetime) => {
  return `${formatDate(datetime)} at ${formatTime(datetime)}`;
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(date);
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'THB')
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'THB') => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format task status for display
 * @param {string} status - Task status
 * @returns {string} Formatted status
 */
export const formatTaskStatus = (status) => {
  const statusMap = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
    APPROVED: 'Approved',
  };
  return statusMap[status] || status;
};
