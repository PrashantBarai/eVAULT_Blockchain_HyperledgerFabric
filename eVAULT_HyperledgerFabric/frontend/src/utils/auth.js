/**
 * Authentication utility functions for JWT token management
 */

/**
 * Get the JWT token from sessionStorage
 */
export const getAuthToken = () => {
  return sessionStorage.getItem('access_token');
};

/**
 * Get user data from sessionStorage
 */
export const getUserData = () => {
  const userString = sessionStorage.getItem('user_data');
  return userString ? JSON.parse(userString) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUserData();
  return !!(token && user);
};

/**
 * Get authorization headers for API requests
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Clear authentication data (logout)
 */
export const clearAuth = () => {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('token_type');
  sessionStorage.removeItem('user_data');
  sessionStorage.removeItem('user_role');
};

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options (method, body, etc.)
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  // Only add Content-Type if not already set and body is JSON
  if (!headers['Content-Type'] && options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Authentication expired. Please login again.');
  }
  
  return response;
};

/**
 * Decode JWT token (without verification - for client-side display only)
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = () => {
  const token = getAuthToken();
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};
