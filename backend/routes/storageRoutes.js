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

/**
 * @swagger
 * /storage/allocate-to-user:
 *   post:
 *     summary: Allocate storage to a user
 *     description: Admin allocates storage quota to a team member (Admin only)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storageInGB
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to allocate storage to
 *                 example: 60d21b4667d0d8992e610c88
 *               storageInGB:
 *                 type: number
 *                 minimum: 0.1
 *                 description: Storage amount in gigabytes
 *                 example: 10
 *     responses:
 *       200:
 *         description: Storage allocated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 10GB storage allocated to jane_smith
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c88
 *                     username:
 *                       type: string
 *                       example: jane_smith
 *                     storageAllocated:
 *                       type: number
 *                       example: 10737418240
 *                     storageUsed:
 *                       type: number
 *                       example: 5242880
 *                     availableStorage:
 *                       type: number
 *                       example: 10732175360
 *                 admin:
 *                   type: object
 *                   properties:
 *                     allocatedToUsers:
 *                       type: number
 *                       example: 10737418240
 *                     available:
 *                       type: number
 *                       example: 41875931136
 *       400:
 *         description: Invalid input or insufficient storage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Insufficient storage
 *                 message:
 *                   type: string
 *                   example: Admin only has 5.2GB available
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /storage/me:
 *   get:
 *     summary: Get my storage information
 *     description: Returns storage quota and usage for the authenticated user
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User storage information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 storage:
 *                   type: object
 *                   properties:
 *                     allocated:
 *                       type: number
 *                       description: Total storage allocated in bytes
 *                       example: 53687091200
 *                     used:
 *                       type: number
 *                       description: Storage used in bytes
 *                       example: 1048576
 *                     available:
 *                       type: number
 *                       description: Available storage in bytes
 *                       example: 52638515200
 *                     allocatedToUsers:
 *                       type: number
 *                       description: Storage allocated to team members (admin only)
 *                       example: 10737418240
 *                     percentage:
 *                       type: string
 *                       description: Percentage of storage used
 *                       example: "0.02"
 *                     fileCount:
 *                       type: number
 *                       description: Number of files
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', getMyStorage);

/**
 * @swagger
 * /storage/user/{userId}:
 *   get:
 *     summary: Get storage information for a specific user
 *     description: Returns storage details for a specific user (Admin only or self)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 60d21b4667d0d8992e610c88
 *     responses:
 *       200:
 *         description: User storage information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c88
 *                     username:
 *                       type: string
 *                       example: jane_smith
 *                     email:
 *                       type: string
 *                       example: jane@company.com
 *                     role:
 *                       type: string
 *                       example: user
 *                 storage:
 *                   type: object
 *                   properties:
 *                     allocated:
 *                       type: number
 *                       example: 10737418240
 *                     used:
 *                       type: number
 *                       example: 5242880
 *                     available:
 *                       type: number
 *                       example: 10732175360
 *                     allocatedToUsers:
 *                       type: number
 *                       example: 0
 *                     percentage:
 *                       type: string
 *                       example: "0.05"
 *                     fileCount:
 *                       type: number
 *                       example: 2
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', getUserStorage);

/**
 * @swagger
 * /storage/company/{companyId}:
 *   get:
 *     summary: Get storage information for a company
 *     description: Returns storage details for a company (Company members only)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: 60d21b4667d0d8992e610c86
 *     responses:
 *       200:
 *         description: Company storage information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 company:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     name:
 *                       type: string
 *                       example: Acme Corporation
 *                     owner:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 60d21b4667d0d8992e610c85
 *                         username:
 *                           type: string
 *                           example: john_doe
 *                         email:
 *                           type: string
 *                           example: john@company.com
 *                     totalStorage:
 *                       type: number
 *                       example: 107374182400
 *                     usedStorage:
 *                       type: number
 *                       example: 52428800
 *                     userCount:
 *                       type: number
 *                       example: 5
 *                 storage:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 107374182400
 *                     used:
 *                       type: number
 *                       example: 52428800
 *                     available:
 *                       type: number
 *                       example: 107321753600
 *                     adminAllocated:
 *                       type: number
 *                       example: 53687091200
 *                     adminUsed:
 *                       type: number
 *                       example: 10485760
 *                     adminGivenToUsers:
 *                       type: number
 *                       example: 42949672960
 *                     adminAvailable:
 *                       type: number
 *                       example: 10687091200
 *                     usersTotalAllocated:
 *                       type: number
 *                       example: 42949672960
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
 *                       storageAllocated:
 *                         type: number
 *                       storageUsed:
 *                         type: number
 *                       availableStorage:
 *                         type: number
 *                 fileCount:
 *                   type: number
 *                   example: 10
 *       403:
 *         description: Access denied
 *       404:
 *         description: Company not found
 */
router.get('/company/:companyId', getCompanyStorage);

export default router;