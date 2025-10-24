import apiClient from './apiConfig';

// Types for API responses (you can expand these based on your server models)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Bin {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'empty' | 'half-full' | 'full' | 'critical';
  lastPickup?: string;
}

export interface Activity {
  id: string;
  binId: string;
  staffId: string;
  type: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string; redirectTo: string }>> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  signup: async (userData: {
    fullName: string;
    email: string;
    password: string;
    address?: string;
    role?: string;
    phone?: string;
  }): Promise<ApiResponse<{ message: string; redirectTo: string }>> => {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/signout');
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateCurrentUser: async (updates: Partial<User>): Promise<ApiResponse> => {
    const response = await apiClient.patch('/auth/me', updates);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/request-password-reset', { email });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// Bins API
export const binsAPI = {
  getAll: async (): Promise<ApiResponse<Bin[]>> => {
    const response = await apiClient.get('/api/bins');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Bin>> => {
    const response = await apiClient.get(`/api/bins/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<Bin>> => {
    const response = await apiClient.put(`/api/bins/${id}/status`, { status });
    return response.data;
  },

  getNearby: async (latitude: number, longitude: number, radius: number = 1000): Promise<ApiResponse<Bin[]>> => {
    const response = await apiClient.get(`/api/bins/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
    return response.data;
  },
};

// Activities API
export const activitiesAPI = {
  getAll: async (): Promise<ApiResponse<Activity[]>> => {
    const response = await apiClient.get('/api/activities');
    return response.data;
  },

  getByStaff: async (staffId: string): Promise<ApiResponse<Activity[]>> => {
    const response = await apiClient.get(`/api/activities/staff/${staffId}`);
    return response.data;
  },

  create: async (activityData: {
    binId: string;
    type: string;
    location?: { latitude: number; longitude: number };
  }): Promise<ApiResponse<Activity>> => {
    const response = await apiClient.post('/api/activities', activityData);
    return response.data;
  },

  update: async (id: string, updates: Partial<Activity>): Promise<ApiResponse<Activity>> => {
    const response = await apiClient.put(`/api/activities/${id}`, updates);
    return response.data;
  },
};

// Schedules API
export const schedulesAPI = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/api/schedules');
    return response.data;
  },

  getByStaff: async (staffId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/api/schedules/staff/${staffId}`);
    return response.data;
  },

  create: async (scheduleData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/api/schedules', scheduleData);
    return response.data;
  },

  update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/api/schedules/${id}`, updates);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/api/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse> => {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/api/analytics/dashboard');
    return response.data;
  },

  getPerformance: async (period: string = 'week'): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/api/analytics/performance?period=${period}`);
    return response.data;
  },
};

// Waste Management API
export const wasteAPI = {
  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/api/waste/stats');
    return response.data;
  },

  getHistory: async (binId?: string): Promise<ApiResponse<any[]>> => {
    const url = binId ? `/api/waste/history?binId=${binId}` : '/api/waste/history';
    const response = await apiClient.get(url);
    return response.data;
  },
};

// User Info API
export const userInfoAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  },

  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/api/user/profile', updates);
    return response.data;
  },
};

// Combined API object for easy importing
export const API = {
  auth: authAPI,
  bins: binsAPI,
  activities: activitiesAPI,
  schedules: schedulesAPI,
  notifications: notificationsAPI,
  analytics: analyticsAPI,
  waste: wasteAPI,
  userInfo: userInfoAPI,
};

export default API;
