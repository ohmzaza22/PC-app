/**
 * API Response Utilities
 * Provides consistent response formatting across all endpoints
 */

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    status: 'success',
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 * @param {object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
export const sendCreated = (res, data, message = 'Resource created successfully') => {
  sendSuccess(res, data, message, 201);
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {object} errors - Additional error details
 */
export const sendError = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    message,
  };

  if (errors && process.env.NODE_ENV === 'development') {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

/**
 * Send validation error response (400)
 * @param {object} res - Express response object
 * @param {string} message - Validation error message
 * @param {object} errors - Validation errors object
 */
export const sendValidationError = (res, message = 'Validation failed', errors = null) => {
  sendError(res, message, 400, errors);
};

/**
 * Send not found response (404)
 * @param {object} res - Express response object
 * @param {string} resource - Resource name
 */
export const sendNotFound = (res, resource = 'Resource') => {
  sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response (401)
 * @param {object} res - Express response object
 * @param {string} message - Unauthorized message
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  sendError(res, message, 401);
};

/**
 * Send forbidden response (403)
 * @param {object} res - Express response object
 * @param {string} message - Forbidden message
 */
export const sendForbidden = (res, message = 'Access forbidden') => {
  sendError(res, message, 403);
};
