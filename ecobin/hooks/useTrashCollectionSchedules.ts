import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrashCollectionSchedule {
  id: string;
  date: string;
  area: string;
  type: 'trash_collection';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'scheduled';
  staffId?: string;
  driverName?: string;
  time?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  // Server field mappings
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
const transformTrashCollectionData = (serverData: any[], staffData: any[] = []): TrashCollectionSchedule[] => {
  console.log('🗑️ Transforming trash collection schedules with staff data:', {
    scheduleCount: serverData.length,
    staffCount: staffData.length,
    staffIds: staffData.map(s => s.id),
    scheduleStaffIds: serverData.map(s => s.staffId)
  });
  
  return serverData.map(item => {
    // Find staff member by staffId
    const assignedStaff = staffData.find(staff => staff.id === item.staffId);
    const driverName = assignedStaff ? assignedStaff.fullName : 'Unassigned';
    
    console.log(`🗑️ Trash Collection Schedule ${item.id}: staffId=${item.staffId}, found=${!!assignedStaff}, name=${driverName}`);
    console.log(`🗑️ Available staff:`, staffData.map(s => ({ id: s.id, name: s.fullName })));
    
    return {
      id: item.id,
      date: item.date,
      area: item.location || 'Unknown Area',
      type: 'trash_collection',
      status: item.status || 'scheduled',
      staffId: item.staffId,
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

export function useTrashCollectionSchedules() {
  const [schedules, setSchedules] = useState<TrashCollectionSchedule[]>([]);
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
        console.log('👥 Staff data loaded for trash collection:', response.data.length, 'staff members');
      }
    } catch (err: any) {
      console.log('Failed to fetch staff data:', err.message);
    }
  }, []);

  // Fetch trash collection schedules from API
  const fetchTrashCollectionSchedules = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch fresh data from API
      const response = await apiClient.get('/api/truck-schedules');
      
      if (response.data) {
        console.log('🗑️ Raw trash collection data from server:', response.data);
        console.log('🗑️ Staff data available:', staffData.length, 'staff members');
        
        // Filter only trash collection schedules
        const trashCollectionData = response.data.filter((item: any) => 
          item.sched_type === 'collection'
        );
        
        const transformedData = transformTrashCollectionData(trashCollectionData, staffData);
        console.log('🗑️ Transformed trash collection schedules:', transformedData);
        setSchedules(transformedData);
        setLastUpdate(Date.now());
        
        // Cache the data
        await AsyncStorage.setItem('trashCollectionSchedules', JSON.stringify(transformedData));
        setError(null);
      }
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to fetch trash collection schedules');
    } finally {
      setLoading(false);
    }
  }, [staffData]);

  // Fetch initial data
  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Fetch trash collection schedules after staff data is loaded
  useEffect(() => {
    if (staffData.length > 0) {
      fetchTrashCollectionSchedules();
    }
  }, [staffData, fetchTrashCollectionSchedules]);

  // Re-transform existing trash collection schedules when staff data becomes available
  useEffect(() => {
    if (staffData.length > 0 && schedules.length > 0) {
      console.log('🔄 Re-transforming trash collection schedules with staff data');
      console.log('🔄 Current trash collection schedules:', schedules.length);
      console.log('🔄 Staff data:', staffData.length);
      
      // Re-transform the current schedules with staff data
      const transformedData = transformTrashCollectionData(schedules.map(s => ({
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
      
      setSchedules(transformedData);
    }
  }, [staffData, schedules.length]);

  // Set up real-time updates using polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get('/api/truck-schedules');
        
        if (response.data) {
          // Filter only trash collection schedules
          const trashCollectionData = response.data.filter((item: any) => 
            item.sched_type === 'collection'
          );
          
          const transformedData = transformTrashCollectionData(trashCollectionData, staffData);
          setSchedules(transformedData);
          setLastUpdate(Date.now());
          
          // Cache the data
          await AsyncStorage.setItem('trashCollectionSchedules', JSON.stringify(transformedData));
          setError(null);
        }
      } catch (err: any) {
        // Silently handle network errors to prevent LogBox display
        setError(err.message || 'Failed to fetch real-time trash collection schedules');
      }
    }, 30000); // Poll every 30 seconds for trash collection schedules

    return () => clearInterval(interval);
  }, [staffData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/truck-schedules');
      if (response.data) {
        // Filter only trash collection schedules
        const trashCollectionData = response.data.filter((item: any) => 
          item.sched_type === 'collection'
        );
        
        const transformedData = transformTrashCollectionData(trashCollectionData, staffData);
        setSchedules(transformedData);
        setLastUpdate(Date.now());
        await AsyncStorage.setItem('trashCollectionSchedules', JSON.stringify(transformedData));
      }
      setError(null);
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to refresh trash collection schedules');
    } finally {
      setLoading(false);
    }
  }, [staffData]);

  // Get trash collection schedules by status
  const getSchedulesByStatus = useCallback((status: string) => {
    return schedules.filter(schedule => schedule.status === status);
  }, [schedules]);

  // Get trash collection schedules by date
  const getSchedulesByDate = useCallback((date: string) => {
    return schedules.filter(schedule => schedule.date === date);
  }, [schedules]);

  // Get today's trash collection schedules
  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === today);
  }, [schedules]);

  // Get upcoming trash collection schedules (next 7 days)
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

// Helper function to format trash collection schedule type for display
export function formatTrashCollectionType(): string {
  return 'Trash Collection';
}

// Helper function to get trash collection schedule type color
export function getTrashCollectionTypeColor(): string {
  return '#4caf50'; // Green
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
export function getTrashCollectionCalendarDotColor(dateString: string): string {
  if (isDateInPast(dateString)) {
    return '#f44336'; // Red for past dates
  }
  return getTrashCollectionTypeColor();
}

// Helper function to get status color
export function getTrashCollectionStatusColor(status: string): string {
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
export function formatTrashCollectionDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper function to format time for display
export function formatTrashCollectionTime(timeString?: string): string {
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
export function formatTrashCollectionTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return 'TBD';
  
  const formattedStart = formatTrashCollectionTime(startTime);
  const formattedEnd = endTime ? formatTrashCollectionTime(endTime) : '';
  
  if (formattedEnd && formattedEnd !== 'TBD') {
    return `${formattedStart} - ${formattedEnd}`;
  }
  
  return formattedStart;
}
