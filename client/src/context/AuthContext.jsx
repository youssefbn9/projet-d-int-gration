import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sp_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chargement initial via /auth/me
  useEffect(() => {
    const storedToken = localStorage.getItem('sp_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    authService
      .me()
      .then((res) => {
        setUser(res.data.data);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem('sp_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('sp_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('sp_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sp_token');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAdmin,
      login,
      register,
      logout,
    }),
    [user, token, loading, isAdmin, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return ctx;
}
