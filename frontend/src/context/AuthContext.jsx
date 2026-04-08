import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/apiService.js';

/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

export const AuthContext = createContext();
export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('token')));
  const [error, setError] = useState(null);

  const clearSession = useCallback((nextError = null) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setError(nextError);
    setIsLoading(false);
  }, []);

  // Initialize and validate user session whenever the token changes.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const hydrateSession = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (!cancelled) {
            setUser(parsedUser);
          }
        } catch (err) {
          console.error('Failed to parse stored user:', err);
          if (!cancelled) {
            clearSession('Your saved session could not be restored. Please login again.');
          }
          return;
        }
      }

      try {
        const profileResponse = await authAPI.getProfile(token);
        if (cancelled) {
          return;
        }

        localStorage.setItem('user', JSON.stringify(profileResponse.data));
        setUser(profileResponse.data);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          clearSession(err.message || 'Your session has expired. Please login again.');
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  useEffect(() => {
    const handleUnauthorized = (event) => {
      clearSession(event.detail?.message || 'Your session is no longer valid. Please login again.');
    };

    window.addEventListener('securesphere:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('securesphere:unauthorized', handleUnauthorized);
    };
  }, [clearSession]);

  // Register user
  const register = useCallback(async (payload) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await authAPI.register(payload);

      // Store user and token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      setToken(data.data.token);
      setUser(data.data.user);
      setError(null);
      setIsLoading(false);

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Login user
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await authAPI.login(email, password);

      // Store user and token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      setToken(data.data.token);
      setUser(data.data.user);
      setError(null);
      setIsLoading(false);

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout user
  const logout = useCallback(() => {
    clearSession(null);
  }, [clearSession]);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }

      localStorage.setItem('user', JSON.stringify(data.data));
      setUser(data.data);
      setIsLoading(false);

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Update failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [token]);

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
