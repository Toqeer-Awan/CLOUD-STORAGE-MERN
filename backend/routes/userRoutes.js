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
  deleteCustomRole
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.get('/permissions/me', getUserPermissions);
router.get('/', admin, getAllUsers);
router.post('/', admin, createUser);
router.put('/:id/role', admin, updateUserRole);
router.delete('/:id', admin, deleteUser);
router.get('/permissions', admin, getAllRolesPermissions);
router.put('/permissions', admin, updateAllRolesPermissions);
router.delete('/permissions/role/:roleName', admin, deleteCustomRole);

export default router;