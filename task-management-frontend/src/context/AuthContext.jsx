import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => JSON.parse(localStorage.getItem('tm_user') || 'null'));
  const [org, setOrg]       = useState(() => JSON.parse(localStorage.getItem('tm_org')  || 'null'));
  const [token, setToken]   = useState(() => localStorage.getItem('tm_token') || null);
  const [loading, setLoading] = useState(false);

  const persist = useCallback((u, o, t) => {
    setUser(u); setOrg(o); setToken(t);
    if (u) { localStorage.setItem('tm_user', JSON.stringify(u)); localStorage.setItem('tm_org', JSON.stringify(o)); localStorage.setItem('tm_token', t); }
    else   { localStorage.removeItem('tm_user'); localStorage.removeItem('tm_org'); localStorage.removeItem('tm_token'); }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.user, data.org, data.token);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Login failed' };
    } finally { setLoading(false); }
  };

  const register = async (name, email, password, orgName) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, orgName });
      persist(data.user, data.org, data.token);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Registration failed' };
    } finally { setLoading(false); }
  };

  const logout = () => persist(null, null, null);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      persist(data.user, data.org, token);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, org, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
