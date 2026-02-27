import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  
  googleLogin: (access_token) => API.post('/auth/google', { access_token }),
  facebookLogin: (access_token) => API.post('/auth/facebook', { access_token }),
  microsoftLogin: (access_token) => API.post('/auth/microsoft', { access_token }),
};

// User APIs - SIMPLE USER APIS COMMENTED START
// export const userAPI = {
//   // SUPERADMIN COMMENTED: getAllUsers: () => API.get('/users'),
//   // COMPANY USERS COMMENTED: getCompanyUsers: (companyId) => API.get(`/users/company/${companyId}`),
//   // SIMPLE USER CREATION COMMENTED: createUser: (userData) => API.post('/users', userData),
//   // SIMPLE USER ROLE UPDATE COMMENTED: updateRole: (id, roleData) => API.put(`/users/${id}/role`, roleData),
//   // SIMPLE USER DELETION COMMENTED: deleteUser: (id) => API.delete(`/users/${id}`),
//   // SIMPLE USER PERMISSIONS COMMENTED: getPermissions: () => API.get('/users/permissions/me'),
//   // PERMISSIONS API COMMENTED: getAllPermissions: () => API.get('/users/permissions'),
//   // SUPERADMIN COMMENTED: updatePermissions: (data) => API.put('/users/permissions', data),
//   // SUPERADMIN COMMENTED: deleteCustomRole: (roleName) => API.delete(`/users/permissions/role/${roleName}`),
//   // SIMPLE USER QUOTA COMMENTED: getQuota: () => API.get('/users/quota'),
// };
// SIMPLE USER APIS COMMENTED END

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

// Company APIs - COMPLETELY COMMENTED OUT
// export const companyAPI = {
//   getMyCompany: () => API.get('/companies/me'),
//   getCompanyById: (id) => API.get(`/companies/${id}`),
//   updateCompanyStorage: (id, data) => API.put(`/companies/${id}/storage`, data),
//   getCompanySummary: () => API.get('/companies/summary'),
// };

// Storage Management APIs - SIMPLE USER STORAGE APIS COMMENTED START
// export const storageAPI = {
//   // SIMPLE USER ALLOCATION COMMENTED: allocateToUser: (data) => API.post('/storage/allocate-to-user', data),
//   // SIMPLE USER STORAGE COMMENTED: getUserStorage: (userId) => API.get(`/storage/user/${userId}`),
//   // COMPANY STORAGE COMMENTED: getCompanyStorage: (companyId) => API.get(`/storage/company/${companyId}`),
// };
// SIMPLE USER STORAGE APIS COMMENTED END

export default API;