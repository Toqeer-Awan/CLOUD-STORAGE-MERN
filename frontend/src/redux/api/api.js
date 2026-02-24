import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  getProfile: () => API.get('/auth/profile'),
  logout: () => API.post('/auth/logout'),
  
  // Social Login
  googleLogin: (access_token) => API.post('/auth/google', { access_token }),
  facebookLogin: (access_token) => API.post('/auth/facebook', { access_token }),
  microsoftLogin: (access_token) => API.post('/auth/microsoft', { access_token }),
};

// User APIs
export const userAPI = {
  // SUPERADMIN COMMENTED: getAllUsers: () => API.get('/users'),
  getCompanyUsers: (companyId) => API.get(`/users/company/${companyId}`),
  // SIMPLE USER CREATION COMMENTED: createUser: (userData) => API.post('/users', userData),
  updateRole: (id, roleData) => API.put(`/users/${id}/role`, roleData),
  // SIMPLE USER DELETION COMMENTED: deleteUser: (id) => API.delete(`/users/${id}`),
  getPermissions: () => API.get('/users/permissions/me'),
  getAllPermissions: () => API.get('/users/permissions'),
  // SUPERADMIN COMMENTED: updatePermissions: (data) => API.put('/users/permissions', data),
  // SUPERADMIN COMMENTED: deleteCustomRole: (roleName) => API.delete(`/users/permissions/role/${roleName}`),
  getQuota: () => API.get('/users/quota'),
};

// File APIs
export const fileAPI = {
  getAllFiles: () => API.get('/files'),
  initUpload: (data) => API.post('/files/init', data),
  finalizeUpload: (data) => API.post('/files/finalize', data),
  getDownloadUrl: (id) => API.get(`/files/${id}/download-url`),
  getViewUrl: (id) => API.get(`/files/${id}/view-url`),
  getPendingUploads: () => API.get('/files/pending'),
  deleteFile: (id) => API.delete(`/files/${id}`),
};

// Company APIs
export const companyAPI = {
  // SUPERADMIN COMMENTED: getAllCompanies: () => API.get('/companies'),
  getMyCompany: () => API.get('/companies/me'),
  getCompanyById: (id) => API.get(`/companies/${id}`),
  updateCompanyStorage: (id, data) => API.put(`/companies/${id}/storage`, data),
  // SUPERADMIN COMMENTED: deleteCompany: (id) => API.delete(`/companies/${id}`),
  getCompanySummary: () => API.get('/companies/summary'),
};

// Storage Management APIs
export const storageAPI = {
  // SUPERADMIN COMMENTED: allocateToCompany: (data) => API.post('/storage/allocate-to-company', data),
  allocateToUser: (data) => API.post('/storage/allocate-to-user', data),
  getUserStorage: (userId) => API.get(`/storage/user/${userId}`),
  getCompanyStorage: (companyId) => API.get(`/storage/company/${companyId}`),
};

export default API;