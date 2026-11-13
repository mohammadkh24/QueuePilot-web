import { useEffect, useState } from 'react';
import { Activity, ArrowLeft, CalendarCheck, Clock3, Plus, Users, Zap } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, unwrap, getErrorMessage } from '../api';
import type { DashboardContext } from '../components/DashboardLayout';
import { Card, EmptyState, PageHeading } from '../components/Ui';
import { useAuth } from '../context/AuthContext';

type QueueItem = { id: string; queueNumber: number; status: string; user?: { firstName: string; lastName: string } };
type Appointment = { id: string; startAt: string; status: string; service?: { name: string }; user?: { firstName: string; lastName: string } };
type Service = { id: string; name: string; duration: number; price: number; isActive: boolean };

export function OverviewPage() {
  const { business } = useOutletContext<DashboardContext>();
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!business) { setLoading(false); return; }
    Promise.all([
      api.get(`/businesses/${business.id}/queue?limit=100`).then((r) => setQueue(unwrap<QueueItem[]>(r))).catch(() => setQueue([])),
      api.get(`/businesses/${business.id}/appointments?limit=100`).then((r) => setAppointments(unwrap<Appointment[]>(r))).catch(() => setAppointments([])),
      api.get(`/businesses/${business.id}/services?limit=100`).then((r) => setServices(unwrap<Service[]>(r))).catch(() => setServices([])),
    ]).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false));
  }, [business?.id]);
  if (!business) return <div className="onboarding-card"><div className="onboarding-icon"><Activity size={26} /></div><div className="eyebrow">قدم اول</div><h1>فضای کاری‌ات را بساز</h1><p>برای شروع مدیریت نوبت‌ها و صف، ابتدا اطلاعات کسب‌وکارت را ثبت کن.</p><Link to="/app/business" className="button button-accent">ثبت کسب‌وکار <ArrowLeft size={17} /></Link></div>;
  const activeQueue = queue.filter((q) => ['WAITING', 'CALLED', 'SERVING'].includes(q.status));
  const today = new Date().toDateString();
  const todayAppointments = appointments.filter((a) => new Date(a.startAt).toDateString() === today);
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  return <>
    <PageHeading eyebrow="نمای کلی" title={`روز بخیر، ${user?.firstName || 'مدیر'} 👋`} description={`وضعیت امروز ${business.name} را در یک نگاه ببین.`} action={<Link to="/app/queue" className="button button-accent"><Plus size={17} /> مدیریت صف</Link>} />
    {error && <div className="inline-error">{error}</div>}
    <div className="stats-grid"><Card className="stat-card"><div className="stat-top"><span>مراجعان در صف</span><span className="stat-icon stat-purple"><Users size={18} /></span></div><strong>{loading ? '—' : activeQueue.length.toLocaleString('fa-IR')}</strong><small>در انتظار، فراخوانده‌شده و در حال خدمت</small></Card><Card className="stat-card"><div className="stat-top"><span>نوبت‌های امروز</span><span className="stat-icon stat-blue"><CalendarCheck size={18} /></span></div><strong>{loading ? '—' : todayAppointments.length.toLocaleString('fa-IR')}</strong><small>بر اساس تاریخ شروع نوبت</small></Card><Card className="stat-card"><div className="stat-top"><span>خدمات فعال</span><span className="stat-icon stat-green"><Zap size={18} /></span></div><strong>{loading ? '—' : services.filter((s) => s.isActive).length.toLocaleString('fa-IR')}</strong><small>خدمات قابل رزرو</small></Card><Card className="stat-card"><div className="stat-top"><span>نوبت‌های تکمیل‌شده</span><span className="stat-icon stat-orange"><Clock3 size={18} /></span></div><strong>{loading ? '—' : completed.toLocaleString('fa-IR')}</strong><small>مجموع نوبت‌های تکمیل‌شده</small></Card></div>
    <div className="overview-grid"><Card className="overview-queue"><div className="card-heading"><div><h3>صف در حال انتظار</h3><p>وضعیت فعلی مراجعه‌کنندگان</p></div><Link to="/app/queue">مشاهده صف <ArrowLeft size={14} /></Link></div>{activeQueue.length ? <div className="mini-queue-list">{activeQueue.slice(0, 5).map((item) => <div className="mini-queue-row" key={item.id}><span className="queue-number">{Number(item.queueNumber).toLocaleString('fa-IR', { minimumIntegerDigits: 2 })}</span><div><b>{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'مراجعه‌کننده'}</b><small>شماره صف {item.queueNumber.toLocaleString('fa-IR')}</small></div><span className={`status-pill status-${item.status.toLowerCase()}`}>{statusLabel(item.status)}</span></div>)}</div> : <EmptyState title="صف هنوز خالی است" description="با ثبت اولین مراجعه‌کننده، وضعیت صف در این بخش نمایش داده می‌شود." icon={<Users size={23} />} />}</Card>
    <Card className="overview-side"><div className="card-heading"><div><h3>دسترسی سریع</h3><p>کارهای پرکاربرد</p></div></div><Link className="quick-link" to="/app/services"><span className="quick-icon"><Zap size={18} /></span><span><b>مدیریت خدمات</b><small>تعریف و ویرایش خدمات</small></span><ArrowLeft size={16} /></Link><Link className="quick-link" to="/app/appointments"><span className="quick-icon quick-blue"><CalendarCheck size={18} /></span><span><b>مشاهده نوبت‌ها</b><small>بررسی رزروهای مشتریان</small></span><ArrowLeft size={16} /></Link><Link className="quick-link" to="/app/business"><span className="quick-icon quick-green"><Activity size={18} /></span><span><b>اطلاعات کسب‌وکار</b><small>ویرایش مشخصات و تماس</small></span><ArrowLeft size={16} /></Link><div className="live-hint"><span><i /> اتصال لحظه‌ای آماده است</span><small>تغییرات صف از طریق Socket.IO همگام می‌شوند.</small></div></Card></div>
  </>;
}
function statusLabel(status: string) { return ({ WAITING: 'در انتظار', CALLED: 'فراخوانده‌شده', SERVING: 'در حال خدمت', COMPLETED: 'تکمیل‌شده', CANCELLED: 'لغوشده', NO_SHOW: 'عدم حضور' } as Record<string, string>)[status] || status; }
