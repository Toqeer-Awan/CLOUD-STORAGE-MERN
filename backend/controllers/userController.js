import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    res.status(201).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    
    if (role === 'admin') {
      user.permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true, manageFiles: true
      };
    } else if (role === 'moderator') {
      user.permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: false, removeUser: false, changeRole: false, manageFiles: true
      };
    } else if (role === 'user') {
      user.permissions = {
        view: true, upload: true, download: true, delete: false,
        addUser: false, removeUser: false, changeRole: false, manageFiles: false
      };
    } else {
      const customRole = await Role.findOne({ name: role });
      if (customRole) {
        user.permissions = customRole.permissions;
      }
    }

    user.permissionsUpdatedAt = new Date();
    await user.save();

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllRolesPermissions = async (req, res) => {
  try {
    const customRoles = await Role.find().sort({ createdAt: -1 });
    const users = await User.find().select('role permissions permissionsUpdatedAt');
    
    const roles = {
      admin: { view: true, upload: true, download: true, delete: true, addUser: true, removeUser: true, changeRole: true, manageFiles: true },
      moderator: { view: true, upload: true, download: true, delete: true, addUser: false, removeUser: false, changeRole: false, manageFiles: true },
      user: { view: true, upload: true, download: true, delete: false, addUser: false, removeUser: false, changeRole: false, manageFiles: false }
    };

    const roleTimestamps = {
      admin: { createdAt: null, updatedAt: null, permissionsUpdatedAt: null },
      moderator: { createdAt: null, updatedAt: null, permissionsUpdatedAt: null },
      user: { createdAt: null, updatedAt: null, permissionsUpdatedAt: null }
    };

    users.forEach(user => {
      if (roles[user.role]) {
        roles[user.role] = user.permissions.toObject();
        roleTimestamps[user.role] = {
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          permissionsUpdatedAt: user.permissionsUpdatedAt
        };
      }
    });

    res.json({ 
      roles, 
      roleTimestamps,
      customRoles: customRoles.map(role => ({
        name: role.name,
        displayName: role.displayName,
        permissions: role.permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissionsUpdatedAt: role.permissionsUpdatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateAllRolesPermissions = async (req, res) => {
  try {
    const { roles, customRoles } = req.body;
    const now = new Date();

    for (const [roleName, permissions] of Object.entries(roles)) {
      await User.updateMany(
        { role: roleName },
        { $set: { permissions, permissionsUpdatedAt: now, updatedAt: now } }
      );
    }

    if (Array.isArray(customRoles)) {
      for (const customRole of customRoles) {
        await Role.findOneAndUpdate(
          { name: customRole.name },
          {
            name: customRole.name,
            displayName: customRole.displayName || customRole.name,
            permissions: customRole.permissions,
            permissionsUpdatedAt: now,
            updatedAt: now
          },
          { upsert: true, new: true }
        );
        
        await User.updateMany(
          { role: customRole.name },
          { $set: { permissions: customRole.permissions, permissionsUpdatedAt: now, updatedAt: now } }
        );
      }
    }

    res.json({ message: 'Permissions updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('permissions role');
    res.json({ permissions: user.permissions, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteCustomRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    if (['admin', 'moderator', 'user'].includes(roleName)) {
      return res.status(400).json({ error: 'Cannot delete default role' });
    }
    await Role.deleteOne({ name: roleName });
    await User.updateMany(
      { role: roleName },
      { $set: { role: 'user', updatedAt: new Date() } }
    );
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};