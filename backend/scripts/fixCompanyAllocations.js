import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Company from '../models/Company.js';
import File from '../models/File.js';

dotenv.config();

const fixAllStorageIssues = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Fix all companies - recalculate from actual files and users
    console.log('\n📊 Fixing companies...');
    const companies = await Company.find();
    
    for (const company of companies) {
      console.log(`\n🔍 Processing: ${company.name}`);
      
      // Get all files in this company
      const files = await File.find({ 
        company: company._id,
        isDeleted: false,
        uploadStatus: 'completed'
      });
      
      const totalStorageUsed = files.reduce((acc, f) => acc + (f.size || 0), 0);
      
      // Get all users in this company
      const users = await User.find({ company: company._id });
      
      // Update each user's storageUsed based on actual files
      for (const user of users) {
        const userFiles = files.filter(f => f.uploadedBy.toString() === user._id.toString());
        const userUsed = userFiles.reduce((acc, f) => acc + (f.size || 0), 0);
        
        if (user.storageUsed !== userUsed) {
          console.log(`   📝 Updating ${user.username}: ${(user.storageUsed / (1024*1024*1024)).toFixed(2)}GB → ${(userUsed / (1024*1024*1024)).toFixed(2)}GB`);
          user.storageUsed = userUsed;
          await user.save();
        }
      }
      
      // Calculate total allocated from users
      const totalAllocated = users.reduce((acc, u) => acc + (u.storageAllocated || 0), 0);
      
      // Fix company stats
      const oldUsed = company.usedStorage;
      const oldAllocated = company.allocatedToUsers;
      
      company.usedStorage = totalStorageUsed;
      company.allocatedToUsers = totalAllocated;
      await company.save();
      
      console.log(`   ✅ Company ${company.name}:`);
      console.log(`      Used: ${(oldUsed / (1024*1024*1024)).toFixed(2)}GB → ${(totalStorageUsed / (1024*1024*1024)).toFixed(2)}GB`);
      console.log(`      Allocated: ${(oldAllocated / (1024*1024*1024)).toFixed(2)}GB → ${(totalAllocated / (1024*1024*1024)).toFixed(2)}GB`);
      console.log(`      Unallocated: ${((company.totalStorage - totalAllocated) / (1024*1024*1024)).toFixed(2)}GB`);
      
      if (totalAllocated > company.totalStorage) {
        console.log(`   ⚠️  WARNING: Company is over-allocated by ${((totalAllocated - company.totalStorage) / (1024*1024*1024)).toFixed(2)}GB`);
      }
    }

    // 2. Fix admin users - ensure they have correct allocation
    console.log('\n👑 Fixing admin allocations...');
    const admins = await User.find({ role: 'admin' }).populate('company');
    
    for (const admin of admins) {
      if (admin.company) {
        const shouldHave = admin.company.totalStorage;
        const currentlyHas = admin.storageAllocated;
        
        if (currentlyHas !== shouldHave) {
          console.log(`   📝 ${admin.username}: ${(currentlyHas / (1024*1024*1024)).toFixed(2)}GB → ${(shouldHave / (1024*1024*1024)).toFixed(2)}GB`);
          admin.storageAllocated = shouldHave;
          await admin.save();
        }
      }
    }

    // 3. Fix regular users - ensure they're not over-allocated
    console.log('\n👥 Checking regular users...');
    const users = await User.find({ role: 'user' }).populate('company');
    
    for (const user of users) {
      if (user.company) {
        // Get all users in company except this one
        const otherUsers = await User.find({ 
          company: user.company._id,
          _id: { $ne: user._id }
        });
        
        const otherAllocated = otherUsers.reduce((acc, u) => acc + (u.storageAllocated || 0), 0);
        const maxPossible = user.company.totalStorage - otherAllocated;
        
        if (user.storageAllocated > maxPossible) {
          console.log(`   ⚠️  ${user.username} is over-allocated: ${(user.storageAllocated / (1024*1024*1024)).toFixed(2)}GB > ${(maxPossible / (1024*1024*1024)).toFixed(2)}GB available`);
          
          // Reduce to max possible
          const newAllocation = Math.max(0, maxPossible);
          console.log(`      Reducing to ${(newAllocation / (1024*1024*1024)).toFixed(2)}GB`);
          user.storageAllocated = newAllocation;
          await user.save();
        }
      }
    }

    console.log('\n✅ All storage issues fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

fixAllStorageIssues();