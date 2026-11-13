import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { Button, Field } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = (location.state as { from?: string } | null)?.from || '/app';
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const update = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate(redirect, { replace: true });
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };
  return <div className="auth-page"><div className="auth-side"><Link to="/"><Brand light /></Link><div className="auth-side-copy"><div className="eyebrow">مدیریت، با دیدی روشن‌تر</div><h1>هر مراجعه،<br /><span>یک تجربه بهتر.</span></h1><p>نوبت‌ها و صف انتظار کسب‌وکارت را در یک فضای ساده و یکپارچه مدیریت کن.</p><div className="auth-side-points"><span><Sparkles size={16} /> مدیریت یکپارچه نوبت و صف</span><span><LockKeyhole size={16} /> دسترسی امن و اختصاصی</span></div></div><div className="auth-side-foot">QueuePilot · نظم در جریان کار</div><div className="auth-decoration deco-one" /><div className="auth-decoration deco-two" /></div><div className="auth-form-side"><div className="auth-form-wrap"><Link to="/" className="back-home"><ArrowRight size={16} /> بازگشت به صفحه اصلی</Link><motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="auth-form-card"><div className="auth-mobile-brand"><Brand /></div><div className="eyebrow">{mode === 'login' ? 'خوش برگشتی' : 'شروع یک مسیر منظم'}</div><h2>{mode === 'login' ? 'وارد حساب خودت شو' : 'حساب کاربری بساز'}</h2><p className="auth-subtitle">{mode === 'login' ? 'برای ادامه، اطلاعات ورودت را وارد کن.' : 'چند قدم کوتاه تا راه‌اندازی فضای کاری تو.'}</p><div className="auth-tabs"><button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>ورود</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>ثبت‌نام</button></div><form onSubmit={submit} className="form-stack">{mode === 'register' && <div className="form-two"><Field label="نام" placeholder="مثلاً محمد" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required /><Field label="نام خانوادگی" placeholder="مثلاً رضایی" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required /></div>}<Field label="ایمیل" type="email" placeholder="name@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} required autoComplete="email" /><label className="field"><span>رمز عبور</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} placeholder="حداقل ۸ کاراکتر" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <div className="form-error">{error}</div>}<Button loading={loading} className="button-full">{mode === 'login' ? 'ورود به فضای کاری' : 'ساخت حساب و ادامه'} <ArrowRight size={17} /></Button></form><div className="auth-note"><LockKeyhole size={14} /> اطلاعات حساب تو به‌صورت امن نگهداری می‌شود.</div></motion.div></div></div></div>;
}
