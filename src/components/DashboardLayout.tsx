import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, CalendarDays, ChevronDown, Command, LayoutDashboard, LogOut, Menu, Settings2, Store, Users, X, Zap, BarChart3 } from 'lucide-react';
import { api, unwrap, getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Brand';
import { Button } from './Ui';

export type Business = { id: string; name: string; description?: string; phone?: string; address?: string; isActive: boolean };
export type DashboardContext = { business: Business | null; refreshBusiness: () => Promise<void> };

const links = [
  { to: '/app', label: 'نمای کلی', icon: LayoutDashboard, end: true },
  { to: '/app/queue', label: 'مدیریت صف', icon: Users },
  { to: '/app/analytics', label: 'گزارش‌ها و تحلیل', icon: BarChart3 },
  { to: '/app/appointments', label: 'نوبت‌ها', icon: CalendarDays },
  { to: '/app/services', label: 'خدمات', icon: Command },
  { to: '/app/business', label: 'تنظیمات کسب‌وکار', icon: Settings2 },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const refreshBusiness = async () => {
    const res = await api.get('/businesses?limit=50');
    const list = unwrap<Business[]>(res);
    setBusinesses(list);
    const savedId = localStorage.getItem('qp_business_id');
    const selected = list.find((item) => item.id === savedId) || list[0] || null;
    setBusiness(selected);
    if (selected) localStorage.setItem('qp_business_id', selected.id);
  };
  useEffect(() => { refreshBusiness().catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false)); }, []);
  const chooseBusiness = (id: string) => { const selected = businesses.find((item) => item.id === id) || null; setBusiness(selected); if (selected) localStorage.setItem('qp_business_id', selected.id); };
  const side = <>
    <div className="sidebar-brand"><Brand /></div>
    <div className="workspace-label">فضای کاری</div>
    {businesses.length > 1 && <select className="workspace-select" value={business?.id || ''} onChange={(e) => chooseBusiness(e.target.value)}>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
    <nav className="side-nav">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19} /><span>{label}</span>{to === '/app/queue' && <i className="nav-live-dot" />}</NavLink>)}</nav>
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Zap size={17} /></div><strong>همیشه یک قدم جلوتر</strong><p>صف کسب‌وکارت را در لحظه مدیریت کن.</p></div><button className="profile-mini" onClick={() => navigate('/app/business')}><span className="avatar">{user?.firstName?.[0] || 'ک'}</span><span><b>{user?.firstName} {user?.lastName}</b><small>مدیر کسب‌وکار</small></span><ChevronDown size={16} /></button></div>
  </>;
  if (loading) return <div className="page-loader"><span className="loader" />در حال بارگذاری فضای کاری...</div>;
  return <div className="app-shell">
    <aside className="sidebar">{side}</aside>
    {mobileOpen && <div className="mobile-sidebar-backdrop" onClick={() => setMobileOpen(false)}><aside className="sidebar mobile-sidebar" onClick={(e) => e.stopPropagation()}><button className="mobile-close" onClick={() => setMobileOpen(false)}><X /></button>{side}</aside></div>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)}><Menu /></button><div className="breadcrumb"><span>فضای کاری</span><span className="breadcrumb-dot">/</span><b>{business?.name || 'راه‌اندازی کسب‌وکار'}</b></div><div className="topbar-actions"><span className="connection-status"><i /> سیستم فعال</span><button className="topbar-user" onClick={() => navigate('/app/business')}><span className="avatar avatar-small">{user?.firstName?.[0] || 'ک'}</span><span>{user?.firstName}</span></button><button className="icon-button" title="خروج" onClick={async () => { await logout(); navigate('/'); }}><LogOut size={18} /></button></div></header>
      {error && <div className="inline-error">{error}</div>}
      <div className="content-wrap"><Outlet context={{ business, refreshBusiness } satisfies DashboardContext} /></div>
      <footer className="app-footer"><span>© ۱۴۰۵ کیوپایلوت</span><span><Activity size={13} /> ساخته‌شده برای مدیریت روان‌تر</span></footer>
    </main>
  </div>;
}
