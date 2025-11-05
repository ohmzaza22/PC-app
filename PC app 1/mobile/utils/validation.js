/**
 * Validation Utilities
 * Common validation functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if meets minimum length
 */
export const meetsMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if within maximum length
 */
export const isWithinMaxLength = (value, maxLength) => {
  return !value || value.length <= maxLength;
};

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
export const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate GPS coordinates
 * @param {object} location - Location object with latitude and longitude
 * @returns {boolean} True if valid coordinates
 */
export const isValidLocation = (location) => {
  if (!location || typeof location !== 'object') return false;
  const { latitude, longitude } = location;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate positive number
 * @param {*} value - Value to validate
 * @returns {boolean} True if positive number
 */
export const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/**
 * Validate date format
 * @param {*} date - Date to validate
 * @returns {boolean} True if valid date
 */
export const isValidDate = (date) => {
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
};

/**
 * Get validation errors for form fields
 * @param {object} fields - Fields to validate
 * @param {object} rules - Validation rules
 * @returns {object} Validation errors
 */
export const validateForm = (fields, rules) => {
  const errors = {};

  Object.keys(rules).forEach((fieldName) => {
    const value = fields[fieldName];
    const fieldRules = rules[fieldName];

    if (fieldRules.required && !isRequired(value)) {
      errors[fieldName] = fieldRules.requiredMessage || 'This field is required';
      return;
    }

    if (fieldRules.email && value && !isValidEmail(value)) {
      errors[fieldName] = 'Invalid email format';
      return;
    }

    if (fieldRules.phone && value && !isValidPhone(value)) {
      errors[fieldName] = 'Invalid phone number';
      return;
    }

    if (fieldRules.minLength && value && !meetsMinLength(value, fieldRules.minLength)) {
      errors[fieldName] = `Must be at least ${fieldRules.minLength} characters`;
      return;
    }

    if (fieldRules.maxLength && value && !isWithinMaxLength(value, fieldRules.maxLength)) {
      errors[fieldName] = `Must be no more than ${fieldRules.maxLength} characters`;
      return;
    }

    if (fieldRules.min !== undefined && value && parseFloat(value) < fieldRules.min) {
      errors[fieldName] = `Must be at least ${fieldRules.min}`;
      return;
    }

    if (fieldRules.max !== undefined && value && parseFloat(value) > fieldRules.max) {
      errors[fieldName] = `Must be no more than ${fieldRules.max}`;
      return;
    }

    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customError = fieldRules.custom(value, fields);
      if (customError) {
        errors[fieldName] = customError;
      }
    }
  });

  return errors;
};

/**
 * Check if form has errors
 * @param {object} errors - Errors object
 * @returns {boolean} True if has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
