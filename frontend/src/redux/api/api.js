import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
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

export const authAPI = {
  register: userData => API.post('/auth/register', userData),
  login: credentials => API.post('/auth/login', credentials),
};

export const userAPI = {
  getAllUsers: () => API.get('/users'),
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

export default API;