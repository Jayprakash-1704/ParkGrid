import mongoose from 'mongoose';
import { LOT_STATUS } from '../utils/constants.js';

const parkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parking lot name is required'],
      trim: true,
      maxlength: [120, 'Name must not exceed 120 characters'],
    },
    address: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [77.5946, 12.9716],
      },
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: ['24/7 CCTV', 'Covered Bays', 'QR Express Gate'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [1, 'Hourly rate must be positive'],
    },
    operatingHours: {
      open: { type: String, default: '00:00' },
      close: { type: String, default: '23:59' },
      is24x7: { type: Boolean, default: true },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attendants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    floors: [
      {
        floorNumber: {
          type: Number,
          required: true,
          min: 0,
        },
        floorName: {
          type: String,
          required: true,
          trim: true,
        },
        capacity: {
          car: {
            type: Number,
            default: 0,
            min: 0,
          },
          ev: {
            type: Number,
            default: 0,
            min: 0,
          },
          bike: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      },
    ],
    totalSlots: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableSlots: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(LOT_STATUS),
      default: LOT_STATUS.ACTIVE,
      index: true,
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

parkingLotSchema.index({ location: '2dsphere' });
parkingLotSchema.index({ name: 'text', address: 'text', city: 'text' });

export const ParkingLot =
  mongoose.models.ParkingLot || mongoose.model('ParkingLot', parkingLotSchema);
