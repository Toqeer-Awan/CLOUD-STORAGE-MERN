import express from 'express';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/', (req, res) => {
  res.json({ message: 'Roles endpoint' });
});

export default router;