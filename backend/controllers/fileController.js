import File from "../models/File.js";
import Company from "../models/Company.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";
import fs from "fs";

export const getFiles = async (req, res) => {
  try {
    let files;

    if (req.user.role === "admin") {
      files = await File.find()
        .populate("uploadedBy", "username email role")
        .populate("company", "name");
    } else {
      files = await File.find({ company: req.user.company })
        .populate("uploadedBy", "username email role")
        .populate("company", "name")
        .sort({ uploadDate: -1 });
    }

    res.json(files);
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const uploadToCloudinaryHandler = async (req, res) => {
  try {
    if (!req.user.permissions?.upload && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to upload files'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    console.log("Uploading file to Cloudinary:", file.originalname);

    const company = await Company.findById(req.user.company);
    const files = await File.find({ company: company._id });
    const totalStorageUsed = files.reduce((acc, f) => acc + f.size, 0);
    
    if (totalStorageUsed + file.size > company.totalStorage) {
      return res.status(400).json({
        error: "Storage limit exceeded",
        message: `Cannot upload. Company storage limit: ${(company.totalStorage / (1024 * 1024 * 1024)).toFixed(2)}GB`
      });
    }

    const cloudinaryResult = await uploadToCloudinary(file.path);

    const cloudinaryFile = await File.create({
      filename: file.originalname,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storageType: "cloudinary",
      storageUrl: cloudinaryResult.url,
      downloadUrl: cloudinaryResult.url.replace(
        "/upload/",
        "/upload/fl_attachment/",
      ),
      publicId: cloudinaryResult.publicId,
      uploadedBy: req.user.id,
      company: req.user.company,
    });

    company.usedStorage = totalStorageUsed + file.size;
    await company.save();

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(201).json({
      message: "File uploaded to Cloudinary successfully",
      file: cloudinaryFile,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Cloudinary upload failed",
      details: error.message,
    });
  }
};

export const uploadToS3Handler = async (req, res) => {
  try {
    if (!req.user.permissions?.upload && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to upload files'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    console.log("Uploading file to S3:", file.originalname);

    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID === "your_access_key_id"
    ) {
      return res.status(400).json({
        error: "AWS S3 not configured",
        message: "Please configure AWS credentials in .env file",
      });
    }

    const company = await Company.findById(req.user.company);
    const files = await File.find({ company: company._id });
    const totalStorageUsed = files.reduce((acc, f) => acc + f.size, 0);
    
    if (totalStorageUsed + file.size > company.totalStorage) {
      return res.status(400).json({
        error: "Storage limit exceeded",
        message: `Cannot upload. Company storage limit: ${(company.totalStorage / (1024 * 1024 * 1024)).toFixed(2)}GB`
      });
    }

    const s3Url = await uploadToS3(file.path, file.originalname);

    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `cloud-storage/${timestamp}-${safeFileName}`;

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

    company.usedStorage = totalStorageUsed + file.size;
    await company.save();

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(201).json({
      message: "File uploaded to S3 successfully",
      file: s3File,
    });
  } catch (error) {
    console.error("S3 upload error:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "S3 upload failed",
      details: error.message,
    });
  }
};

// ✅ FIXED DELETE FUNCTION
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: "File not found" 
      });
    }

    console.log("Delete attempt - User:", {
      userId: req.user.id,
      userRole: req.user.role,
      userCompany: req.user.company?.toString(),
      permissions: req.user.permissions
    });

    console.log("Delete attempt - File:", {
      fileId: file._id,
      fileName: file.originalName,
      uploadedBy: file.uploadedBy.toString(),
      fileCompany: file.company?.toString(),
      storageType: file.storageType
    });

    // Check permissions
    const isOwner = file.uploadedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const hasDeletePermission = req.user.permissions?.delete === true;
    
    console.log("Permission check:", {
      isOwner,
      isAdmin,
      hasDeletePermission
    });

    // Allow if:
    // 1. User is admin
    // 2. User has delete permission AND file belongs to user's company
    // 3. User owns the file AND file belongs to user's company
    if (isAdmin) {
      // Admin can delete anything
      console.log("✅ Admin delete permission granted");
    } 
    else if (hasDeletePermission && file.company.toString() === req.user.company.toString()) {
      // User has delete permission and file is in their company
      console.log("✅ Delete permission granted (has permission + same company)");
    }
    else if (isOwner && file.company.toString() === req.user.company.toString()) {
      // User owns the file and it's in their company
      console.log("✅ Delete permission granted (owner + same company)");
    }
    else {
      console.log("❌ Delete permission denied");
      return res.status(403).json({ 
        success: false,
        error: "Access denied",
        message: "You do not have permission to delete this file"
      });
    }

    // Delete from storage based on type
    if (file.storageType === "cloudinary") {
      if (!file.publicId) {
        console.error("No publicId found for Cloudinary file");
        return res.status(400).json({
          success: false,
          error: "Invalid file data: missing publicId"
        });
      }
      
      console.log(`Deleting from Cloudinary, publicId: ${file.publicId}`);
      const result = await deleteFromCloudinary(file.publicId);
      console.log("Cloudinary delete result:", result);
    }

    if (file.storageType === "s3") {
      if (!file.s3Key) {
        console.error("No s3Key found for S3 file");
        return res.status(400).json({
          success: false,
          error: "Invalid file data: missing s3Key"
        });
      }
      
      console.log(`Deleting from S3, key: ${file.s3Key}`);
      const result = await deleteFromS3(file.s3Key);
      console.log("S3 delete result:", result);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    // Update company used storage
    const company = await Company.findById(file.company);
    if (company) {
      const companyFiles = await File.find({ company: company._id });
      const totalStorageUsed = companyFiles.reduce((acc, f) => acc + f.size, 0);
      company.usedStorage = totalStorageUsed;
      await company.save();
      console.log(`✅ Updated company storage: ${totalStorageUsed} bytes`);
    }

    console.log("✅ File deleted successfully from database");

    res.json({
      success: true,
      message: "File deleted successfully from storage and database",
    });
  } catch (error) {
    console.error("❌ Delete file error:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
      details: error.message,
    });
  }
};