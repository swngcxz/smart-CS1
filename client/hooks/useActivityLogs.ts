import { useState, useEffect } from 'react';

export interface ActivityLog {
  id: string;
  timestamp: string;
  activity_type: string;
  status?: string;
  priority?: string;
  bin_id?: string;
  bin_location?: string;
  task_note?: string;
  assigned_janitor_name?: string;
  bin_level?: number;
  bin_status?: string;
  status_notes?: string;
  display_status?: string;
  display_priority?: string;
  formatted_date?: string;
  formatted_time?: string;
}

export interface UseActivityLogsReturn {
  logs: ActivityLog[];
  user: any;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useActivityLogs(userId: string): UseActivityLogsReturn {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data for demonstration
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          activity_type: 'Bin Emptied',
          status: 'Completed',
          priority: 'Medium',
          bin_id: 'BIN-001',
          bin_location: 'Main Entrance',
          task_note: 'Regular scheduled emptying',
          assigned_janitor_name: 'John Doe',
          bin_level: 15,
          bin_status: 'Operational',
          display_status: 'Completed',
          display_priority: 'Medium'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          activity_type: 'Maintenance',
          status: 'In Progress',
          priority: 'High',
          bin_id: 'BIN-002',
          bin_location: 'Parking Lot A',
          task_note: 'Fixing damaged lid',
          assigned_janitor_name: 'Jane Smith',
          bin_level: 80,
          bin_status: 'Needs Repair',
          display_status: 'In Progress',
          display_priority: 'High'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          activity_type: 'Task Assignment',
          status: 'Pending',
          priority: 'Low',
          bin_id: 'BIN-003',
          bin_location: 'Building B - Floor 2',
          task_note: 'Check bin capacity levels',
          assigned_janitor_name: 'Mike Johnson',
          bin_level: 45,
          bin_status: 'Operational',
          display_status: 'Pending',
          display_priority: 'Low'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          activity_type: 'Bin Alert',
          status: 'Completed',
          priority: 'Urgent',
          bin_id: 'BIN-004',
          bin_location: 'Cafeteria Area',
          task_note: 'Bin overflow alert resolved',
          assigned_janitor_name: 'Sarah Wilson',
          bin_level: 10,
          bin_status: 'Operational',
          display_status: 'Completed',
          display_priority: 'Urgent'
        }
      ];
      
      setLogs(mockLogs);
    } catch (err) {
      setError('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  return {
    logs,
    user,
    loading,
    error,
    refetch: fetchLogs
  };
}