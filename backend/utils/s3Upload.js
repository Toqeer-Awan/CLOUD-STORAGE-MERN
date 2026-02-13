import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

if (!BUCKET_NAME) {
  console.warn('⚠️ AWS_BUCKET_NAME is not set in environment variables');
}

export const uploadToS3 = async (filePath, fileName) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not configured');
    }

    const fileContent = fs.readFileSync(filePath);
    
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `cloud-storage/${timestamp}-${safeFileName}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: getContentType(fileName),
    };
    
    console.log(`📤 Uploading to S3: ${key}`);
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    console.log('✅ S3 upload successful:', url);
    
    return url;
    
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

export const deleteFromS3 = async (key) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not configured');
    }

    if (!key) {
      throw new Error('S3 key is required');
    }

    // Extract just the key if full URL is provided
    if (key.includes('amazonaws.com/')) {
      key = key.split('amazonaws.com/')[1];
    }

    console.log(`🗑️ Deleting from S3, key: ${key}`);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    const command = new DeleteObjectCommand(params);
    const result = await s3Client.send(command);
    
    console.log('✅ S3 delete successful');
    return { success: true, message: 'File deleted from S3' };
    
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    throw new Error(`S3 delete failed: ${error.message}`);
  }
};

const getContentType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.csv': 'text/csv'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
};

export default {
  uploadToS3,
  deleteFromS3
};