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

/**
 * @swagger
 * /files/init:
 *   post:
 *     summary: Initialize file upload
 *     description: |
 *       Generates a presigned URL for direct upload to Backblaze B2.
 *       
 *       **Upload Flow:**
 *       1. Call this endpoint with file metadata
 *       2. Get presigned URL back
 *       3. Upload file directly to B2 using PUT request to the presigned URL
 *       4. Call /files/finalize to complete the upload
 *       
 *       For files > 100MB, multipart upload is automatically used.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - size
 *               - mimetype
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Full path including folders
 *                 example: documents/2023/annual-report.pdf
 *               size:
 *                 type: number
 *                 description: File size in bytes
 *                 example: 5242880
 *               mimetype:
 *                 type: string
 *                 example: application/pdf
 *               useMultipart:
 *                 type: boolean
 *                 description: Force multipart upload
 *                 example: false
 *               folderPath:
 *                 type: string
 *                 description: Optional folder path
 *                 example: documents/2023
 *     responses:
 *       201:
 *         description: Upload initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 fileId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c87
 *                 storageKey:
 *                   type: string
 *                   example: uploads/user-123/1623456789-annual-report.pdf
 *                 presignedUrl:
 *                   type: string
 *                   example: https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1623456789-annual-report.pdf?X-Amz-Algorithm=...
 *                 uploadId:
 *                   type: string
 *                   example: ~123456789
 *                 partUrls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       partNumber:
 *                         type: number
 *                         example: 1
 *                       url:
 *                         type: string
 *                         example: https://s3.us-west-002.backblazeb2.com/...
 *                 expiresIn:
 *                   type: number
 *                   example: 900
 *                 useMultipart:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Insufficient storage quota
 *       500:
 *         description: Server error
 */
router.post('/init', initUpload);

/**
 * @swagger
 * /files/finalize:
 *   post:
 *     summary: Finalize file upload
 *     description: |
 *       Completes the upload process, verifies file size, and updates storage quotas.
 *       
 *       **Important:** This must be called after successfully uploading the file to B2.
 *       For multipart uploads, include the parts array with ETags.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c87
 *               parts:
 *                 type: array
 *                 description: Required for multipart uploads
 *                 items:
 *                   type: object
 *                   properties:
 *                     PartNumber:
 *                       type: number
 *                       example: 1
 *                     ETag:
 *                       type: string
 *                       example: "5d41402abc4b2a76b9719d911017c592"
 *     responses:
 *       200:
 *         description: Upload finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Upload finalized successfully
 *                 file:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c87
 *                     name:
 *                       type: string
 *                       example: annual-report.pdf
 *                     size:
 *                       type: number
 *                       example: 5242880
 *                     storageUrl:
 *                       type: string
 *                       example: https://your-bucket.s3.us-west-002.backblazeb2.com/uploads/user-123/1623456789-annual-report.pdf
 *       400:
 *         description: File not pending or size mismatch
 *       404:
 *         description: File not found
 */
router.post('/finalize', finalizeUpload);

// ==================== DOWNLOAD/VIEW ====================

/**
 * @swagger
 * /files/{id}/download-url:
 *   get:
 *     summary: Get presigned download URL
 *     description: Generates a temporary URL for downloading a file (forces download)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 60d21b4667d0d8992e610c87
 *     responses:
 *       200:
 *         description: Download URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 downloadUrl:
 *                   type: string
 *                   example: https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1623456789-annual-report.pdf?X-Amz-Algorithm=...
 *                 filename:
 *                   type: string
 *                   example: annual-report.pdf
 *                 fileId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c87
 *                 size:
 *                   type: number
 *                   example: 5242880
 *                 expiresIn:
 *                   type: number
 *                   example: 300
 *       404:
 *         description: File not found
 */
router.get('/:id/download-url', getDownloadUrl);

/**
 * @swagger
 * /files/{id}/view-url:
 *   get:
 *     summary: Get presigned view URL
 *     description: Generates a temporary URL for viewing a file in the browser
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 60d21b4667d0d8992e610c87
 *     responses:
 *       200:
 *         description: View URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 viewUrl:
 *                   type: string
 *                   example: https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1623456789-annual-report.pdf?X-Amz-Algorithm=...
 *                 filename:
 *                   type: string
 *                   example: annual-report.pdf
 *                 fileId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c87
 *                 expiresIn:
 *                   type: number
 *                   example: 600
 *       404:
 *         description: File not found
 */
router.get('/:id/view-url', getViewUrl);

// ==================== FILE MANAGEMENT ====================

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get user's own files
 *     description: Returns a list of all files uploaded by the authenticated user
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60d21b4667d0d8992e610c87
 *                   filename:
 *                     type: string
 *                     example: 1623456789-annual-report.pdf
 *                   originalName:
 *                     type: string
 *                     example: annual-report.pdf
 *                   size:
 *                     type: number
 *                     example: 5242880
 *                   mimetype:
 *                     type: string
 *                     example: application/pdf
 *                   storageUrl:
 *                     type: string
 *                     example: https://bucket.s3.region.backblazeb2.com/uploads/1623456789-annual-report.pdf
 *                   uploadStatus:
 *                     type: string
 *                     example: completed
 *                   uploadedBy:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                   company:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', getFiles);

/**
 * @swagger
 * /files/my-files:
 *   get:
 *     summary: Get user's files with statistics
 *     description: Returns files with additional statistics for dashboard display
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Files with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: number
 *                       example: 10
 *                     totalSize:
 *                       type: number
 *                       example: 52428800
 *                     byType:
 *                       type: object
 *                       properties:
 *                         images:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 3
 *                             size:
 *                               type: number
 *                               example: 15728640
 *                         videos:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 1
 *                             size:
 *                               type: number
 *                               example: 20971520
 *                         pdfs:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 2
 *                             size:
 *                               type: number
 *                               example: 10485760
 *                         documents:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 3
 *                             size:
 *                               type: number
 *                               example: 3145728
 *                         others:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 1
 *                             size:
 *                               type: number
 *                               example: 2097152
 *                     recent:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/File'
 */
router.get('/my-files', getMyFiles);

/**
 * @swagger
 * /files/stats:
 *   get:
 *     summary: Get file statistics for user
 *     description: Returns aggregated statistics about user's files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: number
 *                       example: 10
 *                     totalSize:
 *                       type: number
 *                       example: 52428800
 *                     allocated:
 *                       type: number
 *                       example: 53687091200
 *                     used:
 *                       type: number
 *                       example: 52428800
 *                     available:
 *                       type: number
 *                       example: 53634662400
 *                     byType:
 *                       type: object
 *                       properties:
 *                         images:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 3
 *                             size:
 *                               type: number
 *                               example: 15728640
 *                         videos:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 1
 *                             size:
 *                               type: number
 *                               example: 20971520
 *                         pdfs:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 2
 *                             size:
 *                               type: number
 *                               example: 10485760
 *                         documents:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 3
 *                             size:
 *                               type: number
 *                               example: 3145728
 *                         others:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: number
 *                               example: 1
 *                             size:
 *                               type: number
 *                               example: 2097152
 */
router.get('/stats', getFileStats);

/**
 * @swagger
 * /files/search:
 *   get:
 *     summary: Search files
 *     description: Search through user's files by filename
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *         example: "report"
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *                 count:
 *                   type: number
 *                   example: 2
 *       400:
 *         description: Missing search query
 */
router.get('/search', searchFiles);

/**
 * @swagger
 * /files/type/{type}:
 *   get:
 *     summary: Get files by type
 *     description: Filter files by category (images, videos, pdfs, documents, others)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [images, videos, pdfs, documents, others]
 *         description: File type category
 *         example: "images"
 *     responses:
 *       200:
 *         description: Filtered files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *                 count:
 *                   type: number
 *                   example: 3
 *                 type:
 *                   type: string
 *                   example: images
 */
router.get('/type/:type', getFilesByType);

/**
 * @swagger
 * /files/pending:
 *   get:
 *     summary: Get pending uploads
 *     description: Returns files with pending or uploading status (for resume)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending uploads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/File'
 */
router.get('/pending', getPendingUploads);

// Single file operations

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file by ID
 *     description: Returns detailed information about a specific file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 60d21b4667d0d8992e610c87
 *     responses:
 *       200:
 *         description: File details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 */
router.get('/:id', getFileById);

/**
 * @swagger
 * /files/{id}/metadata:
 *   get:
 *     summary: Get file metadata
 *     description: Returns metadata for a specific file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 60d21b4667d0d8992e610c87
 *     responses:
 *       200:
 *         description: File metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 size:
 *                   type: number
 *                 type:
 *                   type: string
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *                 uploadedBy:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                 storageUrl:
 *                   type: string
 *                 etag:
 *                   type: string
 *       404:
 *         description: File not found
 */
router.get('/:id/metadata', getFileMetadata);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete file
 *     description: Soft deletes a file (marks as deleted, doesn't remove from storage immediately)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 60d21b4667d0d8992e610c87
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: File deleted successfully
 *                 fileId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c87
 *       404:
 *         description: File not found
 */
router.delete('/:id', deleteFile);

export default router;