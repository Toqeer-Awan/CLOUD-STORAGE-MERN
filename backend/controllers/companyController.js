// backend/controllers/companyController.js
import Company from '../models/Company.js';
import User from '../models/User.js';
import File from '../models/File.js';

// @desc    Get all companies (Admin only)
// @route   GET /api/companies
// @access  Private/Admin
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    
    // Get user count and storage usage for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const users = await User.find({ company: company._id }).select('username email role createdAt');
        const files = await File.find({ company: company._id });
        const totalStorageUsed = files.reduce((acc, file) => acc + file.size, 0);
        
        return {
          ...company.toObject(),
          users,
          totalFiles: files.length,
          storageUsed: totalStorageUsed,
          storagePercentage: ((totalStorageUsed / company.totalStorage) * 100).toFixed(2)
        };
      })
    );
    
    res.json(companiesWithStats);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Server error' });
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

    // Check if user belongs to this company or is admin
    if (req.user.role !== 'admin' && req.user.company.toString() !== company._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.find({ company: company._id }).select('-password');
    const files = await File.find({ company: company._id })
      .populate('uploadedBy', 'username')
      .sort({ uploadDate: -1 })
      .limit(50);

    const totalStorageUsed = files.reduce((acc, file) => acc + file.size, 0);

    res.json({
      ...company.toObject(),
      users,
      files,
      storageUsed: totalStorageUsed,
      storagePercentage: ((totalStorageUsed / company.totalStorage) * 100).toFixed(2)
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update company storage (Admin only)
// @route   PUT /api/companies/:id/storage
// @access  Private/Admin
export const updateCompanyStorage = async (req, res) => {
  try {
    const { totalStorage } = req.body;
    
    if (!totalStorage || totalStorage < 100 * 1024 * 1024) {
      return res.status(400).json({ error: 'Storage must be at least 100MB' });
    }

    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.totalStorage = totalStorage;
    await company.save();

    res.json({
      message: 'Company storage updated successfully',
      company: {
        _id: company._id,
        name: company.name,
        totalStorage: company.totalStorage,
        usedStorage: company.usedStorage
      }
    });
  } catch (error) {
    console.error('Update storage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get current user's company
// @route   GET /api/companies/me
// @access  Private
export const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company)
      .populate('owner', 'username email');
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const users = await User.find({ company: company._id })
      .select('-password')
      .sort({ createdAt: -1 });
    
    const files = await File.find({ company: company._id })
      .populate('uploadedBy', 'username')
      .sort({ uploadDate: -1 })
      .limit(20);

    const totalStorageUsed = files.reduce((acc, file) => acc + file.size, 0);
    const storageByUser = {};
    
    users.forEach(user => {
      storageByUser[user._id] = {
        username: user.username,
        email: user.email,
        storageUsed: 0,
        fileCount: 0
      };
    });

    files.forEach(file => {
      if (storageByUser[file.uploadedBy._id]) {
        storageByUser[file.uploadedBy._id].storageUsed += file.size;
        storageByUser[file.uploadedBy._id].fileCount += 1;
      }
    });

    res.json({
      ...company.toObject(),
      users: users.map(user => ({
        ...user.toObject(),
        storageUsed: storageByUser[user._id]?.storageUsed || 0,
        fileCount: storageByUser[user._id]?.fileCount || 0
      })),
      recentFiles: files,
      storageUsed: totalStorageUsed,
      storagePercentage: ((totalStorageUsed / company.totalStorage) * 100).toFixed(2),
      availableStorage: company.totalStorage - totalStorageUsed
    });
  } catch (error) {
    console.error('Get my company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete company (Admin only)
// @route   DELETE /api/companies/:id
// @access  Private/Admin
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Delete all users and files associated with this company
    await User.deleteMany({ company: company._id });
    await File.deleteMany({ company: company._id });
    await company.deleteOne();

    res.json({ message: 'Company and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};