import express from 'express';
import User from '../models/User.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

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

export default router;