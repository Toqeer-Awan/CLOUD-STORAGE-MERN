import Role from '../models/Role.js';

export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Check if role exists
    const roleExists = await Role.findOne({ name });
    if (roleExists) {
      return res.status(400).json({ error: 'Role already exists' });
    }
    
    const role = await Role.create({
      name,
      description,
      permissions,
      isCustom: true
    });
    
    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Don't allow updating default roles if they're not custom
    if (!role.isCustom && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update default roles' });
    }
    
    if (name) role.name = name;
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    
    await role.save();
    
    res.json({
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Don't allow deleting default roles
    if (!role.isCustom) {
      return res.status(403).json({ error: 'Cannot delete default roles' });
    }
    
    await role.deleteOne();
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};