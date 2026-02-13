// backend/controllers/userController.js
import User from '../models/User.js';
import Company from '../models/Company.js';
import Role from '../models/Role.js';
import bcrypt from 'bcryptjs';

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('company', 'name totalStorage')
      .populate('addedBy', 'username email');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users by company (For company owners)
export const getCompanyUsers = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Check if user has access to this company
    if (req.user.role !== 'admin' && req.user.company.toString() !== companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const users = await User.find({ company: companyId })
      .select('-password')
      .populate('addedBy', 'username email');
    
    res.json(users);
  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create user (Company owners can add users to their company)
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Determine which company to add user to
    let companyId;
    
    if (req.user.role === 'admin') {
      // Admin can specify company or create new company
      if (req.body.companyId) {
        companyId = req.body.companyId;
      } else {
        // Create new company for this user
        const companyName = `${username.toLowerCase().replace(/\s+/g, '_')}_company`;
        const company = await Company.create({
          name: companyName,
          owner: null, // Will be set after user creation
          totalStorage: 5 * 1024 * 1024 * 1024,
          userCount: 1
        });
        companyId = company._id;
      }
    } else {
      // Company owner adding user to their company
      companyId = req.user.company;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check storage quota if adding to existing company
    const currentUsers = await User.countDocuments({ company: companyId });
    const files = await File.find({ company: companyId });
    const totalStorageUsed = files.reduce((acc, file) => acc + file.size, 0);
    
    if (totalStorageUsed >= company.totalStorage) {
      return res.status(400).json({ error: 'Company storage limit reached' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set permissions based on role
    let permissions = {};
    if (role === 'admin') {
      permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true, manageFiles: true, manageStorage: true
      };
    } else if (role === 'moderator') {
      permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: false, removeUser: false, changeRole: false, manageFiles: true, manageStorage: false
      };
    } else {
      permissions = {
        view: true, upload: true, download: true, delete: false,
        addUser: false, removeUser: false, changeRole: false, manageFiles: false, manageStorage: false
      };
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      company: companyId,
      addedBy: req.user.id,
      permissions
    });

    // Update company user count
    company.userCount = await User.countDocuments({ company: companyId });
    await company.save();

    // If company has no owner and this is admin creating, set as owner
    if (!company.owner && req.user.role === 'admin') {
      company.owner = user._id;
      await company.save();
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        company: company._id,
        companyName: company.name,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id).populate('company');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      // Company owner can only update users in their company
      if (req.user.company.toString() !== user.company._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Company owner cannot change admin role
      if (user.role === 'admin' || role === 'admin') {
        return res.status(403).json({ error: 'Cannot modify admin roles' });
      }
    }

    user.role = role;
    
    // Set permissions based on new role
    if (role === 'admin') {
      user.permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true, manageFiles: true, manageStorage: true
      };
    } else if (role === 'moderator') {
      user.permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: false, removeUser: false, changeRole: false, manageFiles: true, manageStorage: false
      };
    } else {
      user.permissions = {
        view: true, upload: true, download: true, delete: false,
        addUser: false, removeUser: false, changeRole: false, manageFiles: false, manageStorage: false
      };
    }

    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('company');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      // Company owner can only delete users in their company
      if (req.user.company.toString() !== user.company._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Cannot delete company owner
      if (user.company.owner && user.company.owner.toString() === user._id.toString()) {
        return res.status(403).json({ error: 'Cannot delete company owner' });
      }
    }

    await user.deleteOne();
    
    // Update company user count
    const company = await Company.findById(user.company._id);
    if (company) {
      company.userCount = await User.countDocuments({ company: company._id });
      await company.save();
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user permissions
export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('permissions role company');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      permissions: user.permissions,
      role: user.role,
      company: user.company
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all roles and permissions
export const getAllRolesPermissions = async (req, res) => {
  try {
    const customRoles = await Role.find();
    
    const roles = {
      admin: { 
        view: true, upload: true, download: true, delete: true, 
        addUser: true, removeUser: true, changeRole: true, manageFiles: true, manageStorage: true 
      },
      moderator: { 
        view: true, upload: true, download: true, delete: true, 
        addUser: false, removeUser: false, changeRole: false, manageFiles: true, manageStorage: false 
      },
      user: { 
        view: true, upload: true, download: true, delete: false, 
        addUser: false, removeUser: false, changeRole: false, manageFiles: false, manageStorage: false 
      }
    };

    res.json({ 
      roles, 
      customRoles: customRoles.map(role => ({
        name: role.name,
        displayName: role.displayName,
        permissions: role.permissions
      }))
    });
  } catch (error) {
    console.error('Get all roles & permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update all roles and permissions
export const updateAllRolesPermissions = async (req, res) => {
  try {
    const { roles, customRoles } = req.body;

    if (!roles || typeof roles !== 'object') {
      return res.status(400).json({ error: 'Roles object is required' });
    }

    // Update default roles in users
    for (const [roleName, permissions] of Object.entries(roles)) {
      await User.updateMany(
        { role: roleName },
        { $set: { permissions: permissions } }
      );
    }

    // Save custom roles
    if (Array.isArray(customRoles)) {
      for (const customRole of customRoles) {
        await Role.findOneAndUpdate(
          { name: customRole.name },
          {
            name: customRole.name,
            displayName: customRole.displayName || customRole.name,
            permissions: customRole.permissions
          },
          { upsert: true, new: true }
        );
        
        await User.updateMany(
          { role: customRole.name },
          { $set: { permissions: customRole.permissions } }
        );
      }
    }

    res.json({ 
      message: 'Permissions updated successfully',
      roles,
      customRoles
    });
  } catch (error) {
    console.error('Update all roles & permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete custom role
export const deleteCustomRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    
    if (['admin', 'moderator', 'user'].includes(roleName)) {
      return res.status(400).json({ error: 'Cannot delete default roles' });
    }
    
    await Role.deleteOne({ name: roleName });
    await User.updateMany(
      { role: roleName },
      { $set: { role: 'user' } }
    );
    
    res.json({ message: `Role ${roleName} deleted successfully` });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};