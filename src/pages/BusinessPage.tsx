import { useEffect, useState } from 'react';
import { Building2, MapPin, Phone, Save } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import type { DashboardContext } from '../components/DashboardLayout';
import { Button, Card, Field, PageHeading, TextAreaField } from '../components/Ui';

export function BusinessPage() {
  const { business, refreshBusiness } = useOutletContext<DashboardContext>();
  const [form, setForm] = useState({ name: '', description: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { setForm({ name: business?.name || '', description: business?.description || '', phone: business?.phone || '', address: business?.address || '' }); }, [business?.id]);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setError(''); setSuccess(''); try { if (business) await api.patch(`/businesses/${business.id}`, form); else await api.post('/businesses', form); await refreshBusiness(); setSuccess('اطلاعات کسب‌وکار با موفقیت ذخیره شد.'); } catch (e) { setError(getErrorMessage(e)); } finally { setLoading(false); } };
  return <><PageHeading eyebrow="پروفایل کسب‌وکار" title={business ? 'تنظیمات کسب‌وکار' : 'راه‌اندازی کسب‌وکار'} description="اطلاعاتی که مشتریان برای شناخت و ارتباط با کسب‌وکار تو نیاز دارند." />
    <div className="settings-grid"><Card className="settings-form-card"><div className="card-heading"><div><h3>اطلاعات اصلی</h3><p>این اطلاعات در صفحه عمومی کسب‌وکار نمایش داده می‌شود.</p></div><span className="settings-heading-icon"><Building2 size={19} /></span></div><form className="form-stack" onSubmit={submit}><Field label="نام کسب‌وکار" placeholder="مثلاً کلینیک آرام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={150} /><TextAreaField label="درباره کسب‌وکار" placeholder="چند جمله درباره خدمات و فضای کسب‌وکارت..." rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div className="form-two"><Field label="شماره تماس" placeholder="۰۹۱۲۱۲۳۴۵۶۷" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Field label="نشانی" placeholder="شهر، خیابان، پلاک..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>{error && <div className="form-error">{error}</div>}{success && <div className="form-success">{success}</div>}<div className="form-submit-row"><Button loading={loading}><Save size={16} /> {business ? 'ذخیره تغییرات' : 'ایجاد کسب‌وکار'}</Button></div></form></Card>
      <div className="settings-aside"><Card className="profile-preview"><div className="preview-cover"><span className="preview-cover-mark"><Building2 size={27} /></span></div><div className="profile-preview-body"><span className="status-pill status-serving">پروفایل کسب‌وکار</span><h3>{form.name || 'نام کسب‌وکار شما'}</h3><p>{form.description || 'توضیحات کسب‌وکار در این بخش نمایش داده می‌شود.'}</p><div className="profile-detail"><Phone size={15} /> {form.phone || 'شماره تماس ثبت نشده'}</div><div className="profile-detail"><MapPin size={15} /> {form.address || 'نشانی ثبت نشده'}</div></div></Card><div className="settings-tip"><span>نکته</span><p>بعد از ثبت کسب‌وکار، خدماتت را تعریف کن. سپس مشتریان می‌توانند از صفحه عمومی، خدمات را ببینند و نوبت رزرو کنند.</p></div></div></div>
  </>;
}
