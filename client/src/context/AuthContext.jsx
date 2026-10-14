import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifie le token au démarrage
  useEffect(() => {
    const token = localStorage.getItem('sp_token');
    if (!token) { setLoading(false); return; }

    authService.me()
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('sp_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    const { token, user: userData } = res.data.data;
    localStorage.setItem('sp_token', token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sp_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
