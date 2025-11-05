/**
 * =============================================================================
 * API CLIENT
 * =============================================================================
 * 
 * Axios-based API client สำหรับเชื่อมต่อกับ Backend
 * 
 * Features:
 * - Auto-attach JWT token
 * - Request/Response interceptors
 * - Error handling
 * - Organized API modules
 * 
 * @module lib/api
 */

// =============================================================================
// IMPORTS
// =============================================================================

import axios from 'axios';
import { API_URL } from '../constants/config';

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

/**
 * สร้าง Axios instance พร้อม default config
 * 
 * - baseURL: จาก environment config
 * - timeout: 10 วินาที
 * - headers: JSON content type
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

/**
 * Global Token Storage
 * เก็บ JWT token ไว้ใน memory
 * จะถูก attach เข้า Authorization header ทุก request
 */
let globalClerkToken = null;

/**
 * ตั้งค่า Authentication Token
 * 
 * @function setAuthToken
 * @param {string} token - JWT token from Clerk
 * 
 * @example
 * const token = await getToken();
 * setAuthToken(token);
 */
export const setAuthToken = (token) => {
  globalClerkToken = token;
};

// =============================================================================
// REQUEST INTERCEPTOR
// =============================================================================

/**
 * Request Interceptor
 * 
 * ทำงานก่อนทุก request จะถูกส่งออก:
 * - Attach JWT token ไปที่ Authorization header
 * - ใช้ได้กับทุก API calls (ยกเว้น Public endpoints)
 */
api.interceptors.request.use(
  async (config) => {
    // ถ้ามี token ให้แนบเข้า Authorization header
    if (globalClerkToken) {
      config.headers.Authorization = `Bearer ${globalClerkToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR
// =============================================================================

/**
 * Response Interceptor
 * 
 * ทำงานหลังได้รับ response:
 * - จัดการ error responses
 * - Handle 401 Unauthorized (token หมดอายุ)
 * - Log errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token หมดอายุหรือไม่ valid
    if (error.response?.status === 401) {
      console.log('Unauthorized - token expired or invalid');
      // TODO: Redirect to login screen
      // router.replace('/sign-in');
    }
    return Promise.reject(error);
  }
);

// ============================================================================="}

// User API
export const userAPI = {
  createOrUpdate: (data) => api.post('/users', data),
  getByClerkId: (clerkId) => api.get(`/users/clerk/${clerkId}`),
  getAll: (role) => api.get('/users', { params: { role } }),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
};

// Store API
export const storeAPI = {
  getAll: (assignedPcId) => api.get('/stores', { params: { assigned_pc_id: assignedPcId } }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.patch(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
};

// OSA API
export const osaAPI = {
  create: (formData) => api.post('/osa', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 seconds for photo upload
    transformRequest: (data, headers) => {
      // Let axios handle FormData automatically
      return data;
    },
  }),
  getAll: (params) => api.get('/osa', { params }),
  getById: (id) => api.get(`/osa/${id}`),
  delete: (id) => api.delete(`/osa/${id}`),
};

// Display API
export const displayAPI = {
  create: (formData) => api.post('/displays', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 seconds for photo upload
  }),
  getAll: (params) => api.get('/displays', { params }),
  verify: (id) => api.patch(`/displays/${id}/verify`),
  delete: (id) => api.delete(`/displays/${id}`),
};

// Survey API
export const surveyAPI = {
  create: (formData) => api.post('/surveys', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 seconds for photo upload
  }),
  getAll: (params) => api.get('/surveys', { params }),
  getById: (id) => api.get(`/surveys/${id}`),
  delete: (id) => api.delete(`/surveys/${id}`),
};

// Promotion API
export const promotionAPI = {
  create: (formData) => api.post('/promotions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 seconds for file upload
  }),
  getAll: (active) => api.get('/promotions', { params: { active } }),
  getById: (id) => api.get(`/promotions/${id}`),
  delete: (id) => api.delete(`/promotions/${id}`),
};

// Store Visit API
export const storeVisitAPI = {
  checkIn: (storeId, location) => api.post('/store-visits/check-in', { store_id: storeId, location }),
  checkOut: (visitId, location) => api.post('/store-visits/check-out', { visit_id: visitId, location }),
  cancelCheckIn: (visitId) => api.post('/store-visits/cancel-check-in', { visit_id: visitId }),
  getCurrent: () => api.get('/store-visits/current'),
  getHistory: (params) => api.get('/store-visits/history', { params }),
  validateAccess: (storeId) => api.get('/store-visits/validate-access', { params: { store_id: storeId } }),
};

// Approval API
export const approvalAPI = {
  getPending: (params) => api.get('/approvals/pending', { params }),
  approveOSA: (id) => api.post(`/approvals/osa/${id}/approve`),
  rejectOSA: (id, reason) => api.post(`/approvals/osa/${id}/reject`, { reason }),
  approveDisplay: (id) => api.post(`/approvals/display/${id}/approve`),
  rejectDisplay: (id, reason) => api.post(`/approvals/display/${id}/reject`, { reason }),
  approveSurvey: (id) => api.post(`/approvals/survey/${id}/approve`),
  rejectSurvey: (id, reason) => api.post(`/approvals/survey/${id}/reject`, { reason }),
  getRejected: () => api.get('/approvals/rejected'),
  getStats: (params) => api.get('/approvals/stats', { params }),
};

// Task API (PC)
export const taskAPI = {
  getCheckinEligibility: () => api.get('/pc/checkin-eligibility'),
  getDashboard: () => api.get('/pc/dashboard'),
  getTaskDetails: (id) => api.get(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
};

// Task Batch API (MC)
export const taskBatchAPI = {
  create: (data) => api.post('/task-batches', data),
  getAll: () => api.get('/task-batches'),
  getDetails: (id) => api.get(`/task-batches/${id}`),
};

export default api;
