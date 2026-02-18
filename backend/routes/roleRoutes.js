import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { getAllRoles, getRolesPermissions } from '../controllers/roleController.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/', getAllRoles);
router.get('/permissions', getRolesPermissions);

export default router;