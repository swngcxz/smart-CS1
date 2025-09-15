
import axios from 'axios';

// You can switch these as needed for web, mobile, or local
export const BASE_URLS = {
  web: 'http://192.168.100.155:8000', // Web deployment
<<<<<<< HEAD
  mobile: 'http:// 192.168.0.115:8000', // Mobile (Expo/React Native)
=======
  mobile: 'http://192.168.254.190.74:8000', // Mobile (Expo/React Native)
>>>>>>> 9d12944340aa4c17b7a57809c4152fc20d135d63
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
