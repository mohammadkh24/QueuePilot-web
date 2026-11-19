import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, BarChart3, CalendarDays, Clock3, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { api, getErrorMessage, unwrap } from '../api';
import type { DashboardContext } from '../components/DashboardLayout';
import { Card, PageHeading } from '../components/Ui';

type AnyRecord = Record<string, any>;
type DailyPoint = { date: string; total: number; completed: number; cancelled: number; noShow: number };
type HourPoint = { hour: string; count: number };

const numberFrom = (obj: AnyRecord, keys: string[], fallback = 0): number => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
};
const pick = (obj: AnyRecord, keys: string[]) => keys.map((key) => obj?.[key]).find((v) => v !== undefined && v !== null);
const asArray = (value: any): AnyRecord[] => Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : Array.isArray(value?.data) ? value.data : [];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
}
function formatNumber(value: number, suffix = '') {
  return `${Number(value || 0).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}${suffix}`;
}

export function AnalyticsPage() {
  const { business } = useOutletContext<DashboardContext>();
  const [from, setFrom] = useState(() => {
    const date = new Date(); date.setDate(date.getDate() - 6); return date.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [overview, setOverview] = useState<AnyRecord>({});
  const [dailyRaw, setDailyRaw] = useState<AnyRecord[]>([]);
  const [hoursRaw, setHoursRaw] = useState<AnyRecord[]>([]);
  const [performance, setPerformance] = useState<AnyRecord>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true); setError('');
    const query = new URLSearchParams({
      from: new Date(`${from}T00:00:00.000Z`).toISOString(),
      to: new Date(`${to}T23:59:59.999Z`).toISOString(),
    }).toString();
    try {
      const [overviewRes, dailyRes, hoursRes, performanceRes] = await Promise.all([
        api.get(`/businesses/${business.id}/analytics/overview?${query}`),
        api.get(`/businesses/${business.id}/analytics/daily?${query}`),
        api.get(`/businesses/${business.id}/analytics/peak-hours?${query}`),
        api.get(`/businesses/${business.id}/analytics/performance?${query}`),
      ]);
      setOverview(unwrap<AnyRecord>(overviewRes) || {});
      setDailyRaw(asArray(unwrap<any>(dailyRes)));
      setHoursRaw(asArray(unwrap<any>(hoursRes)));
      setPerformance(unwrap<AnyRecord>(performanceRes) || {});
    } catch (e) {
      setError(getErrorMessage(e));
    } finally { setLoading(false); }
  }, [business?.id, from, to]);

  useEffect(() => { load(); }, [load]);

  const daily: DailyPoint[] = useMemo(() => dailyRaw.map((item) => ({
    date: String(pick(item, ['date', 'day', 'label']) ?? ''),
    total: numberFrom(item, ['total', 'totalQueues', 'count', 'created']),
    completed: numberFrom(item, ['completed', 'completedQueues']),
    cancelled: numberFrom(item, ['cancelled', 'cancelledQueues']),
    noShow: numberFrom(item, ['noShow', 'noShowQueues', 'no_show']),
  })), [dailyRaw]);

  const hours: HourPoint[] = useMemo(() => hoursRaw.map((item) => {
    const hour = pick(item, ['hour', 'time', 'label']);
    const raw = typeof hour === 'number' ? `${String(hour).padStart(2, '0')}:00` : String(hour ?? '');
    return { hour: raw, count: numberFrom(item, ['count', 'total', 'queues', 'totalQueues']) };
  }), [hoursRaw]);

  const total = numberFrom(overview, ['total', 'totalQueues', 'totalCount', 'totalAppointments']);
  const completed = numberFrom(overview, ['completed', 'completedQueues', 'completedCount']);
  const waiting = numberFrom(overview, ['waiting', 'waitingQueues', 'waitingCount']);
  const cancelled = numberFrom(overview, ['cancelled', 'cancelledQueues', 'cancelledCount']);
  const noShow = numberFrom(overview, ['noShow', 'noShowQueues', 'noShowCount', 'no_show']);
  const averageWait = numberFrom(performance, ['averageWaitMinutes', 'avgWaitMinutes', 'averageWaitingTime', 'averageWaitTime']);
  const averageService = numberFrom(performance, ['averageServiceMinutes', 'avgServiceMinutes', 'medianMinutes', 'averageServiceTime']);
  const completionRate = numberFrom(performance, ['completionRate', 'completedRate'], total ? completed / total * 100 : 0);
  const cancellationRate = numberFrom(performance, ['cancellationRate', 'cancelledRate'], total ? cancelled / total * 100 : 0);
  const noShowRate = numberFrom(performance, ['noShowRate', 'no_showRate'], total ? noShow / total * 100 : 0);

  if (!business) return <div className="empty-panel">ابتدا کسب‌وکارت را ثبت کن.</div>;

  return <>
    <PageHeading eyebrow="گزارش و تحلیل" title="عملکرد کسب‌وکار" description="آمار واقعی صف و روند مراجعه‌کنندگان در بازه انتخاب‌شده." action={<button className="button button-secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> به‌روزرسانی</button>} />
    <div className="analytics-filters">
      <label>از تاریخ <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
      <label>تا تاریخ <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
    </div>
    {error && <div className="form-error page-error">{error}</div>}
    <div className="analytics-stat-grid">
      <Metric icon={<Users size={18}/>} label="کل نوبت‌ها" value={total} loading={loading} tone="blue" />
      <Metric icon={<Activity size={18}/>} label="تکمیل‌شده" value={completed} loading={loading} tone="green" />
      <Metric icon={<Clock3 size={18}/>} label="در انتظار" value={waiting} loading={loading} tone="purple" />
      <Metric icon={<CalendarDays size={18}/>} label="لغو و عدم حضور" value={cancelled + noShow} loading={loading} tone="orange" />
    </div>
    <div className="analytics-chart-grid">
      <Card className="analytics-chart-card">
        <div className="card-heading"><div><h3>روند روزانه نوبت‌ها</h3><p>تعداد ثبت و تکمیل نوبت در هر روز</p></div><TrendingUp size={19} /></div>
        {daily.length ? <div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily} margin={{ top: 8, right: 4, left: -18, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#8b95a9' }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8b95a9' }} axisLine={false} tickLine={false}/><Tooltip labelFormatter={(v) => formatDate(String(v))} formatter={(v: number) => formatNumber(v)} /><Bar dataKey="total" name="کل نوبت‌ها" fill="#657cf2" radius={[5,5,0,0]}/><Bar dataKey="completed" name="تکمیل‌شده" fill="#31b58a" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div> : <ChartEmpty loading={loading} />}
      </Card>
      <Card className="analytics-chart-card">
        <div className="card-heading"><div><h3>ساعات پرتردد</h3><p>توزیع مراجعه بر اساس ساعت ورود به صف</p></div><Clock3 size={19}/></div>
        {hours.length ? <div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={hours} margin={{ top: 8, right: 4, left: -18, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8b95a9' }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8b95a9' }} axisLine={false} tickLine={false}/><Tooltip formatter={(v: number) => formatNumber(v, ' نوبت')}/><Bar dataKey="count" name="مراجعه" radius={[5,5,0,0]}>{hours.map((_, i) => <Cell key={i} fill={i === hours.reduce((best, p, idx, arr) => p.count > arr[best].count ? idx : best, 0) ? '#31b58a' : '#91a1f7'} />)}</Bar></BarChart></ResponsiveContainer></div> : <ChartEmpty loading={loading} />}
      </Card>
    </div>
    <Card className="analytics-performance">
      <div className="card-heading"><div><h3>شاخص‌های عملکرد</h3><p>زمان‌ها بر حسب دقیقه و نرخ‌ها بر اساس کل نوبت‌ها</p></div><BarChart3 size={19}/></div>
      <div className="performance-grid">
        <Performance label="میانگین زمان انتظار" value={formatNumber(averageWait, ' دقیقه')} />
        <Performance label="میانگین زمان خدمت" value={formatNumber(averageService, ' دقیقه')} />
        <Performance label="نرخ تکمیل" value={formatNumber(completionRate, '٪')} />
        <Performance label="نرخ لغو" value={formatNumber(cancellationRate, '٪')} />
        <Performance label="نرخ عدم حضور" value={formatNumber(noShowRate, '٪')} />
      </div>
      <div className="analytics-note">آمار بر اساس نوبت‌های ثبت‌شده در بازه انتخابی محاسبه شده است. اگر داده کافی وجود نداشته باشد، بعضی شاخص‌ها ممکن است صفر نمایش داده شوند.</div>
    </Card>
  </>;
}

function Metric({ icon, label, value, loading, tone }: { icon: ReactNode; label: string; value: number; loading: boolean; tone: string }) {
  return <Card className="analytics-metric"><div className="metric-top"><span>{label}</span><i className={`metric-icon metric-${tone}`}>{icon}</i></div><strong>{loading ? '—' : formatNumber(value)}</strong><small>در بازه انتخاب‌شده</small></Card>;
}
function Performance({ label, value }: { label: string; value: string }) {
  return <div className="performance-item"><span>{label}</span><strong>{value}</strong></div>;
}
function ChartEmpty({ loading }: { loading: boolean }) {
  return <div className="analytics-empty">{loading ? 'در حال دریافت گزارش...' : 'برای این بازه داده‌ای ثبت نشده است.'}</div>;
}
