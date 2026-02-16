import File from "../models/File.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";
import fs from "fs";

// @desc    Get user's own files ONLY
// @route   GET /api/files
// @access  Private
export const getFiles = async (req, res) => {
  try {
    console.log('📁 Get files - User:', {
      userId: req.user.id,
      role: req.user.role,
      company: req.user.company
    });

    // 🔥 CRITICAL: Everyone can ONLY see their own files
    const files = await File.find({ 
      uploadedBy: req.user.id  // Only files uploaded by this user
    })
      .populate("uploadedBy", "username email role")
      .populate("company", "name")
      .sort({ uploadDate: -1 });
    
    console.log(`✅ User ${req.user.id} found ${files.length} of their own files`);
    res.json(files);
  } catch (error) {
    console.error("❌ Get files error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Upload file to S3
// @route   POST /api/files/upload/s3
// @access  Private
export const uploadToS3Handler = async (req, res) => {
  try {
    // Check upload permission
    if (!req.user.permissions?.upload) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to upload files'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    console.log("📤 Uploading file to S3:", file.originalname);

    // Check AWS configuration
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID === "your_access_key_id"
    ) {
      return res.status(400).json({
        error: "AWS S3 not configured",
        message: "Please configure AWS credentials in .env file",
      });
    }

    // Check user's allocated storage
    const user = await User.findById(req.user.id);
    const userFiles = await File.find({ uploadedBy: user._id });
    const userStorageUsed = userFiles.reduce((acc, f) => acc + f.size, 0);
    
    if (userStorageUsed + file.size > user.storageAllocated) {
      return res.status(400).json({
        error: "Storage limit exceeded",
        message: `You have used ${(userStorageUsed / (1024 * 1024 * 1024)).toFixed(2)}GB of ${(user.storageAllocated / (1024 * 1024 * 1024)).toFixed(2)}GB`
      });
    }

    // Check company storage
    const company = await Company.findById(req.user.company);
    const companyFiles = await File.find({ company: company._id });
    const companyStorageUsed = companyFiles.reduce((acc, f) => acc + f.size, 0);
    
    if (companyStorageUsed + file.size > company.totalStorage) {
      return res.status(400).json({
        error: "Company storage limit exceeded",
        message: `Company storage limit: ${(company.totalStorage / (1024 * 1024 * 1024)).toFixed(2)}GB`
      });
    }

    // Upload to S3
    const s3Url = await uploadToS3(file.path, file.originalname);

    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `cloud-storage/${timestamp}-${safeFileName}`;

    // Save file record in database
    const s3File = await File.create({
      filename: file.originalname,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storageType: "s3",
      storageUrl: s3Url,
      downloadUrl: s3Url,
      s3Key: s3Key,
      uploadedBy: req.user.id,
      company: req.user.company,
    });

    // Update storage usage
    company.usedStorage = companyStorageUsed + file.size;
    await company.save();
    
    user.storageUsed = userStorageUsed + file.size;
    await user.save();

    // Clean up temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    console.log("✅ File uploaded successfully:", s3File._id);

    res.status(201).json({
      message: "File uploaded to S3 successfully",
      file: s3File,
    });
  } catch (error) {
    console.error("❌ S3 upload error:", error);

    // Clean up temporary file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "S3 upload failed",
      details: error.message,
    });
  }
};

// @desc    Delete user's own file ONLY
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: "File not found" 
      });
    }

    console.log('🗑️ Delete attempt - User:', {
      userId: req.user.id,
      userRole: req.user.role
    });

    console.log('🗑️ Delete attempt - File:', {
      fileId: file._id,
      fileName: file.originalName,
      uploadedBy: file.uploadedBy.toString()
    });

    // 🔥 CRITICAL: Check if user owns this file
    const isOwner = file.uploadedBy.toString() === req.user.id;
    
    if (!isOwner) {
      console.log("❌ Delete permission denied - not file owner");
      return res.status(403).json({ 
        success: false,
        error: "Access denied",
        message: "You can only delete your own files"
      });
    }

    console.log("✅ Delete permission granted - user owns this file");

    // Delete from S3
    if (file.storageType === "s3") {
      if (!file.s3Key) {
        console.error("❌ No s3Key found for S3 file");
        return res.status(400).json({
          success: false,
          error: "Invalid file data: missing s3Key"
        });
      }
      
      console.log(`🗑️ Deleting from S3, key: ${file.s3Key}`);
      await deleteFromS3(file.s3Key);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    // Update user storage
    const user = await User.findById(file.uploadedBy);
    if (user) {
      const userFiles = await File.find({ uploadedBy: user._id });
      const userStorageUsed = userFiles.reduce((acc, f) => acc + f.size, 0);
      user.storageUsed = userStorageUsed;
      await user.save();
    }

    // Update company storage
    const company = await Company.findById(file.company);
    if (company) {
      const companyFiles = await File.find({ company: company._id });
      const companyStorageUsed = companyFiles.reduce((acc, f) => acc + f.size, 0);
      company.usedStorage = companyStorageUsed;
      await company.save();
    }

    console.log("✅ File deleted successfully");

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete file error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
      details: error.message,
    });
  }
};