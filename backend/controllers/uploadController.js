import File from '../models/File.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import b2 from '../config/b2.js';

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to update file type statistics
const updateFileTypeStats = async (user, file) => {
  const type = file.mimetype || '';
  const size = file.size || 0;
  
  if (!user.fileTypeStats) {
    user.fileTypeStats = {
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      pdfs: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
      others: { count: 0, size: 0 }
    };
  }
  
  if (type.startsWith('image/')) {
    user.fileTypeStats.images.count++;
    user.fileTypeStats.images.size += size;
  } else if (type.startsWith('video/')) {
    user.fileTypeStats.videos.count++;
    user.fileTypeStats.videos.size += size;
  } else if (type === 'application/pdf') {
    user.fileTypeStats.pdfs.count++;
    user.fileTypeStats.pdfs.size += size;
  } else if (type.includes('document') || type.includes('word') || type.includes('text') || 
             type.includes('excel') || type.includes('spreadsheet') || type.includes('presentation')) {
    user.fileTypeStats.documents.count++;
    user.fileTypeStats.documents.size += size;
  } else {
    user.fileTypeStats.others.count++;
    user.fileTypeStats.others.size += size;
  }
};

// Helper function to update daily usage
const updateDailyUsage = async (user, size, type = 'upload') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!user.dailyUsage) {
    user.dailyUsage = [];
  }
  
  let dailyRecord = user.dailyUsage.find(d => {
    const date = new Date(d.date);
    return date.getTime() === today.getTime();
  });
  
  if (!dailyRecord) {
    dailyRecord = {
      date: today,
      uploadSize: 0,
      uploadCount: 0,
      downloadSize: 0,
      downloadCount: 0
    };
    user.dailyUsage.push(dailyRecord);
  }
  
  if (type === 'upload') {
    dailyRecord.uploadSize += size;
    dailyRecord.uploadCount += 1;
  } else if (type === 'download') {
    dailyRecord.downloadSize += size;
    dailyRecord.downloadCount += 1;
  }
  
  // Keep only last 30 days
  user.dailyUsage = user.dailyUsage
    .sort((a, b) => b.date - a.date)
    .slice(0, 30);
};

// @desc    Initialize upload (Step 1)
// @route   POST /api/files/init
// @access  Private
export const initUpload = async (req, res) => {
  try {
    const { filename, size, mimetype } = req.body;
    
    if (!filename || !size || !mimetype) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('📤 Init upload request:', {
      user: req.user.id,
      filename,
      size: `${(size / (1024 * 1024)).toFixed(2)}MB`,
      mimetype
    });
    
    // Get user and verify quota
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate today's uploads
    const todayUploads = await File.aggregate([
      {
        $match: {
          uploadedBy: user._id,
          uploadStatus: 'completed',
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$size" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const todayUploadedSize = todayUploads[0]?.totalSize || 0;
    const todayUploadCount = todayUploads[0]?.count || 0;
    
    // Calculate user's current usage
    const userFiles = await File.find({ 
      uploadedBy: user._id,
      isDeleted: false,
      uploadStatus: 'completed'
    });
    
    const totalUsed = userFiles.reduce((acc, file) => acc + (file.size || 0), 0);
    const fileCount = userFiles.length;
    
    // Calculate user's available quota
    let userAvailable = 0;
    if (user.role === 'admin') {
      const allocatedToUsers = user.allocatedToUsers || 0;
      userAvailable = Math.max(0, user.storageAllocated - user.storageUsed - allocatedToUsers);
    } else {
      userAvailable = Math.max(0, user.storageAllocated - user.storageUsed);
    }
    
    console.log('👤 User storage:', {
      username: user.username,
      role: user.role,
      allocated: (user.storageAllocated / (1024*1024*1024)).toFixed(2) + 'GB',
      used: (user.storageUsed / (1024*1024*1024)).toFixed(2) + 'GB',
      allocatedToUsers: ((user.allocatedToUsers || 0) / (1024*1024*1024)).toFixed(2) + 'GB',
      available: (userAvailable / (1024*1024*1024)).toFixed(2) + 'GB',
      requested: (size / (1024*1024*1024)).toFixed(2) + 'GB',
      fileCount: fileCount,
      todayUploaded: (todayUploadedSize / (1024*1024*1024)).toFixed(2) + 'GB',
      todayCount: todayUploadCount
    });
    
    // ===== QUOTA ENFORCEMENT CHECKS =====
    
    // 1. Total storage check (5GB)
    if (totalUsed + size > 5 * 1024 * 1024 * 1024) {
      const available = (5 * 1024 * 1024 * 1024) - totalUsed;
      return res.status(403).json({ 
        error: 'Storage limit exceeded',
        message: `You have ${formatBytes(available)} remaining. Upgrade to Pro for more storage.`,
        quota: {
          used: totalUsed,
          total: 5 * 1024 * 1024 * 1024,
          available,
          percentage: ((totalUsed / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1)
        }
      });
    }
    
    // 2. File count check (100 files)
    if (fileCount >= 100) {
      return res.status(403).json({ 
        error: 'File count limit exceeded',
        message: 'Free plan allows maximum 100 files. Delete some files to continue uploading.',
        quota: {
          fileCount,
          maxFiles: 100
        }
      });
    }
    
    // 3. File size check (100MB per file)
    if (size > 100 * 1024 * 1024) {
      return res.status(403).json({ 
        error: 'File size limit exceeded',
        message: `Free plan allows maximum 100MB per file. Your file is ${formatBytes(size)}.`,
        quota: {
          fileSize: size,
          maxFileSize: 100 * 1024 * 1024
        }
      });
    }
    
    // 4. Daily upload limit (1GB per day)
    if (todayUploadedSize + size > 1 * 1024 * 1024 * 1024) {
      const remaining = (1 * 1024 * 1024 * 1024) - todayUploadedSize;
      return res.status(403).json({ 
        error: 'Daily upload limit exceeded',
        message: `Free plan allows 1GB per day. You have ${formatBytes(remaining)} remaining today.`,
        quota: {
          todayUsed: todayUploadedSize,
          todayLimit: 1 * 1024 * 1024 * 1024,
          remaining
        }
      });
    }
    
    // 5. File type check
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'application/pdf', 
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-zip-compressed'
    ];
    
    if (!allowedTypes.includes(mimetype) && !mimetype.startsWith('image/')) {
      return res.status(403).json({ 
        error: 'File type not allowed',
        message: 'Free plan supports images, PDFs, videos, documents, and archives.',
        quota: {
          fileType: mimetype,
          allowedTypes
        }
      });
    }
    
    // Check company storage if user has company
    if (user.company) {
      const company = await Company.findById(user.company);
      if (company) {
        const companyAvailable = company.totalStorage - company.usedStorage;
        if (size > companyAvailable) {
          return res.status(403).json({ 
            error: 'Company storage limit exceeded',
            message: `Company has ${formatBytes(companyAvailable)} available`,
            quota: {
              companyUsed: company.usedStorage,
              companyTotal: company.totalStorage,
              companyAvailable
            }
          });
        }
      }
    }
    
    // Generate unique storage key
    const storageKey = b2.generateStorageKey(req.user.id, filename);
    
    // Generate presigned URL
    const presignedUrl = await b2.generatePresignedUploadUrl(storageKey, mimetype);
    
    // Create pending file record
    const file = new File({
      filename,
      originalName: filename,
      size,
      mimetype,
      storageType: 'b2',
      storageKey,
      uploadStatus: 'pending',
      uploadInitiatedAt: new Date(),
      uploadedBy: req.user.id,
      company: req.user.company
    });
    
    await file.save();
    
    console.log('✅ Upload initialized:', {
      fileId: file._id,
      storageKey,
      expiresIn: 900
    });
    
    const storagePercentage = ((totalUsed / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1);
    const dailyPercentage = ((todayUploadedSize / (1 * 1024 * 1024 * 1024)) * 100).toFixed(1);
    
    res.status(201).json({
      success: true,
      fileId: file._id,
      storageKey,
      presignedUrl,
      expiresIn: 900,
      quota: {
        storage: {
          used: totalUsed,
          total: 5 * 1024 * 1024 * 1024,
          available: (5 * 1024 * 1024 * 1024) - totalUsed - size,
          percentage: storagePercentage,
          isNearLimit: storagePercentage >= 80,
          isCritical: storagePercentage >= 95
        },
        files: {
          count: fileCount,
          max: 100,
          remaining: 100 - fileCount - 1,
          isNearLimit: fileCount >= 90
        },
        daily: {
          used: todayUploadedSize,
          limit: 1 * 1024 * 1024 * 1024,
          remaining: (1 * 1024 * 1024 * 1024) - todayUploadedSize - size,
          percentage: dailyPercentage,
          isNearLimit: dailyPercentage >= 85
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Init upload error:', error);
    res.status(500).json({ error: `Failed to initialize upload: ${error.message}` });
  }
};

// @desc    Finalize upload (Step 3)
// @route   POST /api/files/finalize
// @access  Private
export const finalizeUpload = async (req, res) => {
  try {
    const { fileId } = req.body;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Verify user owns this file
    if (file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Verify file is still pending
    if (file.uploadStatus !== 'pending') {
      return res.status(400).json({ error: 'File already finalized' });
    }
    
    console.log('📥 Finalizing upload:', {
      fileId: file._id,
      filename: file.originalName,
      size: file.size
    });
    
    // Verify actual file size with HEAD request
    const metadata = await b2.getObjectMetadata(file.storageKey);
    if (!metadata) {
      return res.status(404).json({ error: 'File not found in storage' });
    }
    
    console.log('📦 B2 metadata:', {
      size: metadata.size,
      etag: metadata.etag
    });
    
    // Verify size matches (prevent quota bypass)
    if (metadata.size !== file.size) {
      // Size mismatch - possible tampering
      await b2.deleteObject(file.storageKey);
      return res.status(400).json({ 
        error: 'File size mismatch - possible tampering',
        details: {
          expected: file.size,
          actual: metadata.size
        }
      });
    }
    
    // Get user and verify quota again
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Recalculate available quota
    let userAvailable = 0;
    if (user.role === 'admin') {
      const allocatedToUsers = user.allocatedToUsers || 0;
      userAvailable = Math.max(0, user.storageAllocated - user.storageUsed - allocatedToUsers);
    } else {
      userAvailable = Math.max(0, user.storageAllocated - user.storageUsed);
    }
    
    // Double-check quota
    if (userAvailable < file.size) {
      await b2.deleteObject(file.storageKey);
      return res.status(403).json({ 
        error: 'Insufficient storage',
        message: 'Your storage quota changed during upload'
      });
    }
    
    // Update file record
    file.uploadStatus = 'completed';
    file.uploadCompletedAt = new Date();
    file.etag = metadata.etag;
    file.storageUrl = `https://${process.env.B2_BUCKET_NAME}.s3.${process.env.B2_REGION}.backblazeb2.com/${file.storageKey}`;
    await file.save();
    
    // Update user's storageUsed
    const oldUserUsed = user.storageUsed;
    user.storageUsed = (user.storageUsed || 0) + file.size;
    
    // Update user's file count
    if (!user.quota) {
      user.quota = {
        plan: 'free',
        maxFiles: 100,
        fileCount: 0,
        dailyUploadLimit: 1 * 1024 * 1024 * 1024
      };
    }
    user.quota.fileCount = (user.quota.fileCount || 0) + 1;
    
    // Update file type statistics
    await updateFileTypeStats(user, file);
    
    // Update daily usage
    await updateDailyUsage(user, file.size, 'upload');
    
    await user.save();
    
    console.log('👤 User storage updated:', {
      username: user.username,
      oldUsed: (oldUserUsed / (1024*1024*1024)).toFixed(2) + 'GB',
      added: (file.size / (1024*1024*1024)).toFixed(2) + 'GB',
      newUsed: (user.storageUsed / (1024*1024*1024)).toFixed(2) + 'GB',
      fileCount: user.quota.fileCount
    });
    
    // Update company storage if applicable
    if (user.company) {
      const company = await Company.findById(user.company);
      if (company) {
        const oldCompanyUsed = company.usedStorage;
        company.usedStorage = (company.usedStorage || 0) + file.size;
        await company.save();
        
        console.log('🏢 Company storage updated:', {
          name: company.name,
          oldUsed: (oldCompanyUsed / (1024*1024*1024)).toFixed(2) + 'GB',
          newUsed: (company.usedStorage / (1024*1024*1024)).toFixed(2) + 'GB'
        });
      }
    }
    
    console.log('✅ Upload finalized successfully:', {
      fileId: file._id,
      filename: file.originalName,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
    });
    
    // Calculate updated quota info
    const totalUsed = user.storageUsed;
    const fileCount = user.quota.fileCount;
    const available = (5 * 1024 * 1024 * 1024) - totalUsed;
    const storagePercentage = ((totalUsed / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1);
    
    // Get today's usage for response
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsage = user.dailyUsage?.find(d => {
      const date = new Date(d.date);
      return date.getTime() === today.getTime();
    }) || { uploadSize: 0, uploadCount: 0 };
    
    const dailyPercentage = ((todayUsage.uploadSize / (1 * 1024 * 1024 * 1024)) * 100).toFixed(1);
    
    res.json({
      success: true,
      message: 'Upload finalized successfully',
      file: {
        _id: file._id,
        name: file.originalName,
        size: file.size,
        storageUrl: file.storageUrl,
        uploadedAt: file.uploadCompletedAt
      },
      quota: {
        storage: {
          used: totalUsed,
          total: 5 * 1024 * 1024 * 1024,
          available: available,
          percentage: storagePercentage,
          isNearLimit: storagePercentage >= 80,
          isCritical: storagePercentage >= 95
        },
        files: {
          count: fileCount,
          max: 100,
          remaining: 100 - fileCount,
          isNearLimit: fileCount >= 90
        },
        daily: {
          used: todayUsage.uploadSize,
          limit: 1 * 1024 * 1024 * 1024,
          remaining: (1 * 1024 * 1024 * 1024) - todayUsage.uploadSize,
          percentage: dailyPercentage,
          isNearLimit: dailyPercentage >= 85
        },
        byType: user.fileTypeStats || {}
      }
    });
    
  } catch (error) {
    console.error('❌ Finalize upload error:', error);
    res.status(500).json({ error: `Failed to finalize upload: ${error.message}` });
  }
};

// @desc    Get download URL (presigned)
// @route   GET /api/files/:id/download-url
// @access  Private
export const getDownloadUrl = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
      uploadStatus: 'completed',
      isDeleted: false
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log('📥 Generating download URL for:', file.originalName);
    
    // Track download in daily usage
    const user = await User.findById(req.user.id);
    if (user) {
      await updateDailyUsage(user, file.size, 'download');
      await user.save();
    }
    
    const downloadUrl = await b2.generatePresignedDownloadUrl(file.storageKey, 300);
    
    res.json({
      success: true,
      downloadUrl,
      filename: file.originalName,
      fileId: file._id,
      size: file.size,
      expiresIn: 300
    });
    
  } catch (error) {
    console.error('❌ Get download URL error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get view URL (presigned - for preview)
// @route   GET /api/files/:id/view-url
// @access  Private
export const getViewUrl = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
      uploadStatus: 'completed',
      isDeleted: false
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log('👁️ Generating view URL for:', file.originalName);
    
    const viewUrl = await b2.generatePresignedViewUrl(file.storageKey, 600);
    
    res.json({
      success: true,
      viewUrl,
      filename: file.originalName,
      fileId: file._id,
      expiresIn: 600
    });
    
  } catch (error) {
    console.error('❌ Get view URL error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get user's own files
// @route   GET /api/files
// @access  Private
export const getFiles = async (req, res) => {
  try {
    console.log('📁 Get files - User:', req.user.id);

    const files = await File.find({ 
      uploadedBy: req.user.id,
      isDeleted: false,
      uploadStatus: 'completed'
    })
      .populate("uploadedBy", "username email role")
      .populate("company", "name")
      .sort({ uploadDate: -1 });
    
    console.log(`✅ User ${req.user.id} found ${files.length} files`);
    res.json(files);
  } catch (error) {
    console.error("❌ Get files error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// @desc    Get pending uploads (for resume)
// @route   GET /api/files/pending
// @access  Private
export const getPendingUploads = async (req, res) => {
  try {
    const pendingFiles = await File.find({
      uploadedBy: req.user.id,
      uploadStatus: { $in: ['pending', 'uploading'] },
      isDeleted: false
    }).sort({ uploadInitiatedAt: -1 });
    
    res.json(pendingFiles);
  } catch (error) {
    console.error('❌ Get pending uploads error:', error);
    res.status(500).json({ error: 'Failed to get pending uploads' });
  }
};

// @desc    Soft delete file
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
      isDeleted: false
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log('🗑️ Deleting file:', {
      fileId: file._id,
      filename: file.originalName,
      size: file.size
    });
    
    // Soft delete
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();
    
    // Update user usage
    const user = await User.findById(req.user.id);
    if (user) {
      const oldUserUsed = user.storageUsed;
      user.storageUsed = Math.max(0, (user.storageUsed || 0) - file.size);
      
      // Update file count
      if (user.quota) {
        user.quota.fileCount = Math.max(0, (user.quota.fileCount || 1) - 1);
      }
      
      await user.save();
      
      console.log('👤 User storage updated after delete:', {
        username: user.username,
        oldUsed: (oldUserUsed / (1024*1024*1024)).toFixed(2) + 'GB',
        removed: (file.size / (1024*1024*1024)).toFixed(2) + 'GB',
        newUsed: (user.storageUsed / (1024*1024*1024)).toFixed(2) + 'GB',
        fileCount: user.quota?.fileCount || 0
      });
    }
    
    // Update company storage
    if (req.user.company) {
      const company = await Company.findById(req.user.company);
      if (company) {
        const oldCompanyUsed = company.usedStorage;
        company.usedStorage = Math.max(0, (company.usedStorage || 0) - file.size);
        await company.save();
        
        console.log('🏢 Company storage updated after delete:', {
          name: company.name,
          oldUsed: (oldCompanyUsed / (1024*1024*1024)).toFixed(2) + 'GB',
          newUsed: (company.usedStorage / (1024*1024*1024)).toFixed(2) + 'GB'
        });
      }
    }
    
    console.log('✅ File soft deleted successfully:', file._id);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      fileId: file._id
    });
    
  } catch (error) {
    console.error('❌ Delete file error:', error);
    res.status(500).json({ error: `Failed to delete file: ${error.message}` });
  }
};

// @desc    Get file metadata
// @route   GET /api/files/:id/metadata
// @access  Private
export const getFileMetadata = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
      isDeleted: false
    }).populate('uploadedBy', 'username');
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({
      _id: file._id,
      name: file.originalName,
      size: file.size,
      type: file.mimetype,
      uploadedAt: file.uploadDate,
      uploadedBy: file.uploadedBy,
      storageUrl: file.storageUrl,
      etag: file.etag
    });
  } catch (error) {
    console.error('❌ Get file metadata error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Export all functions
export default {
  initUpload,
  finalizeUpload,
  getDownloadUrl,
  getViewUrl,
  getFiles,
  getPendingUploads,
  deleteFile,
  getFileMetadata
};