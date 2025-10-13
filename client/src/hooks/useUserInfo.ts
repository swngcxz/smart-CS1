import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export interface UserInfoData {
  id?: string;
  address?: string;
  bio?: string;
  website?: string;
  phone?: string;
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
      console.log('Web App - Fetching user info...');
      const res = await axios.get('http://localhost:8000/api/userinfo', {
        withCredentials: true // Include cookies for authentication
      });
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
      const res = await axios.patch('http://localhost:8000/api/userinfo/profile-fields', fields, {
        withCredentials: true
      });
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

  const updateUserInfo = async (formData: FormData) => {
    try {
      console.log('Web App - Updating user info with file...');
      const res = await axios.put('http://localhost:8000/api/userinfo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
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
      const res = await axios.delete('http://localhost:8000/api/userinfo/profile-image', {
        withCredentials: true
      });
      
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
    if (!userInfo?.profileImagePath) return null;
    
    // Extract filename from the path
    const filename = userInfo.profileImagePath.split('/').pop();
    if (!filename) return null;
    
    // Return the full URL to the image via the API endpoint
    const baseUrl = axios.defaults.baseURL || window.location.origin;
    return `${baseUrl}/api/userinfo/profile-image/${filename}`;
  }, [userInfo?.profileImagePath]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return {
    userInfo,
    loading,
    error,
    fetchUserInfo,
    updateProfileFields,
    updateUserInfo,
    deleteProfileImage,
    getProfileImageUrl,
    setUserInfo
  };
}
