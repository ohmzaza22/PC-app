/**
 * Application Constants
 * Centralized configuration values and constants
 */

// User Roles
export const USER_ROLES = {
  PC: 'PC',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  VENDOR: 'VENDOR',
};

// Store Types
export const STORE_TYPES = {
  RETAIL: 'RETAIL',
  HOSPITAL: 'HOSPITAL',
  PHARMACY: 'PHARMACY',
  SUPERMARKET: 'SUPERMARKET',
  CONVENIENCE: 'CONVENIENCE',
};

// Task Types
export const TASK_TYPES = {
  OSA: 'OSA',
  SPECIAL_DISPLAY: 'SPECIAL_DISPLAY',
  MARKET_INFORMATION: 'MARKET_INFORMATION',
  SURVEY: 'SURVEY',
};

export const VALID_TASK_TYPES = ['OSA', 'SPECIAL_DISPLAY', 'MARKET_INFORMATION', 'SURVEY'];

export const TASK_STATUS = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  COMPLETED: 'COMPLETED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const PC_ALLOWED_STATUS = ['IN_PROGRESS', 'SUBMITTED', 'COMPLETED'];
export const MC_ALLOWED_STATUS = ['APPROVED', 'REJECTED'];

// Visit Status
export const VISIT_STATUS = {
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
};

// Session Status
export const SESSION_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Approval Status
export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// Display Types
export const DISPLAY_TYPES = {
  SHELF: 'SHELF',
  ENDCAP: 'ENDCAP',
  PALLET: 'PALLET',
  COOLER: 'COOLER',
  POSTER: 'POSTER',
  OTHER: 'OTHER',
};

// GPS Validation
export const GPS_CONFIG = {
  MAX_DISTANCE_METERS: parseInt(process.env.GPS_VALIDATION_RADIUS_METERS || '100000', 10),
  ACCURACY_THRESHOLD_METERS: 50,
};

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_PDF_TYPES: ['application/pdf'],
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  USER_NOT_FOUND: 'User not found',
  STORE_NOT_FOUND: 'Store not found',
  VISIT_NOT_FOUND: 'Visit not found',
  ALREADY_CHECKED_IN: 'Already checked in to this store',
  MUST_CHECK_IN: 'You must check in to this store before performing tasks',
  COMPLETE_REQUIRED_TASKS: 'You must complete all required tasks before checking out',
  GPS_TOO_FAR: 'You must be within the allowed distance to check in',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  CHECKED_IN: 'Checked in successfully',
  CHECKED_OUT: 'Checked out successfully',
  CHECK_IN_CANCELLED: 'Check-in cancelled successfully',
  APPROVED: 'Approved successfully',
  REJECTED: 'Rejected successfully',
};
