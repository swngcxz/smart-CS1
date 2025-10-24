import { useEffect, useCallback } from 'react';
import { ActivityLog } from './useActivityLogsApi';

interface AutomaticTaskListenerProps {
  onNewAutomaticTask?: (task: ActivityLog) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<ActivityLog>) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function useAutomaticTaskListener({
  onNewAutomaticTask,
  onTaskUpdate,
  onTaskDeleted
}: AutomaticTaskListenerProps) {
  
  // Listen for automatic task events
  const handleAutomaticTaskEvent = useCallback((event: CustomEvent) => {
    const { type, data } = event.detail || {};
    
    switch (type) {
      case 'AUTOMATIC_TASK_CREATED':
        console.log('🎯 Automatic task created event received:', data);
        onNewAutomaticTask?.(data);
        break;
        
      case 'TASK_UPDATED':
        console.log('🔄 Task updated event received:', data);
        onTaskUpdate?.(data.taskId, data.updates);
        break;
        
      case 'TASK_DELETED':
        console.log('🗑️ Task deleted event received:', data);
        onTaskDeleted?.(data.taskId);
        break;
        
      default:
        console.log('📡 Unknown event type:', type);
    }
  }, [onNewAutomaticTask, onTaskUpdate, onTaskDeleted]);

  useEffect(() => {
    // Listen for custom events
    window.addEventListener('automaticTaskEvent', handleAutomaticTaskEvent as EventListener);
    
    return () => {
      window.removeEventListener('automaticTaskEvent', handleAutomaticTaskEvent as EventListener);
    };
  }, [handleAutomaticTaskEvent]);

  // Function to emit automatic task events
  const emitAutomaticTaskEvent = useCallback((type: string, data: any) => {
    const event = new CustomEvent('automaticTaskEvent', {
      detail: { type, data }
    });
    window.dispatchEvent(event);
  }, []);

  return {
    emitAutomaticTaskEvent
  };
}
