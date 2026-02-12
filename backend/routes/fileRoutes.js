import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getFiles,
  uploadToCloudinaryHandler,
  uploadToS3Handler, // Add this import
  deleteFile
} from '../controllers/fileController.js';

const router = express.Router();

router.use(protect);

// Get all files
router.get('/', getFiles);

// Upload to Cloudinary
router.post('/upload/cloudinary', upload.single('file'), uploadToCloudinaryHandler);

// Upload to S3
router.post('/upload/s3', upload.single('file'), uploadToS3Handler); // Add this route

// Delete file
router.delete('/:id', deleteFile);

export default router;