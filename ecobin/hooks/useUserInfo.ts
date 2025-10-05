import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export interface UserInfoData {
  id?: string;
  address?: string;
  profileImagePath?: string;
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
      console.log('👤 Mobile App - Fetching user info...');
      const res = await axiosInstance.get('/api/userinfo');
      console.log('👤 Mobile App - User info response:', res.data);
      
      if (res.data.success && res.data.userInfo) {
        setUserInfo(res.data.userInfo);
      } else {
        setUserInfo(null);
      }
    } catch (err: any) {
      console.error('👤 Mobile App - Failed to fetch user info:', err);
      setError(err.response?.data?.error || 'Failed to fetch user info');
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = async (formData: FormData) => {
    try {
      console.log('👤 Mobile App - Updating user info...');
      const res = await axiosInstance.put('/api/userinfo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.data.success && res.data.userInfo) {
        setUserInfo(res.data.userInfo);
        console.log('👤 Mobile App - User info updated successfully');
        return { success: true, data: res.data.userInfo };
      } else {
        throw new Error('Update failed');
      }
    } catch (err: any) {
      console.error('👤 Mobile App - Failed to update user info:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update user info';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteProfileImage = async () => {
    try {
      console.log('👤 Mobile App - Deleting profile image...');
      const res = await axiosInstance.delete('/api/userinfo/profile-image');
      
      if (res.data.success) {
        // Refresh user info to get updated data
        await fetchUserInfo();
        console.log('👤 Mobile App - Profile image deleted successfully');
        return { success: true };
      } else {
        throw new Error('Delete failed');
      }
    } catch (err: any) {
      console.error('👤 Mobile App - Failed to delete profile image:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete profile image';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getProfileImageUrl = () => {
    if (!userInfo?.profileImagePath) return null;
    
    // Extract filename from the path
    const filename = userInfo.profileImagePath.split('/').pop();
    if (!filename) return null;
    
    // Return the full URL to the image via the API endpoint
    const baseUrl = axiosInstance.defaults.baseURL || 'http://10.0.0.117:8000';
    return `${baseUrl}/api/userinfo/profile-image/${filename}`;
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return {
    userInfo,
    loading,
    error,
    fetchUserInfo,
    updateUserInfo,
    deleteProfileImage,
    getProfileImageUrl,
    setUserInfo
  };
}
