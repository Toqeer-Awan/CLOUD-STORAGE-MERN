import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  // SUPERADMIN COMMENTED: allocateStorageToCompany,
  allocateStorageToUser,
  getUserStorage,
  getCompanyStorage,
  getMyStorage
} from '../controllers/storageController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// SUPERADMIN COMMENTED START
// // Super Admin routes
// router.post('/allocate-to-company', (req, res, next) => {
//   if (req.user.role !== 'superAdmin') {
//     return res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
//   }
//   next();
// }, allocateStorageToCompany);
// SUPERADMIN COMMENTED END

// Admin routes
router.post('/allocate-to-user', (req, res, next) => {
  // SUPERADMIN COMMENTED START
  // if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
  // SUPERADMIN COMMENTED END
  
  // NEW: Only admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
}, allocateStorageToUser);

// Get my storage (current user)
router.get('/me', getMyStorage);

// Get storage info for specific user
router.get('/user/:userId', getUserStorage);

// Get storage info for company
router.get('/company/:companyId', getCompanyStorage);

export default router;