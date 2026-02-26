// backend/routes/companyRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  // SUPERADMIN COMMENTED: getAllCompanies,
  getCompanyById,
  updateCompanyStorage,
  getMyCompany,
  getCompanySummary,
  fixCompanyAllocations
  // SUPERADMIN COMMENTED: deleteCompany
} from '../controllers/companyController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /companies/me:
 *   get:
 *     summary: Get current user's company
 *     description: Returns detailed information about the company belonging to the authenticated user
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c86
 *                 name:
 *                   type: string
 *                   example: john_doe's Company
 *                 owner:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                 totalStorage:
 *                   type: number
 *                   description: Total company storage in bytes
 *                   example: 53687091200
 *                 usedStorage:
 *                   type: number
 *                   description: Storage used in bytes
 *                   example: 10485760
 *                 allocatedToUsers:
 *                   type: number
 *                   description: Storage allocated to team members in bytes
 *                   example: 21474836480
 *                 userCount:
 *                   type: number
 *                   example: 5
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       storageAllocated:
 *                         type: number
 *                       storageUsed:
 *                         type: number
 *                       availableStorage:
 *                         type: number
 *                       usagePercentage:
 *                         type: string
 *                       isOwner:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 recentFiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       size:
 *                         type: number
 *                       type:
 *                         type: string
 *                       uploadedBy:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                       uploadDate:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No company assigned or company not found
 */
router.get('/me', getMyCompany);

/**
 * @swagger
 * /companies/summary:
 *   get:
 *     summary: Get company storage summary
 *     description: Returns a summary of company storage statistics for admin dashboard
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 companyId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c86
 *                 companyName:
 *                   type: string
 *                   example: john_doe's Company
 *                 totalStorage:
 *                   type: number
 *                   example: 53687091200
 *                 usedStorage:
 *                   type: number
 *                   example: 10485760
 *                 allocatedStorage:
 *                   type: number
 *                   example: 21474836480
 *                 availableStorage:
 *                   type: number
 *                   example: 53676605440
 *                 unallocatedStorage:
 *                   type: number
 *                   example: 32212254720
 *                 isOverAllocated:
 *                   type: boolean
 *                   example: false
 *                 overAllocatedBy:
 *                   type: number
 *                   example: 0
 *                 userCount:
 *                   type: number
 *                   example: 5
 *                 fileCount:
 *                   type: number
 *                   example: 10
 *                 storagePercentage:
 *                   type: string
 *                   example: "0.02"
 *                 allocationPercentage:
 *                   type: string
 *                   example: "40.00"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No company found
 */
router.get('/summary', getCompanySummary);

/**
 * @swagger
 * /companies/fix-allocations:
 *   post:
 *     summary: Fix company allocations
 *     description: Utility endpoint to sync and fix company storage allocations (Admin only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company allocations fixed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company allocations fixed
 *                 company:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     totalStorage:
 *                       type: number
 *                     allocatedToUsers:
 *                       type: number
 *                     isOverAllocated:
 *                       type: boolean
 *                     overAllocatedBy:
 *                       type: number
 *                     availableToAllocate:
 *                       type: number
 *                 userCount:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Company not found
 */
router.post('/fix-allocations', admin, fixCompanyAllocations);

// Get company by ID (accessible by company members and admin)

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Returns detailed information about a specific company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: 60d21b4667d0d8992e610c86
 *     responses:
 *       200:
 *         description: Company details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 owner:
 *                   type: object
 *                 users:
 *                   type: array
 *                 files:
 *                   type: array
 *                 storageUsed:
 *                   type: number
 *                 allocatedToUsers:
 *                   type: number
 *                 storagePercentage:
 *                   type: string
 *                 allocationPercentage:
 *                   type: string
 *                 isOverAllocated:
 *                   type: boolean
 *                 overAllocatedBy:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Company not found
 */
router.get('/:id', getCompanyById);

// Admin only routes

/**
 * @swagger
 * /companies/{id}/storage:
 *   put:
 *     summary: Update company storage
 *     description: Updates the total storage allocation for a company (Admin only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: 60d21b4667d0d8992e610c86
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalStorage
 *             properties:
 *               totalStorage:
 *                 type: number
 *                 minimum: 104857600
 *                 description: Total storage in bytes (minimum 100MB)
 *                 example: 107374182400
 *     responses:
 *       200:
 *         description: Company storage updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company storage updated successfully
 *                 company:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     totalStorage:
 *                       type: number
 *                     usedStorage:
 *                       type: number
 *                     allocatedToUsers:
 *                       type: number
 *                     previousTotal:
 *                       type: number
 *                     availableToAllocate:
 *                       type: number
 *       400:
 *         description: Invalid storage value or cannot reduce below allocated amount
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Company not found
 */
router.put('/:id/storage', admin, updateCompanyStorage);

// SUPERADMIN COMMENTED START
// router.get('/', admin, getAllCompanies);
// router.delete('/:id', admin, deleteCompany);
// SUPERADMIN COMMENTED END

export default router;