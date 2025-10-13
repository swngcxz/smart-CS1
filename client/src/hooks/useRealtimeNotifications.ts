import { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useActivityLogsApi } from './useActivityLogsApi';

export function useRealtimeNotifications() {
  const { showTaskCreated, showTaskClaimed } = useNotifications();
  const { logs } = useActivityLogsApi();
  const previousLogsRef = useRef<any[]>([]);
  const lastCheckRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!logs || logs.length === 0) {
      previousLogsRef.current = [];
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - lastCheckRef.current;
    
    // Only check for new tasks if enough time has passed (avoid spam)
    if (timeSinceLastCheck < 2000) {
      return;
    }

    const previousLogs = previousLogsRef.current;
    
    // Find new automatic tasks created since last check
    const newAutomaticTasks = logs.filter(currentLog => {
      // Check if it's a new automatic task
      const isNewTask = !previousLogs.find(prevLog => prevLog.id === currentLog.id);
      const isAutomaticTask = currentLog.source === 'automatic_monitoring' && 
                             currentLog.activity_type === 'task_assignment' &&
                             currentLog.status === 'pending';
      
      return isNewTask && isAutomaticTask;
    });

    // Find tasks that were just claimed
    const claimedTasks = logs.filter(currentLog => {
      const previousLog = previousLogs.find(prevLog => prevLog.id === currentLog.id);
      
      if (!previousLog) return false;
      
      // Check if status changed from pending to in_progress and janitor was assigned
      const wasPending = previousLog.status === 'pending' && !previousLog.assigned_janitor_name;
      const isNowInProgress = currentLog.status === 'in_progress' && currentLog.assigned_janitor_name;
      
      return wasPending && isNowInProgress;
    });

    // Show notifications for new automatic tasks
    newAutomaticTasks.forEach(task => {
      console.log('New automatic task detected:', task);
      showTaskCreated(task.bin_id || 'Unknown Bin', task.bin_level || 0);
    });

    // Show notifications for claimed tasks
    claimedTasks.forEach(task => {
      console.log('Task claimed:', task);
      showTaskClaimed(task.id, task.assigned_janitor_name || 'Unknown Janitor');
    });

    // Update refs
    previousLogsRef.current = [...logs];
    lastCheckRef.current = currentTime;

  }, [logs, showTaskCreated, showTaskClaimed]);

  return {
    // Expose any additional functionality if needed
  };
}
