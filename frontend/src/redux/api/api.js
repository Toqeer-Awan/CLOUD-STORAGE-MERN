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
  getAllUsers: () => API.get('/users'),
  getCompanyUsers: (companyId) => API.get(`/users/company/${companyId}`),
  createUser: (userData) => API.post('/users', userData),
  updateRole: (id, roleData) => API.put(`/users/${id}/role`, roleData),
  deleteUser: (id) => API.delete(`/users/${id}`),
  getPermissions: () => API.get('/users/permissions/me'),
  getAllPermissions: () => API.get('/users/permissions'),
  updatePermissions: (data) => API.put('/users/permissions', data),
  deleteCustomRole: (roleName) => API.delete(`/users/permissions/role/${roleName}`),
};

// File APIs
export const fileAPI = {
  // Get current user's files only
  getAllFiles: () => API.get('/files'),
  
  // Upload file to S3
  uploadToS3: (formData, onUploadProgress) =>
    API.post('/files/upload/s3', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  
  // Delete user's own file
  deleteFile: (id) => API.delete(`/files/${id}`),
};

// Company APIs
export const companyAPI = {
  getAllCompanies: () => API.get('/companies'),
  getMyCompany: () => API.get('/companies/me'),
  getCompanyById: (id) => API.get(`/companies/${id}`),
  updateCompanyStorage: (id, data) => API.put(`/companies/${id}/storage`, data),
  deleteCompany: (id) => API.delete(`/companies/${id}`),
};

// 🔥 NEW: Storage Management APIs
export const storageAPI = {
  // SuperAdmin allocates storage to company
  allocateToCompany: (data) => API.post('/storage/allocate-to-company', data),
  
  // Admin allocates storage to user
  allocateToUser: (data) => API.post('/storage/allocate-to-user', data),
  
  // Get storage usage
  getUserStorage: (userId) => API.get(`/storage/user/${userId}`),
  getCompanyStorage: (companyId) => API.get(`/storage/company/${companyId}`),
};

export default API;