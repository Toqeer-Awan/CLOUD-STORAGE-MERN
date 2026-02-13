// backend/routes/companyRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  getAllCompanies,
  getCompanyById,
  updateCompanyStorage,
  getMyCompany,
  deleteCompany
} from '../controllers/companyController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get current user's company
router.get('/me', getMyCompany);

// Admin only routes
router.get('/', admin, getAllCompanies);
router.put('/:id/storage', admin, updateCompanyStorage);
router.delete('/:id', admin, deleteCompany);

// Get company by ID (accessible by company members and admin)
router.get('/:id', getCompanyById);

export default router;