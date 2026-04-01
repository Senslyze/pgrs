import type { JwtPayload, User } from '@/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';

/**
 * Store JWT token in localStorage
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Store user information in localStorage
 */
export const setUserInfo = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Store both token and user info from login response
 */
export const setAuthData = (token: string, user: User): void => {
  setToken(token);
  setUserInfo(user);
};

export const setUserDetails = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Retrieve JWT token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Retrieve user information from localStorage
 */
export const getUserInfoFromStorage = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user info from localStorage:', error);
    return null;
  }
};

/**
 * Remove JWT token and user info from localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  removeToken();
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null && token.length > 0;
};

/**
 * Parse JWT token to extract payload
 */
export const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

/**
 * Get user information from JWT token
 */
export const getUserInfo = (): JwtPayload | null => {
  const token = getToken();
  if (!token) return null;
  
  const payload = parseJwt(token);
  if (!payload) return null;
  
  return {
    id: payload.userId || payload.id, // Handle both userId and id fields
    username: payload.username,
    email: payload.email || '', // Handle missing email field
    fullName: payload.fullName || '', // Handle missing fullName field
    role: payload.role,
    departmentId: payload.departmentId || null, // Handle missing departmentId field
    iat: payload.iat,
    exp: payload.exp
  };
};

/**
 * Get current user info (prefer localStorage over JWT parsing)
 */
export const getCurrentUser = (): User | null => {
  // First try to get from localStorage
  const userFromStorage = getUserInfoFromStorage();
  if (userFromStorage) {
    return userFromStorage;
  }
  
  // Fallback to JWT parsing
  const jwtInfo = getUserInfo();
  if (jwtInfo) {
    return {
      id: jwtInfo.id,
      username: jwtInfo.username,
      email: jwtInfo.email,
      fullName: jwtInfo.fullName,
      role: jwtInfo.role,
      departmentId: jwtInfo.departmentId,
      createdAt: '',
      updatedAt: ''
    };
  }
  
  return null;
};

/**
 * Check if current user has admin role
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};

/**
 * Debug function to log current auth state
 */
export const debugAuthState = (): void => {
  const token = getToken();
  const user = getCurrentUser();
  const userFromStorage = getUserInfoFromStorage();
  
  console.log('=== Auth Debug Info ===');
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('User from storage:', userFromStorage);
  console.log('Current user:', user);
  console.log('Is authenticated:', isAuthenticated());
  console.log('Is admin:', isAdmin());
  console.log('========================');
};