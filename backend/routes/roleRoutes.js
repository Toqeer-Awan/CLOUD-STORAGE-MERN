import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { getAllRoles, getRolesPermissions } from '../controllers/roleController.js';

const router = express.Router();

router.use(protect);
router.use(admin);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     description: Returns a list of all roles in the system (Admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60d21b4667d0d8992e610c90
 *                   name:
 *                     type: string
 *                     example: admin
 *                   displayName:
 *                     type: string
 *                     example: Administrator
 *                   permissions:
 *                     type: object
 *                     properties:
 *                       view:
 *                         type: boolean
 *                         example: true
 *                       upload:
 *                         type: boolean
 *                         example: true
 *                       download:
 *                         type: boolean
 *                         example: true
 *                       delete:
 *                         type: boolean
 *                         example: true
 *                       addUser:
 *                         type: boolean
 *                         example: true
 *                       removeUser:
 *                         type: boolean
 *                         example: true
 *                       changeRole:
 *                         type: boolean
 *                         example: true
 *                       manageFiles:
 *                         type: boolean
 *                         example: true
 *                       manageStorage:
 *                         type: boolean
 *                         example: true
 *                       assignStorage:
 *                         type: boolean
 *                         example: true
 *                   isCustom:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get('/', getAllRoles);

/**
 * @swagger
 * /roles/permissions:
 *   get:
 *     summary: Get roles with permissions format for frontend
 *     description: Returns roles formatted for frontend usage, separating default and custom roles (Admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles and permissions retrieved successfully
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get('/permissions', getRolesPermissions);

// SUPERADMIN COMMENTED START
// // @desc    Create a new role
// // @route   POST /api/roles
// // @access  Private/SuperAdmin
// router.post('/', superAdmin, createRole);
// 
// // @desc    Update a role
// // @route   PUT /api/roles/:id
// // @access  Private/SuperAdmin
// router.put('/:id', superAdmin, updateRole);
// 
// // @desc    Delete a role
// // @route   DELETE /api/roles/:id
// // @access  Private/SuperAdmin
// router.delete('/:id', superAdmin, deleteRole);
// SUPERADMIN COMMENTED END

export default router;