import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'sonner';

import { hydrateAuth } from './store/slices/authSlice.js';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { DashboardLayout } from './components/layout/DashboardLayout.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';

// Public Pages
import { HomePage } from './pages/public/HomePage.jsx';
import { LoginPage, RegisterPage } from './pages/public/AuthPages.jsx';
import { AboutPage, ContactPage } from './pages/public/AboutContactPages.jsx';

// Driver Pages
import { DriverDashboardPage } from './pages/driver/DriverDashboardPage.jsx';
import { FindParkingPage } from './pages/driver/FindParkingPage.jsx';
import { ParkingDetailReservePage } from './pages/driver/ParkingDetailReservePage.jsx';
import {
  DriverProfilePage,
  MyReservationsPage,
  PaymentHistoryPage,
  QrCodesWalletPage,
  ReservationConfirmationQrPage,
} from './pages/driver/DriverReservationsPages.jsx';

// Attendant Pages
import {
  AttendantDashboardPage,
  AttendantHistoryPage,
  AttendantReservationsPage,
  QrScannerPage,
} from './pages/attendant/AttendantPages.jsx';

// Lot Admin Pages
import {
  LotAdminDashboardPage,
  LotReportsPage,
  LotReservationsPage,
  ManageAttendantsPage,
  ManageLotsPage,
  ManageSlotsPage,
} from './pages/lot-admin/LotAdminPages.jsx';

// Super Admin Pages
import {
  ManageAllLocationsPage,
  ManageUsersPage,
  SuperAdminDashboardPage,
  SystemSettingsPage,
} from './pages/super-admin/SuperAdminPages.jsx';

function ScanDeepLinkRedirect() {
  const { token } = useParams();
  const { user, initialized } = useSelector((state) => state.auth);

  if (!initialized) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (['ATTENDANT', 'LOT_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return <Navigate to={`/attendant/scanner/${token}`} replace />;
  }
  return <Navigate to="/driver/reservations" replace />;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/parking" element={<FindParkingPage publicMode />} />
          <Route path="/parking/:id" element={<ParkingDetailReservePage publicMode />} />
        </Route>

        {/* Direct QR scan deep-link (/scan/:token) */}
        <Route path="/scan/:token" element={<ScanDeepLinkRedirect />} />

        {/* Driver Dashboard */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={['DRIVER', 'SUPER_ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DriverDashboardPage />} />
          <Route path="find" element={<FindParkingPage />} />
          <Route path="parking/:id" element={<ParkingDetailReservePage />} />
          <Route path="reservations" element={<MyReservationsPage />} />
          <Route path="reservations/:id" element={<ReservationConfirmationQrPage />} />
          <Route path="qr-codes" element={<QrCodesWalletPage />} />
          <Route path="payments" element={<PaymentHistoryPage />} />
          <Route path="profile" element={<DriverProfilePage />} />
        </Route>

        {/* Attendant Dashboard */}
        <Route
          path="/attendant"
          element={
            <ProtectedRoute allowedRoles={['ATTENDANT', 'LOT_ADMIN', 'SUPER_ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AttendantDashboardPage />} />
          <Route path="scanner" element={<QrScannerPage />} />
          <Route path="scanner/:token" element={<QrScannerPage />} />
          <Route path="reservations" element={<AttendantReservationsPage />} />
          <Route path="history" element={<AttendantHistoryPage />} />
        </Route>

        {/* Lot Admin Dashboard */}
        <Route
          path="/lot-admin"
          element={
            <ProtectedRoute allowedRoles={['LOT_ADMIN', 'SUPER_ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LotAdminDashboardPage />} />
          <Route path="lots" element={<ManageLotsPage />} />
          <Route path="slots" element={<ManageSlotsPage />} />
          <Route path="attendants" element={<ManageAttendantsPage />} />
          <Route path="reservations" element={<LotReservationsPage />} />
          <Route path="analytics" element={<LotAdminDashboardPage />} />
          <Route path="reports" element={<LotReportsPage />} />
        </Route>

        {/* Super Admin Dashboard */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboardPage />} />
          <Route path="users" element={<ManageUsersPage />} />
          <Route path="lot-admins" element={<ManageUsersPage onlyLotAdmins />} />
          <Route path="locations" element={<ManageAllLocationsPage />} />
          <Route path="analytics" element={<SuperAdminDashboardPage />} />
          <Route path="settings" element={<SystemSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
