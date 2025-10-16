import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MaintenanceSchedule {
  id: string;
  date: string;
  area: string;
  type: 'maintenance';
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

// Transform server data to our interface
const transformMaintenanceData = (serverData: any[], staffData: any[] = []): MaintenanceSchedule[] => {
  console.log('🔧 Transforming maintenance schedules with staff data:', {
    scheduleCount: serverData.length,
    staffCount: staffData.length,
    staffIds: staffData.map(s => s.id),
    scheduleStaffIds: serverData.map(s => s.staffId)
  });
  
  return serverData.map(item => {
    // Find staff member by staffId
    const assignedStaff = staffData.find(staff => staff.id === item.staffId);
    const staffName = assignedStaff ? assignedStaff.fullName : 'Unassigned';
    
    console.log(`🔧 Maintenance Schedule ${item.id}: staffId=${item.staffId}, found=${!!assignedStaff}, name=${staffName}`);
    console.log(`🔧 Available staff:`, staffData.map(s => ({ id: s.id, name: s.fullName })));
    
    return {
      id: item.id,
      date: item.date,
      area: item.location || 'Unknown Area',
      type: 'maintenance',
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

export function useMaintenanceSchedules() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
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
        console.log('👥 Staff data loaded for maintenance:', response.data.length, 'staff members');
      }
    } catch (err: any) {
      console.log('Failed to fetch staff data:', err.message);
    }
  }, []);

  // Fetch maintenance schedules from API
  const fetchMaintenanceSchedules = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch fresh data from API
      const response = await apiClient.get('/api/schedules');
      
      if (response.data) {
        console.log('🔧 Raw maintenance data from server:', response.data);
        console.log('🔧 Staff data available:', staffData.length, 'staff members');
        
        // Filter only maintenance schedules
        const maintenanceData = response.data.filter((item: any) => 
          item.sched_type === 'maintenance'
        );
        
        const transformedData = transformMaintenanceData(maintenanceData, staffData);
        console.log('🔧 Transformed maintenance schedules:', transformedData);
        setSchedules(transformedData);
        setLastUpdate(Date.now());
        
        // Cache the data
        await AsyncStorage.setItem('maintenanceSchedules', JSON.stringify(transformedData));
        setError(null);
      }
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to fetch maintenance schedules');
    } finally {
      setLoading(false);
    }
  }, [staffData]);

  // Fetch initial data
  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Fetch maintenance schedules after staff data is loaded
  useEffect(() => {
    if (staffData.length > 0) {
      fetchMaintenanceSchedules();
    }
  }, [staffData, fetchMaintenanceSchedules]);

  // Re-transform existing maintenance schedules when staff data becomes available
  useEffect(() => {
    if (staffData.length > 0 && schedules.length > 0) {
      console.log('🔄 Re-transforming maintenance schedules with staff data');
      console.log('🔄 Current maintenance schedules:', schedules.length);
      console.log('🔄 Staff data:', staffData.length);
      
      // Re-transform the current schedules with staff data
      const transformedData = transformMaintenanceData(schedules.map(s => ({
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
          // Filter only maintenance schedules
          const maintenanceData = response.data.filter((item: any) => 
            item.sched_type === 'maintenance'
          );
          
          const transformedData = transformMaintenanceData(maintenanceData, staffData);
          setSchedules(transformedData);
          setLastUpdate(Date.now());
          
          // Cache the data
          await AsyncStorage.setItem('maintenanceSchedules', JSON.stringify(transformedData));
          setError(null);
        }
      } catch (err: any) {
        // Silently handle network errors to prevent LogBox display
        setError(err.message || 'Failed to fetch real-time maintenance schedules');
      }
    }, 30000); // Poll every 30 seconds for maintenance schedules

    return () => clearInterval(interval);
  }, [staffData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/schedules');
      if (response.data) {
        // Filter only maintenance schedules
        const maintenanceData = response.data.filter((item: any) => 
          item.sched_type === 'maintenance'
        );
        
        const transformedData = transformMaintenanceData(maintenanceData, staffData);
        setSchedules(transformedData);
        setLastUpdate(Date.now());
        await AsyncStorage.setItem('maintenanceSchedules', JSON.stringify(transformedData));
      }
      setError(null);
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to refresh maintenance schedules');
    } finally {
      setLoading(false);
    }
  }, [staffData]);

  // Get maintenance schedules by status
  const getSchedulesByStatus = useCallback((status: string) => {
    return schedules.filter(schedule => schedule.status === status);
  }, [schedules]);

  // Get maintenance schedules by date
  const getSchedulesByDate = useCallback((date: string) => {
    return schedules.filter(schedule => schedule.date === date);
  }, [schedules]);

  // Get today's maintenance schedules
  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === today);
  }, [schedules]);

  // Get upcoming maintenance schedules (next 7 days)
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
    getSchedulesByStatus,
    getSchedulesByDate,
    getTodaySchedules,
    getUpcomingSchedules,
  };
}

// Helper function to format maintenance schedule type for display
export function formatMaintenanceType(): string {
  return 'Maintenance';
}

// Helper function to get maintenance schedule type color
export function getMaintenanceTypeColor(): string {
  return '#ff9800'; // Orange
}

// Helper function to check if a date is in the past
export function isDateInPast(dateString: string): boolean {
  const today = new Date();
  const scheduleDate = new Date(dateString);
  today.setHours(0, 0, 0, 0);
  scheduleDate.setHours(0, 0, 0, 0);
  return scheduleDate < today;
}

// Helper function to get calendar dot color based on date
export function getMaintenanceCalendarDotColor(dateString: string): string {
  if (isDateInPast(dateString)) {
    return '#f44336'; // Red for past dates
  }
  return getMaintenanceTypeColor();
}

// Helper function to get status color
export function getMaintenanceStatusColor(status: string): string {
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
export function formatMaintenanceDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper function to format time for display
export function formatMaintenanceTime(timeString?: string): string {
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
export function formatMaintenanceTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return 'TBD';
  
  const formattedStart = formatMaintenanceTime(startTime);
  const formattedEnd = endTime ? formatMaintenanceTime(endTime) : '';
  
  if (formattedEnd && formattedEnd !== 'TBD') {
    return `${formattedStart} - ${formattedEnd}`;
  }
  
  return formattedStart;
}
