// utils/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Create directory if it doesn't exist
      const uploadPath = path.join(__dirname, '../../ecobin/assets/Prof-Image');
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('profileImage');

// Helper function to get relative path for database storage
const getRelativePath = (fullPath) => {
  const normalizedPath = path.normalize(fullPath);
  const relativePath = normalizedPath.replace(/\\/g, '/');
  
  // Extract the path from ecobin/assets/Prof-Image onwards
  const assetsIndex = relativePath.indexOf('ecobin/assets/Prof-Image');
  if (assetsIndex !== -1) {
    return relativePath.substring(assetsIndex);
  }
  
  return relativePath;
};

// Helper function to delete file
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../../', filePath);
    await fs.unlink(fullPath);
    console.log(`File deleted: ${fullPath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

// Helper function to check if file exists
const fileExists = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../../', filePath);
    await fs.access(fullPath);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  uploadSingle,
  getRelativePath,
  deleteFile,
  fileExists,
  upload // Export the main upload instance for other uses
};
