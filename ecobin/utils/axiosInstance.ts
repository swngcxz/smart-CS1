import axios from 'axios';

// You can switch these as needed for web, mobile, or local
export const BASE_URLS = {
  web: 'http://192.168.100.155:8000', // Web deployment
  mobile: 'http://192.168.1.19:8000', // Mobile (Expo/React Native)
  local: 'http://localhost:8000', // Local development
};

// Default to mobile for now
const instance = axios.create({
  baseURL: BASE_URLS.mobile,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
