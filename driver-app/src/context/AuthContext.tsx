import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, getDriverId, saveSession, clearSession } from '../api/authStorage';

interface AuthState {
  isReady: boolean;
  isLoggedIn: boolean;
  driverId: string | null;
  login: (token: string, driverId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [token, id] = await Promise.all([getToken(), getDriverId()]);
      setIsLoggedIn(!!token);
      setDriverId(id);
      setIsReady(true);
    })();
  }, []);

  const login = async (token: string, id: string) => {
    await saveSession(token, id);
    setDriverId(id);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await clearSession();
    setDriverId(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isReady, isLoggedIn, driverId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
