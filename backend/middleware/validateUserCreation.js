// middleware/validateUserCreation.js
import User from '../models/User.js';
import Company from '../models/Company.js';

export const validateUserCreation = async (req, res, next) => {
  try {
    const ACCOUNT_AGE_REQUIREMENT = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const STORAGE_REQUIREMENT = 0.14 * 1024 * 1024; // 0.14 MB in bytes

    const admin = await User.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if admin has company
    if (!admin.company) {
      return res.status(403).json({ 
        error: 'You do not have a company. Please contact support.' 
      });
    }

    const accountAge = Date.now() - new Date(admin.createdAt).getTime();
    const accountAgeInHours = (accountAge / (60 * 60 * 1000)).toFixed(1);
    const storageUsedMB = (admin.storageUsed / (1024 * 1024)).toFixed(2);

    console.log('🔍 Validation middleware check:', {
      username: admin.username,
      accountAge: `${accountAgeInHours} hours`,
      requiredAge: '48 hours',
      storageUsed: `${storageUsedMB} MB`,
      requiredStorage: '0.14 MB',
      meetsAgeRequirement: accountAge >= ACCOUNT_AGE_REQUIREMENT,
      meetsStorageRequirement: admin.storageUsed > STORAGE_REQUIREMENT
    });

    // Check account age
    if (accountAge < ACCOUNT_AGE_REQUIREMENT) {
      const hoursRemaining = ((ACCOUNT_AGE_REQUIREMENT - accountAge) / (60 * 60 * 1000)).toFixed(1);
      return res.status(403).json({
        error: 'Account too new',
        message: `Your account is ${accountAgeInHours} hours old. Need 48 hours to add users. ${hoursRemaining} hours remaining.`,
        details: {
          accountAge: accountAgeInHours,
          requiredAge: '48',
          hoursRemaining,
          meetsRequirement: false
        }
      });
    }

    // Check storage usage
    if (admin.storageUsed <= STORAGE_REQUIREMENT) {
      const storageNeededMB = ((STORAGE_REQUIREMENT - admin.storageUsed) / (1024 * 1024)).toFixed(2);
      return res.status(403).json({
        error: 'Insufficient storage usage',
        message: `Need >0.14MB usage. Currently using ${storageUsedMB}MB. Upload ${storageNeededMB}MB more.`,
        details: {
          storageUsed: storageUsedMB,
          requiredStorage: '0.14',
          storageNeeded: storageNeededMB,
          meetsRequirement: false
        }
      });
    }

    // If all checks pass, proceed
    console.log('✅ Admin meets all requirements, proceeding with user creation');
    next();
  } catch (error) {
    console.error('❌ Validation middleware error:', error);
    res.status(500).json({ error: 'Server error during validation' });
  }
};