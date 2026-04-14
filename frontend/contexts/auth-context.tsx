/**
 * Authentication Context for TulsiHealth
 * Manages user authentication state and JWT tokens
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  hospitalId?: string;
  isActive: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithFace: (username: string, faceImage: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save auth data
      setToken(data.access_token);
      setUser(data.user);
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Login successful');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFace = async (username: string, faceImage: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/face-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, face_image: faceImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Face login failed');
      }

      // Save auth data
      setToken(data.access_token);
      setUser(data.user);
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Face login successful');
      router.push('/dashboard');
    } catch (error) {
      console.error('Face login error:', error);
      toast.error(error instanceof Error ? error.message : 'Face login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Call logout endpoint if available
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore logout API errors
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local state
      setToken(null);
      setUser(null);
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  const refreshToken = async () => {
    if (!token) throw new Error('No token to refresh');

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    loginWithFace,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// API helper function
export function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
}
