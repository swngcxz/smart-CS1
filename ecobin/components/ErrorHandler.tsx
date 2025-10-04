import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ErrorHandlerProps {
  error: string | null;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({ 
  error, 
  onDismiss, 
  type = 'error' 
}) => {
  if (!error) return null;

  const getErrorStyle = () => {
    switch (type) {
      case 'warning':
        return styles.warningContainer;
      case 'info':
        return styles.infoContainer;
      default:
        return styles.errorContainer;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'warning':
        return styles.warningText;
      case 'info':
        return styles.infoText;
      default:
        return styles.errorText;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <View style={[styles.container, getErrorStyle()]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={[styles.message, getTextStyle()]}>{error}</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  warningContainer: {
    backgroundColor: '#FFFBF0',
    borderColor: '#FF9500',
    borderWidth: 1,
  },
  infoContainer: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#D70015',
  },
  warningText: {
    color: '#CC5500',
  },
  infoText: {
    color: '#0051D5',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
});
