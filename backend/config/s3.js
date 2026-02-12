import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

console.log('S3 Config:', {
  region: s3Config.region,
  accessKeyId: s3Config.credentials.accessKeyId ? 'Set' : 'Not set',
  secretAccessKey: s3Config.credentials.secretAccessKey ? 'Set' : 'Not set',
  bucket: process.env.AWS_BUCKET_NAME || 'Not set'
});

const s3Client = new S3Client(s3Config);

export default s3Client;