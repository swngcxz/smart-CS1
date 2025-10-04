import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { LoginErrorPopup } from './LoginErrorPopup';

interface LoginFormWithPopupProps {
  onLoginSuccess?: (userData: any) => void;
}

export const LoginFormWithPopup: React.FC<LoginFormWithPopupProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorType, setErrorType] = useState<'invalid_credentials' | 'network_error' | 'server_error' | 'validation_error' | 'generic'>('generic');
  
  const { 
    login, 
    loading, 
    error, 
    validationErrors, 
    clearError, 
    clearValidationErrors 
  } = useAuth();

  const handleLogin = async () => {
    // Clear previous errors
    clearError();
    clearValidationErrors();

    const result = await login(email, password);
    
    if (result) {
      // Login successful
      Alert.alert(
        'Welcome Back! 🎉', 
        'You have successfully logged in.',
        [
          { 
            text: 'Continue', 
            onPress: () => onLoginSuccess?.(result) 
          }
        ]
      );
    } else {
      // Determine error type and show popup
      const errorType = determineErrorType();
      setErrorType(errorType);
      setShowErrorPopup(true);
    }
  };

  const determineErrorType = (): 'invalid_credentials' | 'network_error' | 'server_error' | 'validation_error' | 'generic' => {
    // Check validation errors first
    if (validationErrors.email || validationErrors.password) {
      return 'validation_error';
    }

    // Check general error message
    if (error) {
      if (error.includes('Invalid email or password') || error.includes('Invalid credentials')) {
        return 'invalid_credentials';
      }
      if (error.includes('Network error') || error.includes('internet connection')) {
        return 'network_error';
      }
      if (error.includes('Server error') || error.includes('try again later')) {
        return 'server_error';
      }
    }

    return 'generic';
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    
    // Clear validation errors when user starts typing
    if (validationErrors[field]) {
      clearValidationErrors();
    }
    
    // Clear general error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleRetry = () => {
    handleLogin();
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'To reset your password, please contact your administrator or use the web portal.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Support', onPress: () => {
          // You can add navigation to support or email functionality here
          console.log('Navigate to support');
        }}
      ]
    );
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    clearError();
    clearValidationErrors();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌱</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your ECOBIN account</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[
              styles.input,
              validationErrors.email && styles.inputError
            ]}
            placeholder="Enter your email"
            value={email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            autoComplete="email"
          />
          {validationErrors.email && (
            <Text style={styles.fieldError}>{validationErrors.email}</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[
              styles.input,
              validationErrors.password && styles.inputError
            ]}
            placeholder="Enter your password"
            value={password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            autoComplete="password"
          />
          {validationErrors.password && (
            <Text style={styles.fieldError}>{validationErrors.password}</Text>
          )}
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>Signing In...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Need help? Contact support for assistance
        </Text>
      </View>

      {/* Error Popup */}
      <LoginErrorPopup
        visible={showErrorPopup}
        errorType={errorType}
        onClose={closeErrorPopup}
        onRetry={handleRetry}
        onForgotPassword={handleForgotPassword}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
  },
});
