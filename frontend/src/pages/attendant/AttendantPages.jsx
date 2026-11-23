import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  History,
  LogIn,
  LogOut,
  ScanLine,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchBookingsThunk } from '../../store/slices/bookingSlice.js';
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
import { formatDateTime } from '../../lib/utils.js';

export function AttendantDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items: bookings, loading } = useSelector((state) => state.bookings);
  const [slots, setSlots] = useState([]);

  const lotId = user?.assignedLot?._id || user?.assignedLot;

  useEffect(() => {
    dispatch(fetchBookingsThunk());
    if (lotId) {
      api
        .get('/parking-slots', { params: { parkingLotId: lotId } })
        .then((res) => setSlots(res.data.data.slots || []))
        .catch(() => {});
    }
  }, [dispatch, lotId]);

  const upcomingCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const parkedNow = bookings.filter((b) => b.status === 'ACTIVE').length;
  const completedToday = bookings.filter((b) => b.status === 'COMPLETED').length;
  const openSlots = slots.filter((s) => s.status === 'AVAILABLE').length;

  const handleToggleSlotMaintenance = async (slot) => {
    const nextStatus = slot.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      const res = await api.patch(`/parking-slots/${slot._id}`, { status: nextStatus });
      const updated = res.data.data.slot;
      setSlots((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      toast.success(`Bay ${updated.slotNumber} marked ${updated.status}.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Gate Operations Console
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Assigned facility:{' '}
            <strong className="font-semibold text-slate-900">
              {user?.assignedLot?.name || 'All Connected Lots'}
            </strong>
          </p>
        </div>
        <Button variant="emerald" onClick={() => navigate('/attendant/scanner')}>
          <ScanLine className="h-4 w-4" />
          Open QR Gate Scanner
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Expected Arrivals</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-700">
            {upcomingCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Confirmed QR passes pending entry</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Currently Parked</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {parkedNow}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active vehicles inside garage</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Open Bays Available</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {openSlots}
            <span className="text-sm font-normal text-slate-400">/{slots.length}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Live facility inventory</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Completed Exits</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {completedToday}
          </p>
          <p className="mt-1 text-xs text-slate-500">Verified departures</p>
        </Panel>
      </div>

      {/* Live Facility Bay Status Control */}
      {slots.length > 0 && (
        <Panel className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Live Bay Status Override
              </h2>
              <p className="text-xs text-slate-500">
                Toggle open bays in or out of maintenance. Reserved and occupied bays sync via QR scans.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {slots.map((slot) => {
              const canToggle =
                slot.status === 'AVAILABLE' || slot.status === 'MAINTENANCE';
              return (
                <div
                  key={slot._id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between gap-2"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {slot.slotNumber}
                    </p>
                    <StatusText status={slot.status} className="text-[11px]" />
                  </div>
                  {canToggle && (
                    <button
                      type="button"
                      onClick={() => handleToggleSlotMaintenance(slot)}
                      className="text-left text-[11px] font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      {slot.status === 'MAINTENANCE' ? 'Set Open' : 'Maintenance'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Active Gate Queue Preview */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Ready for Entry / Exit Scan
        </h2>
        {loading ? (
          <Skeleton className="h-44" />
        ) : (
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Driver & Plate</th>
                    <th className="px-4 py-3">Bay</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings
                    .filter((b) => ['CONFIRMED', 'ACTIVE'].includes(b.status))
                    .map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                          {b.bookingCode}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{b.driver?.name}</p>
                          <p className="font-mono text-xs text-slate-500">
                            {b.vehicleNumber}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                          {b.parkingSlot?.slotNumber}
                        </td>
                        <td className="px-4 py-3">
                          <StatusText status={b.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/attendant/scanner?token=${encodeURIComponent(b.qrToken || '')}`)
                            }
                          >
                            Verify Pass
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

export function QrScannerPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const { items: bookings } = useSelector((state) => state.bookings);

  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  const verifyRawQr = async (rawValue) => {
    if (!rawValue?.trim()) {
      toast.error('Enter or scan a QR URL or token first.');
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post('/qr/verify', { qrUrl: rawValue.trim() });
      setVerificationResult(res.data.data);
      toast.success('QR pass verified by server.');
    } catch (err) {
      setVerificationResult(null);
      toast.error(getApiErrorMessage(err, 'QR verification failed.'));
    } finally {
      setVerifying(false);
    }
  };

  // Auto-verify if navigated via /scan/:token or ?token=
  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get('token');
    const initial = params.token || queryToken;
    if (initial) {
      setManualInput(initial);
      verifyRawQr(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const html5Qr = new Html5Qrcode('parkgrid-qr-reader');
      scannerRef.current = html5Qr;
      setCameraActive(true);
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          setManualInput(decodedText);
          await stopCamera();
          await verifyRawQr(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setCameraActive(false);
      setCameraError(
        err?.message ||
          'Camera unavailable in this browser/sandbox. Use the QR URL input or Quick Pass selector below.'
      );
    }
  };

  const handleConfirmEntry = async () => {
    const token = verificationResult?.booking?.qrToken;
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await api.post('/qr/entry', { qrToken: token });
      toast.success(res.data.message);
      await verifyRawQr(token);
      dispatch(fetchBookingsThunk());
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmExit = async () => {
    const token = verificationResult?.booking?.qrToken;
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await api.post('/qr/exit', { qrToken: token });
      toast.success(res.data.message);
      await verifyRawQr(token);
      dispatch(fetchBookingsThunk());
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const scannableQueue = bookings.filter(
    (b) => b.qrToken && ['CONFIRMED', 'ACTIVE'].includes(b.status)
  );

  const b = verificationResult?.booking;
  const canEnter =
    b &&
    b.status === 'CONFIRMED' &&
    ['READY_FOR_ENTRY', 'EARLY'].includes(verificationResult.validityStatus);
  const canExit = b && b.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          QR Gate Scanner & Vehicle Verification
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Scan driver QR codes with your device camera or paste a scan URL to verify entry and exit against the backend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Camera + Manual Input */}
        <Panel className="p-6 lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Camera Scanner
            </h2>
            {cameraActive ? (
              <Button variant="outline" size="sm" onClick={stopCamera}>
                <CameraOff className="h-4 w-4" />
                Stop Camera
              </Button>
            ) : (
              <Button variant="emerald" size="sm" onClick={startCamera}>
                <Camera className="h-4 w-4" />
                Start Camera
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 min-h-60 flex items-center justify-center relative">
            <div id="parkgrid-qr-reader" className="w-full" />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300">
                <ScanLine className="h-10 w-10 text-emerald-400" />
                <p className="mt-2 text-xs">
                  Click Start Camera to scan a driver QR pass live.
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {cameraError}
            </p>
          )}

          {/* Direct QR URL / Token Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyRawQr(manualInput);
            }}
            className="space-y-2.5 border-t border-slate-200 pt-4"
          >
            <Label htmlFor="qr-manual-input">Paste Scanned QR URL or Token</Label>
            <div className="flex gap-2">
              <Input
                id="qr-manual-input"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="https://.../scan/{qrToken} or token"
                className="font-mono text-xs"
              />
              <Button type="submit" variant="default" disabled={verifying}>
                {verifying ? 'Checking...' : 'Verify'}
              </Button>
            </div>
          </form>

          {/* Quick Select from Active Facility Queue for Fast Testing */}
          {scannableQueue.length > 0 && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <p className="text-xs font-medium text-slate-500">
                Active Facility Passes (Click to Simulate Scan)
              </p>
              <div className="space-y-2">
                {scannableQueue.slice(0, 5).map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      const scanVal = item.qrUrl || item.qrToken;
                      setManualInput(scanVal);
                      verifyRawQr(scanVal);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-mono font-semibold text-slate-900">
                        {item.bookingCode}
                      </span>
                      <span className="text-slate-500">
                        {' '}
                        · {item.vehicleNumber} · Bay {item.parkingSlot?.slotNumber}
                      </span>
                    </div>
                    <StatusText status={item.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Right: Server-Verified Reservation Details & Gate Controls */}
        <Panel className="p-6 lg:col-span-7">
          {!verificationResult ? (
            <div className="py-16 text-center space-y-2">
              <ScanLine className="mx-auto h-9 w-9 text-slate-400" />
              <h2 className="font-display text-base font-semibold text-slate-900">
                Awaiting QR Pass Scan
              </h2>
              <p className="mx-auto max-w-md text-sm text-slate-500">
                All reservation details, payment status, and entry/exit eligibility are
                validated directly by the backend upon scan.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div
                className={`rounded-lg border p-4 flex items-start gap-3 ${
                  canEnter || canExit
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-red-200 bg-red-50 text-red-900'
                }`}
              >
                {canEnter || canExit ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {verificationResult.validityStatus.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-0.5 text-xs">{verificationResult.reason}</p>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Booking Code</p>
                  <p className="mt-0.5 font-mono font-bold text-slate-900">
                    {b.bookingCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Booking Status</p>
                  <div className="mt-0.5">
                    <StatusText status={b.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment</p>
                  <div className="mt-0.5">
                    <StatusText status={b.payment?.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Driver Name</p>
                  <p className="mt-0.5 font-medium text-slate-900">{b.driver?.name}</p>
                  <p className="text-xs text-slate-500">{b.driver?.phone || b.driver?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Vehicle Plate</p>
                  <p className="mt-0.5 font-mono font-bold text-slate-900">
                    {b.vehicleNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Assigned Bay</p>
                  <p className="mt-0.5 font-mono font-bold text-emerald-700">
                    {b.parkingSlot?.slotNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.parkingSlot?.floor} · {b.parkingSlot?.slotType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Scheduled Window</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-900">
                    {formatDateTime(b.startTime)}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-slate-500">
                    to {formatDateTime(b.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Verified Entry Time</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-900">
                    {formatDateTime(b.entryTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Verified Exit Time</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-900">
                    {formatDateTime(b.exitTime)}
                  </p>
                </div>
              </div>

              {/* Gate Confirmation Buttons */}
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                <Button
                  variant="emerald"
                  disabled={!canEnter || actionLoading}
                  onClick={handleConfirmEntry}
                >
                  <LogIn className="h-4 w-4" />
                  {actionLoading ? 'Recording...' : 'Confirm Vehicle Entry'}
                </Button>
                <Button
                  variant="default"
                  disabled={!canExit || actionLoading}
                  onClick={handleConfirmExit}
                >
                  <LogOut className="h-4 w-4" />
                  {actionLoading ? 'Recording...' : 'Confirm Vehicle Exit & Free Bay'}
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function AttendantReservationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: bookings, loading } = useSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Facility Reservations Queue
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor incoming reservations and currently occupied bays in real time.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Bay</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                      {b.bookingCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{b.driver?.name}</p>
                      <p className="font-mono text-xs text-slate-500">{b.vehicleNumber}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                      {b.parkingSlot?.slotNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-600">
                      {formatDateTime(b.startTime)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.qrToken && ['CONFIRMED', 'ACTIVE'].includes(b.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/attendant/scanner?token=${encodeURIComponent(b.qrToken)}`)
                          }
                        >
                          Open in Scanner
                        </Button>
                      )}
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

export function AttendantHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/qr/history')
      .then((res) => setLogs(res.data.data.logs || []))
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Vehicle Entry & Exit History
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Audited gate verification timestamps logged by attendants.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No entry or exit records yet"
          description="Verified vehicle entries and exits will appear here immediately after scanning."
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking & Plate</th>
                  <th className="px-4 py-3">Facility / Bay</th>
                  <th className="px-4 py-3">Entry Verified</th>
                  <th className="px-4 py-3">Exit Verified</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {log.bookingCode}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {log.vehicleNumber} · {log.driver?.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">
                        {log.parkingLot?.name}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        Bay {log.parkingSlot?.slotNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs tabular-nums text-slate-900">
                        {formatDateTime(log.entryTime)}
                      </p>
                      {log.entryVerifiedBy?.name && (
                        <p className="text-[11px] text-slate-500">
                          by {log.entryVerifiedBy.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs tabular-nums text-slate-900">
                        {formatDateTime(log.exitTime)}
                      </p>
                      {log.exitVerifiedBy?.name && (
                        <p className="text-[11px] text-slate-500">
                          by {log.exitVerifiedBy.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText status={log.status} />
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
