import express from 'express';
import { protect, admin } from '../middleware/auth.js';
// SIMPLE USER CREATION MIDDLEWARE COMMENTED: import { validateUserCreation } from '../middleware/validateUserCreation.js'; // NEW
import {
  // SUPERADMIN COMMENTED: getAllUsers,
  getCompanyUsers,
  // SIMPLE USER CREATION COMMENTED: createUser,
  updateUserRole,
  // SIMPLE USER DELETION COMMENTED: deleteUser,
  getUserPermissions,
  getAllRolesPermissions,
  getQuota,
  // SUPERADMIN COMMENTED: updateAllRolesPermissions,
  // SUPERADMIN COMMENTED: deleteCustomRole,
  // SUPERADMIN COMMENTED: syncAdminStorage
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /users/quota:
 *   get:
 *     summary: Get current user's storage quota
 *     description: Returns storage usage and quota information for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User quota information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 used:
 *                   type: number
 *                   description: Storage used in bytes
 *                   example: 1048576
 *                 total:
 *                   type: number
 *                   description: Total storage allocated in bytes
 *                   example: 53687091200
 *                 available:
 *                   type: number
 *                   description: Available storage in bytes
 *                   example: 52638515200
 *                 percentage:
 *                   type: number
 *                   description: Percentage of storage used
 *                   example: 0.02
 *                 accountAge:
 *                   type: string
 *                   description: Account age in hours
 *                   example: "72.5"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-01-01T00:00:00.000Z
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/quota', getQuota);

/**
 * @swagger
 * /users/permissions/me:
 *   get:
 *     summary: Get current user's permissions
 *     description: Returns the permissions object for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissions:
 *                   type: object
 *                   properties:
 *                     view:
 *                       type: boolean
 *                       example: true
 *                     upload:
 *                       type: boolean
 *                       example: true
 *                     download:
 *                       type: boolean
 *                       example: true
 *                     delete:
 *                       type: boolean
 *                       example: true
 *                     addUser:
 *                       type: boolean
 *                       example: true
 *                     removeUser:
 *                       type: boolean
 *                       example: true
 *                     changeRole:
 *                       type: boolean
 *                       example: true
 *                     manageFiles:
 *                       type: boolean
 *                       example: true
 *                     manageStorage:
 *                       type: boolean
 *                       example: true
 *                     assignStorage:
 *                       type: boolean
 *                       example: true
 *                 role:
 *                   type: string
 *                   example: admin
 *                 company:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c86
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/permissions/me', getUserPermissions);

// SUPERADMIN COMMENTED START
// // Sync admin storage with company storage
// router.post('/sync-admin-storage/:companyId', admin, syncAdminStorage);
// SUPERADMIN COMMENTED END

// Admin routes
// SUPERADMIN COMMENTED: router.get('/', admin, getAllUsers);

/**
 * @swagger
 * /users/company/{companyId}:
 *   get:
 *     summary: Get all users in a company
 *     description: Returns a list of all users belonging to the specified company (Admin only)
 *     tags: [Users]
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
 *         description: List of users in company
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60d21b4667d0d8992e610c88
 *                   username:
 *                     type: string
 *                     example: jane_smith
 *                   email:
 *                     type: string
 *                     example: jane@company.com
 *                   role:
 *                     type: string
 *                     example: user
 *                   storageAllocated:
 *                     type: number
 *                     example: 10737418240
 *                   storageUsed:
 *                     type: number
 *                     example: 5242880
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2023-01-15T10:30:00.000Z
 *       403:
 *         description: Access denied
 */
router.get('/company/:companyId', admin, getCompanyUsers);

// SIMPLE USER CREATION COMMENTED: router.post('/', admin, validateUserCreation, createUser); // NEW: Added validation middleware

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Update user role
 *     description: Changes the role of a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 60d21b4667d0d8992e610c88
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: admin
 *     responses:
 *       200:
 *         description: User role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User role updated
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c88
 *                     username:
 *                       type: string
 *                       example: jane_smith
 *                     role:
 *                       type: string
 *                       example: admin
 *                     permissions:
 *                       type: object
 *                     storageAllocated:
 *                       type: number
 *                       example: 53687091200
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.put('/:id/role', admin, updateUserRole);

// SIMPLE USER DELETION COMMENTED: router.delete('/:id', admin, deleteUser);

// Global roles & permissions (admin only)

/**
 * @swagger
 * /users/permissions:
 *   get:
 *     summary: Get all roles and permissions
 *     description: Returns the default roles and any custom roles with their permissions (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles and permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: object
 *                       properties:
 *                         view:
 *                           type: boolean
 *                           example: true
 *                         upload:
 *                           type: boolean
 *                           example: true
 *                         download:
 *                           type: boolean
 *                           example: true
 *                         delete:
 *                           type: boolean
 *                           example: true
 *                         addUser:
 *                           type: boolean
 *                           example: true
 *                         removeUser:
 *                           type: boolean
 *                           example: true
 *                         changeRole:
 *                           type: boolean
 *                           example: true
 *                         manageFiles:
 *                           type: boolean
 *                           example: true
 *                         manageStorage:
 *                           type: boolean
 *                           example: true
 *                         assignStorage:
 *                           type: boolean
 *                           example: true
 *                     user:
 *                       type: object
 *                       properties:
 *                         view:
 *                           type: boolean
 *                           example: true
 *                         upload:
 *                           type: boolean
 *                           example: true
 *                         download:
 *                           type: boolean
 *                           example: true
 *                         delete:
 *                           type: boolean
 *                           example: false
 *                         addUser:
 *                           type: boolean
 *                           example: false
 *                         removeUser:
 *                           type: boolean
 *                           example: false
 *                         changeRole:
 *                           type: boolean
 *                           example: false
 *                         manageFiles:
 *                           type: boolean
 *                           example: false
 *                         manageStorage:
 *                           type: boolean
 *                           example: false
 *                         assignStorage:
 *                           type: boolean
 *                           example: false
 *                 customRoles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: editor
 *                       displayName:
 *                         type: string
 *                         example: Editor
 *                       permissions:
 *                         type: object
 *                       isCustom:
 *                         type: boolean
 *                         example: true
 */
router.get('/permissions', admin, getAllRolesPermissions);
// SUPERADMIN COMMENTED START
// router.put('/permissions', admin, updateAllRolesPermissions);
// router.delete('/permissions/role/:roleName', admin, deleteCustomRole);
// SUPERADMIN COMMENTED END

export default router;