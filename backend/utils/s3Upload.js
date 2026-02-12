import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'mern-cloud-app';

export const uploadToS3 = async (filePath, fileName) => {
  try {
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
    
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

// ADD DELETE FUNCTION
export const deleteFromS3 = async (key) => {
  try {
    console.log(`🗑️  Deleting ${key} from S3...`);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    const command = new DeleteObjectCommand(params);
    const result = await s3Client.send(command);
    
    console.log('✅ S3 delete successful');
    return result;
    
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    throw new Error(`S3 delete failed: ${error.message}`);
  }
};

const getContentType = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const contentTypes = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    mp4: 'video/mp4', avi: 'video/x-msvideo', mov: 'video/quicktime'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
};

export default {
  uploadToS3,
  deleteFromS3
};