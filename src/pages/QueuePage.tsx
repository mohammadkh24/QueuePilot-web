import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ArrowLeft, BellRing, CheckCircle2, CircleDot, Clock3, Plus, RefreshCw, UserRound, Volume2, VolumeX, Play, XCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { API_URL, api, unwrap, getErrorMessage } from '../api';
import type { DashboardContext } from '../components/DashboardLayout';
import { Button, Card, EmptyState, Field, Modal, PageHeading } from '../components/Ui';
import { PredictionCard } from '../components/PredictionCard';

type QueueItem = { id: string; queueNumber: number; status: string; joinedAt: string; customerName?: string | null; customerPhone?: string | null; calledAt?: string | null; startedAt?: string | null; completedAt?: string | null; user?: { id: string; firstName: string; lastName: string; email: string }; appointment?: { id: string; service?: { name: string } } | null };
const labels: Record<string, string> = { WAITING: 'در انتظار', CALLED: 'فراخوانده‌شده', SERVING: 'در حال خدمت', COMPLETED: 'تکمیل‌شده', CANCELLED: 'لغوشده', NO_SHOW: 'عدم حضور' };

export function QueuePage() {
  const { business } = useOutletContext<DashboardContext>();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState('ACTIVE');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInBusy, setWalkInBusy] = useState(false);
  const [walkIn, setWalkIn] = useState({ customerName: '', customerPhone: '' });
  const [predictionRefresh, setPredictionRefresh] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('qp_voice_announcements') === 'true');
  const [voiceServiceAvailable, setVoiceServiceAvailable] = useState(false);
  const audioPlayback = useRef<Promise<void>>(Promise.resolve());
  const announcedCalls = useRef<Set<string>>(new Set());
  const TTS_URL = (import.meta.env.VITE_TTS_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');

  useEffect(() => {
    let active = true;
    const checkVoiceService = async () => {
      try {
        const response = await fetch(`${TTS_URL}/health`);
        if (!response.ok) throw new Error('TTS service unavailable');
        if (active) setVoiceServiceAvailable(true);
      } catch {
        if (active) setVoiceServiceAvailable(false);
      }
    };
    checkVoiceService();
    const interval = window.setInterval(checkVoiceService, 10000);
    return () => { active = false; window.clearInterval(interval); };
  }, [TTS_URL]);

  const playAnnouncement = (text: string) => {
    audioPlayback.current = audioPlayback.current.then(async () => {
      const response = await fetch(`${TTS_URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('تولید صدای فارسی ناموفق بود.');
      const audioUrl = URL.createObjectURL(await response.blob());
      try {
        const audio = new Audio(audioUrl);
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('پخش فایل صوتی ناموفق بود.'));
          audio.play().catch(reject);
        });
      } finally {
        URL.revokeObjectURL(audioUrl);
      }
    }).catch((error) => {
      console.error('QueuePilot voice announcement failed:', error);
    });
    return audioPlayback.current;
  };
  const load = useCallback(async () => {
    if (!business) return;
    const res = await api.get(`/businesses/${business.id}/queue?limit=100`);
    setItems(unwrap<QueueItem[]>(res));
  }, [business?.id]);
  useEffect(() => { if (!business) { setLoading(false); return; } load().catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false)); }, [business?.id, load]);
  useEffect(() => {
    if (!business) return;
    const token = localStorage.getItem('qp_access_token');
    if (!token) return;
    const socket: Socket = io(`${API_URL}/queue`, { auth: { token }, transports: ['websocket'] });
    socket.on('connect', () => { setConnected(true); socket.emit('queue:join', { businessId: business.id }); });
    socket.on('disconnect', () => setConnected(false));
    const refresh = () => { load().catch(() => undefined); };
    const announceCalledQueue = (payload: unknown) => {
      if (!voiceEnabled || !voiceServiceAvailable) return;

      // Backend event payloads may be wrapped; normalize the common shapes.
      const source = payload as any;
      const queue = source?.queue ?? source?.data?.queue ?? source?.data ?? source;
      if (!queue || String(queue.status || '').toUpperCase() !== 'CALLED') return;

      const queueNumber = Number(queue.queueNumber ?? queue.number);
      if (!Number.isFinite(queueNumber) || queueNumber <= 0) return;

      const queueId = String(queue.id ?? queue.queueId ?? `number-${queueNumber}`);
      const eventKey = queueId;
      if (announcedCalls.current.has(eventKey)) return;
      announcedCalls.current.add(eventKey);

      // Keep the in-memory dedupe set bounded during long-running dashboard sessions.
      if (announcedCalls.current.size > 300) {
        const oldest = announcedCalls.current.values().next().value;
        if (oldest) announcedCalls.current.delete(oldest);
      }

      void playAnnouncement(
        `شماره ${queueNumber.toLocaleString('fa-IR')}، لطفاً به باجه مراجعه کنید`
      );
    };

    socket.on('queue:created', refresh);
    socket.on('queue:updated', (payload: unknown) => {
      announceCalledQueue(payload);
      refresh();
    });
    socket.on('queue:cancelled', refresh);
    socket.on('queue:prediction-updated', () => {
      setPredictionRefresh((value) => value + 1);
      refresh();
    });
    return () => { socket.emit('queue:leave', { businessId: business.id }); socket.disconnect(); };
  }, [business?.id, load, voiceEnabled, voiceServiceAvailable]);
  const update = async (item: QueueItem, status: string) => {
    setBusy(item.id); setError('');
    try { await api.patch(`/businesses/${business!.id}/queue/${item.id}/status`, { status }); await load(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(null); }
  };
  const addWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setWalkInBusy(true); setError('');
    try {
      await api.post(`/businesses/${business.id}/queue/walk-in`, walkIn);
      setWalkIn({ customerName: '', customerPhone: '' }); setWalkInOpen(false); await load();
    } catch (e) { setError(getErrorMessage(e)); } finally { setWalkInBusy(false); }
  };
  const cancel = async (item: QueueItem) => {
    setBusy(item.id); setError('');
    try { await api.delete(`/businesses/${business!.id}/queue/${item.id}`); await load(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(null); }
  };
  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem('qp_voice_announcements', String(next));
    if (next) {
      void playAnnouncement('اعلام صوتی کیو پایلوت فعال شد');
    }
  };

  const testVoice = () => {
    void playAnnouncement('اعلام صوتی کیو پایلوت فعال است');
  };

  const filtered = useMemo(() => filter === 'ACTIVE' ? items.filter((i) => ['WAITING', 'CALLED', 'SERVING'].includes(i.status)) : filter === 'DONE' ? items.filter((i) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(i.status)) : items, [items, filter]);
  const waitingItems = items
    .filter((i) => i.status === 'WAITING')
    .sort((a, b) => a.queueNumber - b.queueNumber || new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  const nextWaiting = waitingItems[0];
  const waiting = waitingItems.length;
  if (!business) return <div className="empty-panel">ابتدا کسب‌وکارت را ثبت کن.</div>;
  return <><PageHeading eyebrow="عملیات روزانه" title="مدیریت صف انتظار" description="مراجعه‌کنندگان را به‌ترتیب فراخوانی و وضعیت خدمت را به‌روز کن." action={<div className="queue-heading-actions"><div className={`socket-badge ${connected ? 'is-connected' : ''}`}><i />{connected ? 'اتصال زنده برقرار است' : 'در حال اتصال...'}</div><Button onClick={() => setWalkInOpen(true)}><Plus size={16} /> مراجعه حضوری</Button></div>} />
    {error && <div className="form-error page-error">{error}</div>}
    <div className="voice-announcement-bar">
      <div className="voice-announcement-info">
        <span className={`voice-announcement-icon ${voiceEnabled ? 'is-enabled' : ''}`}>
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </span>
        <span>
          <strong>اعلام صوتی نوبت‌ها</strong>
          <small>{!voiceServiceAvailable ? 'سرویس صدای فارسی محلی در دسترس نیست؛ ابتدا آن را اجرا کن.' : voiceEnabled ? 'با فراخوانی هر نوبت، شماره آن با صدای فارسی اعلام می‌شود.' : 'برای پخش خودکار صدای فراخوانی، این قابلیت را فعال کن.'}</small>
        </span>
      </div>
      <div className="voice-announcement-actions">
        <Button variant="secondary" className="button-small" onClick={testVoice} disabled={!voiceServiceAvailable}>
          <Play size={14} /> تست صدا
        </Button>
        <Button className="button-small" variant={voiceEnabled ? 'secondary' : 'primary'} onClick={toggleVoice} disabled={!voiceServiceAvailable}>
          {voiceEnabled ? 'غیرفعال‌کردن' : 'فعال‌سازی صدا'}
        </Button>
      </div>
    </div>
    <div className="queue-summary"><div><span>در انتظار</span><b>{waiting.toLocaleString('fa-IR')}</b></div><div><span>در حال خدمت</span><b>{items.filter((i) => i.status === 'SERVING').length.toLocaleString('fa-IR')}</b></div><div><span>فراخوانده‌شده</span><b>{items.filter((i) => i.status === 'CALLED').length.toLocaleString('fa-IR')}</b></div><div><span>کل ثبت‌شده</span><b>{items.length.toLocaleString('fa-IR')}</b></div></div>
    {nextWaiting ? <PredictionCard key={nextWaiting.id} title={`تخمین نوبت بعدی · شماره ${nextWaiting.queueNumber}`} endpoint={`/businesses/${business.id}/predictions/queues/${nextWaiting.id}`} refreshKey={predictionRefresh} /> : <div className="prediction-empty"><Clock3 size={17} /><span>در حال حاضر نوبت منتظری برای تخمین وجود ندارد.</span></div>}
    <Card className="table-card"><div className="table-toolbar"><div className="filter-tabs"><button className={filter === 'ACTIVE' ? 'active' : ''} onClick={() => setFilter('ACTIVE')}>صف فعال</button><button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>همه</button><button className={filter === 'DONE' ? 'active' : ''} onClick={() => setFilter('DONE')}>پایان‌یافته</button></div><Button variant="secondary" onClick={() => load()}><RefreshCw size={15} /> تازه‌سازی</Button></div>
      {loading ? <div className="table-loading">در حال دریافت اطلاعات صف...</div> : filtered.length ? <div className="table-scroll"><table><thead><tr><th>شماره</th><th>مراجعه‌کننده</th><th>خدمت</th><th>زمان ورود</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><span className="queue-number">{Number(item.queueNumber).toLocaleString('fa-IR', { minimumIntegerDigits: 2 })}</span></td><td><div className="table-person"><span className="person-avatar"><UserRound size={16} /></span><span><b>{item.user ? `${item.user.firstName} ${item.user.lastName}` : item.customerName || 'مراجعه‌کننده'}</b><small>{item.user?.email || item.customerPhone || 'مراجعه حضوری'}</small></span></div></td><td>{item.appointment?.service?.name || 'مراجعه حضوری'}</td><td>{new Date(item.joinedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</td><td><span className={`status-pill status-${item.status.toLowerCase()}`}>{labels[item.status] || item.status}</span></td><td><div className="row-actions">{item.status === 'WAITING' && <Button className="button-small" loading={busy === item.id} onClick={() => update(item, 'CALLED')}><BellRing size={14} /> فراخوانی</Button>}{item.status === 'CALLED' && <><Button className="button-small" loading={busy === item.id} onClick={() => update(item, 'SERVING')}><CircleDot size={14} /> شروع خدمت</Button><Button className="button-small" variant="secondary" onClick={() => update(item, 'NO_SHOW')}>عدم حضور</Button></>}{item.status === 'SERVING' && <Button className="button-small" loading={busy === item.id} onClick={() => update(item, 'COMPLETED')}><CheckCircle2 size={14} /> تکمیل</Button>}{['WAITING', 'CALLED'].includes(item.status) && <button className="table-icon-danger" title="لغو صف" onClick={() => cancel(item)}><XCircle size={17} /></button>}{['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(item.status) && <span className="muted-dash">—</span>}</div></td></tr>)}</tbody></table></div> : <EmptyState title="موردی در این فهرست نیست" description="با ورود اولین مراجعه‌کننده به صف، اطلاعات اینجا نمایش داده می‌شود." icon={<Clock3 size={24} />} />}
      <div className="table-foot"><span>نمایش {filtered.length.toLocaleString('fa-IR')} مورد</span><span><i className="tiny-live-dot" /> همگام‌سازی خودکار</span></div>
    </Card>
    {walkInOpen && <Modal title="ثبت مراجعه‌کننده حضوری" onClose={() => setWalkInOpen(false)}><form className="form-stack" onSubmit={addWalkIn}><p className="modal-description">برای مراجعه‌کننده حضوری نیازی به ساخت حساب کاربری نیست؛ فقط نام او را وارد کن.</p><Field label="نام و نام خانوادگی" placeholder="مثلاً علی رضایی" value={walkIn.customerName} onChange={(e) => setWalkIn({ ...walkIn, customerName: e.target.value })} required maxLength={150} /><Field label="شماره تماس (اختیاری)" placeholder="۰۹۱۲۱۲۳۴۵۶۷" value={walkIn.customerPhone} onChange={(e) => setWalkIn({ ...walkIn, customerPhone: e.target.value })} maxLength={20} />{error && <div className="form-error">{error}</div>}<div className="modal-actions"><Button variant="secondary" type="button" onClick={() => setWalkInOpen(false)}>انصراف</Button><Button type="submit" loading={walkInBusy}>افزودن به صف <Plus size={15} /></Button></div></form></Modal>}
  </>;
}
