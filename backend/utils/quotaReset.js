import cron from 'node-cron';
import User from '../models/User.js';

// Reset daily quotas at midnight
export const startDailyQuotaReset = () => {
  // Run at 00:01 every day
  cron.schedule('1 0 * * *', async () => {
    console.log('🔄 Running daily quota reset...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // The dailyUsage array automatically tracks new days
      // We just need to log that the job ran
      
      console.log('✅ Daily quota reset completed');
    } catch (error) {
      console.error('❌ Daily quota reset failed:', error);
    }
  });
  
  console.log('⏰ Daily quota reset job scheduled');
};

// Clean up old daily usage data (older than 30 days)
export const startQuotaCleanupJob = () => {
  // Run at 02:00 every Sunday
  cron.schedule('0 2 * * 0', async () => {
    console.log('🧹 Running quota data cleanup...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Remove daily usage older than 30 days
      await User.updateMany(
        {},
        {
          $pull: {
            dailyUsage: {
              date: { $lt: thirtyDaysAgo }
            }
          }
        }
      );
      
      console.log('✅ Quota data cleanup completed');
    } catch (error) {
      console.error('❌ Quota data cleanup failed:', error);
    }
  });
  
  console.log('⏰ Quota cleanup job scheduled');
};

// Check for users near quota limits (for notifications)
export const startQuotaWarningJob = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔍 Checking users near quota limits...');
    
    try {
      // Find users with >80% storage used
      const usersNearStorageLimit = await User.find({
        $expr: {
          $gte: [
            { $divide: ["$storageUsed", 5 * 1024 * 1024 * 1024] },
            0.8
          ]
        }
      });
      
      // Find users with >90% file count limit
      const usersNearFileLimit = await User.find({
        $expr: {
          $gte: [
            { $divide: ["$quota.fileCount", "$quota.maxFiles"] },
            0.9
          ]
        }
      });
      
      console.log(`📊 Found ${usersNearStorageLimit.length} users near storage limit`);
      console.log(`📊 Found ${usersNearFileLimit.length} users near file limit`);
      
      // Here you could send email notifications
      // or create system alerts
      
    } catch (error) {
      console.error('❌ Quota warning check failed:', error);
    }
  });
  
  console.log('⏰ Quota warning job scheduled');
};

// Start all quota jobs
export const startAllQuotaJobs = () => {
  startDailyQuotaReset();
  startQuotaCleanupJob();
  startQuotaWarningJob();
  
  console.log('🎯 All quota management jobs started');
};