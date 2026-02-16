import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getAllRolesPermissions,
  updateAllRolesPermissions,
  getUserPermissions,
  deleteCustomRole,
  syncAdminStorage  // 🔥 NEW
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

// Get current user permissions
router.get('/permissions/me', getUserPermissions);

// 🔥 Sync admin storage with company storage
router.post('/sync-admin-storage/:companyId', admin, syncAdminStorage);

// Admin routes
router.get('/', admin, getAllUsers);
router.post('/', admin, createUser);
router.put('/:id/role', admin, updateUserRole);
router.delete('/:id', admin, deleteUser);

// Global roles & permissions (admin only)
router.get('/permissions', admin, getAllRolesPermissions);
router.put('/permissions', admin, updateAllRolesPermissions);
router.delete('/permissions/role/:roleName', admin, deleteCustomRole);

export default router;