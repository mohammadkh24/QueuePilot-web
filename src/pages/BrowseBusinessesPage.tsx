import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Search, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, unwrap, getErrorMessage } from '../api';
import { Brand } from '../components/Brand';
import { Button, EmptyState } from '../components/Ui';

type Business = { id: string; name: string; description?: string; address?: string; phone?: string };
export function BrowseBusinessesPage() {
  const [items, setItems] = useState<Business[]>([]); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async (term = '') => { setLoading(true); setError(''); try { const res = await api.get(`/public/businesses?limit=50&search=${encodeURIComponent(term)}`); setItems(unwrap<Business[]>(res)); } catch (e) { setError(getErrorMessage(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <div className="browse-page"><header className="browse-nav container"><Link to="/"><Brand light /></Link><Link to="/auth" className="nav-login">ورود کسب‌وکارها</Link></header><main className="container browse-main"><div className="eyebrow">انتخاب مقصد</div><h1>کسب‌وکار موردنظرت را پیدا کن.</h1><p>خدمات را ببین و در زمان مناسب، نوبتت را رزرو کن.</p><form className="business-search" onSubmit={(e) => { e.preventDefault(); load(search); }}><Search size={19} /><input placeholder="جست‌وجوی نام یا نوع کسب‌وکار..." value={search} onChange={(e) => setSearch(e.target.value)} /><Button type="submit">جست‌وجو</Button></form>{error && <div className="form-error">{error}</div>}{loading ? <div className="table-loading">در حال دریافت کسب‌وکارها...</div> : items.length ? <div className="browse-grid">{items.map((item, i) => <article className="browse-card" key={item.id}><div className={`browse-card-icon browse-icon-${i % 4}`}><Store size={23} /></div><h3>{item.name}</h3><p>{item.description || 'ارائه خدمات با امکان رزرو آنلاین نوبت.'}</p><small><MapPin size={14} /> {item.address || 'نشانی ثبت نشده'}</small><Link to={`/book/${item.id}`}>مشاهده خدمات و رزرو <ArrowLeft size={16} /></Link></article>)}</div> : <EmptyState title="کسب‌وکاری پیدا نشد" description="عبارت دیگری را جست‌وجو کن یا بعداً دوباره سر بزن." icon={<Store size={25} />} />}</main></div>;
}
