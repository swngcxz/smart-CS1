import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotificationBadge } from '../hooks/useNotificationBadge';

interface NotificationErrorHandlerProps {
  janitorId?: string;
  onError?: (error: string) => void;
  showErrorPopup?: boolean;
}

export const NotificationErrorHandler: React.FC<NotificationErrorHandlerProps> = ({
  janitorId,
  onError,
  showErrorPopup = false,
}) => {
  const { error, loading } = useNotificationBadge(janitorId, { auto: true });
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (error && showErrorPopup) {
      setShowPopup(true);
      onError?.(error);
    } else if (error && !showErrorPopup) {
      // Log error but don't show popup
      console.log('📱 Notification Error (handled silently):', error);
    }
  }, [error, showErrorPopup, onError]);

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleRetry = () => {
    setShowPopup(false);
    // The hook will automatically retry
  };

  if (!showPopup) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔔</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Notification Error</Text>
          <Text style={styles.message}>
            Unable to load notifications. This might be because no notifications have been created yet.
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.okButton} onPress={handleClose}>
            <Text style={styles.okText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  content: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  okButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  okText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
