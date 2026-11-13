import { useCallback, useEffect, useState } from 'react';
import { Clock3, Edit3, Plus, Trash2, Zap } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api, unwrap, getErrorMessage } from '../api';
import type { DashboardContext } from '../components/DashboardLayout';
import { Button, Card, EmptyState, Field, Modal, PageHeading, TextAreaField } from '../components/Ui';

type Service = { id: string; name: string; description?: string | null; duration: number; price: number; isActive: boolean };
const empty = { name: '', description: '', duration: '30', price: '0' };
export function ServicesPage() {
  const { business } = useOutletContext<DashboardContext>();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { if (!business) return; const res = await api.get(`/businesses/${business.id}/services?limit=100`); setItems(unwrap<Service[]>(res)); }, [business?.id]);
  useEffect(() => { if (!business) { setLoading(false); return; } load().catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false)); }, [business?.id, load]);
  const open = (item?: Service) => { setEditing(item || null); setForm(item ? { name: item.name, description: item.description || '', duration: String(item.duration), price: String(item.price) } : empty); setError(''); setModal(true); };
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setError(''); const payload = { name: form.name, description: form.description, duration: Number(form.duration), price: Number(form.price) }; try { if (editing) await api.patch(`/businesses/${business!.id}/services/${editing.id}`, payload); else await api.post(`/businesses/${business!.id}/services`, payload); setModal(false); await load(); } catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); } };
  const remove = async (item: Service) => { if (!confirm(`خدمت «${item.name}» حذف شود؟`)) return; try { await api.delete(`/businesses/${business!.id}/services/${item.id}`); await load(); } catch (e) { setError(getErrorMessage(e)); } };
  if (!business) return <div className="empty-panel">ابتدا کسب‌وکارت را ثبت کن.</div>;
  return <><PageHeading eyebrow="کاتالوگ خدمات" title="خدمات کسب‌وکار" description="خدماتی که مشتریان می‌توانند برای آن‌ها نوبت رزرو کنند." action={<Button onClick={() => open()}><Plus size={17} /> افزودن خدمت</Button>} />{error && <div className="form-error page-error">{error}</div>}
    {loading ? <div className="table-loading">در حال دریافت خدمات...</div> : items.length ? <div className="services-grid">{items.map((item, i) => <Card className="service-card" key={item.id}><div className="service-card-top"><span className={`service-symbol symbol-${i % 4}`}><Zap size={20} /></span><span className={`status-pill ${item.isActive ? 'status-serving' : 'status-cancelled'}`}>{item.isActive ? 'فعال' : 'غیرفعال'}</span></div><h3>{item.name}</h3><p>{item.description || 'بدون توضیحات'}</p><div className="service-meta"><span><Clock3 size={15} /> {item.duration.toLocaleString('fa-IR')} دقیقه</span><b>{Number(item.price).toLocaleString('fa-IR')} <small>تومان</small></b></div><div className="service-actions"><button onClick={() => open(item)}><Edit3 size={15} /> ویرایش</button><button className="delete-action" onClick={() => remove(item)}><Trash2 size={15} /> حذف</button></div></Card>)}</div> : <Card><EmptyState title="هنوز خدمتی تعریف نکرده‌ای" description="اولین خدمت را اضافه کن تا مشتریان بتوانند برای آن نوبت رزرو کنند." icon={<Zap size={24} />} /></Card>}
    {modal && <Modal title={editing ? 'ویرایش خدمت' : 'افزودن خدمت جدید'} onClose={() => setModal(false)}><form className="form-stack" onSubmit={submit}><Field label="نام خدمت" placeholder="مثلاً اصلاح مو" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={150} /><TextAreaField label="توضیحات" placeholder="توضیح کوتاهی درباره خدمت..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div className="form-two"><Field label="مدت (دقیقه)" type="number" min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required /><Field label="قیمت (تومان)" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><Button variant="secondary" type="button" onClick={() => setModal(false)}>انصراف</Button><Button type="submit" loading={busy}>{editing ? 'ذخیره تغییرات' : 'ثبت خدمت'}</Button></div></form></Modal>}
  </>;
}
