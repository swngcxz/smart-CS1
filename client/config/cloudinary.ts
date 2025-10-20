// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: 'dwdy3ygzx',
  uploadPreset: 'react_native_upload', // You need to create this unsigned preset in your Cloudinary dashboard
  uploadUrl: 'https://api.cloudinary.com/v1_1/dwdy3ygzx/image/upload',
};

// Instructions for setting up the upload preset:
// 1. Go to Cloudinary Dashboard → Settings → Upload
// 2. Scroll down to "Upload presets"
// 3. Click "Add upload preset"
// 4. Set:
//    - Preset name: react_native_upload
//    - Signing Mode: Unsigned
//    - Folder: mobile_uploads (optional)
// 5. Save the preset
