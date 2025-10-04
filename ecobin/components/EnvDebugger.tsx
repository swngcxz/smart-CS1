import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  API_BASE_URL,
  API_FALLBACK_LOCALHOST,
  API_FALLBACK_ANDROID_EMULATOR,
  API_TIMEOUT,
  API_DEBUG,
} from '@env';

export const EnvDebugger: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Environment Variables Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>API_BASE_URL:</Text>
        <Text style={styles.value}>{API_BASE_URL || '❌ UNDEFINED'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>API_FALLBACK_LOCALHOST:</Text>
        <Text style={styles.value}>{API_FALLBACK_LOCALHOST || '❌ UNDEFINED'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>API_FALLBACK_ANDROID_EMULATOR:</Text>
        <Text style={styles.value}>{API_FALLBACK_ANDROID_EMULATOR || '❌ UNDEFINED'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>API_TIMEOUT:</Text>
        <Text style={styles.value}>{API_TIMEOUT || '❌ UNDEFINED'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>API_DEBUG:</Text>
        <Text style={styles.value}>{API_DEBUG || '❌ UNDEFINED'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[
          styles.value, 
          API_BASE_URL ? styles.success : styles.error
        ]}>
          {API_BASE_URL ? '✅ Environment variables loaded' : '❌ Environment variables NOT loaded'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  success: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  error: {
    color: '#F44336',
    fontWeight: 'bold',
  },
});
