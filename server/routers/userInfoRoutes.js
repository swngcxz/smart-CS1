// routers/userInfoRoutes.js
const express = require('express');
const router = express.Router();
const userInfoController = require('../controllers/userInfoController');

// Get user info
router.get('/userinfo', userInfoController.getUserInfo);

// Update user info (with file upload)
router.put('/userinfo', userInfoController.updateUserInfo);

// Update profile fields only (no file upload)
router.patch('/userinfo/profile-fields', userInfoController.updateProfileFields);

// Update profile image URL (for Cloudinary URLs)
router.patch('/userinfo/profile-image-url', userInfoController.updateProfileImageUrl);

// Delete profile image
router.delete('/userinfo/profile-image', userInfoController.deleteProfileImage);

// Serve profile images (optional)
router.get('/userinfo/profile-image/:filename', userInfoController.serveProfileImage);

module.exports = router;
