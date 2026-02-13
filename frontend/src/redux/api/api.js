// frontend/src/redux/api/api.js
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
    console.log(`🚀 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  response => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('❌ Response error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('❌ No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('❌ Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: userData => API.post('/auth/register', userData),
  login: credentials => API.post('/auth/login', credentials),
};

export const userAPI = {
  getAllUsers: () => API.get('/users'),
  getCompanyUsers: (companyId) => API.get(`/users/company/${companyId}`),
  createUser: userData => API.post('/users', userData),
  updateRole: (id, roleData) => API.put(`/users/${id}/role`, roleData),
  deleteUser: id => API.delete(`/users/${id}`),
  getPermissions: () => API.get('/users/permissions/me'),
  getAllPermissions: () => API.get('/users/permissions'),
  updatePermissions: (data) => API.put('/users/permissions', data),
  deleteCustomRole: (roleName) => API.delete(`/users/permissions/role/${roleName}`),
};

export const fileAPI = {
  getAllFiles: () => API.get('/files'),
  getCompanyFiles: (companyId) => API.get(`/files/company/${companyId}`),
  uploadToCloudinary: (formData, onUploadProgress) =>
    API.post('/files/upload/cloudinary', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  uploadToS3: (formData, onUploadProgress) =>
    API.post('/files/upload/s3', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  deleteFile: id => API.delete(`/files/${id}`),
};

export const companyAPI = {
  getAllCompanies: () => API.get('/companies'),
  getMyCompany: () => API.get('/companies/me'),
  getCompanyById: (id) => API.get(`/companies/${id}`),
  updateCompanyStorage: (id, data) => API.put(`/companies/${id}/storage`, data),
  deleteCompany: (id) => API.delete(`/companies/${id}`),
};
export default API;