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

interface LoginErrorPopupProps {
  visible: boolean;
  errorType: 'invalid_credentials' | 'network_error' | 'server_error' | 'validation_error' | 'generic';
  onClose: () => void;
  onRetry?: () => void;
  onForgotPassword?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const LoginErrorPopup: React.FC<LoginErrorPopupProps> = ({
  visible,
  errorType,
  onClose,
  onRetry,
  onForgotPassword,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.7,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getErrorConfig = () => {
    switch (errorType) {
      case 'invalid_credentials':
        return {
          icon: '🔐',
          title: 'Login Failed',
          message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
          primaryAction: 'Try Again',
          secondaryAction: 'Forgot Password?',
          showSecondary: true,
          color: '#FF6B6B',
          backgroundColor: '#FFF5F5',
          borderColor: '#FF6B6B',
        };
      case 'network_error':
        return {
          icon: '📡',
          title: 'Connection Problem',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          primaryAction: 'Retry',
          secondaryAction: null,
          showSecondary: false,
          color: '#FF9500',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9500',
        };
      case 'server_error':
        return {
          icon: '⚠️',
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again in a few moments.',
          primaryAction: 'Try Again',
          secondaryAction: null,
          showSecondary: false,
          color: '#FF3B30',
          backgroundColor: '#FFEBEE',
          borderColor: '#FF3B30',
        };
      case 'validation_error':
        return {
          icon: '📝',
          title: 'Invalid Input',
          message: 'Please check your email and password format and try again.',
          primaryAction: 'OK',
          secondaryAction: null,
          showSecondary: false,
          color: '#007AFF',
          backgroundColor: '#E3F2FD',
          borderColor: '#007AFF',
        };
      default:
        return {
          icon: '❌',
          title: 'Login Error',
          message: 'An unexpected error occurred. Please try again.',
          primaryAction: 'Try Again',
          secondaryAction: null,
          showSecondary: false,
          color: '#8E8E93',
          backgroundColor: '#F2F2F7',
          borderColor: '#8E8E93',
        };
    }
  };

  const config = getErrorConfig();

  const handlePrimaryAction = () => {
    if (onRetry) {
      onRetry();
    }
    onClose();
  };

  const handleSecondaryAction = () => {
    if (onForgotPassword) {
      onForgotPassword();
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
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
                  backgroundColor: config.backgroundColor,
                  borderColor: config.borderColor,
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                },
              ]}
            >
              {/* Icon and Close Button */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                  <Text style={styles.icon}>{config.icon}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={[styles.title, { color: config.color }]}>
                  {config.title}
                </Text>
                <Text style={styles.message}>{config.message}</Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {config.showSecondary && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSecondaryAction}
                  >
                    <Text style={[styles.secondaryText, { color: config.color }]}>
                      {config.secondaryAction}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: config.color }]}
                  onPress={handlePrimaryAction}
                >
                  <Text style={styles.primaryText}>{config.primaryAction}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  popup: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#333',
    paddingHorizontal: 8,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
