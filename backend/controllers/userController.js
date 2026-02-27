import User from '../models/User.js';
import Company from '../models/Company.js';
import Role from '../models/Role.js';
import File from '../models/File.js';
import bcrypt from 'bcryptjs';

// SUPERADMIN COMMENTED START
// // @desc    Get all users
// // @route   GET /api/users
// // @access  Private/Admin
// export const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find()
//       .select('-password')
//       .populate('company', 'name totalStorage')
//       .populate('addedBy', 'username email');
//     res.json(users);
//   } catch (error) {
//     console.error('❌ Get users error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SUPERADMIN COMMENTED END

// COMPANY USERS COMMENTED START
// // @desc    Get users by company
// // @route   GET /api/users/company/:companyId
// // @access  Private/Admin
// export const getCompanyUsers = async (req, res) => {
//   try {
//     const { companyId } = req.params;
//     
//     if (req.user.role !== 'admin' && req.user.company?.toString() !== companyId) {
//       return res.status(403).json({ error: 'Access denied' });
//     }
//     
//     const users = await User.find({ company: companyId })
//       .select('-password')
//       .populate('addedBy', 'username email');
//     
//     res.json(users);
//   } catch (error) {
//     console.error('❌ Get company users error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// COMPANY USERS COMMENTED END

// SIMPLE USER CREATION COMMENTED START
// // @desc    Create a new user
// // @route   POST /api/users
// // @access  Private/Admin
// export const createUser = async (req, res) => {
//   try {
//     const { username, email, password, role } = req.body;
//     
//     if (!username || !email || !password) {
//       return res.status(400).json({ error: 'Please provide username, email and password' });
//     }
// 
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ error: 'User already exists' });
//     }
// 
//     const admin = await User.findById(req.user.id);
//     if (!admin) {
//       return res.status(404).json({ error: 'Admin not found' });
//     }
// 
//     if (!admin.company) {
//       return res.status(403).json({ 
//         error: 'You do not have a company. Please contact support.' 
//       });
//     }
// 
//     company = await Company.findById(admin.company);
//     if (!company) {
//       return res.status(404).json({ error: 'Company not found' });
//     }
// 
//     const ACCOUNT_AGE_REQUIREMENT = 48 * 60 * 60 * 1000;
//     const STORAGE_REQUIREMENT = 0.14 * 1024 * 1024;
// 
//     const accountAge = Date.now() - new Date(admin.createdAt).getTime();
//     const accountAgeInHours = (accountAge / (60 * 60 * 1000)).toFixed(1);
//     
//     if (accountAge < ACCOUNT_AGE_REQUIREMENT) {
//       const hoursRemaining = ((ACCOUNT_AGE_REQUIREMENT - accountAge) / (60 * 60 * 1000)).toFixed(1);
//       return res.status(403).json({ 
//         error: 'Account too new to add users',
//         message: `Your account is only ${accountAgeInHours} hours old. You need to wait ${hoursRemaining} more hours before you can add users.`,
//         details: {
//           accountAge: accountAgeInHours,
//           requiredAge: '48',
//           hoursRemaining: hoursRemaining,
//           meetsRequirement: false
//         }
//       });
//     }
// 
//     if (admin.storageUsed <= STORAGE_REQUIREMENT) {
//       const storageNeededMB = ((STORAGE_REQUIREMENT - admin.storageUsed) / (1024 * 1024)).toFixed(2);
//       return res.status(403).json({ 
//         error: 'Insufficient storage usage',
//         message: `You need to use more than 0.14 MB of storage before adding users. Currently using ${(admin.storageUsed / (1024 * 1024)).toFixed(2)} MB. Upload at least ${storageNeededMB} MB more.`,
//         details: {
//           storageUsed: (admin.storageUsed / (1024 * 1024)).toFixed(2),
//           requiredStorage: '0.14',
//           storageNeeded: storageNeededMB,
//           meetsRequirement: false
//         }
//       });
//     }
// 
//     companyId = admin.company;
// 
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
// 
//     let permissions = {
//       view: true, upload: true, download: true, delete: false,
//       addUser: false, removeUser: false, changeRole: false,
//       manageFiles: false, manageStorage: false, assignStorage: false
//     };
// 
//     if (role === 'admin') {
//       permissions = {
//         view: true, upload: true, download: true, delete: true,
//         addUser: true, removeUser: true, changeRole: true,
//         manageFiles: true, manageStorage: true, assignStorage: true
//       };
//     }
// 
//     let storageAllocated = 0;
//     if (role === 'admin' && company) {
//       storageAllocated = company.totalStorage || 50 * 1024 * 1024 * 1024;
//     }
// 
//     const user = new User({
//       username,
//       email,
//       password: hashedPassword,
//       role: role || 'user',
//       company: companyId,
//       addedBy: req.user.id,
//       storageAllocated,
//       storageUsed: 0,
//       allocatedToUsers: 0,
//       permissions,
//       quota: {
//         plan: 'free',
//         maxFiles: 100,
//         fileCount: 0,
//         dailyUploadLimit: 1 * 1024 * 1024 * 1024
//       }
//     });
// 
//     await user.save();
// 
//     if (company) {
//       company.userCount = await User.countDocuments({ company: company._id });
//       await company.save();
//     }
// 
//     const userResponse = user.toObject();
//     delete userResponse.password;
// 
//     res.status(201).json({
//       message: 'User created successfully',
//       user: userResponse
//     });
// 
//   } catch (error) {
//     console.error('❌ Create user error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SIMPLE USER CREATION COMMENTED END

// SIMPLE USER ROLE UPDATE COMMENTED START
// // @desc    Update user role
// // @route   PUT /api/users/:id/role
// // @access  Private/Admin
// export const updateUserRole = async (req, res) => {
//   try {
//     const { role } = req.body;
//     const user = await User.findById(req.params.id);
//     
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
// 
//     let permissions = {
//       view: true, upload: true, download: true, delete: false,
//       addUser: false, removeUser: false, changeRole: false,
//       manageFiles: false, manageStorage: false, assignStorage: false
//     };
// 
//     if (role === 'admin') {
//       permissions = {
//         view: true, upload: true, download: true, delete: true,
//         addUser: true, removeUser: true, changeRole: true,
//         manageFiles: true, manageStorage: true, assignStorage: true
//       };
//     }
// 
//     if (role === 'admin' && user.role !== 'admin') {
//       const company = await Company.findById(user.company);
//       if (company) {
//         user.storageAllocated = company.totalStorage;
//         if (user.quota) {
//           user.quota.maxFiles = 1000; // Admin gets more files
//         }
//       }
//     }
// 
//     user.role = role;
//     user.permissions = permissions;
//     await user.save();
// 
//     res.json({ 
//       message: 'User role updated',
//       user: {
//         _id: user._id,
//         username: user.username,
//         role: user.role,
//         permissions: user.permissions,
//         storageAllocated: user.storageAllocated
//       }
//     });
//   } catch (error) {
//     console.error('❌ Update role error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SIMPLE USER ROLE UPDATE COMMENTED END

// SIMPLE USER DELETION COMMENTED START
// // @desc    Delete user
// // @route   DELETE /api/users/:id
// // @access  Private/Admin
// export const deleteUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
// 
//     if (user._id.toString() === req.user.id.toString()) {
//       return res.status(400).json({ error: 'Cannot delete your own account' });
//     }
// 
//     if (user.role === 'user' && user.storageAllocated > 0) {
//       const admin = await User.findOne({ 
//         company: user.company, 
//         role: 'admin' 
//       });
//       
//       if (admin) {
//         admin.allocatedToUsers = (admin.allocatedToUsers || 0) - user.storageAllocated;
//         await admin.save();
//       }
//     }
// 
//     if (user.company) {
//       const company = await Company.findById(user.company);
//       if (company) {
//         company.userCount = Math.max(0, (company.userCount || 1) - 1);
//         await company.save();
//       }
//     }
// 
//     await User.findByIdAndDelete(req.params.id);
//     
//     res.json({ 
//       success: true,
//       message: 'User deleted successfully' 
//     });
//     
//   } catch (error) {
//     console.error('❌ Delete user error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SIMPLE USER DELETION COMMENTED END

// SIMPLE USER PERMISSIONS COMMENTED START
// // @desc    Get current user permissions
// // @route   GET /api/users/permissions/me
// // @access  Private
// export const getUserPermissions = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('permissions role company');
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     
//     res.json({
//       permissions: user.permissions,
//       role: user.role,
//       company: user.company
//     });
//   } catch (error) {
//     console.error('❌ Get permissions error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SIMPLE USER PERMISSIONS COMMENTED END

// PERMISSIONS API COMMENTED START
// // @desc    Get all roles and permissions
// // @route   GET /api/users/permissions
// // @access  Private/Admin
// export const getAllRolesPermissions = async (req, res) => {
//   try {
//     const roles = {
//       admin: {
//         view: true, upload: true, download: true, delete: true,
//         addUser: true, removeUser: true, changeRole: true,
//         manageFiles: true, manageStorage: true, assignStorage: true
//       },
//       user: {
//         view: true, upload: true, download: true, delete: false,
//         addUser: false, removeUser: false, changeRole: false,
//         manageFiles: false, manageStorage: false, assignStorage: false
//       }
//     };
//     
//     let customRoles = [];
//     try {
//       const dbRoles = await Role.find({ isCustom: true });
//       customRoles = dbRoles.map(role => ({
//         name: role.name,
//         displayName: role.displayName,
//         permissions: role.permissions,
//         isCustom: true
//       }));
//     } catch (err) {
//       console.log('ℹ️ Role model not found, using default roles only');
//     }
//     
//     res.json({ 
//       roles,
//       customRoles
//     });
//   } catch (error) {
//     console.error('❌ Get roles permissions error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// PERMISSIONS API COMMENTED END

// @desc    Get user quota with detailed usage
// @route   GET /api/users/quota
// @access  Private
export const getQuota = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('storageAllocated storageUsed username role createdAt quota dailyUsage fileTypeStats');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's usage
    const todayUsage = user.dailyUsage?.find(d => {
      const date = new Date(d.date);
      return date.getTime() === today.getTime();
    }) || { uploadSize: 0, uploadCount: 0, downloadSize: 0, downloadCount: 0 };
    
    // Get file statistics
    const files = await File.find({ 
      uploadedBy: user._id,
      isDeleted: false,
      uploadStatus: 'completed'
    });
    
    const totalUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
    const fileCount = files.length;
    
    // Calculate by file type
    const byType = user.fileTypeStats || {
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      pdfs: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
      others: { count: 0, size: 0 }
    };
    
    const available = Math.max(0, (5 * 1024 * 1024 * 1024) - totalUsed);
    const percentage = ((totalUsed / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1);
    
    res.json({
      // Basic quota
      used: totalUsed,
      total: 5 * 1024 * 1024 * 1024,
      available: available,
      percentage: parseFloat(percentage),
      
      // File statistics
      fileCount,
      maxFiles: 100,
      
      // Daily usage
      daily: {
        used: todayUsage.uploadSize || 0,
        limit: 1 * 1024 * 1024 * 1024,
        remaining: Math.max(0, (1 * 1024 * 1024 * 1024) - (todayUsage.uploadSize || 0)),
        count: todayUsage.uploadCount || 0
      },
      
      // Plan info
      plan: 'free',
      
      // Status flags
      isNearLimit: percentage >= 80,
      isOverLimit: available <= 0,
      
      // Storage by type
      byType,
      
      // Limits
      limits: {
        maxFileSize: 100 * 1024 * 1024,
        maxFiles: 100,
        dailyUpload: 1 * 1024 * 1024 * 1024
      },
      
      // Warnings
      warnings: {
        storage: percentage >= 80,
        files: fileCount >= 90,
        daily: ((todayUsage.uploadSize || 0) / (1 * 1024 * 1024 * 1024)) >= 0.85
      }
    });
  } catch (error) {
    console.error('❌ Get quota error:', error);
    res.status(500).json({ error: error.message });
  }
};

// SUPERADMIN COMMENTED START
// // @desc    Update all roles permissions
// // @route   PUT /api/users/permissions
// // @access  Private/SuperAdmin
// export const updateAllRolesPermissions = async (req, res) => {
//   try {
//     const { roles, customRoles } = req.body;
// 
//     if (!roles || typeof roles !== 'object') {
//       return res.status(400).json({ error: 'Roles object is required' });
//     }
// 
//     console.log('🔄 Updating permissions');
// 
//     for (const [roleName, permissions] of Object.entries(roles)) {
//       await User.updateMany(
//         { role: roleName },
//         { $set: { permissions: permissions } }
//       );
//     }
// 
//     try {
//       if (Array.isArray(customRoles)) {
//         for (const customRole of customRoles) {
//           await Role.findOneAndUpdate(
//             { name: customRole.name, isCustom: true },
//             {
//               name: customRole.name,
//               displayName: customRole.displayName || customRole.name,
//               permissions: customRole.permissions,
//               isCustom: true
//             },
//             { upsert: true, new: true }
//           );
//         }
//       }
//     } catch (err) {
//       console.log('ℹ️ Role model not found, skipping custom role save');
//     }
// 
//     res.json({ 
//       message: 'Permissions updated successfully',
//       roles,
//       customRoles
//     });
//   } catch (error) {
//     console.error('❌ Update permissions error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// 
// // @desc    Delete custom role
// // @route   DELETE /api/users/permissions/role/:roleName
// // @access  Private/SuperAdmin
// export const deleteCustomRole = async (req, res) => {
//   try {
//     const { roleName } = req.params;
//     
//     try {
//       await Role.deleteOne({ name: roleName, isCustom: true });
//     } catch (err) {
//       console.log('ℹ️ Role model not found');
//     }
//     
//     await User.updateMany(
//       { role: roleName },
//       { 
//         $set: { 
//           role: 'user',
//           storageAllocated: 0,
//           allocatedToUsers: 0
//         } 
//       }
//     );
//     
//     res.json({ message: `Role ${roleName} deleted successfully` });
//   } catch (error) {
//     console.error('❌ Delete role error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// 
// // @desc    Sync admin storage with company storage
// // @route   POST /api/users/sync-admin-storage/:companyId
// // @access  Private/Admin
// export const syncAdminStorage = async (req, res) => {
//   try {
//     const { companyId } = req.params;
//     
//     const company = await Company.findById(companyId);
//     if (!company) {
//       return res.status(404).json({ error: 'Company not found' });
//     }
//     
//     const admins = await User.find({ 
//       company: companyId, 
//       role: 'admin' 
//     });
//     
//     console.log(`🔄 Syncing ${admins.length} admins for company ${company.name}`);
//     
//     for (const admin of admins) {
//       admin.storageAllocated = company.totalStorage;
//       await admin.save();
//       console.log(`✅ Updated admin ${admin.username} storage to ${(company.totalStorage / (1024*1024*1024)).toFixed(2)}GB`);
//     }
//     
//     res.json({
//       message: `Synced ${admins.length} admin(s) storage with company total`,
//       company: {
//         _id: company._id,
//         name: company.name,
//         totalStorage: company.totalStorage
//       },
//       updatedAdmins: admins.length
//     });
//   } catch (error) {
//     console.error('❌ Sync admin storage error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// SUPERADMIN COMMENTED END

export default {
  // SUPERADMIN COMMENTED: getAllUsers,
  // COMPANY USERS COMMENTED: getCompanyUsers,
  // SIMPLE USER CREATION COMMENTED: createUser,
  // SIMPLE USER ROLE UPDATE COMMENTED: updateUserRole,
  // SIMPLE USER DELETION COMMENTED: deleteUser,
  // SIMPLE USER PERMISSIONS COMMENTED: getUserPermissions,
  // PERMISSIONS API COMMENTED: getAllRolesPermissions,
  // SUPERADMIN COMMENTED: updateAllRolesPermissions,
  // SUPERADMIN COMMENTED: deleteCustomRole,
  // SUPERADMIN COMMENTED: syncAdminStorage,
  getQuota
};