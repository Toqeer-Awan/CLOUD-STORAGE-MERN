import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  // SIMPLE USER ALLOCATION COMMENTED: allocateStorageToUser,
  // SIMPLE USER STORAGE COMMENTED: getUserStorage,
  // COMPANY STORAGE COMMENTED: getCompanyStorage,
  // SIMPLE USER MY STORAGE COMMENTED: getMyStorage
} from '../controllers/storageController.js';

const router = express.Router();

router.use(protect);

// SIMPLE USER ALLOCATION ROUTE COMMENTED START
// router.post('/allocate-to-user', (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ error: 'Access denied. Admin only.' });
//   }
//   next();
// }, allocateStorageToUser);
// SIMPLE USER ALLOCATION ROUTE COMMENTED END

// SIMPLE USER MY STORAGE ROUTE COMMENTED START
// router.get('/me', getMyStorage);
// SIMPLE USER MY STORAGE ROUTE COMMENTED END

// SIMPLE USER STORAGE ROUTE COMMENTED START
// router.get('/user/:userId', getUserStorage);
// SIMPLE USER STORAGE ROUTE COMMENTED END

// COMPANY STORAGE ROUTE COMMENTED: router.get('/company/:companyId', getCompanyStorage);

export default router;