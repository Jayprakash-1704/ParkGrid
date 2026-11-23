import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants.js';

const paymentSubSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      enum: ['CASHFREE', 'CASHFREE_SANDBOX'],
      default: 'CASHFREE_SANDBOX',
    },
    orderId: {
      type: String,
      index: true,
      default: null,
    },
    paymentSessionId: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    method: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundId: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parkingLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
      index: true,
    },
    parkingSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      trim: true,
      uppercase: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    durationHours: {
      type: Number,
      required: true,
      min: 1,
    },
    hourlyRateApplied: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_PAYMENT,
      index: true,
    },
    payment: {
      type: paymentSubSchema,
      required: true,
    },
    qrToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    qrUrl: {
      type: String,
      default: null,
    },
    qrDataUrl: {
      type: String,
      default: null,
    },
    entryTime: {
      type: Date,
      default: null,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    entryVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    exitVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

bookingSchema.index({ parkingSlot: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ driver: 1, createdAt: -1 });
bookingSchema.index({ parkingLot: 1, createdAt: -1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
