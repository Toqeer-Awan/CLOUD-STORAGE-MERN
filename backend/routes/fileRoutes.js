import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  initUpload,
  finalizeUpload,
  getDownloadUrl,
  getViewUrl,
  getPendingUploads,
  deleteFile,
  getFileMetadata
} from '../controllers/uploadController.js';

import {
  getFiles,
  getMyFiles,
  getFileById,
  getFileStats,
  searchFiles,
  getFilesByType
} from '../controllers/fileController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== UPLOAD FLOW ====================
router.post('/init', initUpload);                 // Step 1 - Get presigned URL
router.post('/finalize', finalizeUpload);         // Step 3 - Verify and complete

// ==================== DOWNLOAD/VIEW ====================
router.get('/:id/download-url', getDownloadUrl);  // Get presigned download URL
router.get('/:id/view-url', getViewUrl);          // Get presigned view URL

// ==================== FILE MANAGEMENT ====================
// Get user's files
router.get('/', getFiles);                        // Get all user's files
router.get('/my-files', getMyFiles);              // Get user's files with stats
router.get('/stats', getFileStats);               // Get file statistics
router.get('/search', searchFiles);               // Search files
router.get('/type/:type', getFilesByType);        // Get files by type
router.get('/pending', getPendingUploads);        // Get pending uploads

// Single file operations
router.get('/:id', getFileById);                  // Get file by ID
router.get('/:id/metadata', getFileMetadata);     // Get file metadata
router.delete('/:id', deleteFile);                 // Delete file

export default router;