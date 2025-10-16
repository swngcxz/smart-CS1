import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useApi, useApiMutation, useAuth } from '../hooks/useApi';
import { API } from '../utils/apiServices';

// Example component showing how to use the API connection
export default function ApiExample() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
  // Example: Fetch bins data
  const { 
    data: bins, 
    loading: binsLoading, 
    error: binsError, 
    execute: fetchBins 
  } = useApi(() => API.bins.getAll(), { immediate: false });

  // Example: Create activity mutation
  const {
    data: newActivity,
    loading: activityLoading,
    error: activityError,
    mutate: createActivity,
  } = useApiMutation((data: { binId: string; type: string }) => 
    API.activities.create(data)
  );

  // Example: Fetch notifications
  const { 
    data: notifications, 
    loading: notificationsLoading, 
    error: notificationsError 
  } = useApi(() => API.notifications.getAll());

  const handleLogin = async () => {
    const result = await login('test@example.com', 'password123');
    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
    }
  };

  const handleCreateActivity = async () => {
    const result = await createActivity({
      binId: 'bin123',
      type: 'pickup',
    });
    
    if (result.success) {
      Alert.alert('Success', 'Activity created successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to create activity');
    }
  };

  const handleFetchBins = () => {
    fetchBins();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Connection Example</Text>
      
      {/* Authentication Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        {isAuthenticated ? (
          <View>
            <Text style={styles.successText}>✅ Authenticated as: {user?.name}</Text>
            <TouchableOpacity style={styles.button} onPress={logout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login (Demo)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bins Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bins API</Text>
        <TouchableOpacity style={styles.button} onPress={handleFetchBins}>
          <Text style={styles.buttonText}>Fetch Bins</Text>
        </TouchableOpacity>
        
        {binsLoading && <Text style={styles.loadingText}>Loading bins...</Text>}
        {binsError && <Text style={styles.errorText}>Error: {binsError}</Text>}
        {bins && (
          <Text style={styles.successText}>
            ✅ Found {bins.length} bins
          </Text>
        )}
      </View>

      {/* Activities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities API</Text>
        <TouchableOpacity 
          style={[styles.button, activityLoading && styles.disabledButton]} 
          onPress={handleCreateActivity}
          disabled={activityLoading}
        >
          <Text style={styles.buttonText}>
            {activityLoading ? 'Creating...' : 'Create Activity'}
          </Text>
        </TouchableOpacity>
        
        {activityError && <Text style={styles.errorText}>Error: {activityError}</Text>}
        {newActivity && (
          <Text style={styles.successText}>
            ✅ Activity created: {newActivity.type}
          </Text>
        )}
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications API</Text>
        {notificationsLoading && <Text style={styles.loadingText}>Loading notifications...</Text>}
        {notificationsError && <Text style={styles.errorText}>Error: {notificationsError}</Text>}
        {notifications && (
          <Text style={styles.successText}>
            ✅ Found {notifications.length} notifications
          </Text>
        )}
      </View>

      {/* Server Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Status</Text>
        <Text style={styles.infoText}>
          Server URL: {__DEV__ ? 'http://localhost:8000' : 'http://192.168.1.2:8000'}
        </Text>
        <Text style={styles.infoText}>
          Available endpoints: /api/bins, /api/activities, /api/notifications, etc.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
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
  loadingText: {
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 5,
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 5,
  },
  successText: {
    color: '#34C759',
    marginTop: 5,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    marginTop: 3,
  },
});
