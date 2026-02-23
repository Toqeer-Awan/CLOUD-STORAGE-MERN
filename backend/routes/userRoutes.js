import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { validateUserCreation } from '../middleware/validateUserCreation.js'; // NEW
import {
  // SUPERADMIN COMMENTED: getAllUsers,
  getCompanyUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getUserPermissions,
  getAllRolesPermissions,
  getQuota,
  // SUPERADMIN COMMENTED: updateAllRolesPermissions,
  // SUPERADMIN COMMENTED: deleteCustomRole,
  // SUPERADMIN COMMENTED: syncAdminStorage
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

// This is the endpoint your frontend is calling
router.get('/quota', getQuota);

// Get current user permissions
router.get('/permissions/me', getUserPermissions);

// SUPERADMIN COMMENTED START
// // Sync admin storage with company storage
// router.post('/sync-admin-storage/:companyId', admin, syncAdminStorage);
// SUPERADMIN COMMENTED END

// Admin routes
// SUPERADMIN COMMENTED: router.get('/', admin, getAllUsers);
router.get('/company/:companyId', admin, getCompanyUsers);
router.post('/', admin, validateUserCreation, createUser); // NEW: Added validation middleware
router.put('/:id/role', admin, updateUserRole);
router.delete('/:id', admin, deleteUser);

// Global roles & permissions (admin only)
router.get('/permissions', admin, getAllRolesPermissions);
// SUPERADMIN COMMENTED START
// router.put('/permissions', admin, updateAllRolesPermissions);
// router.delete('/permissions/role/:roleName', admin, deleteCustomRole);
// SUPERADMIN COMMENTED END

export default router;