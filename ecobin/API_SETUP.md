# API Connection Setup Guide

This guide explains how the ecobin mobile app connects to the server using axios.

## 📁 Files Created

### 1. `utils/apiConfig.ts`
- Main axios configuration
- Handles authentication tokens automatically
- Sets up request/response interceptors
- Configures base URL for development and production

### 2. `utils/apiServices.ts`
- Complete API service layer
- Organized by functionality (auth, bins, activities, etc.)
- TypeScript interfaces for type safety
- Covers all major server endpoints

### 3. `hooks/useApi.ts`
- Custom React hooks for API calls
- `useApi` - for GET requests with loading states
- `useApiMutation` - for POST/PUT/DELETE requests
- `useAuth` - for authentication management

### 4. `components/ApiExample.tsx`
- Example component showing how to use the API
- Demonstrates authentication, data fetching, and mutations
- Can be used for testing the connection

## 🚀 How to Use

### Basic API Call
```typescript
import { API } from '../utils/apiServices';
import { useApi } from '../hooks/useApi';

// In your component
const { data, loading, error } = useApi(() => API.bins.getAll());
```

### Authentication
```typescript
import { useAuth } from '../hooks/useApi';

const { isAuthenticated, user, login, logout } = useAuth();

// Login
await login('email@example.com', 'password');

// Logout
await logout();
```

### Mutations (POST/PUT/DELETE)
```typescript
import { useApiMutation } from '../hooks/useApi';

const { mutate, loading, error } = useApiMutation((data) => 
  API.activities.create(data)
);

// Usage
await mutate({ binId: '123', type: 'pickup' });
```

## 🔧 Configuration

### Server URL
Update the server URL in `utils/apiConfig.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'        // Development
  : 'http://YOUR_SERVER_IP:8000';  // Production
```

### Available Endpoints
Based on your server, these endpoints are available:
- `/auth/*` - Authentication
- `/api/bins/*` - Bin management
- `/api/activities/*` - Activity tracking
- `/api/schedules/*` - Schedule management
- `/api/notifications/*` - Notifications
- `/api/analytics/*` - Analytics data
- `/api/waste/*` - Waste management

## 🧪 Testing

1. Start your server: `cd server && npm start`
2. Start the mobile app: `cd ecobin && npm start`
3. Import and use the `ApiExample` component to test the connection

## 📱 Example Integration

Add to any screen:
```typescript
import ApiExample from '../components/ApiExample';

export default function TestScreen() {
  return <ApiExample />;
}
```

## 🔒 Authentication Flow

1. User logs in → Token stored in AsyncStorage
2. All subsequent requests include the token automatically
3. Token expires → User redirected to login
4. Logout → Token and user data cleared

## 🐛 Troubleshooting

### Connection Issues
- Check if server is running on port 8000
- Verify the IP address in `apiConfig.ts`
- Check network connectivity

### Authentication Issues
- Ensure token is being stored correctly
- Check server auth middleware
- Verify token format

### CORS Issues
- Server already has CORS configured
- Check if server is accessible from device/emulator

## 📚 Next Steps

1. Replace example data with real API calls in your screens
2. Add error handling and loading states
3. Implement offline support if needed
4. Add API response caching
5. Set up proper TypeScript types for all server models
