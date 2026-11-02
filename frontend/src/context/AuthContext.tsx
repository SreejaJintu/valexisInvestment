import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, AuthResponse } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('valexis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('valexis_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  const login = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('valexis_token', data.token);
    localStorage.setItem('valexis_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('valexis_token');
    localStorage.removeItem('valexis_user');
  };

  const refreshProfile = async () => {
    try {
      if (token) {
        const res = await api.get<UserProfile>('/profile');
        setUser(res.data);
        localStorage.setItem('valexis_user', JSON.stringify(res.data));
      }
    } catch {
      // Ignored if unauthorized
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        await refreshProfile();
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'Admin',
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
