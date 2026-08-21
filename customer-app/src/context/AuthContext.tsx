import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, getUserId, saveSession, clearSession } from '../api/authStorage';

interface AuthState {
  isReady: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  login: (token: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [token, uid] = await Promise.all([getToken(), getUserId()]);
      setIsLoggedIn(!!token);
      setUserId(uid);
      setIsReady(true);
    })();
  }, []);

  const login = async (token: string, uid: string) => {
    await saveSession(token, uid);
    setUserId(uid);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await clearSession();
    setUserId(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isReady, isLoggedIn, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
