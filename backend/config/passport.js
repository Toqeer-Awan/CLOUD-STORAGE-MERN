import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('company');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email }).populate('company');
    
    if (!user) {
      // Create new user and company
      const username = profile.displayName.replace(/\s+/g, '_').toLowerCase();
      
      const company = await Company.create({
        name: `${username}_company`,
        owner: null,
        totalStorage: 5 * 1024 * 1024 * 1024,
        userCount: 1
      });
      
      const permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: false,
        manageFiles: true, manageStorage: false
      };
      
      user = await User.create({
        username: username,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: 'user',
        company: company._id,
        authProvider: 'google',
        authProviderId: profile.id,
        avatar: profile.photos[0]?.value,
        permissions: permissions
      });
      
      company.owner = user._id;
      await company.save();
      
      user = await User.findById(user._id).populate('company');
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/api/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'email', 'name', 'photos'],
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    
    if (!email) {
      return done(new Error('Email not provided by Facebook'), null);
    }
    
    let user = await User.findOne({ email }).populate('company');
    
    if (!user) {
      const username = profile.displayName.replace(/\s+/g, '_').toLowerCase();
      
      const company = await Company.create({
        name: `${username}_company`,
        owner: null,
        totalStorage: 5 * 1024 * 1024 * 1024,
        userCount: 1
      });
      
      const permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: false,
        manageFiles: true, manageStorage: false
      };
      
      user = await User.create({
        username: username,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: 'user',
        company: company._id,
        authProvider: 'facebook',
        authProviderId: profile.id,
        avatar: profile.photos[0]?.value,
        permissions: permissions
      });
      
      company.owner = user._id;
      await company.save();
      
      user = await User.findById(user._id).populate('company');
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Microsoft Strategy
passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: '/api/auth/microsoft/callback',
  scope: ['user.read'],
  proxy: true,
  tenant: 'common' // Use 'common' for personal accounts, or your tenant ID
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
    
    if (!email) {
      return done(new Error('Email not provided by Microsoft'), null);
    }
    
    let user = await User.findOne({ email }).populate('company');
    
    if (!user) {
      const username = profile.displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${Date.now()}`;
      
      const company = await Company.create({
        name: `${username}_company`,
        owner: null,
        totalStorage: 5 * 1024 * 1024 * 1024,
        userCount: 1
      });
      
      const permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: false,
        manageFiles: true, manageStorage: false
      };
      
      user = await User.create({
        username: username,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: 'user',
        company: company._id,
        authProvider: 'microsoft',
        authProviderId: profile.id,
        avatar: null,
        permissions: permissions
      });
      
      company.owner = user._id;
      await company.save();
      
      user = await User.findById(user._id).populate('company');
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

export default passport;