import File from '../models/File.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3Upload.js';
import fs from 'fs';

export const getFiles = async (req, res) => {
  try {
    let files;
    if (req.user.role === 'admin' || req.user.permissions?.manageFiles) {
      files = await File.find().populate('uploadedBy', 'username email');
    } else {
      files = await File.find({ uploadedBy: req.user.id }).populate('uploadedBy', 'username email');
    }
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const uploadToCloudinaryHandler = async (req, res) => {
  try {
    if (!req.user.permissions?.upload && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No upload permission' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const result = await uploadToCloudinary(req.file.path);
    
    const file = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      storageType: 'cloudinary',
      storageUrl: result.url,
      publicId: result.publicId,
      uploadedBy: req.user.id
    });

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.status(201).json({ file });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
};

export const uploadToS3Handler = async (req, res) => {
  try {
    if (!req.user.permissions?.upload && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No upload permission' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const url = await uploadToS3(req.file.path, req.file.originalname);
    
    const file = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      storageType: 's3',
      storageUrl: url,
      s3Key: req.file.originalname,
      uploadedBy: req.user.id
    });

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.status(201).json({ file });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const isOwner = file.uploadedBy.toString() === req.user.id;
    if (req.user.role !== 'admin' && !req.user.permissions?.delete && !isOwner) {
      return res.status(403).json({ error: 'No delete permission' });
    }

    if (file.storageType === 'cloudinary' && file.publicId) {
      await deleteFromCloudinary(file.publicId);
    }
    if (file.storageType === 's3' && file.s3Key) {
      await deleteFromS3(file.s3Key);
    }

    await file.deleteOne();
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};