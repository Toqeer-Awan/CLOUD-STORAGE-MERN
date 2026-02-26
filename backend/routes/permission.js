import express from 'express';
import User from '../models/User.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /permissions/role/{role}:
 *   put:
 *     summary: Update permissions for a role
 *     description: Updates the permissions for all users with the specified role (Requires manageRoles permission)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *         description: Role name to update permissions for
 *         example: user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: object
 *                 properties:
 *                   view:
 *                     type: boolean
 *                     example: true
 *                   upload:
 *                     type: boolean
 *                     example: true
 *                   download:
 *                     type: boolean
 *                     example: true
 *                   delete:
 *                     type: boolean
 *                     example: false
 *                   addUser:
 *                     type: boolean
 *                     example: false
 *                   removeUser:
 *                     type: boolean
 *                     example: false
 *                   changeRole:
 *                     type: boolean
 *                     example: false
 *                   manageFiles:
 *                     type: boolean
 *                     example: false
 *                   manageStorage:
 *                     type: boolean
 *                     example: false
 *                   assignStorage:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Permissions updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Insufficient permissions
 *       500:
 *         description: Failed to update permissions
 */
router.put('/role/:role', checkPermission('canManageRoles'), async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    await User.updateMany({ role }, { permissions });

    res.json({ message: 'Permissions updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// SUPERADMIN COMMENTED START
// // Additional permission management routes could be added here
// // GET /permissions - List all permissions
// // GET /permissions/user/:userId - Get permissions for specific user
// // PUT /permissions/user/:userId - Update permissions for specific user
// SUPERADMIN COMMENTED END

export default router;