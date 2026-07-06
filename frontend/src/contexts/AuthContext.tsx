// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const restoreUserFromToken = (storedToken: string) => {
    try {
      const decoded: any = jwtDecode(storedToken);
      setUser({
        id: decoded.sub,
        username: decoded.username || decoded.sub,
        email: decoded.email || '',
        role: decoded.role || 'USER',
      });
      setToken(storedToken);
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    // Проверка токенов при старте
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      restoreUserFromToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/login', { username, password });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setToken(access_token);
      restoreUserFromToken(access_token);
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await axios.post('/auth/register', { username, email, password });
      // После регистрации автоматически входим
      const loginRes = await axios.post('/auth/login', { username, password });
      const { access_token, refresh_token } = loginRes.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setToken(access_token);
      restoreUserFromToken(access_token);
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};