import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { EnvDebugger } from '../components/EnvDebugger';
import axiosInstance from '../utils/axiosInstance';
import apiService from '../utils/apiService';

export default function DebugScreen() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runConnectivityTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    // Test 1: Basic axios instance
    try {
      const response = await axiosInstance.get('/api/bin1');
      addTestResult('Axios Instance Test', 'success', `Connected to: ${axiosInstance.defaults.baseURL}`);
    } catch (error: any) {
      addTestResult('Axios Instance Test', 'error', `Failed: ${error.message}`);
    }

    // Test 2: API Service
    try {
      const response = await apiService.getBin1Data();
      addTestResult('API Service Test', 'success', 'Successfully fetched bin1 data');
    } catch (error: any) {
      addTestResult('API Service Test', 'error', `Failed: ${error.message}`);
    }

    // Test 3: Notification endpoint (the one that's failing)
    try {
      const response = await axiosInstance.get('/api/bin-notifications/janitor/6uprP4efGeffBN5aEJGx?limit=50');
      addTestResult('Notification Endpoint Test', 'success', 'Successfully fetched notifications');
    } catch (error: any) {
      addTestResult('Notification Endpoint Test', 'error', `Failed: ${error.message}`);
    }

    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Debug Screen</Text>
      
      <EnvDebugger />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Connectivity Tests</Text>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={runConnectivityTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running Tests...' : 'Run Connectivity Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Text style={styles.clearButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Test Results</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Run tests to see results.</Text>
        ) : (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTest}>{result.test}</Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
              <Text style={[
                styles.resultMessage,
                result.status === 'success' ? styles.successText : styles.errorText
              ]}>
                {result.status === 'success' ? '✅' : '❌'} {result.message}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  resultItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
  },
  resultMessage: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
});
