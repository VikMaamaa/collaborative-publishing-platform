'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';
import { apiClient } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  // Set up automatic token refresh
  const setupTokenRefresh = useCallback((token: string) => {
    try {
      // Decode JWT token to get expiration time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Refresh token 5 minutes before expiration
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000); // At least 1 minute
      
      // Clear existing timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      // Set new timeout
      const timeout = setTimeout(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          logout();
        }
      }, refreshTime);
      
      setRefreshTimeout(timeout);
    } catch (error) {
      console.error('Failed to setup token refresh:', error);
    }
  }, [refreshTimeout]);

  const refreshToken = async () => {
    try {
      const response: AuthResponse = await apiClient.refreshToken();
      localStorage.setItem('access_token', response.access_token);
      setUser(response.user);
      setupTokenRefresh(response.access_token);
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
          setupTokenRefresh(token);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid token
        localStorage.removeItem('access_token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [setupTokenRefresh]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiClient.login(credentials);
      
      // Store token
      localStorage.setItem('access_token', response.access_token);
      
      // Set user
      setUser(response.user);
      
      // Setup token refresh
      setupTokenRefresh(response.access_token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiClient.register(userData);
      
      // Store token
      localStorage.setItem('access_token', response.access_token);
      
      // Set user
      setUser(response.user);
      
      // Setup token refresh
      setupTokenRefresh(response.access_token);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear token and user
    localStorage.removeItem('access_token');
    setUser(null);
    
    // Clear refresh timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(null);
    }
    
    // Optional: Call logout endpoint
    apiClient.logout().catch(console.error);
  };

  const refreshUser = async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, logout
      logout();
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const updatedUser = await apiClient.updateUser(user.id, userData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 