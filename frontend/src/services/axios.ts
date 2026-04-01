// apiClient.ts
import axios from "axios";
import { baseURL } from "@/config";
import { getToken, removeToken } from "@/utils/auth";

const optiServerInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
optiServerInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    console.log('Making request to:', config.url);
    console.log('Token available:', !!token);
    console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token found - request will be unauthenticated');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
optiServerInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data);
    
    // If we get a 401 or 403 Unauthorized/Forbidden, remove the token and redirect to login
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Authentication failed - removing token and redirecting to login');
      removeToken();
      // Respect Vite base path (basename) when redirecting to login
      const loginPath = '/municipality/login';
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }
    
    return Promise.reject(error);
  }
);

export { optiServerInstance,baseURL };
