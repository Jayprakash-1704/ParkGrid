import mongoose from 'mongoose';
import { SLOT_STATUS, SLOT_TYPES } from '../utils/constants.js';

const parkingSlotSchema = new mongoose.Schema(
  {
    parkingLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
      index: true,
    },
    slotNumber: {
      type: String,
      required: [true, 'Slot number is required'],
      trim: true,
      uppercase: true,
    },
    floor: {
      type: String,
      trim: true,
      default: 'Basement',
    },
    zone: {
      type: String,
      trim: true,
      default: 'Zone A',
    },
    slotType: {
      type: String,
      enum: Object.values(SLOT_TYPES),
      default: SLOT_TYPES.CAR,
      index: true,
    },
    hourlyRateOverride: {
      type: Number,
      min: 1,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SLOT_STATUS),
      default: SLOT_STATUS.AVAILABLE,
      index: true,
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
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

parkingSlotSchema.index({ parkingLot: 1, slotNumber: 1 }, { unique: true });
parkingSlotSchema.index({ parkingLot: 1, status: 1 });

export const ParkingSlot =
  mongoose.models.ParkingSlot || mongoose.model('ParkingSlot', parkingSlotSchema);
