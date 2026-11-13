
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Store,
} from 'lucide-react';

import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

import { api, unwrap, getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { Brand } from '../components/Brand';
import { Button, EmptyState, TextAreaField } from '../components/Ui';

type Business = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
};

type Service = {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
};

export function BookingPage() {
  const { businessId = '' } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState('');

  const [date, setDate] = useState<DateObject | null>(null);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      api
        .get(`/public/businesses/${businessId}`)
        .then((r) => setBusiness(unwrap<Business>(r))),

      api
        .get(`/public/businesses/${businessId}/services`)
        .then((r) => {
          const list = unwrap<Service[]>(r);

          setServices(list);

          if (list[0]) {
            setSelected(list[0].id);
          }
        }),
    ])
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (!authLoading && !user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: `/book/${businessId}` }}
      />
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected || !date || !time) {
      setError('لطفاً خدمت، تاریخ و ساعت را انتخاب کن.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Convert Persian calendar date to Gregorian local date
      const startAtDate = date.toDate();

      // Apply selected local time
      const [hours, minutes] = time.split(':').map(Number);

      startAtDate.setHours(hours, minutes, 0, 0);

      // Convert to UTC ISO string for backend
      const startAt = startAtDate.toISOString();

      await api.post(
        `/businesses/${businessId}/appointments`,
        {
          serviceId: selected,
          startAt,
          note,
        },
      );

      setDone(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const chosen = services.find((s) => s.id === selected);

  return (
    <div className="booking-page">
      <header className="booking-nav container">
        <Link to="/">
          <Brand light />
        </Link>

        <Link to="/businesses" className="nav-login">
          <ArrowRight size={15} />
          همه کسب‌وکارها
        </Link>
      </header>

      <main className="booking-wrap">
        {loading ? (
          <div className="page-loader">
            <span className="loader" />
            در حال بارگذاری...
          </div>
        ) : error && !business ? (
          <div className="form-error">{error}</div>
        ) : done ? (
          <div className="booking-success">
            <span>
              <CheckCircle2 size={36} />
            </span>

            <div className="eyebrow">رزرو ثبت شد</div>

            <h1>درخواست نوبتت ثبت شد.</h1>

            <p>
              درخواست رزرو برای {business?.name} ثبت شد.
              زمان انتخاب‌شده پس از بررسی تداخل‌ها در سیستم ذخیره شده است.
            </p>

            <Button onClick={() => navigate('/businesses')}>
              مشاهده کسب‌وکارهای دیگر
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          <>
            <div className="booking-business">
              <div className="booking-business-icon">
                <Store size={28} />
              </div>

              <div>
                <div className="eyebrow">رزرو آنلاین نوبت</div>

                <h1>{business?.name}</h1>

                <p>
                  {business?.description ||
                    'خدمت موردنظرت را انتخاب کن و زمان مناسب را رزرو کن.'}
                </p>

                <div className="business-contact">
                  {business?.address && (
                    <span>
                      <MapPin size={14} />
                      {business.address}
                    </span>
                  )}

                  {business?.phone && (
                    <span>
                      <Phone size={14} />
                      {business.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form className="booking-form" onSubmit={submit}>
              {/* Service selection */}

              <div className="booking-section-title">
                <span>۱</span>

                <div>
                  <h3>انتخاب خدمت</h3>
                  <p>کدام خدمت را نیاز داری؟</p>
                </div>
              </div>

              {services.length ? (
                <div className="booking-service-list">
                  {services.map((service) => (
                    <button
                      type="button"
                      key={service.id}
                      className={`booking-service ${
                        selected === service.id ? 'selected' : ''
                      }`}
                      onClick={() => setSelected(service.id)}
                    >
                      <span className="service-radio" />

                      <span className="booking-service-copy">
                        <b>{service.name}</b>

                        <small>
                          {service.description ||
                            'ارائه خدمت توسط تیم متخصص'}
                        </small>
                      </span>

                      <span className="booking-service-meta">
                        <b>
                          {Number(service.price).toLocaleString('fa-IR')}
                          {' '}تومان
                        </b>

                        <small>
                          {service.duration.toLocaleString('fa-IR')}
                          {' '}دقیقه
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="هنوز خدمتی تعریف نشده"
                  description="این کسب‌وکار هنوز خدمات قابل رزرو ندارد."
                  icon={<Store size={24} />}
                />
              )}

              {/* Date and time selection */}

              <div className="booking-section-title">
                <span>۲</span>

                <div>
                  <h3>انتخاب زمان</h3>
                  <p>تاریخ و ساعت دلخواهت را مشخص کن.</p>
                </div>
              </div>

              <div className="form-two">
                <div className="persian-date-field">
                  <label>تاریخ رزرو</label>

                  <DatePicker
                    value={date}
                    onChange={(value) => {
                      setDate(
                        value instanceof DateObject ? value : null,
                      );
                    }}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    format="YYYY/MM/DD"
                    minDate={
                      new DateObject({
                        calendar: persian,
                        locale: persian_fa,
                      })
                    }
                    inputClass="persian-date-input"
                    placeholder="انتخاب تاریخ شمسی"
                    editable={false}
                  />

                  <small>
                    تاریخ را به تقویم شمسی انتخاب کن.
                  </small>
                </div>

                <div className="persian-time-field">
                  <label>ساعت شروع</label>

                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <TextAreaField
                label="توضیحات (اختیاری)"
                placeholder="اگر نکته‌ای هست اینجا بنویس..."
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              {error && (
                <div className="form-error">{error}</div>
              )}

              {/* Submit */}

              <div className="booking-submit">
                <div>
                  <small>خدمت انتخاب‌شده</small>

                  <b>{chosen?.name || 'انتخاب نشده'}</b>

                  <span>
                    <Clock3 size={14} />

                    {chosen?.duration
                      ? `${chosen.duration.toLocaleString('fa-IR')} دقیقه`
                      : '—'}
                  </span>
                </div>

                <Button
                  type="submit"
                  loading={saving}
                  disabled={!services.length}
                >
                  ثبت درخواست نوبت
                  <ArrowRight size={16} />
                </Button>
              </div>

              <p className="booking-disclaimer">
                <CalendarDays size={14} />
                ثبت نوبت به معنی درخواست رزرو است؛
                زمان‌های متداخل توسط سیستم بررسی می‌شوند.
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
