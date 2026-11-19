import { useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, Clock3, Users } from 'lucide-react';
import { api, getErrorMessage } from '../api';

type Prediction = {
  queueId?: string;
  status?: string;
  aheadCount?: number;
  estimatedWaitMinutes: number | null;
  estimatedStartAt: string | null;
  sampleCount?: number;
  message?: string;
};

type Props = {
  endpoint: string;
  refreshKey?: number;
  title?: string;
};

function readPrediction(payload: any): Prediction {
  // Supports both the standard { data: ... } envelope and the direct response
  // currently returned by the prediction endpoint.
  const value = payload?.data?.data ?? payload?.data ?? payload;
  return {
    queueId: value?.queueId,
    status: value?.status,
    aheadCount: Number(value?.aheadCount ?? 0),
    estimatedWaitMinutes: value?.estimatedWaitMinutes === null || value?.estimatedWaitMinutes === undefined
      ? null
      : Number(value.estimatedWaitMinutes),
    estimatedStartAt: value?.estimatedStartAt ?? null,
    sampleCount: Number(value?.sampleCount ?? 0),
    message: value?.message,
  };
}

function formatClock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export function PredictionCard({ endpoint, refreshKey = 0, title = 'پیش‌بینی زمان انتظار' }: Props) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(endpoint);
        const result = readPrediction(response);
        if (active) setPrediction(result);
      } catch (err) {
        if (active) {
          setPrediction(null);
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [endpoint, refreshKey]);

  const startAt = prediction?.estimatedStartAt ? formatClock(prediction.estimatedStartAt) : null;

  return (
    <section className="prediction-card" aria-live="polite">
      <div className="prediction-card-heading">
        <span className="prediction-card-icon"><Clock3 size={18} /></span>
        <div><h3>{title}</h3><p>برآورد بر اساس وضعیت فعلی صف و سابقه خدمت</p></div>
      </div>

      {loading ? (
        <div className="prediction-state">در حال محاسبه زمان تقریبی...</div>
      ) : error ? (
        <div className="prediction-state prediction-state-warning"><AlertCircle size={17} /><span>{error}</span></div>
      ) : !prediction || prediction.estimatedWaitMinutes === null ? (
        <div className="prediction-state prediction-state-warning">
          <AlertCircle size={17} />
          <span>{prediction?.message || 'داده کافی برای تخمین قابل اتکا وجود ندارد. با تکمیل سوابق خدمت، تخمین نمایش داده می‌شود.'}</span>
        </div>
      ) : (
        <>
          <div className="prediction-primary">
            <span>زمان انتظار تخمینی</span>
            <strong>{prediction.estimatedWaitMinutes.toLocaleString('fa-IR')} <small>دقیقه</small></strong>
          </div>
          <div className="prediction-meta">
            {typeof prediction.aheadCount === 'number' && <span><Users size={15} /> {prediction.aheadCount.toLocaleString('fa-IR')} نفر جلوتر</span>}
            {startAt && <span><CalendarClock size={15} /> زمان تقریبی شروع: {startAt}</span>}
          </div>
          <p className="prediction-footnote">بر اساس {Number(prediction.sampleCount || 0).toLocaleString('fa-IR')} نمونه تاریخی. این زمان تقریبی است و ممکن است تغییر کند.</p>
        </>
      )}
    </section>
  );
}
