import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ErrorPopup } from './ErrorPopup';
import { LoginErrorPopup } from './LoginErrorPopup';

export const ErrorPopupDemo: React.FC = () => {
  const [showGenericPopup, setShowGenericPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorType, setLoginErrorType] = useState<'invalid_credentials' | 'network_error' | 'server_error' | 'validation_error' | 'generic'>('invalid_credentials');

  const showLoginErrorPopup = (type: typeof loginErrorType) => {
    setLoginErrorType(type);
    setShowLoginError(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Error Popup Demo</Text>
      <Text style={styles.subtitle}>Tap buttons to see different popup types</Text>

      {/* Generic Error Popup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generic Error Popup</Text>
        <TouchableOpacity
          style={[styles.button, styles.errorButton]}
          onPress={() => setShowGenericPopup(true)}
        >
          <Text style={styles.buttonText}>Show Error Popup</Text>
        </TouchableOpacity>
      </View>

      {/* Success Popup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Success Popup</Text>
        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={() => setShowSuccessPopup(true)}
        >
          <Text style={styles.buttonText}>Show Success Popup</Text>
        </TouchableOpacity>
      </View>

      {/* Warning Popup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warning Popup</Text>
        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={() => setShowWarningPopup(true)}
        >
          <Text style={styles.buttonText}>Show Warning Popup</Text>
        </TouchableOpacity>
      </View>

      {/* Info Popup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info Popup</Text>
        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={() => setShowInfoPopup(true)}
        >
          <Text style={styles.buttonText}>Show Info Popup</Text>
        </TouchableOpacity>
      </View>

      {/* Login Error Popups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Login Error Popups</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.loginErrorButton]}
          onPress={() => showLoginErrorPopup('invalid_credentials')}
        >
          <Text style={styles.buttonText}>Invalid Credentials</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginErrorButton]}
          onPress={() => showLoginErrorPopup('network_error')}
        >
          <Text style={styles.buttonText}>Network Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginErrorButton]}
          onPress={() => showLoginErrorPopup('server_error')}
        >
          <Text style={styles.buttonText}>Server Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginErrorButton]}
          onPress={() => showLoginErrorPopup('validation_error')}
        >
          <Text style={styles.buttonText}>Validation Error</Text>
        </TouchableOpacity>
      </View>

      {/* Popups */}
      <ErrorPopup
        visible={showGenericPopup}
        title="Error"
        message="Something went wrong. Please try again."
        type="error"
        onClose={() => setShowGenericPopup(false)}
        showRetry={true}
        onRetry={() => console.log('Retry pressed')}
      />

      <ErrorPopup
        visible={showSuccessPopup}
        title="Success!"
        message="Your action was completed successfully."
        type="success"
        onClose={() => setShowSuccessPopup(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />

      <ErrorPopup
        visible={showWarningPopup}
        title="Warning"
        message="Please be careful with this action. It cannot be undone."
        type="warning"
        onClose={() => setShowWarningPopup(false)}
        showRetry={true}
        onRetry={() => console.log('Retry pressed')}
      />

      <ErrorPopup
        visible={showInfoPopup}
        title="Information"
        message="This is some helpful information for you."
        type="info"
        onClose={() => setShowInfoPopup(false)}
      />

      <LoginErrorPopup
        visible={showLoginError}
        errorType={loginErrorType}
        onClose={() => setShowLoginError(false)}
        onRetry={() => console.log('Retry login')}
        onForgotPassword={() => console.log('Forgot password')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorButton: {
    backgroundColor: '#FF6B6B',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  loginErrorButton: {
    backgroundColor: '#9C27B0',
  },
});
