import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

interface ErrorPopupProps {
  visible: boolean;
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClose: () => void;
  showRetry?: boolean;
  onRetry?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ErrorPopup: React.FC<ErrorPopupProps> = ({
  visible,
  title,
  message,
  type = 'error',
  onClose,
  showRetry = false,
  onRetry,
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close if enabled
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    onClose();
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          title: title || 'Success!',
        };
      case 'warning':
        return {
          icon: '⚠️',
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          title: title || 'Warning',
        };
      case 'info':
        return {
          icon: 'ℹ️',
          color: '#2196F3',
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          title: title || 'Information',
        };
      default: // error
        return {
          icon: '❌',
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          title: title || 'Error',
        };
    }
  };

  const typeConfig = getTypeConfig();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.popup,
                {
                  backgroundColor: typeConfig.backgroundColor,
                  borderColor: typeConfig.borderColor,
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{typeConfig.icon}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.closeText, { color: typeConfig.color }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={[styles.title, { color: typeConfig.color }]}>
                  {typeConfig.title}
                </Text>
                <Text style={styles.message}>{message}</Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {showRetry && onRetry && (
                  <TouchableOpacity
                    style={[styles.retryButton, { borderColor: typeConfig.color }]}
                    onPress={() => {
                      onRetry();
                      handleClose();
                    }}
                  >
                    <Text style={[styles.retryText, { color: typeConfig.color }]}>
                      Try Again
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.okButton, { backgroundColor: typeConfig.color }]}
                  onPress={handleClose}
                >
                  <Text style={styles.okText}>OK</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popup: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  retryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  okButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  okText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
