// controllers/userInfoController.js
const UserInfoModel = require('../models/userInfoModel');
const { uploadSingle, getRelativePath, deleteFile, fileExists } = require('../utils/fileUpload');
const { db } = require('../models/firebase');
const jwt = require('jsonwebtoken');
const withRetry = require('../utils/retryHandler');
const path = require('path');
const fs = require('fs').promises;

const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";

// Helper function to get user ID from token
const getUserIdFromToken = (req) => {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('Not authenticated');
  
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded.email; // We'll use email to find user ID
};

// Get user info
const getUserInfo = async (req, res) => {
  try {
    const userEmail = getUserIdFromToken(req);
    
    // Find user by email to get user ID
    const snapshot = await withRetry(() => 
      db.collection('users').where('email', '==', userEmail).get()
    );
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    
    const userInfo = await UserInfoModel.getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ error: 'User info not found' });
    }
    
    res.json({
      success: true,
      userInfo: userInfo
    });
    
  } catch (error) {
    console.error('[USER INFO] Error getting user info:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create or update user info with profile picture upload
const updateUserInfo = async (req, res) => {
  try {
    const userEmail = getUserIdFromToken(req);
    
    // Find user by email to get user ID
    const snapshot = await withRetry(() => 
      db.collection('users').where('email', '==', userEmail).get()
    );
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    
    // Handle file upload
    uploadSingle(req, res, async (err) => {
      if (err) {
        console.error('[USER INFO] File upload error:', err);
        return res.status(400).json({ error: err.message });
      }
      
      try {
        // Only update fields that are actually provided in the request
        const updateData = {
          updatedAt: new Date().toISOString()
        };
        
        // Add fields only if they are provided in the request body
        if (req.body.address !== undefined) {
          updateData.address = req.body.address;
        } else if (req.body.location !== undefined) {
          updateData.address = req.body.location;
        }
        
        if (req.body.bio !== undefined) {
          updateData.bio = req.body.bio;
        }
        
        if (req.body.website !== undefined) {
          updateData.website = req.body.website;
        }
        
        if (req.body.phone !== undefined) {
          updateData.phone = req.body.phone;
        }
        
        // If file was uploaded, add the file path
        if (req.file) {
          const relativePath = getRelativePath(req.file.path);
          updateData.profileImagePath = relativePath;
          updateData.profileImageName = req.file.filename;
          updateData.profileImageOriginalName = req.file.originalname;
          updateData.profileImageSize = req.file.size;
          updateData.profileImageMimeType = req.file.mimetype;
        }
        
        // Get existing user info to check for old profile image
        const existingUserInfo = await UserInfoModel.getUserInfo(userId);
        
        // If updating profile image and there's an old one, delete it
        if (req.file && existingUserInfo && existingUserInfo.profileImagePath) {
          try {
            await deleteFile(existingUserInfo.profileImagePath);
            console.log(`Deleted old profile image: ${existingUserInfo.profileImagePath}`);
          } catch (deleteErr) {
            console.warn(`Could not delete old profile image: ${deleteErr.message}`);
          }
        }
        
        // Upsert user info
        await UserInfoModel.upsertUserInfo(userId, updateData);
        
        // Get updated user info
        const updatedUserInfo = await UserInfoModel.getUserInfo(userId);
        
        res.json({
          success: true,
          message: 'User info updated successfully',
          userInfo: updatedUserInfo
        });
        
      } catch (updateErr) {
        // If there was an error after file upload, try to delete the uploaded file
        if (req.file) {
          try {
            await deleteFile(getRelativePath(req.file.path));
          } catch (deleteErr) {
            console.error('Failed to delete uploaded file after error:', deleteErr);
          }
        }
        
        console.error('[USER INFO] Error updating user info:', updateErr);
        res.status(500).json({ error: updateErr.message });
      }
    });
    
  } catch (error) {
    console.error('[USER INFO] Error in updateUserInfo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update profile fields only (no file upload)
const updateProfileFields = async (req, res) => {
  try {
    console.log('[USER INFO] Update profile fields request:', {
      body: req.body,
      headers: req.headers,
      cookies: req.cookies
    });
    
    const userEmail = getUserIdFromToken(req);
    console.log('[USER INFO] User email from token:', userEmail);
    
    // Find user by email to get user ID
    const snapshot = await withRetry(() => 
      db.collection('users').where('email', '==', userEmail).get()
    );
    
    if (snapshot.empty) {
      console.log('[USER INFO] User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    console.log('[USER INFO] User ID:', userId);
    
    // Only update fields that are actually provided in the request
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    // Add fields only if they are provided in the request body
    if (req.body.address !== undefined) {
      updateData.address = req.body.address;
    } else if (req.body.location !== undefined) {
      updateData.address = req.body.location;
    }
    
    if (req.body.bio !== undefined) {
      updateData.bio = req.body.bio;
    }
    
    if (req.body.website !== undefined) {
      updateData.website = req.body.website;
    }
    
    if (req.body.phone !== undefined) {
      updateData.phone = req.body.phone;
    }
    
    console.log('[USER INFO] Update data:', updateData);
    
    // Upsert user info
    await UserInfoModel.upsertUserInfo(userId, updateData);
    console.log('[USER INFO] User info upserted successfully');
    
    // Get updated user info
    const updatedUserInfo = await UserInfoModel.getUserInfo(userId);
    console.log('[USER INFO] Updated user info:', updatedUserInfo);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      userInfo: updatedUserInfo
    });
    
  } catch (error) {
    console.error('[USER INFO] Error updating profile fields:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update profile image URL (for Cloudinary URLs)
const updateProfileImageUrl = async (req, res) => {
  try {
    console.log('[USER INFO] Update profile image URL request:', {
      body: req.body,
      headers: req.headers,
      cookies: req.cookies
    });
    
    const userEmail = getUserIdFromToken(req);
    console.log('[USER INFO] User email from token:', userEmail);
    
    // Find user by email to get user ID
    const snapshot = await withRetry(() => 
      db.collection('users').where('email', '==', userEmail).get()
    );
    
    if (snapshot.empty) {
      console.log('[USER INFO] User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    console.log('[USER INFO] User ID:', userId);
    
    // Validate that profileImageUrl is provided
    if (!req.body.profileImageUrl) {
      return res.status(400).json({ error: 'profileImageUrl is required' });
    }
    
    // Update data with the Cloudinary URL
    const updateData = {
      profileImageUrl: req.body.profileImageUrl,
      updatedAt: new Date().toISOString()
    };
    
    console.log('[USER INFO] Update profile image URL data:', updateData);
    
    // Upsert user info
    await UserInfoModel.upsertUserInfo(userId, updateData);
    console.log('[USER INFO] Profile image URL updated successfully');
    
    // Get updated user info
    const updatedUserInfo = await UserInfoModel.getUserInfo(userId);
    console.log('[USER INFO] Updated user info:', updatedUserInfo);
    
    res.json({
      success: true,
      message: 'Profile image URL updated successfully',
      userInfo: updatedUserInfo
    });
    
  } catch (error) {
    console.error('[USER INFO] Error updating profile image URL:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete profile image
const deleteProfileImage = async (req, res) => {
  try {
    const userEmail = getUserIdFromToken(req);
    
    // Find user by email to get user ID
    const snapshot = await withRetry(() => 
      db.collection('users').where('email', '==', userEmail).get()
    );
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    
    // Get current user info
    const userInfo = await UserInfoModel.getUserInfo(userId);
    
    if (!userInfo || !userInfo.profileImagePath) {
      return res.status(404).json({ error: 'No profile image found' });
    }
    
    // Delete the file
    await deleteFile(userInfo.profileImagePath);
    
    // Update user info to remove image references
    await UserInfoModel.updateUserInfo(userId, {
      profileImagePath: null,
      profileImageName: null,
      profileImageOriginalName: null,
      profileImageSize: null,
      profileImageMimeType: null
    });
    
    res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
    
  } catch (error) {
    console.error('[USER INFO] Error deleting profile image:', error);
    res.status(500).json({ error: error.message });
  }
};

// Serve profile images (optional - for serving images via API)
const serveProfileImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../ecobin/assets/Prof-Image', filename);
    
    console.log('[USER INFO] Serving image:', imagePath);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
      // Set proper headers for image serving
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.sendFile(imagePath);
    } catch (error) {
      console.log('[USER INFO] Image not found:', imagePath);
      res.status(404).json({ error: 'Image not found' });
    }
    
  } catch (error) {
    console.error('[USER INFO] Error serving profile image:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  updateProfileFields,
  updateProfileImageUrl,
  deleteProfileImage,
  serveProfileImage
};
