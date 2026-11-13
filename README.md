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
