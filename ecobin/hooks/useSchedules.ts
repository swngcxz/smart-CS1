import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Schedule {
  id: string;
  date: string;
  area: string;
  type: 'trash_collection' | 'maintenance';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'scheduled';
  staffId?: string;
  staffName?: string;
  time?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  // Server field mappings
  sched_type?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  priority?: string;
  contactPerson?: string;
  notes?: string;
}

export interface TruckSchedule {
  id: string;
  date: string;
  area: string;
  type: 'trash_collection' | 'maintenance';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'scheduled';
  truckId?: string;
  driverName?: string;
  time?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  // Server field mappings
  staffId?: string;
  sched_type?: string;
  location?: string;
  start_collected?: string;
  end_collected?: string;
  priority?: string;
  contactPerson?: string;
  notes?: string;
  truckPlate?: string;
}

// Transform server data to our interface
const transformScheduleData = (serverData: any[], staffData: any[] = []): Schedule[] => {
  console.log('🔍 Transforming schedules with staff data:', {
    scheduleCount: serverData.length,
    staffCount: staffData.length,
    staffIds: staffData.map(s => s.id),
    scheduleStaffIds: serverData.map(s => s.staffId)
  });
  
  return serverData.map(item => {
    // Find staff member by staffId
    const assignedStaff = staffData.find(staff => staff.id === item.staffId);
    const staffName = assignedStaff ? assignedStaff.fullName : 'Unassigned';
    
    console.log(`📋 Schedule ${item.id}: staffId=${item.staffId}, found=${!!assignedStaff}, name=${staffName}`);
    console.log(`📋 Available staff:`, staffData.map(s => ({ id: s.id, name: s.fullName })));
    
    return {
      id: item.id,
      date: item.date,
      area: item.location || 'Unknown Area',
      type: item.sched_type === 'collection' ? 'trash_collection' : 'maintenance',
      status: item.status || 'scheduled',
      staffId: item.staffId,
      staffName: staffName,
      time: item.start_time || 'TBD',
      description: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Keep original server fields
      sched_type: item.sched_type,
      location: item.location,
      start_time: item.start_time,
      end_time: item.end_time,
      priority: item.priority,
      contactPerson: item.contactPerson,
      notes: item.notes,
    };
  });
};

const transformTruckScheduleData = (serverData: any[], staffData: any[] = []): TruckSchedule[] => {
  console.log('🚛 Transforming truck schedules with staff data:', {
    scheduleCount: serverData.length,
    staffCount: staffData.length,
    staffIds: staffData.map(s => s.id),
    scheduleStaffIds: serverData.map(s => s.staffId)
  });
  
  return serverData.map(item => {
    // Find staff member by staffId
    const assignedStaff = staffData.find(staff => staff.id === item.staffId);
    const driverName = assignedStaff ? assignedStaff.fullName : 'Unassigned';
    
    console.log(`🚛 Truck Schedule ${item.id}: staffId=${item.staffId}, found=${!!assignedStaff}, name=${driverName}`);
    console.log(`🚛 Available staff:`, staffData.map(s => ({ id: s.id, name: s.fullName })));
    
    return {
      id: item.id,
      date: item.date,
      area: item.location || 'Unknown Area',
      type: item.sched_type === 'collection' ? 'trash_collection' : 'maintenance',
      status: item.status || 'scheduled',
      truckId: item.truckPlate,
      driverName: driverName,
      time: item.start_collected || 'TBD',
      description: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Keep original server fields
      sched_type: item.sched_type,
      location: item.location,
      start_collected: item.start_collected,
      end_collected: item.end_collected,
      priority: item.priority,
      contactPerson: item.contactPerson,
      notes: item.notes,
      truckPlate: item.truckPlate,
    };
  });
};

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fetch staff data
  const fetchStaffData = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/staff');
      if (response.data) {
        setStaffData(response.data);
        console.log('👥 Staff data loaded:', response.data.length, 'staff members');
      }
    } catch (err: any) {
      console.log('Failed to fetch staff data:', err.message);
    }
  }, []);

  // Fetch schedules from API
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch fresh data from API
      const response = await apiClient.get('/api/schedules');
      
      if (response.data) {
        console.log('📅 Raw schedule data from server:', response.data);
        console.log('📅 Staff data available:', staffData.length, 'staff members');
        
        const transformedData = transformScheduleData(response.data, staffData);
        console.log('📅 Transformed schedules:', transformedData);
        setSchedules(transformedData);
        setLastUpdate(Date.now());
        
        // Cache the data
        await AsyncStorage.setItem('schedules', JSON.stringify(transformedData));
        setError(null);
      }
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  }, [staffData]);

  // Fetch initial data
  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Fetch schedules after staff data is loaded
  useEffect(() => {
    if (staffData.length > 0) {
      fetchSchedules();
    }
  }, [staffData, fetchSchedules]);

  // Re-transform existing schedules when staff data becomes available
  useEffect(() => {
    if (staffData.length > 0 && schedules.length > 0) {
      console.log('🔄 Re-transforming schedules with staff data');
      console.log('🔄 Current schedules:', schedules.length);
      console.log('🔄 Staff data:', staffData.length);
      
      // Re-transform the current schedules with staff data
      const transformedData = transformScheduleData(schedules.map(s => ({
        id: s.id,
        staffId: s.staffId,
        sched_type: s.sched_type,
        location: s.location,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
        date: s.date,
        priority: s.priority,
        contactPerson: s.contactPerson,
        notes: s.notes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      })), staffData);
      
      setSchedules(transformedData);
    }
  }, [staffData, schedules.length]);

  // Set up real-time updates using polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get('/api/schedules');
        
        if (response.data) {
          const transformedData = transformScheduleData(response.data, staffData);
          setSchedules(transformedData);
          setLastUpdate(Date.now());
          
          // Cache the data
          await AsyncStorage.setItem('schedules', JSON.stringify(transformedData));
          setError(null);
        }
      } catch (err: any) {
        // Silently handle network errors to prevent LogBox display
        setError(err.message || 'Failed to fetch real-time schedules');
      }
    }, 30000); // Poll every 30 seconds for schedules

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/schedules');
      if (response.data) {
        const transformedData = transformScheduleData(response.data, staffData);
        setSchedules(transformedData);
        setLastUpdate(Date.now());
        await AsyncStorage.setItem('schedules', JSON.stringify(transformedData));
      }
      setError(null);
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to refresh schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get schedules by type
  const getSchedulesByType = useCallback((type: 'trash_collection' | 'maintenance') => {
    return schedules.filter(schedule => schedule.type === type);
  }, [schedules]);

  // Get schedules by status
  const getSchedulesByStatus = useCallback((status: string) => {
    return schedules.filter(schedule => schedule.status === status);
  }, [schedules]);

  // Get schedules by date
  const getSchedulesByDate = useCallback((date: string) => {
    return schedules.filter(schedule => schedule.date === date);
  }, [schedules]);

  // Get today's schedules
  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === today);
  }, [schedules]);

  // Get upcoming schedules (next 7 days)
  const getUpcomingSchedules = useCallback(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= today && scheduleDate <= nextWeek;
    });
  }, [schedules]);

  return {
    schedules,
    loading,
    error,
    lastUpdate,
    refresh,
    getSchedulesByType,
    getSchedulesByStatus,
    getSchedulesByDate,
    getTodaySchedules,
    getUpcomingSchedules,
  };
}

export function useTruckSchedules() {
  const [truckSchedules, setTruckSchedules] = useState<TruckSchedule[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fetch staff data
  const fetchStaffData = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/staff');
      if (response.data) {
        setStaffData(response.data);
        console.log('👥 Staff data loaded for truck schedules:', response.data.length, 'staff members');
      }
    } catch (err: any) {
      console.log('Failed to fetch staff data:', err.message);
    }
  }, []);

  // Fetch truck schedules from API
  const fetchTruckSchedules = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch fresh data from API
      const response = await apiClient.get('/api/truck-schedules');
      
      if (response.data) {
        console.log('🚛 Raw truck schedule data from server:', response.data);
        console.log('🚛 Staff data available:', staffData.length, 'staff members');
        
        const transformedData = transformTruckScheduleData(response.data, staffData);
        console.log('🚛 Transformed truck schedules:', transformedData);
        setTruckSchedules(transformedData);
        setLastUpdate(Date.now());
        
        // Cache the data
        await AsyncStorage.setItem('truckSchedules', JSON.stringify(transformedData));
        setError(null);
      }
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to fetch truck schedules');
    } finally {
      setLoading(false);
    }
  }, [staffData]);

  // Fetch initial data
  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Fetch truck schedules after staff data is loaded
  useEffect(() => {
    if (staffData.length > 0) {
      fetchTruckSchedules();
    }
  }, [staffData, fetchTruckSchedules]);

  // Re-transform existing truck schedules when staff data becomes available
  useEffect(() => {
    if (staffData.length > 0 && truckSchedules.length > 0) {
      console.log('🔄 Re-transforming truck schedules with staff data');
      console.log('🔄 Current truck schedules:', truckSchedules.length);
      console.log('🔄 Staff data:', staffData.length);
      
      // Re-transform the current truck schedules with staff data
      const transformedData = transformTruckScheduleData(truckSchedules.map(s => ({
        id: s.id,
        staffId: s.staffId,
        sched_type: s.sched_type,
        location: s.location,
        start_collected: s.start_collected,
        end_collected: s.end_collected,
        status: s.status,
        date: s.date,
        priority: s.priority,
        contactPerson: s.contactPerson,
        notes: s.notes,
        truckPlate: s.truckPlate,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      })), staffData);
      
      setTruckSchedules(transformedData);
    }
  }, [staffData, truckSchedules.length]);

  // Set up real-time updates using polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get('/api/truck-schedules');
        
        if (response.data) {
          const transformedData = transformTruckScheduleData(response.data, staffData);
          setTruckSchedules(transformedData);
          setLastUpdate(Date.now());
          
          // Cache the data
          await AsyncStorage.setItem('truckSchedules', JSON.stringify(transformedData));
          setError(null);
        }
      } catch (err: any) {
        // Silently handle network errors to prevent LogBox display
        setError(err.message || 'Failed to fetch real-time truck schedules');
      }
    }, 30000); // Poll every 30 seconds for truck schedules

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/truck-schedules');
      if (response.data) {
        const transformedData = transformTruckScheduleData(response.data, staffData);
        setTruckSchedules(transformedData);
        setLastUpdate(Date.now());
        await AsyncStorage.setItem('truckSchedules', JSON.stringify(transformedData));
      }
      setError(null);
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to refresh truck schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get truck schedules by type
  const getTruckSchedulesByType = useCallback((type: 'trash_collection' | 'maintenance') => {
    return truckSchedules.filter(schedule => schedule.type === type);
  }, [truckSchedules]);

  // Get truck schedules by status
  const getTruckSchedulesByStatus = useCallback((status: string) => {
    return truckSchedules.filter(schedule => schedule.status === status);
  }, [truckSchedules]);

  // Get truck schedules by date
  const getTruckSchedulesByDate = useCallback((date: string) => {
    return truckSchedules.filter(schedule => schedule.date === date);
  }, [truckSchedules]);

  // Get today's truck schedules
  const getTodayTruckSchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return truckSchedules.filter(schedule => schedule.date === today);
  }, [truckSchedules]);

  return {
    truckSchedules,
    loading,
    error,
    lastUpdate,
    refresh,
    getTruckSchedulesByType,
    getTruckSchedulesByStatus,
    getTruckSchedulesByDate,
    getTodayTruckSchedules,
  };
}

// Helper function to format schedule type for display
export function formatScheduleType(type: 'trash_collection' | 'maintenance'): string {
  switch (type) {
    case 'trash_collection':
      return 'Trash Collection';
    case 'maintenance':
      return 'Maintenance';
    default:
      return 'Unknown';
  }
}

// Helper function to get schedule type color
export function getScheduleTypeColor(type: 'trash_collection' | 'maintenance'): string {
  switch (type) {
    case 'trash_collection':
      return '#4caf50'; // Green
    case 'maintenance':
      return '#ff9800'; // Orange
    default:
      return '#666'; // Gray
  }
}

// Helper function to check if a date is in the past
export function isDateInPast(dateString: string): boolean {
  const today = new Date();
  const scheduleDate = new Date(dateString);
  today.setHours(0, 0, 0, 0);
  scheduleDate.setHours(0, 0, 0, 0);
  return scheduleDate < today;
}

// Helper function to get calendar dot color based on date and type
export function getCalendarDotColor(type: 'trash_collection' | 'maintenance', dateString: string): string {
  if (isDateInPast(dateString)) {
    return '#f44336'; // Red for past dates
  }
  return getScheduleTypeColor(type);
}

// Helper function to get status color
export function getScheduleStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#ffc107'; // Yellow
    case 'in_progress':
      return '#2196f3'; // Blue
    case 'completed':
      return '#4caf50'; // Green
    case 'cancelled':
      return '#f44336'; // Red
    default:
      return '#666'; // Gray
  }
}

// Helper function to format date for display
export function formatScheduleDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper function to format time for display
export function formatScheduleTime(timeString?: string): string {
  if (!timeString) return 'TBD';
  
  try {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeString;
  }
}

// Helper function to format time range for display
export function formatScheduleTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return 'TBD';
  
  const formattedStart = formatScheduleTime(startTime);
  const formattedEnd = endTime ? formatScheduleTime(endTime) : '';
  
  if (formattedEnd && formattedEnd !== 'TBD') {
    return `${formattedStart} - ${formattedEnd}`;
  }
  
  return formattedStart;
}
