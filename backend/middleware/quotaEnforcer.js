import User from '../models/User.js';
import File from '../models/File.js';

// Free plan limits
export const FREE_PLAN = {
  maxStorage: 5 * 1024 * 1024 * 1024, // 5GB in bytes
  maxFiles: 100, // Maximum number of files
  maxFileSize: 100 * 1024 * 1024, // 100MB per file
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                 'video/mp4', 'video/quicktime', 'text/plain', 'application/msword',
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  dailyUploadLimit: 1 * 1024 * 1024 * 1024 // 1GB per day
};

// Check quota before upload
export const checkUploadQuota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fileSize = req.body.size || 0;
    const fileType = req.body.mimetype || '';

    const user = await User.findById(userId);
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

    // Quota checks
    const checks = [];

    // 1. Total storage limit
    if (totalUsed + fileSize > FREE_PLAN.maxStorage) {
      checks.push({
        passed: false,
        limit: 'storage',
        message: `Storage limit exceeded. You have ${formatBytes(FREE_PLAN.maxStorage - totalUsed)} remaining`
      });
    }

    // 2. File count limit
    if (fileCount + 1 > FREE_PLAN.maxFiles) {
      checks.push({
        passed: false,
        limit: 'fileCount',
        message: `File count limit exceeded. Maximum ${FREE_PLAN.maxFiles} files allowed`
      });
    }

    // 3. Individual file size limit
    if (fileSize > FREE_PLAN.maxFileSize) {
      checks.push({
        passed: false,
        limit: 'fileSize',
        message: `File size limit exceeded. Maximum file size is ${formatBytes(FREE_PLAN.maxFileSize)}`
      });
    }

    // 4. File type restriction
    if (!FREE_PLAN.allowedTypes.includes(fileType) && !fileType.startsWith('image/')) {
      checks.push({
        passed: false,
        limit: 'fileType',
        message: `File type not allowed. Supported types: Images, PDFs, Videos, Documents`
      });
    }

    // 5. Daily upload limit
    if (todayUploadedSize + fileSize > FREE_PLAN.dailyUploadLimit) {
      checks.push({
        passed: false,
        limit: 'daily',
        message: `Daily upload limit exceeded. You can upload ${formatBytes(FREE_PLAN.dailyUploadLimit)} per day`
      });
    }

    // 6. Daily upload count limit (optional)
    if (todayUploadCount + 1 > 50) { // Max 50 files per day
      checks.push({
        passed: false,
        limit: 'dailyCount',
        message: `Daily file count limit exceeded. Maximum 50 files per day`
      });
    }

    // If any checks failed
    const failedChecks = checks.filter(check => !check.passed);
    if (failedChecks.length > 0) {
      return res.status(403).json({
        error: 'Quota exceeded',
        message: 'Upload blocked due to quota limits',
        details: failedChecks,
        usage: {
          totalUsed,
          fileCount,
          todayUploadedSize,
          todayUploadCount,
          limits: {
            maxStorage: FREE_PLAN.maxStorage,
            maxFiles: FREE_PLAN.maxFiles,
            maxFileSize: FREE_PLAN.maxFileSize,
            dailyUploadLimit: FREE_PLAN.dailyUploadLimit
          }
        }
      });
    }

    // Attach usage info to request for logging
    req.quotaInfo = {
      totalUsed,
      fileCount,
      todayUploadedSize,
      todayUploadCount,
      remainingStorage: FREE_PLAN.maxStorage - totalUsed - fileSize
    };

    next();
  } catch (error) {
    console.error('❌ Quota check error:', error);
    res.status(500).json({ error: 'Failed to check quota' });
  }
};

// Check quota before delete (to update counters)
export const updateQuotaOnDelete = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const file = await File.findOne({
      _id: fileId,
      uploadedBy: req.user.id,
      isDeleted: false
    });

    if (file) {
      req.deletedFileSize = file.size;
    }
    next();
  } catch (error) {
    console.error('❌ Delete quota check error:', error);
    next();
  }
};

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};