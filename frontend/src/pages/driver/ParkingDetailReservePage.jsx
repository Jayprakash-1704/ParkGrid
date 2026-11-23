import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Clock3,
  CreditCard,
  MapPin,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';

import { fetchParkingLotDetailThunk } from '../../store/slices/parkingSlice.js';
import { joinLotRoom, leaveLotRoom } from '../../services/socket.js';
import { api, getApiErrorMessage } from '../../services/api.js';

import {
  Button,
  Dialog,
  Input,
  Label,
  Panel,
  SafeImage,
  Select,
  Skeleton,
} from '../../components/ui/primitives.jsx';

import { formatCurrency } from '../../lib/utils.js';

function toLocalDateTimeInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ParkingDetailReservePage({ publicMode = false }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const {
    currentLot: lot,
    currentSlots: slots,
    detailLoading,
  } = useSelector((state) => state.parking);

  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [vehicleNumber, setVehicleNumber] = useState(
    user?.vehicleNumber || 'KA-01-MG-4821'
  );

  const [startTime, setStartTime] = useState(() => {
    const d = new Date(Date.now() + 10 * 60 * 1000);
    d.setSeconds(0, 0);
    return toLocalDateTimeInputValue(d);
  });

  const [durationHours, setDurationHours] = useState(2);

  // Cashfree Checkout state
  const [initiating, setInitiating] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!id) return;

    dispatch(fetchParkingLotDetailThunk(id));
    joinLotRoom(id);

    return () => {
      leaveLotRoom(id);
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (user?.vehicleNumber) {
      setVehicleNumber(user.vehicleNumber);
    }
  }, [user?.vehicleNumber]);

  const floors = useMemo(() => {
    const set = new Set(slots.map((s) => s.floor || 'Level 1'));
    return ['ALL', ...Array.from(set)];
  }, [slots]);

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (floorFilter !== 'ALL' && s.floor !== floorFilter) return false;
      if (typeFilter !== 'ALL' && s.slotType !== typeFilter) return false;
      return true;
    });
  }, [slots, floorFilter, typeFilter]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s._id === selectedSlotId) || null,
    [slots, selectedSlotId]
  );

  // Deselect if slot becomes unavailable in real time
  useEffect(() => {
    if (selectedSlot && selectedSlot.status !== 'AVAILABLE') {
      toast.info(`Slot ${selectedSlot.slotNumber} is no longer available.`);
      setSelectedSlotId(null);
    }
  }, [selectedSlot]);

  const estimatedBreakdown = useMemo(() => {
    if (!lot) return { rate: 0, subtotal: 0, fee: 0, total: 0 };

    const rate = selectedSlot?.hourlyRateOverride ?? lot.hourlyRate;
    const subtotal = rate * Number(durationHours || 1);
    const fee = Number((subtotal * 0.05).toFixed(2));

    return {
      rate,
      subtotal,
      fee,
      total: Number((subtotal + fee).toFixed(2)),
    };
  }, [lot, selectedSlot, durationHours]);

  const handleInitiateBooking = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.info('Please sign in as a Driver to reserve a bay.');
      navigate('/login');
      return;
    }

    if (user.role !== 'DRIVER' && user.role !== 'SUPER_ADMIN') {
      toast.error('Switch to a Driver account to create reservations.');
      return;
    }

    if (!selectedSlot) {
      toast.error('Select an available green parking bay first.');
      return;
    }

    if (!vehicleNumber.trim()) {
      toast.error('Please enter your vehicle registration plate.');
      return;
    }

    const startDate = new Date(startTime);

    const endDate = new Date(
      startDate.getTime() + Number(durationHours) * 60 * 60 * 1000
    );

    setInitiating(true);

    try {
      const res = await api.post('/reservations/initiate', {
        parkingLotId: lot._id,
        parkingSlotId: selectedSlot._id,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      setCheckoutData(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setInitiating(false);
    }
  };

 const handleCompleteCashfree = async () => {
  if (!checkoutData) return;

  setProcessingPayment(true);

  try {
    // Step 1: Initialize Cashfree SDK
    const cashfree = await load({
      mode: 'sandbox',
    });

    // Step 2: Get payment session ID from backend
    const paymentSessionId =
      checkoutData.paymentOrder.paymentSessionId;

    if (!paymentSessionId) {
      throw new Error('Cashfree payment session not found');
    }

    // Step 3: Open actual Cashfree Checkout
    await cashfree.checkout({
      paymentSessionId,
      redirectTarget: '_modal',
    });

    // Step 4: Verify payment through backend
    const verifyRes = await api.post('/payments/verify', {
      bookingId: checkoutData.booking._id,
      orderId: checkoutData.paymentOrder.orderId,
    });

    // Step 5: Get confirmed booking
    const confirmedBooking =
      verifyRes.data.data.booking;

    setCheckoutData(null);

    toast.success('Payment successful! QR pass generated.');

    navigate(`/driver/reservations/${confirmedBooking._id}`);

  } catch (err) {
    console.error('Cashfree Payment Error:', err);

    toast.error(
      getApiErrorMessage(err, 'Payment verification failed.')
    );

  } finally {
    setProcessingPayment(false);
  }
};

  if (detailLoading || !lot) {
    return (
      <div
        className={
          publicMode
            ? 'mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8'
            : 'space-y-6'
        }
      >
        <Skeleton className="h-10 w-64" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-8" />
          <Skeleton className="h-96 lg:col-span-4" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        publicMode
          ? 'mx-auto max-w-7xl space-y-7 px-4 py-10 sm:px-6 lg:px-8'
          : 'space-y-7'
      }
    >
      {/* Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={publicMode ? '/parking' : '/driver/find'}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#68716a] transition-colors hover:text-[#24734c]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parking Locations
        </Link>

        <span className="inline-flex items-center gap-2 border border-[#dce7df] bg-[#edf4ef] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#24734c]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#24734c]" />
          Live Bay Sync Active
        </span>
      </div>

      {/* Facility Header */}
      <Panel className="overflow-hidden border border-[#deded8] bg-white shadow-none">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="relative min-h-56 bg-[#efefe9] lg:col-span-4 lg:min-h-full">
            <SafeImage
              src={lot.images?.[0]}
              alt={lot.name}
              fallbackTitle={lot.name}
              className="h-full w-full object-cover"
            />

            <div className="absolute bottom-4 left-4 border border-white/30 bg-[#202923]/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white">
              Verified Parking Facility
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 p-5 sm:p-7 lg:col-span-8">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#24734c]">
                Facility Information
              </div>

              <div className="flex flex-col justify-between gap-5 sm:flex-row">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-[#202923] sm:text-3xl">
                    {lot.name}
                  </h1>

                  <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-[#737a74]">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#24734c]" />
                    <span>
                      {lot.address}, {lot.city}
                    </span>
                  </p>
                </div>

                <div className="border-t border-[#e9e9e3] pt-4 sm:min-w-40 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-[#202923]">
                    {formatCurrency(lot.hourlyRate)}
                  </p>

                  <p className="text-xs text-[#858b85]">Base price / hour</p>

                  <p className="mt-3 text-xs font-semibold text-[#24734c]">
                    {lot.availableSlots} of {lot.totalSlots} bays available
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#737a74]">
                {lot.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#e9e9e3] pt-4">
              <div className="flex items-center gap-2 text-xs text-[#737a74]">
                <Clock3 className="h-4 w-4 text-[#24734c]" />
                <span>
                  {lot.operatingHours?.is24x7
                    ? 'Open 24/7'
                    : `${lot.operatingHours?.open} – ${lot.operatingHours?.close}`}
                </span>
              </div>

              {(lot.amenities || []).map((a) => (
                <span
                  key={a}
                  className="border border-[#e5e7e1] bg-[#f8f8f4] px-2.5 py-1.5 text-[10px] font-medium text-[#626c64]"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Main Booking Layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

        {/* Parking Bay Selection */}
        <Panel className="space-y-6 border border-[#deded8] bg-white p-4 shadow-none sm:p-6 lg:col-span-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#24734c]">
                Step 01 · Select a bay
              </div>

              <h2 className="font-display text-xl font-semibold text-[#202923]">
                Choose Your Parking Slot
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-5 text-[#858b85]">
                Select an available bay. Slot availability updates automatically
                for all connected drivers.
              </p>
            </div>

            {/* Availability Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#68716a]">
              {[
                ['bg-[#edf4ef] border-[#24734c]', 'Available'],
                ['bg-[#fff7e8] border-[#d9a441]', 'Reserved'],
                ['bg-[#fef0ef] border-[#dc7770]', 'Occupied'],
                ['bg-[#f0f1ee] border-[#aeb5ae]', 'Maintenance'],
              ].map(([color, label]) => (
                <span key={label} className="flex items-center gap-2">
                  <span className={`h-3 w-3 border ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4 border-y border-[#e9e9e3] py-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#858b85]">
                Parking level
              </p>

              <div className="flex flex-wrap gap-2">
                {floors.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFloorFilter(f)}
                    className={`border px-3.5 py-2 text-xs font-medium transition-colors ${
                      floorFilter === f
                        ? 'border-[#24734c] bg-[#24734c] text-white'
                        : 'border-[#deded8] bg-white text-[#68716a] hover:border-[#24734c] hover:text-[#24734c]'
                    }`}
                  >
                    {f === 'ALL' ? 'All Levels' : f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#858b85]">
                Bay category
              </p>

              <div className="flex flex-wrap gap-2">
                {['ALL', 'CAR', 'EV', 'BIKE'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`border px-3.5 py-2 text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? 'border-[#24734c] bg-[#edf4ef] text-[#24734c]'
                        : 'border-[#deded8] bg-white text-[#68716a] hover:border-[#24734c] hover:text-[#24734c]'
                    }`}
                  >
                    {t === 'ALL' ? 'All Types' : t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bay Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlotId === slot._id;
              const isAvailable = slot.status === 'AVAILABLE';

              let tone =
                'border-[#deded8] bg-[#f0f1ee] text-[#9ba29b] cursor-not-allowed';

              if (isSelected) {
                tone =
                  'border-[#24734c] bg-[#24734c] text-white ring-2 ring-[#24734c]/20';
              } else if (isAvailable) {
                tone =
                  'border-[#b8d4c0] bg-[#f2f7f3] text-[#202923] hover:border-[#24734c] hover:bg-[#e8f2eb]';
              } else if (slot.status === 'RESERVED') {
                tone =
                  'border-[#ecd6a8] bg-[#fff8e9] text-[#94712e] cursor-not-allowed';
              } else if (slot.status === 'OCCUPIED') {
                tone =
                  'border-[#edc8c5] bg-[#fdf1f0] text-[#ad514a] cursor-not-allowed';
              }

              return (
                <button
                  key={slot._id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => isAvailable && setSelectedSlotId(slot._id)}
                  className={`flex min-h-28 flex-col justify-between border p-3.5 text-left transition-all duration-150 ${tone}`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold tabular-nums">
                      {slot.slotNumber}
                    </span>

                    {slot.slotType === 'EV' && (
                      <Zap
                        className={`h-4 w-4 ${
                          isSelected ? 'text-white' : 'text-[#24734c]'
                        }`}
                      />
                    )}

                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>

                  <div className="mt-4">
                    <p
                      className={`text-[11px] font-medium ${
                        isSelected ? 'text-white/80' : 'opacity-80'
                      }`}
                    >
                      {slot.slotType} · {slot.floor}
                    </p>

                    <p
                      className={`mt-1 font-mono text-[11px] font-semibold tabular-nums ${
                        isSelected ? 'text-white' : ''
                      }`}
                    >
                      {isAvailable
                        ? `${formatCurrency(
                            slot.hourlyRateOverride ?? lot.hourlyRate
                          )}/hr`
                        : slot.status}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredSlots.length === 0 && (
            <div className="border border-dashed border-[#deded8] py-10 text-center">
              <p className="text-sm font-medium text-[#68716a]">
                No bays match these filters.
              </p>
              <p className="mt-1 text-xs text-[#929a92]">
                Try selecting another floor or bay category.
              </p>
            </div>
          )}

          {/* Grid Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e9e9e3] pt-4 text-[11px] text-[#858b85]">
            <span>
              Showing {filteredSlots.length} of {slots.length} parking bays
            </span>
            <span>Availability synchronized in real time</span>
          </div>
        </Panel>

        {/* Reservation Summary */}
        {/* border border-[#deded8] bg-white shadow-none lg:sticky lg:top-24 lg:col-span-4 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto */}
        <Panel className="lg:max-h-96 lg:overflow-y-auto border border-[#deded8] bg-white shadow-none lg:sticky lg:top-24 lg:col-span-4">
          <div className="border-b border-[#e9e9e3] px-5 py-5 sm:px-6">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#24734c]">
              Step 02 · Reservation
            </div>

            <h2 className="font-display text-xl font-semibold text-[#202923]">
              Booking Summary
            </h2>

            <p className="mt-2 text-xs leading-5 text-[#858b85]">
              Review your booking details and proceed to secure payment.
            </p>
          </div>

          <form onSubmit={handleInitiateBooking} className="space-y-5 p-5 sm:p-6">
            {/* Selected Slot */}
            <div className="border border-[#dce7df] bg-[#f2f7f3] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#68716a]">
                Selected Parking Bay
              </p>

              {selectedSlot ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xl font-bold text-[#202923]">
                      {selectedSlot.slotNumber}
                    </p>
                    <p className="mt-1 text-xs text-[#68716a]">
                      {selectedSlot.floor} · {selectedSlot.slotType}
                    </p>
                  </div>

                  <CheckCircle2 className="h-5 w-5 text-[#24734c]" />
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#858b85]">
                  Select a green bay from the grid.
                </p>
              )}
            </div>

            {/* Vehicle */}
            <div className="space-y-2">
              <Label
                htmlFor="res-vehicle"
                className="text-xs font-semibold text-[#4b554d]"
              >
                Vehicle Registration Number
              </Label>

              <Input
                id="res-vehicle"
                value={vehicleNumber}
                onChange={(e) =>
                  setVehicleNumber(e.target.value.toUpperCase())
                }
                placeholder="KA-01-MG-4821"
                className="h-11 border-[#deded8] bg-[#fbfaf7] font-mono uppercase shadow-none focus:border-[#24734c]"
                required
              />
            </div>

            {/* Arrival */}
            <div className="space-y-2">
              <Label
                htmlFor="res-start"
                className="text-xs font-semibold text-[#4b554d]"
              >
                Arrival Date & Time
              </Label>

              <Input
                id="res-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11 border-[#deded8] bg-[#fbfaf7] text-sm shadow-none focus:border-[#24734c]"
                required
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label
                htmlFor="res-duration"
                className="text-xs font-semibold text-[#4b554d]"
              >
                Parking Duration
              </Label>

              <Select
                id="res-duration"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="h-11 border-[#deded8] bg-[#fbfaf7] text-sm shadow-none focus:border-[#24734c]"
              >
                {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                  <option key={h} value={h}>
                    {h} {h === 1 ? 'Hour' : 'Hours'}
                  </option>
                ))}
              </Select>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-[#e9e9e3] pt-5">
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#737a74]">
                  Parking ({durationHours}h ×{' '}
                  {formatCurrency(estimatedBreakdown.rate)})
                </span>

                <span className="font-mono font-medium tabular-nums text-[#202923]">
                  {formatCurrency(estimatedBreakdown.subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#737a74]">
                  Platform Service Fee (5%)
                </span>

                <span className="font-mono font-medium tabular-nums text-[#202923]">
                  {formatCurrency(estimatedBreakdown.fee)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[#deded8] pt-4">
                <span className="text-sm font-semibold text-[#202923]">
                  Total Payable
                </span>

                <span className="font-mono text-xl font-bold tabular-nums text-[#24734c]">
                  {formatCurrency(estimatedBreakdown.total)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="emerald"
              className="h-12 w-full bg-[#24734c] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#1c5c3c]"
              disabled={!selectedSlot || initiating}
            >
              {initiating ? 'Creating Cashfree Order...' : 'Proceed to Payment'}
              {!initiating && <ArrowUpRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="flex items-start gap-2 border-t border-[#e9e9e3] pt-4 text-[11px] leading-5 text-[#858b85]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#24734c]" />

              <span>
                Your QR entry pass is generated automatically after successful
                Cashfree payment verification.
              </span>
            </div>

            <p className="flex items-start gap-2 text-[11px] leading-5 text-[#858b85]">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Free cancellation up to 1 hour before arrival with instant refund.
            </p>
          </form>
        </Panel>
      </div>

      {/* Cashfree Payment Dialog */}
      <Dialog
        open={Boolean(checkoutData)}
        onClose={() => !processingPayment && setCheckoutData(null)}
        title="Cashfree Payment Gateway"
        description="Server-verified checkout. Your QR entry pass is generated after successful verification."
      >
        {checkoutData && (
          <div className="space-y-5">
            {/* Order Details */}
            <div className="space-y-3 border border-[#deded8] bg-[#fbfaf7] p-4">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <span className="text-xs text-[#858b85]">
                  Order Reference
                </span>

                <span className="break-all font-mono text-xs font-medium text-[#202923] sm:text-right">
                  {checkoutData.paymentOrder.orderId}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-xs text-[#858b85]">Booking Code</span>

                <span className="font-mono text-xs font-semibold text-[#202923]">
                  {checkoutData.booking.bookingCode}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-xs text-[#858b85]">Bay</span>

                <span className="text-right text-xs font-medium text-[#202923]">
                  {checkoutData.booking.parkingSlot?.slotNumber} · {lot.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[#deded8] pt-3">
                <span className="text-sm font-semibold text-[#202923]">
                  Amount Due
                </span>

                <span className="font-mono text-xl font-bold tabular-nums text-[#24734c]">
                  {formatCurrency(checkoutData.booking.totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-[#4b554d]">
                Payment Method
              </Label>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { id: 'UPI', label: 'UPI / QR' },
                  { id: 'CARD', label: 'Credit / Debit' },
                  { id: 'NETBANKING', label: 'NetBanking' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`border px-3 py-3 text-xs font-medium transition-colors ${
                      paymentMethod === m.id
                        ? 'border-[#24734c] bg-[#edf4ef] text-[#24734c]'
                        : 'border-[#deded8] bg-white text-[#68716a] hover:border-[#24734c]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sandbox Notice */}
            <div className="flex items-start gap-3 border border-[#dce7df] bg-[#f2f7f3] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#24734c]" />

              <p className="text-xs leading-5 text-[#68716a]">
                Running in <strong className="text-[#202923]">Cashfree Sandbox Verification Mode</strong>.
                Clicking Pay authorizes the server-side Cashfree ledger, then
                runs backend verification before confirming your slot and
                generating the QR pass.
              </p>
            </div>

            {/* Payment Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="emerald"
                className="h-11 flex-1 bg-[#24734c] text-white shadow-none hover:bg-[#1c5c3c]"
                disabled={processingPayment}
                onClick={() => handleCompleteCashfree()}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />

                {processingPayment
                  ? 'Verifying with Cashfree...'
                  : `Pay ${formatCurrency(checkoutData.booking.totalAmount)}`}
              </Button>

              {/* <Button
                variant="outline"
                className="h-11 border-[#deded8] text-[#68716a] hover:bg-[#f5f5f1]"
                disabled={processingPayment}
                onClick={() => handleCompleteCashfree('FAILED')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Simulate Failed Payment
              </Button> */}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}