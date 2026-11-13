import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, unwrap } from '../api';

export type User = { id: string; firstName: string; lastName: string; email: string };
type AuthValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (payload: Record<string, string>) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem('qp_access_token')) { setLoading(false); return; }
    api.get('/auth/profile').then((res) => setUser(unwrap<User>(res))).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);
  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = res.data?.data;
    localStorage.setItem('qp_access_token', payload.accessToken);
    localStorage.setItem('qp_refresh_token', payload.refreshToken);
    setUser(payload.user);
  };
  const register = async (payload: Record<string, string>) => {
    await api.post('/auth/register', payload);
    await login(payload.email, payload.password);
  };
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally {
      localStorage.removeItem('qp_access_token'); localStorage.removeItem('qp_refresh_token'); setUser(null);
    }
  };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is missing'); return value; }
