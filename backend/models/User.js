import mongoose from 'mongoose';

const permissionsSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: true },
    upload: { type: Boolean, default: true },
    download: { type: Boolean, default: true },
    delete: { type: Boolean, default: false },
    addUser: { type: Boolean, default: false },
    removeUser: { type: Boolean, default: false },
    changeRole: { type: Boolean, default: false },
    manageFiles: { type: Boolean, default: false },
    manageStorage: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: [true, 'Username is required'],
      trim: true
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      default: 'user',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false // 👈 CHANGE THIS FROM 'true' TO 'false'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: permissionsSchema,
      default: () => ({
        view: true,
        upload: true,
        download: true,
        delete: false,
        addUser: false,
        removeUser: false,
        changeRole: false,
        manageFiles: false,
        manageStorage: false
      }),
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;