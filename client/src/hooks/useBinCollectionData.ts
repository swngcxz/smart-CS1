import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface BinCollectionData {
  binId: string;
  capacity: string; // Always "3KG" as per requirement
  wasteType: string; // Always "Mixed" as per requirement
  lastCollected: string; // Date from activity logs with status "done"
  nextCollection: string; // Collection date if assigned, "None" if not assigned
  lastCollectedDate?: Date;
  nextCollectionDate?: Date;
  hasAssignedTask: boolean;
  assignedTaskId?: string;
  assignedTaskDate?: Date;
}

export interface ActivityLog {
  id: string;
  bin_id: string;
  bin_location: string;
  bin_status: string;
  bin_level: number;
  assigned_janitor_id?: string;
  assigned_janitor_name?: string;
  task_note?: string;
  activity_type: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: string;
  timestamp: string;
  date: string;
  time: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  collection_time?: string;
  source?: string;
  available_for_acceptance?: boolean;
  created_by?: string;
  acceptance_deadline?: string;
}

export function useBinCollectionData(binId: string) {
  const [collectionData, setCollectionData] = useState<BinCollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch activity logs for this bin
        const response = await api.get(`/api/activity-logs/bin/${binId}`);
        
        if (response.data?.success && response.data?.logs) {
          const logs: ActivityLog[] = response.data.logs;
          
          // Find the most recent completed collection (status = 'done')
          const completedCollections = logs
            .filter(log => log.status === 'done' && log.bin_id === binId)
            .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime());

          // Find any assigned/pending tasks for this bin
          const assignedTasks = logs
            .filter(log => 
              log.bin_id === binId && 
              (log.status === 'pending' || log.status === 'in_progress') &&
              (log.assigned_janitor_id || log.available_for_acceptance)
            )
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          // Get the most recent completed collection
          const lastCompleted = completedCollections[0];
          const nextAssigned = assignedTasks[0];

          // Format last collected date
          let lastCollected = "Never collected";
          let lastCollectedDate: Date | undefined;
          
          if (lastCompleted) {
            const completedDate = new Date(lastCompleted.completed_at || lastCompleted.updated_at);
            lastCollectedDate = completedDate;
            lastCollected = formatTimeAgo(completedDate);
          }

          // Format next collection
          let nextCollection = "None";
          let nextCollectionDate: Date | undefined;
          let hasAssignedTask = false;
          let assignedTaskId: string | undefined;
          let assignedTaskDate: Date | undefined;

          if (nextAssigned) {
            hasAssignedTask = true;
            assignedTaskId = nextAssigned.id;
            assignedTaskDate = new Date(nextAssigned.created_at);
            nextCollectionDate = assignedTaskDate;
            
            // Format the assigned date
            nextCollection = formatCollectionDate(assignedTaskDate);
          }

          const binCollectionData: BinCollectionData = {
            binId,
            capacity: "3KG", // Always 3KG as per requirement
            wasteType: "Mixed", // Always Mixed as per requirement
            lastCollected,
            nextCollection,
            lastCollectedDate,
            nextCollectionDate,
            hasAssignedTask,
            assignedTaskId,
            assignedTaskDate
          };

          setCollectionData(binCollectionData);
        } else {
          // No data found, set default values
          setCollectionData({
            binId,
            capacity: "3KG",
            wasteType: "Mixed",
            lastCollected: "Never collected",
            nextCollection: "None",
            hasAssignedTask: false
          });
        }
      } catch (err: any) {
        console.error('Error fetching bin collection data:', err);
        setError(err.message || 'Failed to fetch collection data');
        
        // Set default values on error
        setCollectionData({
          binId,
          capacity: "3KG",
          wasteType: "Mixed",
          lastCollected: "Unknown",
          nextCollection: "None",
          hasAssignedTask: false
        });
      } finally {
        setLoading(false);
      }
    };

    if (binId) {
      fetchCollectionData();
    }
  }, [binId]);

  return { collectionData, loading, error };
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

// Helper function to format collection date
function formatCollectionDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const collectionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (collectionDate.getTime() === today.getTime()) {
    return `Today ${date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  } else if (collectionDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
