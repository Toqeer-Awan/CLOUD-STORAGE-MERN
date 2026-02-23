// backend/routes/companyRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  // SUPERADMIN COMMENTED: getAllCompanies,
  getCompanyById,
  updateCompanyStorage,
  getMyCompany,
  // SUPERADMIN COMMENTED: deleteCompany
} from '../controllers/companyController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get current user's company
router.get('/me', getMyCompany);

// Admin only routes
// SUPERADMIN COMMENTED START
// router.get('/', admin, getAllCompanies);
// router.delete('/:id', admin, deleteCompany);
// SUPERADMIN COMMENTED END

router.put('/:id/storage', admin, updateCompanyStorage);

// Get company by ID (accessible by company members and admin)
router.get('/:id', getCompanyById);

export default router;