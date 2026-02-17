import User from '../models/User.js';
import Company from '../models/Company.js';
import File from '../models/File.js';

// @desc    Super Admin allocates storage to Admin's company
// @route   POST /api/storage/allocate-to-company
// @access  Private/SuperAdmin
export const allocateStorageToCompany = async (req, res) => {
  try {
    const { companyId, storageInGB } = req.body;
    
    if (!companyId || !storageInGB || storageInGB < 0.1) {
      return res.status(400).json({ error: 'Company ID and valid storage (min 0.1GB) required' });
    }
    
    const storageInBytes = storageInGB * 1024 * 1024 * 1024;
    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Update company total storage
    company.totalStorage = storageInBytes;
    await company.save();
    
    console.log(`✅ Company ${company.name} storage updated to ${storageInGB}GB`);
    
    // Update all admins in this company to have the same storage
    const admins = await User.find({ 
      company: companyId, 
      role: 'admin' 
    });
    
    for (const admin of admins) {
      admin.storageAllocated = storageInBytes;
      await admin.save();
      console.log(`Updated admin ${admin.username} storage to ${storageInGB}GB`);
    }
    
    // Get updated company data
    const updatedCompany = await Company.findById(companyId);
    const users = await User.find({ company: companyId });
    const totalAllocated = users.reduce((acc, user) => acc + (user.storageAllocated || 0), 0);
    
    res.json({
      message: `Storage allocated to ${company.name}`,
      company: {
        _id: updatedCompany._id,
        name: updatedCompany.name,
        totalStorage: updatedCompany.totalStorage,
        usedStorage: updatedCompany.usedStorage,
        allocatedToUsers: totalAllocated,
        availableStorage: updatedCompany.totalStorage - updatedCompany.usedStorage,
        unallocatedStorage: updatedCompany.totalStorage - totalAllocated
      },
      updatedAdmins: admins.length
    });
  } catch (error) {
    console.error('Allocate storage error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Admin allocates storage to team member
// @route   POST /api/storage/allocate-to-user
// @access  Private/Admin
export const allocateStorageToUser = async (req, res) => {
  try {
    const { userId, storageInGB } = req.body;
    
    console.log('Allocate storage request:', { 
      userId, 
      storageInGB,
      adminUser: req.user.id,
      adminCompany: req.user.company
    });
    
    if (!userId || !storageInGB || storageInGB < 0.1) {
      return res.status(400).json({ error: 'User ID and valid storage (min 0.1GB) required' });
    }
    
    const storageInBytes = storageInGB * 1024 * 1024 * 1024;
    
    // Find the target user
    const targetUser = await User.findById(userId).populate('company');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if target user has a company
    if (!targetUser.company) {
      return res.status(400).json({ 
        error: 'User does not have a company assigned',
        message: 'Please ensure the user is properly added to a company'
      });
    }
    
    // Get admin's company ID
    const adminCompanyId = req.user.company?._id?.toString() || req.user.company?.toString();
    const targetCompanyId = targetUser.company._id?.toString() || targetUser.company?.toString();
    
    // Check if user belongs to admin's company
    if (adminCompanyId !== targetCompanyId) {
      return res.status(403).json({ 
        error: 'User does not belong to your company',
        message: 'You can only allocate storage to users in your own company'
      });
    }
    
    // Get the company
    const company = await Company.findById(targetUser.company._id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get all users in this company
    const companyUsers = await User.find({ company: company._id });
    
    // Calculate total allocated storage (excluding the user we're updating)
    const totalAllocated = companyUsers.reduce((total, u) => {
      if (u._id.toString() !== userId) {
        return total + (u.storageAllocated || 0);
      }
      return total;
    }, 0);
    
    // Calculate available storage
    const availableToAllocate = company.totalStorage - totalAllocated;
    
    if (storageInBytes > availableToAllocate) {
      return res.status(400).json({ 
        error: 'Insufficient storage',
        message: `Company has ${(availableToAllocate / (1024 * 1024 * 1024)).toFixed(2)}GB available to allocate`
      });
    }
    
    // Update user's allocated storage
    targetUser.storageAllocated = storageInBytes;
    await targetUser.save();
    
    // Update company's allocatedToUsers
    const newTotalAllocated = totalAllocated + storageInBytes;
    company.allocatedToUsers = newTotalAllocated;
    await company.save();
    
    res.json({
      message: `Storage allocated to ${targetUser.username}`,
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        storageAllocated: targetUser.storageAllocated,
        storageUsed: targetUser.storageUsed,
        availableStorage: targetUser.storageAllocated - targetUser.storageUsed
      },
      company: {
        _id: company._id,
        name: company.name,
        totalStorage: company.totalStorage,
        allocatedToUsers: newTotalAllocated,
        usedStorage: company.usedStorage,
        availableToAllocate: company.totalStorage - newTotalAllocated,
        availableStorage: company.totalStorage - company.usedStorage
      }
    });
  } catch (error) {
    console.error('Allocate storage to user error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Get storage usage for a user
// @route   GET /api/storage/user/:userId
// @access  Private
export const getUserStorage = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username email storageAllocated storageUsed company');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check permissions
    const adminCompanyId = req.user.company?._id?.toString() || req.user.company?.toString();
    const userCompanyId = user.company?._id?.toString() || user.company?.toString();
    
    if (req.user.role !== 'superAdmin' && adminCompanyId !== userCompanyId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const files = await File.find({ uploadedBy: user._id });
    const totalUsed = files.reduce((acc, file) => acc + file.size, 0);
    
    // Update user's storageUsed
    user.storageUsed = totalUsed;
    await user.save();
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
      storage: {
        allocated: user.storageAllocated,
        used: totalUsed,
        available: user.storageAllocated - totalUsed,
        percentage: user.storageAllocated > 0 ? ((totalUsed / user.storageAllocated) * 100).toFixed(2) : '0.00',
        fileCount: files.length
      }
    });
  } catch (error) {
    console.error('Get user storage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get company storage usage
// @route   GET /api/storage/company/:companyId
// @access  Private/SuperAdmin or Admin
export const getCompanyStorage = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .populate('owner', 'username email');
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const users = await User.find({ company: company._id })
      .select('username email storageAllocated storageUsed');
    
    const files = await File.find({ company: company._id });
    const totalUsed = files.reduce((acc, file) => acc + file.size, 0);
    
    // Calculate total allocated to users
    const totalAllocated = users.reduce((acc, user) => acc + (user.storageAllocated || 0), 0);
    
    // Update company stats
    company.usedStorage = totalUsed;
    company.allocatedToUsers = totalAllocated;
    await company.save();
    
    res.json({
      company: {
        _id: company._id,
        name: company.name,
        owner: company.owner,
        totalStorage: company.totalStorage,
        usedStorage: totalUsed,
        allocatedToUsers: totalAllocated,
        userCount: users.length,
        isActive: company.isActive,
        createdAt: company.createdAt
      },
      storage: {
        total: company.totalStorage,
        used: totalUsed,
        allocatedToUsers: totalAllocated,
        available: company.totalStorage - totalUsed,
        unallocated: company.totalStorage - totalAllocated,
        percentage: ((totalUsed / company.totalStorage) * 100).toFixed(2)
      },
      users: users.map(user => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        storageAllocated: user.storageAllocated,
        storageUsed: user.storageUsed,
        availableStorage: user.storageAllocated - user.storageUsed
      })),
      fileCount: files.length,
      recentFiles: files.slice(0, 10)
    });
  } catch (error) {
    console.error('Get company storage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};