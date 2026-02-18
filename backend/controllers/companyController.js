import Company from '../models/Company.js';
import User from '../models/User.js';
import File from '../models/File.js';
import mongoose from 'mongoose';

// @desc    Get all companies (Admin only)
// @route   GET /api/companies
// @access  Private/Admin
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const users = await User.find({ company: company._id }).select('username email role createdAt storageAllocated storageUsed');
        const files = await File.find({ 
          company: company._id, 
          isDeleted: false, 
          uploadStatus: 'completed' 
        });
        
        const totalStorageUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
        const totalAllocated = users.reduce((acc, user) => acc + (user.storageAllocated || 0), 0);
        
        return {
          ...company.toObject(),
          users,
          totalFiles: files.length,
          storageUsed: totalStorageUsed,
          allocatedToUsers: totalAllocated,
          storagePercentage: company.totalStorage > 0 ? ((totalStorageUsed / company.totalStorage) * 100).toFixed(2) : '0.00',
          allocationPercentage: company.totalStorage > 0 ? ((totalAllocated / company.totalStorage) * 100).toFixed(2) : '0.00',
          isOverAllocated: totalAllocated > company.totalStorage,
          overAllocatedBy: Math.max(0, totalAllocated - company.totalStorage)
        };
      })
    );
    
    res.json(companiesWithStats);
  } catch (error) {
    console.error('❌ Get companies error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'username email');
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin' && req.user.company?.toString() !== company._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.find({ company: company._id }).select('-password');
    const files = await File.find({ 
      company: company._id,
      isDeleted: false,
      uploadStatus: 'completed'
    })
      .populate('uploadedBy', 'username')
      .sort({ uploadDate: -1 })
      .limit(50);

    const totalStorageUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
    const totalAllocated = users.reduce((acc, user) => acc + (user.storageAllocated || 0), 0);

    // Calculate per-user storage used from files
    const userUsageMap = new Map();
    users.forEach(user => userUsageMap.set(user._id.toString(), 0));
    
    files.forEach(file => {
      const userId = file.uploadedBy._id.toString();
      userUsageMap.set(userId, (userUsageMap.get(userId) || 0) + (file.size || 0));
    });

    res.json({
      ...company.toObject(),
      users: users.map(user => ({
        ...user.toObject(),
        storageUsed: userUsageMap.get(user._id.toString()) || 0
      })),
      files,
      storageUsed: totalStorageUsed,
      allocatedToUsers: totalAllocated,
      storagePercentage: company.totalStorage > 0 ? ((totalStorageUsed / company.totalStorage) * 100).toFixed(2) : '0.00',
      allocationPercentage: company.totalStorage > 0 ? ((totalAllocated / company.totalStorage) * 100).toFixed(2) : '0.00',
      isOverAllocated: totalAllocated > company.totalStorage,
      overAllocatedBy: Math.max(0, totalAllocated - company.totalStorage)
    });
  } catch (error) {
    console.error('❌ Get company error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Get current user's company
// @route   GET /api/companies/me
// @access  Private
export const getMyCompany = async (req, res) => {
  try {
    console.log('📊 Getting company for user:', req.user.id);

    // Check if user has a company
    if (!req.user.company) {
      if (req.user.role === 'superAdmin') {
        return res.json({
          message: 'Super admin has no company',
          totalStorage: 0,
          usedStorage: 0,
          allocatedToUsers: 0,
          users: [],
          recentFiles: []
        });
      }
      return res.status(404).json({ error: 'No company assigned' });
    }

    // Find the company
    const company = await Company.findById(req.user.company)
      .populate('owner', 'username email');
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log('✅ Found company:', company.name);
    console.log('📦 Company storage:', {
      total: (company.totalStorage / (1024*1024*1024)).toFixed(2) + 'GB',
      used: (company.usedStorage / (1024*1024*1024)).toFixed(2) + 'GB',
      allocated: (company.allocatedToUsers / (1024*1024*1024)).toFixed(2) + 'GB'
    });

    // 🔥 CRITICAL: Get ALL data from actual sources
    const users = await User.find({ company: company._id })
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log('👥 Found users:', users.length);
    
    const files = await File.find({ 
      company: company._id,
      isDeleted: false,
      uploadStatus: 'completed'
    }).populate('uploadedBy', 'username');

    console.log('📁 Found files:', files.length);

    // Calculate from actual files
    const totalStorageUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
    
    // Calculate from actual user allocations
    const totalAllocated = users.reduce((acc, user) => acc + (user.storageAllocated || 0), 0);
    
    // Calculate per-user storage used from files
    const userUsageMap = new Map();
    users.forEach(user => userUsageMap.set(user._id.toString(), 0));
    
    files.forEach(file => {
      const userId = file.uploadedBy._id.toString();
      userUsageMap.set(userId, (userUsageMap.get(userId) || 0) + (file.size || 0));
    });

    const responseData = {
      _id: company._id,
      name: company.name,
      owner: company.owner,
      totalStorage: company.totalStorage,
      usedStorage: totalStorageUsed,
      allocatedToUsers: totalAllocated,
      userCount: users.length,
      isActive: company.isActive,
      createdAt: company.createdAt,
      
      // Storage calculations
      storagePercentage: ((totalStorageUsed / company.totalStorage) * 100).toFixed(2),
      allocationPercentage: ((totalAllocated / company.totalStorage) * 100).toFixed(2),
      availableStorage: company.totalStorage - totalStorageUsed,
      unallocatedStorage: Math.max(0, company.totalStorage - totalAllocated), // Never negative
      isOverAllocated: totalAllocated > company.totalStorage,
      overAllocatedBy: Math.max(0, totalAllocated - company.totalStorage),
      
      users: users.map(user => {
        const userUsed = userUsageMap.get(user._id.toString()) || 0;
        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          storageAllocated: user.storageAllocated || 0,
          storageUsed: userUsed,
          availableStorage: (user.storageAllocated || 0) - userUsed,
          usagePercentage: user.storageAllocated > 0 ? ((userUsed / user.storageAllocated) * 100).toFixed(1) : '0.0',
          isOwner: company.owner?._id?.toString() === user._id.toString(),
          createdAt: user.createdAt,
          permissions: user.permissions
        };
      }),
      
      recentFiles: files.slice(0, 20).map(file => ({
        _id: file._id,
        name: file.originalName,
        filename: file.filename,
        size: file.size,
        type: file.mimetype,
        uploadedBy: {
          _id: file.uploadedBy._id,
          username: file.uploadedBy.username
        },
        uploadDate: file.uploadDate,
        storageUrl: file.storageUrl
      }))
    };
    
    console.log('📤 Company Response:');
    console.log(`   Total: ${(responseData.totalStorage / (1024*1024*1024)).toFixed(2)}GB`);
    console.log(`   Used: ${(responseData.usedStorage / (1024*1024*1024)).toFixed(2)}GB`);
    console.log(`   Allocated: ${(responseData.allocatedToUsers / (1024*1024*1024)).toFixed(2)}GB`);
    console.log(`   Unallocated: ${(responseData.unallocatedStorage / (1024*1024*1024)).toFixed(2)}GB`);
    console.log(`   Over-allocated: ${responseData.isOverAllocated ? 'YES by ' + (responseData.overAllocatedBy / (1024*1024*1024)).toFixed(2) + 'GB' : 'NO'}`);
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Get my company error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Update company storage (Admin only)
// @route   PUT /api/companies/:id/storage
// @access  Private/Admin
export const updateCompanyStorage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { totalStorage } = req.body;
    
    if (!totalStorage || totalStorage < 100 * 1024 * 1024) {
      return res.status(400).json({ error: 'Storage must be at least 100MB' });
    }

    const company = await Company.findById(req.params.id).session(session);
    
    if (!company) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Company not found' });
    }

    // Only superAdmin can update any company, admin can only update their own
    if (req.user.role !== 'superAdmin' && req.user.company?.toString() !== company._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldTotal = company.totalStorage;
    const oldAllocated = company.allocatedToUsers;
    
    // Check if new total is less than current allocated
    if (totalStorage < company.allocatedToUsers) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: 'Cannot reduce storage below currently allocated amount',
        message: `Currently allocated: ${(company.allocatedToUsers / (1024*1024*1024)).toFixed(2)}GB, New total: ${(totalStorage / (1024*1024*1024)).toFixed(2)}GB`
      });
    }

    company.totalStorage = totalStorage;
    await company.save({ session });

    // If superAdmin updates storage, update admin's allocation as well
    if (req.user.role === 'superAdmin') {
      const admins = await User.find({ 
        company: company._id, 
        role: 'admin' 
      }).session(session);
      
      for (const admin of admins) {
        admin.storageAllocated = totalStorage;
        await admin.save({ session });
      }
      console.log(`✅ Updated ${admins.length} admins to new storage: ${(totalStorage / (1024*1024*1024)).toFixed(2)}GB`);
    }

    await session.commitTransaction();

    res.json({
      message: 'Company storage updated successfully',
      company: {
        _id: company._id,
        name: company.name,
        totalStorage: company.totalStorage,
        usedStorage: company.usedStorage,
        allocatedToUsers: company.allocatedToUsers,
        previousTotal: oldTotal,
        availableToAllocate: company.totalStorage - company.allocatedToUsers
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Update storage error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Delete company (Admin only)
// @route   DELETE /api/companies/:id
// @access  Private/Admin
export const deleteCompany = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const company = await Company.findById(req.params.id).session(session);
    
    if (!company) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Company not found' });
    }

    // Only superAdmin can delete companies
    if (req.user.role !== 'superAdmin') {
      await session.abortTransaction();
      return res.status(403).json({ error: 'Access denied. Only superAdmin can delete companies.' });
    }

    // Delete all users in this company
    await User.deleteMany({ company: company._id }).session(session);
    
    // Delete all files in this company
    await File.deleteMany({ company: company._id }).session(session);
    
    // Delete the company
    await company.deleteOne({ session });

    await session.commitTransaction();

    res.json({ 
      success: true,
      message: 'Company and all associated data deleted successfully' 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Delete company error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get company storage summary (for admin dashboard)
// @route   GET /api/companies/summary
// @access  Private/Admin
export const getCompanySummary = async (req, res) => {
  try {
    if (!req.user.company) {
      return res.status(404).json({ error: 'No company found' });
    }

    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const users = await User.find({ company: company._id });
    const files = await File.find({ 
      company: company._id,
      isDeleted: false,
      uploadStatus: 'completed'
    });

    const totalStorageUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
    const totalAllocated = users.reduce((acc, user) => acc + (user.storageAllocated || 0), 0);

    res.json({
      companyId: company._id,
      companyName: company.name,
      totalStorage: company.totalStorage,
      usedStorage: totalStorageUsed,
      allocatedStorage: totalAllocated,
      availableStorage: company.totalStorage - totalStorageUsed,
      unallocatedStorage: Math.max(0, company.totalStorage - totalAllocated),
      isOverAllocated: totalAllocated > company.totalStorage,
      overAllocatedBy: Math.max(0, totalAllocated - company.totalStorage),
      userCount: users.length,
      fileCount: files.length,
      storagePercentage: ((totalStorageUsed / company.totalStorage) * 100).toFixed(2),
      allocationPercentage: ((totalAllocated / company.totalStorage) * 100).toFixed(2)
    });

  } catch (error) {
    console.error('❌ Get company summary error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Fix company allocations (Admin only - utility)
// @route   POST /api/companies/fix-allocations
// @access  Private/Admin
export const fixCompanyAllocations = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const companyId = req.user.company;
    
    const company = await Company.findById(companyId).session(session);
    if (!company) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get all users in this company
    const users = await User.find({ company: companyId }).session(session);
    
    // Calculate actual total allocated
    const actualAllocated = users.reduce((acc, u) => acc + (u.storageAllocated || 0), 0);
    
    // Fix if mismatch
    if (company.allocatedToUsers !== actualAllocated) {
      console.log(`🔄 Fixing company allocation: ${(company.allocatedToUsers / (1024*1024*1024)).toFixed(2)}GB → ${(actualAllocated / (1024*1024*1024)).toFixed(2)}GB`);
      company.allocatedToUsers = actualAllocated;
      await company.save({ session });
    }
    
    // Check for over-allocation
    const isOverAllocated = actualAllocated > company.totalStorage;
    const overAllocatedBy = Math.max(0, actualAllocated - company.totalStorage);
    
    await session.commitTransaction();
    
    res.json({
      message: 'Company allocations fixed',
      company: {
        _id: company._id,
        name: company.name,
        totalStorage: company.totalStorage,
        allocatedToUsers: actualAllocated,
        isOverAllocated,
        overAllocatedBy,
        availableToAllocate: Math.max(0, company.totalStorage - actualAllocated)
      },
      userCount: users.length
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Fix company allocations error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    session.endSession();
  }
};

// Export all functions
export default {
  getAllCompanies,
  getCompanyById,
  getMyCompany,
  updateCompanyStorage,
  deleteCompany,
  getCompanySummary,
  fixCompanyAllocations
};