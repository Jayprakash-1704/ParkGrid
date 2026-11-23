import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarCheck2, CreditCard, MapPin, QrCode } from 'lucide-react';
import { fetchBookingsThunk, fetchPaymentsThunk } from '../../store/slices/bookingSlice.js';
import { fetchParkingLotsThunk } from '../../store/slices/parkingSlice.js';
import {
  Button,
  EmptyState,
  Panel,
  Skeleton,
  StatusText,
} from '../../components/ui/primitives.jsx';
import { formatCurrency, formatDateTime } from '../../lib/utils.js';

export function DriverDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items: bookings, payments, loading } = useSelector((state) => state.bookings);
  const { lots } = useSelector((state) => state.parking);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
    dispatch(fetchPaymentsThunk());
    dispatch(fetchParkingLotsThunk());
  }, [dispatch]);

  const activeBookings = bookings.filter((b) =>
    ['CONFIRMED', 'ACTIVE'].includes(b.status)
  );
  const totalSpent = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const liveAvailable = lots.reduce((sum, l) => sum + (l.availableSlots || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Vehicle plate{' '}
            <span className="font-mono font-medium text-slate-900">
              {user?.vehicleNumber || 'Not set'}
            </span>{' '}
            · Manage live reservations and gate QR passes.
          </p>
        </div>
        <Button variant="emerald" onClick={() => navigate('/driver/find')}>
          Find Nearby Parking
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Active / Upcoming Passes</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {activeBookings.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Ready for QR gate scan</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Total Reservations</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {bookings.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">All-time booking records</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Verified Payments</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(totalSpent)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Settled via Cashfree</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Live Open Bays Nearby</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {liveAvailable}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across {lots.length} active facilities</p>
        </Panel>
      </div>

      {/* Active QR Passes Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Active & Upcoming Reservations
          </h2>
          <Link
            to="/driver/reservations"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            View all reservations
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
        ) : activeBookings.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="No active reservations"
            description="Search nearby parking lots to select an available bay and automatically generate your QR entry pass."
            action={
              <Button variant="emerald" onClick={() => navigate('/driver/find')}>
                Find Parking
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeBookings.map((booking) => (
              <Panel
                key={booking._id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-900">
                      {booking.bookingCode}
                    </span>
                    <span>·</span>
                    <StatusText status={booking.status} />
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 truncate">
                    {booking.parkingLot?.name}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Bay{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {booking.parkingSlot?.slotNumber}
                    </span>{' '}
                    ({booking.parkingSlot?.floor}, {booking.parkingSlot?.slotType}) ·{' '}
                    <span className="font-mono">{booking.vehicleNumber}</span>
                  </p>
                  <p className="font-mono text-xs tabular-nums text-slate-500">
                    {formatDateTime(booking.startTime)} → {formatDateTime(booking.endTime)}
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/driver/reservations/${booking._id}`)}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Open QR Pass
                    </Button>
                  </div>
                </div>

                {booking.qrDataUrl && (
                  <div className="shrink-0 self-start sm:self-center rounded-lg border border-slate-200 bg-white p-2">
                    <img
                      src={booking.qrDataUrl}
                      alt={`QR pass ${booking.bookingCode}`}
                      className="h-24 w-24 object-contain"
                    />
                  </div>
                )}
              </Panel>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Search Facilities</p>
              <p className="text-xs text-slate-500">Filter by EV bays & hourly price</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/driver/find')}>
            Explore
          </Button>
        </Panel>
        <Panel className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">QR Pass Wallet</p>
              <p className="text-xs text-slate-500">Download passes for offline gate scan</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/driver/qr-codes')}>
            Open
          </Button>
        </Panel>
        <Panel className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Payment Ledger</p>
              <p className="text-xs text-slate-500">Receipts & Cashfree refund status</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/driver/payments')}>
            View
          </Button>
        </Panel>
      </div>
    </div>
  );
}
