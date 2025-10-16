# Authentication Setup Guide

This guide explains how to use the authentication system that connects your login page to the backend auth controller.

## 🔐 **Authentication Hook: `useAuth`**

### **Location:** `hooks/useAuth.ts`

The `useAuth` hook provides complete authentication functionality including login, logout, user management, and password reset.

### **Features:**
- ✅ Login with email/password
- ✅ Automatic token storage and management
- ✅ Role-based redirection after login
- ✅ Logout with server cleanup
- ✅ Password reset with OTP
- ✅ User profile management
- ✅ Automatic session validation

## 🚀 **How to Use**

### **1. Basic Login Integration**

```typescript
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const result = await login({ email, password });
    
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
    // Success - hook automatically redirects based on user role
  };

  return (
    // Your login form JSX
  );
}
```

### **2. Check Authentication Status**

```typescript
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <Text>Loading...</Text>;
  
  if (!isAuthenticated) {
    return <Text>Please log in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user?.fullName}!</Text>
      <Text>Role: {user?.role}</Text>
    </View>
  );
}
```

### **3. Logout Functionality**

```typescript
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(); // Automatically redirects to login screen
  };

  return (
    <TouchableOpacity onPress={handleLogout}>
      <Text>Logout</Text>
    </TouchableOpacity>
  );
}
```

## 🔄 **Backend Integration**

### **Login Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "role": "staff"
  },
  "redirectTo": "/staff"
}
```

### **User Info Endpoint:** `GET /auth/me`

**Response:**
```json
{
  "id": "user_id",
  "fullName": "John Doe",
  "email": "user@example.com",
  "role": "staff",
  "address": "123 Main St",
  "phone": "+1234567890",
  "status": "active",
  "emailVerified": true
}
```

## 🎯 **Role-Based Redirection**

The system automatically redirects users based on their role after successful login:

- **Admin** → `/(tabs)/home` (or create admin-specific route)
- **Staff** → `/(tabs)/home`
- **Default** → `/(tabs)/home`

You can customize these routes in the `useAuth` hook.

## 🔧 **Error Handling**

The hook provides comprehensive error handling:

```typescript
const { error, clearError } = useAuth();

// Display errors in your UI
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
  </View>
)}

// Clear errors manually
const handleRetry = () => {
  clearError();
  // Retry login or other operation
};
```

### **Common Error Messages:**
- "Invalid email or password" (401)
- "Please verify your email before logging in" (403)
- "Too many login attempts. Please try again later." (429)
- "Server error. Please try again later." (500+)

## 🔑 **Password Reset**

Use the `usePasswordReset` hook for password reset functionality:

```typescript
import { usePasswordReset } from '../hooks/useAuth';

export default function ForgotPasswordScreen() {
  const { 
    requestPasswordReset, 
    verifyOtp, 
    resetPassword, 
    loading, 
    error 
  } = usePasswordReset();

  const handleRequestReset = async () => {
    const result = await requestPasswordReset(email);
    if (result.success) {
      // Show OTP input form
    }
  };

  const handleVerifyOtp = async () => {
    const result = await verifyOtp(email, otp);
    if (result.success) {
      // Show new password form
    }
  };

  const handleResetPassword = async () => {
    const result = await resetPassword(email, otp, newPassword);
    if (result.success) {
      // Redirect to login
    }
  };
}
```

## 🧪 **Testing**

### **Test Component**
Use the `LoginTest` component to test authentication:

```typescript
import LoginTest from '../components/LoginTest';

// Add to any screen for testing
<LoginTest />
```

### **Test Credentials**
Update the test credentials in `LoginTest.tsx` with real user data from your backend.

## 📱 **Updated Login Page**

Your login page (`app/(auth)/login.tsx`) has been updated to:
- ✅ Use the `useAuth` hook
- ✅ Display authentication errors
- ✅ Handle loading states
- ✅ Validate input fields
- ✅ Automatically redirect on success

## 🔄 **Token Management**

The system automatically:
- ✅ Stores JWT tokens in AsyncStorage
- ✅ Includes tokens in API requests
- ✅ Validates tokens with the server
- ✅ Clears tokens on logout
- ✅ Handles token expiration

## 🚨 **Security Features**

- ✅ Rate limiting (5 attempts per 10 minutes)
- ✅ Password strength validation
- ✅ Email verification requirement
- ✅ Secure token storage
- ✅ Automatic session cleanup
- ✅ CORS protection

## 📋 **Next Steps**

1. **Start your server:**
   ```bash
   cd server
   npm start
   ```

2. **Test the connection:**
   ```bash
   cd ecobin
   node test-connection.js
   ```

3. **Start your mobile app:**
   ```bash
   cd ecobin
   npm start
   ```

4. **Test login with real credentials** from your backend

5. **Customize role-based redirections** as needed

## 🐛 **Troubleshooting**

### **Connection Issues:**
- Check if server is running on port 8000
- Verify the API URL in `apiConfig.ts`
- Check network connectivity

### **Authentication Issues:**
- Verify user exists in your database
- Check if email is verified
- Ensure password meets strength requirements
- Check server logs for detailed errors

### **Token Issues:**
- Clear AsyncStorage and try again
- Check if JWT_SECRET matches between client and server
- Verify token expiration settings

## 📚 **API Endpoints Used**

- `POST /auth/login` - User login
- `POST /auth/signout` - User logout
- `GET /auth/me` - Get current user info
- `PATCH /auth/me` - Update user info
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/verify-otp` - Verify OTP for password reset
- `POST /auth/reset-password` - Reset password with OTP
- `POST /auth/change-password` - Change password for logged-in user

The authentication system is now fully integrated and ready to use! 🎉
