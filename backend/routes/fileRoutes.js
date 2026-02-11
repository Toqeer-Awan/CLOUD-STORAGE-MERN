import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getFiles,
  uploadToCloudinaryHandler,
  uploadToS3Handler,
  deleteFile
} from '../controllers/fileController.js';

const router = express.Router();

router.use(protect);

router.get('/', getFiles);
router.post('/upload/cloudinary', upload.single('file'), uploadToCloudinaryHandler);
router.post('/upload/s3', upload.single('file'), uploadToS3Handler);
router.delete('/:id', deleteFile);

export default router;