import mongoose from 'mongoose';
import File from '../models/File.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import b2 from '../config/b2.js';
import connectDB from '../config/db.js';

// Run every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000;

async function cleanupOrphanedUploads() {
  console.log('🧹 Running storage cleanup worker...');
  
  try {
    await connectDB();
    
    const now = new Date();
    const staleThreshold = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Find stale pending uploads
    const staleUploads = await File.find({
      uploadStatus: 'pending',
      uploadInitiatedAt: { $lt: staleThreshold }
    });
    
    console.log(`Found ${staleUploads.length} stale uploads`);
    
    for (const file of staleUploads) {
      try {
        // Delete from storage if exists
        const metadata = await b2.getObjectMetadata(file.storageKey);
        if (metadata) {
          await b2.deleteObject(file.storageKey);
          console.log(`Deleted orphaned storage object: ${file.storageKey}`);
        }
        
        // Delete DB record
        await file.deleteOne();
        console.log(`Deleted stale upload record: ${file._id}`);
        
      } catch (error) {
        console.error(`Failed to cleanup file ${file._id}:`, error);
      }
    }
    
    // Find soft-deleted files older than 7 days
    const deleteThreshold = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oldDeletedFiles = await File.find({
      isDeleted: true,
      deletedAt: { $lt: deleteThreshold }
    });
    
    console.log(`Found ${oldDeletedFiles.length} old deleted files to purge`);
    
    for (const file of oldDeletedFiles) {
      try {
        // Delete from storage
        await b2.deleteObject(file.storageKey);
        console.log(`Deleted storage object: ${file.storageKey}`);
        
        // Permanently delete DB record
        await file.deleteOne();
        console.log(`Purged deleted file record: ${file._id}`);
        
      } catch (error) {
        console.error(`Failed to purge file ${file._id}:`, error);
      }
    }
    
    console.log('✅ Storage cleanup completed');
    
  } catch (error) {
    console.error('❌ Storage cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run cleanup on start
cleanupOrphanedUploads();

// Schedule regular cleanup
setInterval(cleanupOrphanedUploads, CLEANUP_INTERVAL);

export default cleanupOrphanedUploads;