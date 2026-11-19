# QueuePilot Web

رابط فارسی و راست‌چین QueuePilot شامل لندینگ، مرور کسب‌وکارها، رزرو نوبت، پنل مدیریت و پیگیری زنده صف.

## اجرا

```bash
cd frontend
npm install
```

فایل `.env` را از روی `.env.example` بسازید و آدرس بک‌اند را تنظیم کنید:

```env
VITE_API_URL=http://localhost:3000
```

سپس:

```bash
npm run dev
```

آدرس پیش‌فرض فرانت‌اند `http://localhost:5173` است.

## ساختار صفحات

- `/` لندینگ
- `/businesses` مرور کسب‌وکارهای فعال
- `/book/:businessId` رزرو نوبت (نیازمند ورود مشتری)
- `/my-queue/:businessId` پیگیری زنده صف مشتری
- `/auth` ورود و ثبت‌نام
- `/app` داشبورد مدیریت
- `/app/queue` مدیریت زنده صف
- `/app/appointments` نوبت‌ها
- `/app/services` خدمات
- `/app/business` اطلاعات کسب‌وکار

## APIهای تکمیلی این رابط

- `GET /public/businesses` و `GET /public/businesses/:businessId`
- `GET /public/businesses/:businessId/services`
- `GET /businesses/:businessId/queue` برای فهرست صف مدیر
- `GET /businesses/:businessId/queue/me` برای صف فعال مشتری
- `POST /businesses/:businessId/queue/walk-in` برای ثبت مراجعه‌کننده حضوری بدون ساخت حساب کاربری

این مسیرها در همین نسخه به بک‌اند اضافه شده‌اند. برای رزرو مشتری، کاربر ابتدا ثبت‌نام/ورود می‌کند؛ سپس درخواست از مسیر موجود `POST /businesses/:businessId/appointments` ارسال می‌شود.

## Queue wait-time prediction (V2)

The queue management page now displays the prediction for the next `WAITING` queue entry using:

`GET /businesses/:businessId/predictions/queues/:queueId`

The customer queue page is wired to display the signed-in customer's own prediction using this intended endpoint:

`GET /businesses/:businessId/predictions/me`

**Backend requirement:** the customer `/predictions/me` endpoint must be implemented before the customer prediction card can return data. It must resolve the authenticated user's active queue for the requested business and must never accept an arbitrary queue ID from the client. The currently documented owner prediction endpoint is not a safe substitute for this customer endpoint.

Both queue pages listen for `queue:prediction-updated` on the existing `/queue` Socket.IO namespace and reload their prediction when the event arrives. The prediction card handles insufficient historical samples (`estimatedWaitMinutes: null`) with a dedicated message rather than displaying a fabricated estimate.

The frontend build could not be verified in this environment because dependency installation (`npm ci`) timed out. Run `npm ci` and `npm run build` locally to verify against the installed dependencies and your backend.
