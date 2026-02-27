import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  // COMPANY USERS COMMENTED: getCompanyUsers,
  // SIMPLE USER CREATION COMMENTED: createUser,
  // SIMPLE USER ROLE UPDATE COMMENTED: updateUserRole,
  // SIMPLE USER DELETION COMMENTED: deleteUser,
  // SIMPLE USER PERMISSIONS COMMENTED: getUserPermissions,
  // PERMISSIONS API COMMENTED: getAllRolesPermissions,
  getQuota,
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

// SIMPLE USER QUOTA ROUTE COMMENTED START
router.get('/quota', getQuota);
// SIMPLE USER QUOTA ROUTE COMMENTED END

// SIMPLE USER PERMISSIONS ROUTE COMMENTED START
// router.get('/permissions/me', getUserPermissions);
// SIMPLE USER PERMISSIONS ROUTE COMMENTED END

// Admin routes
// COMPANY USERS ROUTE COMMENTED: router.get('/company/:companyId', admin, getCompanyUsers);
// SIMPLE USER CREATION ROUTE COMMENTED: router.post('/', admin, createUser);
// SIMPLE USER ROLE UPDATE ROUTE COMMENTED: router.put('/:id/role', admin, updateUserRole);
// SIMPLE USER DELETION ROUTE COMMENTED: router.delete('/:id', admin, deleteUser);
// PERMISSIONS API ROUTE COMMENTED: router.get('/permissions', admin, getAllRolesPermissions);

export default router;