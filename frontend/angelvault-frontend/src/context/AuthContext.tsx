import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';
import api from '../services/api';
import analytics from '../services/analytics';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInvestor: boolean;
  isDeveloper: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  setAuth: (user: User, token: string) => void;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        analytics.setUser(parsedUser.id, parsedUser.role);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    if (!token) return;
    
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      analytics.setUser(userData.id, userData.role);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Don't logout on refresh failure, might be temporary
    }
  }, [token]);

  // Update user locally (for optimistic updates)
  const updateUser = useCallback((data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  }, [user]);

  const login = async (data: LoginRequest) => {
    const response = await api.login(data);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Track login
    analytics.setUser(response.user.id, response.user.role);
    analytics.trackLogin('email');
  };

  const setAuth = useCallback((userData: User, tokenValue: string) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    
    analytics.setUser(userData.id, userData.role);
  }, []);

  const register = async (data: RegisterRequest) => {
    const response = await api.register(data);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Track signup
    analytics.setUser(response.user.id, response.user.role);
    analytics.trackSignup('email', data.role);
  };

  const logout = useCallback(() => {
    analytics.trackLogout();
    analytics.clearUser();
    
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const isInvestor = user?.role === 'investor';
  const isDeveloper = user?.role === 'developer';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isInvestor,
        isDeveloper,
        isAdmin,
        login,
        setAuth,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
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

// Protected route wrapper
export function RequireAuth({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: ('investor' | 'developer' | 'admin')[];
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const dashboardUrl = user.role === 'admin' ? '/admin' : 
                         user.role === 'investor' ? '/investor/dashboard' : 
                         '/developer/dashboard';
    window.location.href = dashboardUrl;
    return null;
  }

  return <>{children}</>;
}
