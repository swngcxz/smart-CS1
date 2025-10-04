import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LoginErrorPopup } from './LoginErrorPopup';

export const TestLoginPopup: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [errorType, setErrorType] = useState<'invalid_credentials' | 'network_error' | 'server_error' | 'validation_error' | 'generic'>('invalid_credentials');

  const showErrorPopup = (type: typeof errorType) => {
    setErrorType(type);
    setShowPopup(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Login Error Popup</Text>
      
      <TouchableOpacity
        style={[styles.button, styles.errorButton]}
        onPress={() => showErrorPopup('invalid_credentials')}
      >
        <Text style={styles.buttonText}>Test Invalid Credentials</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.warningButton]}
        onPress={() => showErrorPopup('network_error')}
      >
        <Text style={styles.buttonText}>Test Network Error</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.infoButton]}
        onPress={() => showErrorPopup('server_error')}
      >
        <Text style={styles.buttonText}>Test Server Error</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.successButton]}
        onPress={() => showErrorPopup('validation_error')}
      >
        <Text style={styles.buttonText}>Test Validation Error</Text>
      </TouchableOpacity>

      <LoginErrorPopup
        visible={showPopup}
        errorType={errorType}
        onClose={() => setShowPopup(false)}
        onRetry={() => {
          console.log('Retry pressed');
          setShowPopup(false);
        }}
        onForgotPassword={() => {
          console.log('Forgot password pressed');
          setShowPopup(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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
  warningButton: {
    backgroundColor: '#FF9800',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
});
