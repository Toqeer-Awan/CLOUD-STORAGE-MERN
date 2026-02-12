import express from 'express';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(admin);

// Placeholder route - we'll implement roles later
router.get('/', (req, res) => {
  res.json({
    roles: ['admin', 'user'],
    message: 'Roles endpoint - implement as needed'
  });
});

export default router;