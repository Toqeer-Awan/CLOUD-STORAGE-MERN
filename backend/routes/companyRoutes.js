// COMPANY ROUTES - COMPLETELY COMMENTED OUT
// import express from 'express';
// import { protect, admin } from '../middleware/auth.js';
// import {
//   getCompanyById,
//   updateCompanyStorage,
//   getMyCompany,
//   getCompanySummary,
//   fixCompanyAllocations
// } from '../controllers/companyController.js';
// 
// const router = express.Router();
// 
// router.use(protect);
// 
// router.get('/me', getMyCompany);
// router.get('/summary', getCompanySummary);
// router.post('/fix-allocations', admin, fixCompanyAllocations);
// router.get('/:id', getCompanyById);
// router.put('/:id/storage', admin, updateCompanyStorage);
// 
// export default router;