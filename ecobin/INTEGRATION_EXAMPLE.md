# Integration Example: Updating Your Existing Login Screen

## 🔄 How to Update Your Current Login Implementation

### **Step 1: Update Your Login Screen Component**

Replace your current login logic with the enhanced version:

```typescript
// Before (Old Implementation)
import { useAuth } from '../hooks/useAuth';

function LoginScreen() {
  const { login, loading, error } = useAuth();
  
  const handleLogin = async () => {
    const result = await login(email, password);
    if (result) {
      // Navigate to main app
    } else {
      // Show generic error
      Alert.alert('Error', error || 'Login failed');
    }
  };
}

// After (New Implementation)
import { useAuth } from '../hooks/useAuth';

function LoginScreen() {
  const { 
    login, 
    loading, 
    error, 
    validationErrors, 
    clearError, 
    clearValidationErrors 
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    // Clear previous errors
    clearError();
    clearValidationErrors();
    
    const result = await login(email, password);
    
    if (result) {
      // Navigate to main app
      navigation.navigate('Home');
    }
    // Errors are automatically handled by the hook
  };
  
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    
    // Clear validation errors when user starts typing
    if (validationErrors[field]) {
      clearValidationErrors();
    }
  };
}
```

### **Step 2: Update Your Input Fields**

Add validation error styling and messages:

```typescript
// Email Input
<TextInput
  style={[
    styles.input,
    validationErrors.email && styles.inputError  // Add error styling
  ]}
  placeholder="Email"
  value={email}
  onChangeText={(value) => handleInputChange('email', value)}
  keyboardType="email-address"
  autoCapitalize="none"
/>

// Show validation error
{validationErrors.email && (
  <Text style={styles.errorText}>{validationErrors.email}</Text>
)}

// Password Input
<TextInput
  style={[
    styles.input,
    validationErrors.password && styles.inputError  // Add error styling
  ]}
  placeholder="Password"
  value={password}
  onChangeText={(value) => handleInputChange('password', value)}
  secureTextEntry
/>

// Show validation error
{validationErrors.password && (
  <Text style={styles.errorText}>{validationErrors.password}</Text>
)}
```

### **Step 3: Add Error Display**

Show general errors from the server:

```typescript
// General error message
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
  </View>
)}
```

### **Step 4: Update Your Styles**

Add error styling:

```typescript
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
});
```

## 🎯 Complete Example Integration

Here's a complete example of how your login screen should look:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { 
    login, 
    loading, 
    error, 
    validationErrors, 
    clearError, 
    clearValidationErrors 
  } = useAuth();
  
  const handleLogin = async () => {
    clearError();
    clearValidationErrors();
    
    const result = await login(email, password);
    
    if (result) {
      Alert.alert('Success', 'Login successful!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    }
  };
  
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    
    if (validationErrors[field]) {
      clearValidationErrors();
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      {/* Email Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, validationErrors.email && styles.inputError]}
          placeholder="Email"
          value={email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        {validationErrors.email && (
          <Text style={styles.errorText}>{validationErrors.email}</Text>
        )}
      </View>
      
      {/* Password Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, validationErrors.password && styles.inputError]}
          placeholder="Password"
          value={password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
          editable={!loading}
        />
        {validationErrors.password && (
          <Text style={styles.errorText}>{validationErrors.password}</Text>
        )}
      </View>
      
      {/* General Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

## 🚀 Benefits After Integration

1. **Better User Experience:**
   - Clear error messages instead of technical jargon
   - Immediate feedback on input validation
   - No more confusing 401 errors

2. **Improved Error Handling:**
   - Network errors are handled gracefully
   - Server errors show user-friendly messages
   - Validation happens before API calls

3. **Easier Maintenance:**
   - Centralized error handling logic
   - Consistent error messages across the app
   - Easy to extend with new validation rules

The 401 "Invalid credentials" error you were seeing will now show as: **"Invalid email or password. Please check your credentials and try again."** 🎉
