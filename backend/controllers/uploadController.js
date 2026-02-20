import File from '../models/File.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import b2 from '../config/b2.js';

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
      allocatedToUsers: (user.allocatedToUsers || 0) / (1024*1024*1024).toFixed(2) + 'GB',
      available: (userAvailable / (1024*1024*1024)).toFixed(2) + 'GB',
      requested: (size / (1024*1024*1024)).toFixed(2) + 'GB'
    });
    
    // Check if user has enough storage
    if (userAvailable < size) {
      return res.status(403).json({ 
        error: 'Insufficient storage',
        message: `You have ${(userAvailable / (1024 * 1024 * 1024)).toFixed(2)}GB available, but need ${(size / (1024 * 1024 * 1024)).toFixed(2)}GB`
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
            message: `Company has ${(companyAvailable / (1024 * 1024 * 1024)).toFixed(2)}GB available`
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
    
    res.status(201).json({
      success: true,
      fileId: file._id,
      storageKey,
      presignedUrl,
      expiresIn: 900
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
    await user.save();
    
    console.log('👤 User storage updated:', {
      username: user.username,
      oldUsed: (oldUserUsed / (1024*1024*1024)).toFixed(2) + 'GB',
      added: (file.size / (1024*1024*1024)).toFixed(2) + 'GB',
      newUsed: (user.storageUsed / (1024*1024*1024)).toFixed(2) + 'GB'
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
    
    res.json({
      success: true,
      message: 'Upload finalized successfully',
      file: {
        _id: file._id,
        name: file.originalName,
        size: file.size,
        storageUrl: file.storageUrl,
        uploadedAt: file.uploadCompletedAt
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
    
    // Make sure this is using the correct method - should be generatePresignedDownloadUrl
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
    
    // Make sure this is using the correct method - should be generatePresignedViewUrl
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
      await user.save();
      
      console.log('👤 User storage updated after delete:', {
        username: user.username,
        oldUsed: (oldUserUsed / (1024*1024*1024)).toFixed(2) + 'GB',
        removed: (file.size / (1024*1024*1024)).toFixed(2) + 'GB',
        newUsed: (user.storageUsed / (1024*1024*1024)).toFixed(2) + 'GB'
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