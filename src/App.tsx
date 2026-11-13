import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { DashboardLayout } from './components/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { QueuePage } from './pages/QueuePage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ServicesPage } from './pages/ServicesPage';
import { BusinessPage } from './pages/BusinessPage';
import { BookingPage } from './pages/BookingPage';
import { MyQueuePage } from './pages/MyQueuePage';
import { BrowseBusinessesPage } from './pages/BrowseBusinessesPage';
import { Toaster } from 'sonner';

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader"><span className="loader" />در حال آماده‌سازی فضای شما...</div>;
  return user ? children : <Navigate to="/auth" replace state={{ from: location.pathname }} />;
}

export default function App() {
  return (
    <>
     <Toaster
        position="top-center"
        richColors
        closeButton
        duration={4000}
        dir="rtl"
      />
     <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/businesses" element={<BrowseBusinessesPage />} />
    <Route path="/book/:businessId" element={<BookingPage />} />
    <Route path="/my-queue/:businessId" element={<Protected><MyQueuePage /></Protected>} />
    <Route path="/app" element={<Protected><DashboardLayout /></Protected>}>
      <Route index element={<OverviewPage />} />
      <Route path="queue" element={<QueuePage />} />
      <Route path="appointments" element={<AppointmentsPage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="business" element={<BusinessPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
    </>
  )
}
