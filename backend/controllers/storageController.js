import User from '../models/User.js';
import Company from '../models/Company.js';
import File from '../models/File.js';

// SIMPLE USER ALLOCATION COMMENTED START
// // @desc    Admin allocates storage to team member
// // @route   POST /api/storage/allocate-to-user
// // @access  Private/Admin
// export const allocateStorageToUser = async (req, res) => {
//   try {
//     const { userId, storageInGB } = req.body;
//     
//     console.log('📦 Allocate storage request:', { 
//       userId, 
//       storageInGB,
//       adminUser: req.user.id
//     });
//     
//     if (!userId || !storageInGB || storageInGB < 0.1) {
//       return res.status(400).json({ 
//         error: 'User ID and valid storage (min 0.1GB) required' 
//       });
//     }
//     
//     const storageInBytes = storageInGB * 1024 * 1024 * 1024;
//     
//     // Get admin user
//     const admin = await User.findById(req.user.id);
//     if (!admin || admin.role !== 'admin') {
//       return res.status(403).json({ error: 'Only admin can allocate storage' });
//     }
//     
//     // Calculate admin's available storage (total - used - already allocated to users)
//     const allocatedToUsers = admin.allocatedToUsers || 0;
//     const adminAvailable = admin.storageAllocated - admin.storageUsed - allocatedToUsers;
//     
//     console.log('👑 Admin storage before allocation:', {
//       username: admin.username,
//       total: (admin.storageAllocated / (1024*1024*1024)).toFixed(2) + 'GB',
//       usedBySelf: (admin.storageUsed / (1024*1024*1024)).toFixed(2) + 'GB',
//       alreadyGivenToUsers: (allocatedToUsers / (1024*1024*1024)).toFixed(2) + 'GB',
//       currentlyAvailable: (adminAvailable / (1024*1024*1024)).toFixed(2) + 'GB',
//       requested: storageInGB + 'GB'
//     });
//     
//     // Check if admin has enough storage
//     if (adminAvailable < storageInBytes) {
//       return res.status(400).json({ 
//         error: 'Insufficient storage',
//         message: `Admin only has ${(adminAvailable / (1024 * 1024 * 1024)).toFixed(2)}GB available`
//       });
//     }
//     
//     // Find target user
//     const targetUser = await User.findById(userId);
//     if (!targetUser) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     
//     // Check if user belongs to admin's company
//     if (targetUser.company?.toString() !== admin.company?.toString()) {
//       return res.status(403).json({ error: 'User does not belong to your company' });
//     }
//     
//     // Don't allow allocating to admin
//     if (targetUser.role === 'admin') {
//       return res.status(400).json({ error: 'Cannot allocate storage to another admin' });
//     }
//     
//     // Store old allocation for logging
//     const oldAllocation = targetUser.storageAllocated || 0;
//     
//     // Update user's allocated storage
//     targetUser.storageAllocated = storageInBytes;
//     await targetUser.save();
//     
//     // Update admin's allocatedToUsers (increment by the new allocation)
//     admin.allocatedToUsers = (admin.allocatedToUsers || 0) + storageInBytes;
//     await admin.save();
//     
//     // Calculate new available for response
//     const newAllocatedToUsers = admin.allocatedToUsers;
//     const newAdminAvailable = admin.storageAllocated - admin.storageUsed - newAllocatedToUsers;
//     
//     console.log('✅ Storage allocated successfully:', {
//       from: admin.username,
//       to: targetUser.username,
//       amount: storageInGB + 'GB',
//       oldUserAllocation: (oldAllocation / (1024*1024*1024)).toFixed(2) + 'GB',
//       newUserAllocation: (targetUser.storageAllocated / (1024*1024*1024)).toFixed(2) + 'GB',
//       adminTotalGivenToUsers: (newAllocatedToUsers / (1024*1024*1024)).toFixed(2) + 'GB',
//       adminRemaining: (newAdminAvailable / (1024*1024*1024)).toFixed(2) + 'GB'
//     });
//     
//     res.json({
//       success: true,
//       message: `${storageInGB}GB storage allocated to ${targetUser.username}`,
//       user: {
//         _id: targetUser._id,
//         username: targetUser.username,
//         storageAllocated: targetUser.storageAllocated,
//         storageUsed: targetUser.storageUsed,
//         availableStorage: targetUser.storageAllocated - targetUser.storageUsed
//       },
//       admin: {
//         allocatedToUsers: admin.allocatedToUsers,
//         available: admin.storageAllocated - admin.storageUsed - admin.allocatedToUsers
//       }
//     });
//     
//   } catch (error) {
//     console.error('❌ Allocate storage error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SIMPLE USER ALLOCATION COMMENTED END

// SUPERADMIN COMMENTED START
// // @desc    Super Admin allocates storage to Admin's company
// // @route   POST /api/storage/allocate-to-company
// // @access  Private/SuperAdmin
// export const allocateStorageToCompany = async (req, res) => {
//   try {
//     const { companyId, storageInGB } = req.body;
//     
//     if (!companyId || !storageInGB || storageInGB < 0.1) {
//       return res.status(400).json({ 
//         error: 'Company ID and valid storage (min 0.1GB) required' 
//       });
//     }
//     
//     const storageInBytes = storageInGB * 1024 * 1024 * 1024;
//     
//     const company = await Company.findById(companyId);
//     if (!company) {
//       return res.status(404).json({ error: 'Company not found' });
//     }
//     
//     const oldTotal = company.totalStorage;
//     
//     // Update company total storage
//     company.totalStorage = storageInBytes;
//     await company.save();
//     
//     // Update the admin (owner) of this company
//     const admin = await User.findById(company.owner);
//     if (admin) {
//       admin.storageAllocated = storageInBytes;
//       await admin.save();
//       console.log(`✅ Updated admin ${admin.username} storage to ${storageInGB}GB`);
//     }
//     
//     console.log(`✅ Company ${company.name} storage updated: ${(oldTotal / (1024*1024*1024)).toFixed(2)}GB → ${storageInGB}GB`);
//     
//     res.json({
//       success: true,
//       message: `Storage updated to ${storageInGB}GB for ${company.name}`,
//       company: {
//         _id: company._id,
//         name: company.name,
//         totalStorage: company.totalStorage,
//         usedStorage: company.usedStorage
//       }
//     });
//   } catch (error) {
//     console.error('❌ Allocate storage error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SUPERADMIN COMMENTED END

// SIMPLE USER STORAGE COMMENTED START
// // @desc    Get user storage
// // @route   GET /api/storage/user/:userId
// // @access  Private
// export const getUserStorage = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId)
//       .select('username email storageAllocated storageUsed company allocatedToUsers');
//     
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     
//     // Check permissions
//     const adminCompanyId = req.user.company?._id?.toString() || req.user.company?.toString();
//     const userCompanyId = user.company?._id?.toString() || user.company?.toString();
//     
//     if (adminCompanyId !== userCompanyId) {
//       return res.status(403).json({ error: 'Access denied' });
//     }
//     
//     // Calculate used storage from actual files
//     const files = await File.find({ 
//       uploadedBy: user._id,
//       isDeleted: false,
//       uploadStatus: 'completed'
//     });
//     
//     const totalUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
//     
//     // Calculate available storage
//     let available = 0;
//     if (user.role === 'admin') {
//       const givenToUsers = user.allocatedToUsers || 0;
//       available = Math.max(0, user.storageAllocated - user.storageUsed - givenToUsers);
//     } else {
//       available = Math.max(0, user.storageAllocated - user.storageUsed);
//     }
//     
//     res.json({
//       success: true,
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role
//       },
//       storage: {
//         allocated: user.storageAllocated,
//         used: totalUsed,
//         available: available,
//         allocatedToUsers: user.allocatedToUsers || 0,
//         percentage: user.storageAllocated > 0 ? ((totalUsed / user.storageAllocated) * 100).toFixed(2) : '0.00',
//         fileCount: files.length
//       }
//     });
//   } catch (error) {
//     console.error('❌ Get user storage error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SIMPLE USER STORAGE COMMENTED END

// COMPANY STORAGE COMMENTED START
// // @desc    Get company storage
// // @route   GET /api/storage/company/:companyId
// // @access  Private
// export const getCompanyStorage = async (req, res) => {
//   try {
//     const company = await Company.findById(req.params.companyId)
//       .populate('owner', 'username email');
//     
//     if (!company) {
//       return res.status(404).json({ error: 'Company not found' });
//     }
//     
//     if (req.user.company?.toString() !== company._id.toString()) {
//       return res.status(403).json({ error: 'Access denied' });
//     }
//     
//     const admin = await User.findById(company.owner._id);
//     
//     const users = await User.find({ 
//       company: company._id,
//       role: 'user'
//     }).select('username email storageAllocated storageUsed');
//     
//     const files = await File.find({ 
//       company: company._id,
//       isDeleted: false,
//       uploadStatus: 'completed'
//     });
//     
//     const totalUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
//     
//     const totalAllocatedToUsers = users.reduce((acc, user) => acc + (user.storageAllocated || 0), 0);
//     
//     res.json({
//       success: true,
//       company: {
//         _id: company._id,
//         name: company.name,
//         owner: {
//           _id: admin._id,
//           username: admin.username,
//           email: admin.email
//         },
//         totalStorage: company.totalStorage,
//         usedStorage: totalUsed,
//         userCount: users.length + 1
//       },
//       storage: {
//         total: company.totalStorage,
//         used: totalUsed,
//         available: company.totalStorage - totalUsed,
//         adminAllocated: admin.storageAllocated,
//         adminUsed: admin.storageUsed,
//         adminGivenToUsers: admin.allocatedToUsers || 0,
//         adminAvailable: admin.storageAllocated - admin.storageUsed - (admin.allocatedToUsers || 0),
//         usersTotalAllocated: totalAllocatedToUsers
//       },
//       users: users.map(user => ({
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         storageAllocated: user.storageAllocated,
//         storageUsed: user.storageUsed,
//         availableStorage: (user.storageAllocated || 0) - (user.storageUsed || 0)
//       })),
//       fileCount: files.length
//     });
//   } catch (error) {
//     console.error('❌ Get company storage error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// COMPANY STORAGE COMMENTED END

// SIMPLE USER MY STORAGE COMMENTED START
// // @desc    Get my storage
// // @route   GET /api/storage/me
// // @access  Private
// export const getMyStorage = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     
//     const files = await File.find({ 
//       uploadedBy: user._id,
//       isDeleted: false,
//       uploadStatus: 'completed'
//     });
//     
//     const totalUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
//     
//     let available = 0;
//     if (user.role === 'admin') {
//       const givenToUsers = user.allocatedToUsers || 0;
//       available = Math.max(0, user.storageAllocated - totalUsed - givenToUsers);
//     } else {
//       available = Math.max(0, user.storageAllocated - totalUsed);
//     }
//     
//     res.json({
//       success: true,
//       storage: {
//         allocated: user.storageAllocated,
//         used: totalUsed,
//         available: available,
//         allocatedToUsers: user.allocatedToUsers || 0,
//         percentage: user.storageAllocated > 0 ? ((totalUsed / user.storageAllocated) * 100).toFixed(2) : '0.00',
//         fileCount: files.length
//       }
//     });
//   } catch (error) {
//     console.error('❌ Get my storage error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SIMPLE USER MY STORAGE COMMENTED END

export default {
  // SUPERADMIN COMMENTED: allocateStorageToCompany,
  // SIMPLE USER ALLOCATION COMMENTED: allocateStorageToUser,
  // SIMPLE USER STORAGE COMMENTED: getUserStorage,
  // COMPANY STORAGE COMMENTED: getCompanyStorage,
  // SIMPLE USER MY STORAGE COMMENTED: getMyStorage
};