import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function LoginTest() {
  const { isAuthenticated, user, login, logout, loading, error } = useAuth();

  const handleTestLogin = async () => {
    // Test with demo credentials - replace with real ones
    const result = await login({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (result.success) {
      Alert.alert('Success', 'Login successful!');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>✅ Authenticated</Text>
        <Text style={styles.userInfo}>Welcome, {user?.fullName || user?.email}!</Text>
        <Text style={styles.role}>Role: {user?.role}</Text>
        
        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Authentication Test</Text>
      <Text style={styles.status}>Status: Not authenticated</Text>
      
      {loading && <Text style={styles.loading}>Loading...</Text>}
      {error && <Text style={styles.error}>Error: {error}</Text>}
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleTestLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Test Login'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Note: Update the test credentials in LoginTest.tsx with real ones
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#2e7d32',
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loading: {
    color: '#007AFF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 5,
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 5,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
