export const API_URL = 'http://localhost:5000/api';

export const STORAGE_TYPES = {
  LOCAL: 'local',
  CLOUDINARY: 'cloudinary',
  S3: 's3'
};

export const FILE_TYPES = {
  IMAGE: 'image',
  PDF: 'pdf',
  DOCUMENT: 'document',
  VIDEO: 'video',
  OTHER: 'other'
};

export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
};

export const PERMISSIONS = {
  VIEW: 'view',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  DELETE: 'delete',
  ADD_USER: 'addUser',
  REMOVE_USER: 'removeUser',
  CHANGE_ROLE: 'changeRole',
  MANAGE_FILES: 'manageFiles'
};

export const CHART_COLORS = {
  BLUE: '#3B82F6',
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  RED: '#EF4444',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  INDIGO: '#6366F1',
  TEAL: '#14B8A6'
};

export const DEFAULT_PERMISSIONS = [
  'view', 'upload', 'download', 'delete',
  'addUser', 'removeUser', 'changeRole', 'manageFiles'
];