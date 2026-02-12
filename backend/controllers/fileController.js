import File from "../models/File.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";
import fs from "fs";

export const getFiles = async (req, res) => {
  try {
    let files;

    if (req.user.role === "admin" || req.user.permissions?.canDeleteAllFiles) {
      // Admins and moderators can see all files
      files = await File.find().populate("uploadedBy", "username email role");
    } else {
      // Regular users can only see their own files
      files = await File.find({ uploadedBy: req.user.id }).populate(
        "uploadedBy",
        "username email role",
      );
    }

    res.json(files);
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const uploadToCloudinaryHandler = async (req, res) => {
  try {
    // Check upload permission
    if (!req.user.permissions?.canUploadFiles && req.user.role !== 'admin') {
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
    });

    // Clean up temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(201).json({
      message: "File uploaded to Cloudinary successfully",
      file: cloudinaryFile,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Clean up temp file
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
    // Check upload permission
    if (!req.user.permissions?.canUploadFiles && req.user.role !== 'admin') {
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

    // Check if AWS credentials are configured
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID === "your_access_key_id"
    ) {
      return res.status(400).json({
        error: "AWS S3 not configured",
        message: "Please configure AWS credentials in .env file",
      });
    }

    const s3Url = await uploadToS3(file.path, file.originalname);

    const s3File = await File.create({
      filename: file.originalname,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storageType: "s3",
      storageUrl: s3Url,
      downloadUrl: s3Url,
      s3Key: file.originalname,
      uploadedBy: req.user.id,
    });

    // Clean up temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(201).json({
      message: "File uploaded to S3 successfully",
      file: s3File,
    });
  } catch (error) {
    console.error("S3 upload error:", error);

    // Clean up temp file
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "S3 upload failed",
      details: error.message,
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if user owns the file
    const isOwner = file.uploadedBy.toString() === req.user.id;
    
    // Check permissions
    if (req.user.role === 'admin') {
      // Admin can delete anything - proceed
    } 
    else if (req.user.permissions?.canDeleteAllFiles) {
      // User can delete all files - proceed
    }
    else if (isOwner && req.user.permissions?.canDeleteOwnFiles) {
      // User owns the file and can delete own files - proceed
    }
    else {
      return res.status(403).json({ 
        error: "Access denied",
        message: "You do not have permission to delete this file"
      });
    }

    // Delete from storage based on type
    if (file.storageType === "cloudinary" && file.publicId) {
      console.log(`Deleting ${file.publicId} from Cloudinary...`);
      await deleteFromCloudinary(file.publicId);
      console.log("✅ Deleted from Cloudinary");
    }

    if (file.storageType === "s3" && file.s3Key) {
      console.log(`Deleting ${file.s3Key} from S3...`);
      await deleteFromS3(file.s3Key);
      console.log("✅ Deleted from S3");
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    console.log("✅ File deleted from database");

    res.json({
      success: true,
      message: "File deleted successfully from storage and database",
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