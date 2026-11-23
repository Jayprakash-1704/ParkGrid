import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  CalendarCheck2,
  Copy,
  CreditCard,
  Download,
  QrCode,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  cancelBookingThunk,
  fetchBookingsThunk,
  fetchPaymentsThunk,
} from '../../store/slices/bookingSlice.js';
import { updateProfileThunk } from '../../store/slices/authSlice.js';
import { api, getApiErrorMessage } from '../../services/api.js';
import {
  Button,
  EmptyState,
  Input,
  Label,
  Panel,
  Skeleton,
  StatusText,
} from '../../components/ui/primitives.jsx';
import { formatCurrency, formatDateTime } from '../../lib/utils.js';

export function MyReservationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: bookings, loading } = useSelector((state) => state.bookings);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  const filtered = bookings.filter((b) =>
    statusFilter === 'ALL' ? true : b.status === statusFilter
  );

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    const res = await dispatch(
      cancelBookingThunk({ bookingId, reason: 'Cancelled by driver from dashboard' })
    );
    setCancellingId(null);
    if (cancelBookingThunk.fulfilled.match(res)) {
      toast.success('Reservation cancelled and refund processed.');
    } else {
      toast.error(res.payload || 'Unable to cancel reservation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            My Reservations
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track live reservation status, open QR entry passes, or cancel eligible bookings.
          </p>
        </div>
        <Button variant="emerald" onClick={() => navigate('/driver/find')}>
          New Reservation
        </Button>
      </div>

      {/* Segmented Status Filter */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        {['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === st
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="No reservations found"
          description="Reserve an available parking bay to see your bookings and digital QR passes here."
          action={
            <Button variant="emerald" onClick={() => navigate('/driver/find')}>
              Find Parking
            </Button>
          }
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Facility & Bay</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {b.bookingCode}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        {b.vehicleNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">
                        {b.parkingLot?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Bay <span className="font-mono font-medium">{b.parkingSlot?.slotNumber}</span> ·{' '}
                        {b.parkingSlot?.floor}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-slate-600">
                      <p>{formatDateTime(b.startTime)}</p>
                      <p className="text-slate-400">to {formatDateTime(b.endTime)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                      {formatCurrency(b.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusText status={b.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {b.qrDataUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/driver/reservations/${b._id}`)}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            QR Pass
                          </Button>
                        )}
                        {['CONFIRMED', 'PENDING_PAYMENT'].includes(b.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={cancellingId === b._id}
                            onClick={() => handleCancel(b._id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {cancellingId === b._id ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function ReservationConfirmationQrPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await api.get(`/reservations/${id}`);
        if (active) setBooking(res.data.data.booking);
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleDownloadQr = () => {
    if (!booking?.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = booking.qrDataUrl;
    link.download = `ParkGrid-QR-${booking.bookingCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR pass PNG downloaded.');
  };

  const handleCopyToken = async () => {
    if (!booking?.qrUrl) return;
    await navigator.clipboard.writeText(booking.qrUrl);
    toast.success('QR scan URL copied to clipboard.');
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  if (!booking) {
    return (
      <EmptyState
        icon={QrCode}
        title="Reservation not found"
        description="This reservation could not be located."
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to="/driver/reservations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to My Reservations</span>
      </Link>

      <Panel className="p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-7 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-900">
                  {booking.bookingCode}
                </span>
                <span>·</span>
                <StatusText status={booking.status} />
                <span>·</span>
                <StatusText status={booking.payment?.status} />
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
                {booking.parkingLot?.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {booking.parkingLot?.address}, {booking.parkingLot?.city}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200 py-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Assigned Bay</p>
                <p className="mt-0.5 font-mono text-base font-bold text-slate-900">
                  {booking.parkingSlot?.slotNumber}
                </p>
                <p className="text-xs text-slate-500">
                  {booking.parkingSlot?.floor} · {booking.parkingSlot?.slotType}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Vehicle Plate</p>
                <p className="mt-0.5 font-mono text-base font-bold text-slate-900">
                  {booking.vehicleNumber}
                </p>
                <p className="text-xs text-slate-500">{booking.durationHours} hour(s)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Scheduled Entry</p>
                <p className="mt-0.5 font-mono text-xs font-medium tabular-nums text-slate-900">
                  {formatDateTime(booking.startTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Scheduled Exit</p>
                <p className="mt-0.5 font-mono text-xs font-medium tabular-nums text-slate-900">
                  {formatDateTime(booking.endTime)}
                </p>
              </div>
              {booking.entryTime && (
                <div>
                  <p className="text-xs text-slate-500">Actual Gate Entry</p>
                  <p className="mt-0.5 font-mono text-xs font-medium tabular-nums text-emerald-700">
                    {formatDateTime(booking.entryTime)}
                  </p>
                </div>
              )}
              {booking.exitTime && (
                <div>
                  <p className="text-xs text-slate-500">Actual Gate Exit</p>
                  <p className="mt-0.5 font-mono text-xs font-medium tabular-nums text-slate-700">
                    {formatDateTime(booking.exitTime)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid (Cashfree)</span>
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
              {booking.payment?.transactionId && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono text-slate-700">
                    {booking.payment.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-xs font-semibold text-slate-700">
              Gate Entry & Exit QR Pass
            </p>
            {booking.qrDataUrl ? (
              <>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <img
                    src={booking.qrDataUrl}
                    alt={`QR Pass for ${booking.bookingCode}`}
                    className="h-52 w-52 object-contain"
                  />
                </div>
                <p className="mt-3 max-w-full truncate font-mono text-[11px] text-slate-500">
                  {booking.qrUrl}
                </p>
                <div className="mt-4 flex w-full flex-col gap-2">
                  <Button variant="emerald" className="w-full" onClick={handleDownloadQr}>
                    <Download className="h-4 w-4" />
                    Download QR PNG
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleCopyToken}>
                    <Copy className="h-4 w-4" />
                    Copy QR Scan URL
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-xs text-slate-500">
                QR code is unavailable for unpaid or cancelled reservations.
              </p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function QrCodesWalletPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: bookings, loading } = useSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  const passes = bookings.filter((b) => Boolean(b.qrDataUrl));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          QR Entry & Exit Passes
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Present these auto-generated passes to the gate attendant on arrival and departure.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : passes.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No QR passes generated yet"
          description="Complete a parking reservation to automatically generate a cryptographically verified QR pass."
          action={
            <Button variant="emerald" onClick={() => navigate('/driver/find')}>
              Reserve a Bay
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {passes.map((b) => (
            <Panel key={b._id} className="p-5 flex flex-col items-center text-center">
              <div className="flex w-full items-center justify-between text-xs">
                <span className="font-mono font-semibold text-slate-900">
                  {b.bookingCode}
                </span>
                <StatusText status={b.status} />
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2.5">
                <img
                  src={b.qrDataUrl}
                  alt={b.bookingCode}
                  className="h-44 w-44 object-contain"
                />
              </div>
              <h3 className="mt-4 font-display text-sm font-semibold text-slate-900">
                {b.parkingLot?.name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Bay <span className="font-mono font-medium text-slate-900">{b.parkingSlot?.slotNumber}</span> ·{' '}
                <span className="font-mono">{b.vehicleNumber}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => navigate(`/driver/reservations/${b._id}`)}
              >
                Inspect & Download
              </Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export function PaymentHistoryPage() {
  const dispatch = useDispatch();
  const { payments, paymentsLoading } = useSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchPaymentsThunk());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Payment History
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cashfree settlement records, transaction references, and cancellation refunds.
        </p>
      </div>

      {paymentsLoading ? (
        <Skeleton className="h-64" />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records yet"
          description="Your completed Cashfree transactions and refunds will appear here."
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Booking / Facility</th>
                  <th className="px-4 py-3">Transaction Ref</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((p) => (
                  <tr key={p.bookingId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-slate-600">
                      {formatDateTime(p.paidAt || p.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">{p.parkingLot}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {p.bookingCode} · Bay {p.slotNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {p.transactionId || p.orderId || '—'}
                      {p.refundId && (
                        <p className="text-[11px] text-slate-400">Refund: {p.refundId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {p.method || 'Cashfree'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusText status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function DriverProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await dispatch(updateProfileThunk({ name, phone, vehicleNumber }));
    setSaving(false);
    if (updateProfileThunk.fulfilled.match(res)) {
      toast.success('Profile updated.');
    } else {
      toast.error(res.payload || 'Update failed.');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Driver Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep your default vehicle plate and phone number updated for faster booking.
        </p>
      </div>

      <Panel className="p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prof-email">Email Address</Label>
            <Input id="prof-email" value={user?.email || ''} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-name">Full Name</Label>
            <Input
              id="prof-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-phone">Phone Number</Label>
            <Input
              id="prof-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-plate">Default Vehicle Plate</Label>
            <Input
              id="prof-plate"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="font-mono uppercase"
            />
          </div>
          <Button type="submit" variant="emerald" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
