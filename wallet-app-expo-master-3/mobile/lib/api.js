import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global token storage
let globalClerkToken = null;

export const setAuthToken = (token) => {
  globalClerkToken = token;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    if (globalClerkToken) {
      config.headers.Authorization = `Bearer ${globalClerkToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.log('Unauthorized - token expired or invalid');
    }
    return Promise.reject(error);
  }
);

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
  }),
  getAll: (params) => api.get('/osa', { params }),
  getById: (id) => api.get(`/osa/${id}`),
  delete: (id) => api.delete(`/osa/${id}`),
};

// Display API
export const displayAPI = {
  create: (formData) => api.post('/displays', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => api.get('/displays', { params }),
  verify: (id) => api.patch(`/displays/${id}/verify`),
  delete: (id) => api.delete(`/displays/${id}`),
};

// Survey API
export const surveyAPI = {
  create: (formData) => api.post('/surveys', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => api.get('/surveys', { params }),
  getById: (id) => api.get(`/surveys/${id}`),
  delete: (id) => api.delete(`/surveys/${id}`),
};

// Promotion API
export const promotionAPI = {
  create: (formData) => api.post('/promotions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (active) => api.get('/promotions', { params: { active } }),
  getById: (id) => api.get(`/promotions/${id}`),
  delete: (id) => api.delete(`/promotions/${id}`),
};

// Store Visit API
export const storeVisitAPI = {
  checkIn: (storeId, location) => api.post('/store-visits/check-in', { store_id: storeId, location }),
  checkOut: (visitId, location) => api.post('/store-visits/check-out', { visit_id: visitId, location }),
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

export default api;
