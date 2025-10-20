import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

export interface UserInfoData {
  id?: string;
  address?: string;
  bio?: string;
  website?: string;
  phone?: string;
  profileImagePath?: string;
  // If storing a full Cloudinary URL instead of a server path
  profileImageUrl?: string;
  profileImageName?: string;
  profileImageOriginalName?: string;
  profileImageSize?: number;
  profileImageMimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useUserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Web App - Fetching user info...');
      const res = await api.get('/api/userinfo');
      console.log('Web App - User info response:', res.data);
      
      if (res.data.success && res.data.userInfo) {
        setUserInfo(res.data.userInfo);
      } else {
        setUserInfo(null);
      }
    } catch (err: any) {
      console.error('Web App - Failed to fetch user info:', err);
      setError(err.response?.data?.error || 'Failed to fetch user info');
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileFields = async (fields: { bio?: string; website?: string; location?: string; phone?: string }) => {
    try {
      console.log('Web App - Updating profile fields...', fields);
      const res = await api.patch('/api/userinfo/profile-fields', fields);
      console.log('Web App - API Response:', res.data);
      
      if (res.data.success && res.data.userInfo) {
        setUserInfo(res.data.userInfo);
        console.log('Web App - Profile fields updated successfully');
        return { success: true, data: res.data.userInfo };
      } else {
        throw new Error('Update failed');
      }
    } catch (err: any) {
      console.error('Web App - Failed to update profile fields:', err);
      console.error('Web App - Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update profile fields';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Save only the Cloudinary URL (no file upload). Backend should persist URL in userinfo.
  const updateProfileImageUrl = async (imageUrl: string) => {
    try {
      console.log('Web App - Updating profile image URL...', imageUrl);
      const res = await api.patch('/api/userinfo/profile-image-url', { profileImageUrl: imageUrl });

      if (res.data.success && res.data.userInfo) {
        setUserInfo(res.data.userInfo);
        console.log('Web App - Profile image URL updated successfully');
        return { success: true, data: res.data.userInfo };
      } else {
        throw new Error('Update failed');
      }
    } catch (err: any) {
      console.error('Web App - Failed to update profile image URL:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update profile image URL';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUserInfo = async (formData: FormData) => {
    try {
      console.log('Web App - Updating user info with file...');
      const res = await api.put('/api/userinfo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (res.data.success && res.data.userInfo) {
        setUserInfo(res.data.userInfo);
        console.log('Web App - User info updated successfully');
        return { success: true, data: res.data.userInfo };
      } else {
        throw new Error('Update failed');
      }
    } catch (err: any) {
      console.error('Web App - Failed to update user info:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update user info';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteProfileImage = async () => {
    try {
      console.log('Web App - Deleting profile image...');
      const res = await api.delete('/api/userinfo/profile-image');
      
      if (res.data.success) {
        // Refresh user info to get updated data
        await fetchUserInfo();
        console.log('Web App - Profile image deleted successfully');
        return { success: true };
      } else {
        throw new Error('Delete failed');
      }
    } catch (err: any) {
      console.error('Web App - Failed to delete profile image:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete profile image';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getProfileImageUrl = useCallback(() => {
    // Prefer explicit URL if present (e.g., Cloudinary)
    if (userInfo?.profileImageUrl) return userInfo.profileImageUrl;

    // Backward compatibility: stored server path
    if (!userInfo?.profileImagePath) return null;
    // If already an absolute URL, return as is
    if (/^https?:\/\//i.test(userInfo.profileImagePath)) return userInfo.profileImagePath;

    // Otherwise construct API URL for server-hosted file
    const filename = userInfo.profileImagePath.split('/').pop();
    if (!filename) return null;
    const baseUrl = api.defaults.baseURL || window.location.origin;
    return `${baseUrl}/api/userinfo/profile-image/${filename}`;
  }, [userInfo?.profileImagePath, userInfo?.profileImageUrl]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return {
    userInfo,
    loading,
    error,
    fetchUserInfo,
    updateProfileFields,
    updateProfileImageUrl,
    updateUserInfo,
    deleteProfileImage,
    getProfileImageUrl,
    setUserInfo
  };
}
