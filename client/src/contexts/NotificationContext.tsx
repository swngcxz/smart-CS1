import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationToast, Notification, useNotification } from '@/components/NotificationToast';

interface NotificationContextType {
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showTaskCreated: (binId: string, binLevel: number) => void;
  showTaskClaimed: (taskId: string, janitorName: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { notification, showSuccess, showError, showInfo, showWarning, hideNotification } = useNotification();

  const showTaskCreated = (binId: string, binLevel: number) => {
    showSuccess(
      'Task Assignment Created',
      `Automatic task created for ${binId} at ${binLevel}% level. Ready for assignment.`,
      6000
    );
  };

  const showTaskClaimed = (taskId: string, janitorName: string) => {
    showInfo(
      'Task Claimed',
      `${janitorName} has claimed task ${taskId.substring(0, 8)}...`,
      4000
    );
  };

  const value: NotificationContextType = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showTaskCreated,
    showTaskClaimed,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast notification={notification} onClose={hideNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
