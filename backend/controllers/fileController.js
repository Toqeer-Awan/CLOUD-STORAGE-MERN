import File from "../models/File.js";
import User from "../models/User.js";
import Company from "../models/Company.js";

// @desc    Get user's own files
// @route   GET /api/files
// @access  Private
export const getFiles = async (req, res) => {
  try {
    const files = await File.find({ 
      uploadedBy: req.user.id,
      isDeleted: false,
      uploadStatus: 'completed'
    })
      .populate("uploadedBy", "username email role")
      .populate("company", "name")
      .sort({ uploadDate: -1 });
    
    // Log to check file sizes
    files.forEach(file => {
      console.log(`File: ${file.originalName}, Size: ${file.size} bytes`);
    });
    
    res.json(files);
  } catch (error) {
    console.error("❌ Get files error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// @desc    Get user's files with statistics (for dashboard)
// @route   GET /api/files/my-files
// @access  Private
export const getMyFiles = async (req, res) => {
  try {
    const files = await File.find({ 
      uploadedBy: req.user.id,
      isDeleted: false,
      uploadStatus: 'completed'
    }).sort({ uploadDate: -1 });
    
    // Calculate statistics
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
      byType: {
        images: { count: 0, size: 0 },
        videos: { count: 0, size: 0 },
        documents: { count: 0, size: 0 },
        pdfs: { count: 0, size: 0 },
        others: { count: 0, size: 0 }
      },
      recent: files.slice(0, 10)
    };

    files.forEach(file => {
      const size = file.size || 0;
      const type = file.mimetype || '';

      if (type.startsWith('image/')) {
        stats.byType.images.count++;
        stats.byType.images.size += size;
      } else if (type.startsWith('video/')) {
        stats.byType.videos.count++;
        stats.byType.videos.size += size;
      } else if (type === 'application/pdf') {
        stats.byType.pdfs.count++;
        stats.byType.pdfs.size += size;
      } else if (type.includes('document') || type.includes('word') || type.includes('text')) {
        stats.byType.documents.count++;
        stats.byType.documents.size += size;
      } else {
        stats.byType.others.count++;
        stats.byType.others.size += size;
      }
    });

    res.json({
      success: true,
      files,
      stats
    });
  } catch (error) {
    console.error("❌ Get my files error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// @desc    Get file by ID
// @route   GET /api/files/:id
// @access  Private
export const getFileById = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
      isDeleted: false
    }).populate('uploadedBy', 'username');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    console.error("❌ Get file by ID error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// @desc    Get file statistics for user
// @route   GET /api/files/stats
// @access  Private
export const getFileStats = async (req, res) => {
  try {
    const files = await File.find({ 
      uploadedBy: req.user.id,
      isDeleted: false,
      uploadStatus: 'completed'
    });

    const user = await User.findById(req.user.id);

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
      allocated: user.storageAllocated || 0,
      used: user.storageUsed || 0,
      available: (user.storageAllocated || 0) - (user.storageUsed || 0),
      byType: {
        images: { count: 0, size: 0 },
        videos: { count: 0, size: 0 },
        documents: { count: 0, size: 0 },
        pdfs: { count: 0, size: 0 },
        others: { count: 0, size: 0 }
      }
    };

    files.forEach(file => {
      const size = file.size || 0;
      const type = file.mimetype || '';

      if (type.startsWith('image/')) {
        stats.byType.images.count++;
        stats.byType.images.size += size;
      } else if (type.startsWith('video/')) {
        stats.byType.videos.count++;
        stats.byType.videos.size += size;
      } else if (type === 'application/pdf') {
        stats.byType.pdfs.count++;
        stats.byType.pdfs.size += size;
      } else if (type.includes('document') || type.includes('word') || type.includes('text')) {
        stats.byType.documents.count++;
        stats.byType.documents.size += size;
      } else {
        stats.byType.others.count++;
        stats.byType.others.size += size;
      }
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("❌ Get file stats error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// @desc    Search files
// @route   GET /api/files/search
// @access  Private
export const searchFiles = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const files = await File.find({
      uploadedBy: req.user.id,
      isDeleted: false,
      uploadStatus: 'completed',
      $or: [
        { originalName: { $regex: query, $options: 'i' } },
        { filename: { $regex: query, $options: 'i' } }
      ]
    }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      files,
      count: files.length
    });
  } catch (error) {
    console.error("❌ Search files error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// @desc    Get files by type
// @route   GET /api/files/type/:type
// @access  Private
export const getFilesByType = async (req, res) => {
  try {
    const { type } = req.params;
    let query = { uploadedBy: req.user.id, isDeleted: false, uploadStatus: 'completed' };

    switch(type) {
      case 'images':
        query.mimetype = { $regex: '^image/' };
        break;
      case 'videos':
        query.mimetype = { $regex: '^video/' };
        break;
      case 'pdfs':
        query.mimetype = 'application/pdf';
        break;
      case 'documents':
        query.mimetype = { $regex: 'document|word|text' };
        break;
      default:
        query.mimetype = { $not: /image|video|pdf|document|word|text/ };
    }

    const files = await File.find(query).sort({ uploadDate: -1 });

    res.json({
      success: true,
      files,
      count: files.length,
      type
    });
  } catch (error) {
    console.error("❌ Get files by type error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

export default {
  getFiles,
  getMyFiles,
  getFileById,
  getFileStats,
  searchFiles,
  getFilesByType
};