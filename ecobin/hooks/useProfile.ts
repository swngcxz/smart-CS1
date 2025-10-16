import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import apiClient from '@/utils/apiConfig';

export interface UserProfile {
  // From users table
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  contactNumber?: string;
  phone?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActivity?: string;
  
  // From userInfo table
  address?: string;
  profileImagePath?: string;
  profileImageName?: string;
  profileImageOriginalName?: string;
  profileImageMimeType?: string;
  profileImageSize?: number;
}

export function useProfile() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    console.log('[useProfile] fetchProfile called, isAuthenticated:', isAuthenticated, 'authUser:', authUser);
    
    if (!isAuthenticated || !authUser) {
      console.log('[useProfile] Not authenticated or no auth user, setting loading to false');
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get complete profile data from userInfo endpoint
      try {
        console.log('[useProfile] Trying /api/user/profile endpoint');
        const response = await apiClient.get('/api/user/profile');
        console.log('[useProfile] Profile response:', response.data);
        if (response.data && response.data.success) {
          console.log('[useProfile] Profile data loaded successfully:', response.data.data);
          setProfile(response.data.data);
          setLoading(false);
          return;
        }
      } catch (profileError: any) {
        console.log('[useProfile] Profile endpoint not available:', profileError.message);
      }

      // Fallback: Use auth user data and try to get additional info
      console.log('[useProfile] Creating base profile from auth user data');
      const baseProfile: UserProfile = {
        id: authUser.id || authUser._id || 'unknown',
        email: authUser.email || 'unknown@example.com',
        fullName: authUser.fullName || authUser.name || 'Unknown User',
        role: authUser.role || 'janitor',
        status: authUser.status || 'active',
        emailVerified: authUser.emailVerified || false,
        contactNumber: authUser.contactNumber || authUser.phone,
        phone: authUser.phone || authUser.contactNumber,
        location: authUser.location,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
        lastActivity: authUser.lastActivity,
        address: authUser.address,
      };
      console.log('[useProfile] Base profile created:', baseProfile);

      // Try to get userInfo data separately
      try {
        const userId = authUser.id || authUser._id;
        if (userId) {
          const userInfoResponse = await apiClient.get('/api/userinfo');
          console.log('[useProfile] UserInfo response:', userInfoResponse.data);
          if (userInfoResponse.data && userInfoResponse.data.success) {
            const userInfo = userInfoResponse.data.userInfo;
            console.log('[useProfile] UserInfo data received:', userInfo);
            setProfile({
              ...baseProfile,
              address: userInfo.address || baseProfile.address,
              profileImagePath: userInfo.profileImagePath,
              profileImageName: userInfo.profileImageName,
              profileImageOriginalName: userInfo.profileImageOriginalName,
              profileImageMimeType: userInfo.profileImageMimeType,
              profileImageSize: userInfo.profileImageSize,
            });
          } else {
            setProfile(baseProfile);
          }
        } else {
          setProfile(baseProfile);
        }
      } catch (userInfoError) {
        console.log('UserInfo not available, using base profile');
        setProfile(baseProfile);
      }

    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
      
      // Even if there's an error, show basic auth user data
      if (authUser) {
        setProfile({
          id: authUser.id || authUser._id || 'unknown',
          email: authUser.email || 'unknown@example.com',
          fullName: authUser.fullName || authUser.name || 'Unknown User',
          role: authUser.role || 'janitor',
          status: authUser.status || 'active',
          emailVerified: authUser.emailVerified || false,
          contactNumber: authUser.contactNumber || authUser.phone,
          phone: authUser.phone || authUser.contactNumber,
          location: authUser.location,
          createdAt: authUser.createdAt,
          updatedAt: authUser.updatedAt,
          lastActivity: authUser.lastActivity,
          address: authUser.address,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refreshProfile = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Helper function to get profile image URL
  const getProfileImageUrl = useCallback(() => {
    if (profile?.profileImagePath) {
      // If it's a full URL, return as is
      if (profile.profileImagePath.startsWith('http')) {
        return profile.profileImagePath;
      }
      // If it's a path, construct the full URL
      return `${apiClient.defaults.baseURL}/${profile.profileImagePath}`;
    }
    return null;
  }, [profile?.profileImagePath]);

  // Helper function to format join date
  const getFormattedJoinDate = useCallback(() => {
    if (profile?.createdAt) {
      const date = new Date(profile.createdAt);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    }
    return 'Unknown';
  }, [profile?.createdAt]);

  // Helper function to get user initials
  const getUserInitials = useCallback(() => {
    if (profile?.fullName) {
      return profile.fullName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    return 'U';
  }, [profile?.fullName]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    getProfileImageUrl,
    getFormattedJoinDate,
    getUserInitials,
  };
}
