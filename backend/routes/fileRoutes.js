import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getFiles,
  uploadToS3Handler,
  deleteFile
} from '../controllers/fileController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/files
// @desc    Get user's own files
// @access  Private
router.get('/', getFiles);

// @route   POST /api/files/upload/s3
// @desc    Upload file to S3
// @access  Private
router.post('/upload/s3', upload.single('file'), uploadToS3Handler);

// @route   DELETE /api/files/:id
// @desc    Delete user's own file
// @access  Private
router.delete('/:id', deleteFile);

export default router;