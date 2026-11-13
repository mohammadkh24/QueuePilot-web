import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Clock3, Plus, UserRound } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api, unwrap, getErrorMessage } from '../api';
import type { DashboardContext } from '../components/DashboardLayout';
import { Button, Card, EmptyState, PageHeading } from '../components/Ui';

type Appointment = { id: string; startAt: string; endAt: string; status: string; note?: string; user?: { id: string; firstName: string; lastName: string; email: string }; service?: { name: string; duration: number; price: number } };
const statusNames: Record<string, string> = { PENDING: 'در انتظار تأیید', CONFIRMED: 'تأییدشده', CANCELLED: 'لغوشده', COMPLETED: 'تکمیل‌شده' };
export function AppointmentsPage() {
  const { business } = useOutletContext<DashboardContext>();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const load = useCallback(async () => { if (!business) return; const res = await api.get(`/businesses/${business.id}/appointments?limit=100`); setItems(unwrap<Appointment[]>(res)); }, [business?.id]);
  useEffect(() => { if (!business) { setLoading(false); return; } load().catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false)); }, [business?.id, load]);
  const addToQueue = async (item: Appointment) => {
    if (!item.user?.id) return;
    setBusy(item.id); setError('');
    try { await api.post(`/businesses/${business!.id}/queue`, { userId: item.user.id, appointmentId: item.id }); await load(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(null); }
  };
  const cancel = async (item: Appointment) => {
    if (!confirm('این نوبت لغو شود؟')) return;
    setBusy(item.id); setError('');
    try { await api.delete(`/businesses/${business!.id}/appointments/${item.id}`); await load(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(null); }
  };
  const filtered = items.filter((item) => filter === 'ALL' || item.status === filter);
  if (!business) return <div className="empty-panel">ابتدا کسب‌وکارت را ثبت کن.</div>;
  return <><PageHeading eyebrow="رزروها" title="مدیریت نوبت‌ها" description="رزروهای مشتریان را بررسی کن و در زمان مراجعه به صف منتقل کن." action={<div className="socket-badge"><CalendarDays size={15} /> رزروهای ثبت‌شده</div>} />{error && <div className="form-error page-error">{error}</div>}
    <Card className="table-card"><div className="table-toolbar"><div className="filter-tabs"><button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>همه نوبت‌ها</button><button className={filter === 'PENDING' ? 'active' : ''} onClick={() => setFilter('PENDING')}>در انتظار</button><button className={filter === 'CONFIRMED' ? 'active' : ''} onClick={() => setFilter('CONFIRMED')}>تأییدشده</button><button className={filter === 'CANCELLED' ? 'active' : ''} onClick={() => setFilter('CANCELLED')}>لغوشده</button></div><span className="muted-count">{filtered.length.toLocaleString('fa-IR')} نوبت</span></div>
      {loading ? <div className="table-loading">در حال دریافت نوبت‌ها...</div> : filtered.length ? <div className="table-scroll"><table><thead><tr><th>مشتری</th><th>خدمت</th><th>تاریخ و ساعت</th><th>مدت</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-person"><span className="person-avatar"><UserRound size={16} /></span><span><b>{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'مشتری'}</b><small>{item.user?.email || '—'}</small></span></div></td><td>{item.service?.name || '—'}</td><td><b>{new Date(item.startAt).toLocaleDateString('fa-IR')}</b><small className="table-subline">{new Date(item.startAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</small></td><td>{item.service?.duration ? `${item.service.duration.toLocaleString('fa-IR')} دقیقه` : '—'}</td><td><span className={`status-pill status-${item.status.toLowerCase()}`}>{statusNames[item.status] || item.status}</span></td><td><div className="row-actions">{['PENDING', 'CONFIRMED'].includes(item.status) && <><Button className="button-small" loading={busy === item.id} onClick={() => addToQueue(item)}><Plus size={14} /> ورود به صف</Button><button className="table-icon-danger" title="لغو نوبت" onClick={() => cancel(item)}><Clock3 size={16} /></button></>}</div></td></tr>)}</tbody></table></div> : <EmptyState title="هنوز نوبتی ثبت نشده" description="وقتی مشتریان از صفحه رزرو عمومی نوبت بگیرند، اینجا نمایش داده می‌شوند." icon={<CalendarDays size={24} />} />}
      <div className="table-foot"><span>نمایش {filtered.length.toLocaleString('fa-IR')} نوبت</span><span>اطلاعات مستقیماً از سرور دریافت می‌شود.</span></div>
    </Card>
  </>;
}
