import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global',
    },
    platformName: {
      type: String,
      default: 'ParkGrid',
    },
    cancellationCutoffHours: {
      type: Number,
      default: 1,
      min: 0,
      max: 48,
    },
    entryGraceMinutes: {
      type: Number,
      default: 30,
      min: 5,
      max: 180,
    },
    platformFeePercent: {
      type: Number,
      default: 5,
      min: 0,
      max: 30,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    allowNewRegistrations: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const SystemSetting =
  mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema);
