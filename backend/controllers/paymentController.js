import { Booking } from '../models/Booking.js';
import { asyncHandler } from '../utils/ApiError.js';
import { completeSandboxCheckout } from '../services/paymentService.js';
import { confirmReservationAfterPayment } from '../services/reservationService.js';
import { ROLES } from '../utils/constants.js';

function getRequestOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

export const simulateCashfreeSandbox = asyncHandler(async (req, res) => {
  const { orderId, outcome, method } = req.body;
  const result = await completeSandboxCheckout({
    orderId,
    outcome: outcome === 'FAILED' ? 'FAILED' : 'SUCCESS',
    method: method || 'UPI',
  });

  res.json({
    success: true,
    message:
      result.status === 'PAID'
        ? 'Cashfree Sandbox payment authorized. Proceeding to backend verification.'
        : 'Cashfree Sandbox simulated a declined transaction.',
    data: { order: result },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId, orderId } = req.body;
  const booking = await confirmReservationAfterPayment({
    bookingId,
    orderId,
    actorUser: req.user,
    baseOrigin: getRequestOrigin(req),
  });

  res.json({
    success: true,
    message: 'Cashfree payment verified and QR pass issued.',
    data: { booking },
  });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.DRIVER) {
    filter.driver = req.user._id;
  }

  const bookings = await Booking.find(filter)
    .populate('parkingLot', 'name city')
    .populate('parkingSlot', 'slotNumber slotType')
    .populate('driver', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const payments = bookings.map((b) => ({
    bookingId: b._id,
    bookingCode: b.bookingCode,
    parkingLot: b.parkingLot?.name || 'Parking Facility',
    city: b.parkingLot?.city || '',
    slotNumber: b.parkingSlot?.slotNumber || '—',
    driverName: b.driver?.name || '',
    amount: b.totalAmount,
    platformFee: b.platformFee,
    currency: b.payment?.currency || 'INR',
    status: b.payment?.status || 'PENDING',
    gateway: b.payment?.gateway || 'CASHFREE_SANDBOX',
    orderId: b.payment?.orderId,
    transactionId: b.payment?.transactionId,
    method: b.payment?.method,
    paidAt: b.payment?.paidAt,
    refundedAt: b.payment?.refundedAt,
    refundAmount: b.payment?.refundAmount || 0,
    refundId: b.payment?.refundId,
    failureReason: b.payment?.failureReason,
    createdAt: b.createdAt,
  }));

  res.json({
    success: true,
    data: { payments },
  });
});
