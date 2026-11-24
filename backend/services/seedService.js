import { User } from '../models/User.js';
import { ParkingLot } from '../models/ParkingLot.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { Booking } from '../models/Booking.js';
import { SystemSetting } from '../models/SystemSetting.js';
import {
  BOOKING_STATUS,
  LOT_STATUS,
  PAYMENT_STATUS,
  ROLES,
  SLOT_STATUS,
  SLOT_TYPES,
} from '../utils/constants.js';
import { generateBookingQRPass } from './qrService.js';

export async function seedInitialData(baseOrigin = 'http://localhost:3000') {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    return;
  }

  console.log('[Seed] Initializing ParkGrid demo dataset...');

  await SystemSetting.create({
    key: 'global',
    platformName: 'ParkGrid',
    cancellationCutoffHours: 1,
    entryGraceMinutes: 30,
    platformFeePercent: 5,
    currency: 'INR',
    allowNewRegistrations: true,
    maintenanceMode: false,
  });

  // 1. Seed Users across all 4 roles
  const [superAdmin, lotAdmin, driver1, driver2, attendant1, attendant2] =
    await User.create([
      {
        name: 'Meera Krishnan',
        email: 'superadmin@parkgrid.app',
        password: 'Password123!',
        phone: '+91 98450 11001',
        role: ROLES.SUPER_ADMIN,
      },
      {
        name: 'Vikram Rao',
        email: 'lotadmin@parkgrid.app',
        password: 'Password123!',
        phone: '+91 98450 22002',
        role: ROLES.LOT_ADMIN,
      },
      {
        name: 'Aarav Sharma',
        email: 'driver@parkgrid.app',
        password: 'Password123!',
        phone: '+91 98450 33003',
        vehicleNumber: 'KA-01-MG-4821',
        role: ROLES.DRIVER,
      },
      {
        name: 'Elena Dsouza',
        email: 'elena@parkgrid.app',
        password: 'Password123!',
        phone: '+91 98450 44004',
        vehicleNumber: 'KA-03-EV-9024',
        role: ROLES.DRIVER,
      },
      {
        name: 'Priya Nair',
        email: 'attendant@parkgrid.app',
        password: 'Password123!',
        phone: '+91 98450 55005',
        role: ROLES.ATTENDANT,
      },
      {
        name: 'Rohan Deshmukh',
        email: 'rohan@parkgrid.app',
        password: 'Password123!',
        phone: '+91 98450 66006',
        role: ROLES.ATTENDANT,
      },
    ]);

  // 2. Seed Parking Lots with freshly generated architectural photography
  const [centralPlaza, airportHub, cyberPark] = await ParkingLot.create([
    {
      name: 'Central Plaza Smart Garage',
      address: '42 Mahatma Gandhi Road, Ashok Nagar',
      city: 'Bengaluru',
      description:
        'Multi-level sunlit architectural garage in the commercial core with express QR barriers, 22kW EV charging bays, and direct metro access.',
      location: { type: 'Point', coordinates: [77.607, 12.9756] },
      images: ['/assets/images/lot_downtown_plaza_1795103242849.jpg'],
      amenities: ['24/7 CCTV', 'Covered Bays', 'EV Fast Charging', 'QR Express Gate', 'Elevator Access'],
      hourlyRate: 80,
      operatingHours: { open: '00:00', close: '23:59', is24x7: true },
      owner: lotAdmin._id,
      attendants: [attendant1._id],
      status: LOT_STATUS.ACTIVE,
    },
    {
      name: 'AeroLink Terminal 3 Hub',
      address: 'Airport Approach Expressway, Devanahalli',
      city: 'Bengaluru',
      description:
        'High-capacity covered terminal parking with dedicated EV supercharging row, automated entry verification, and covered pedestrian skybridge.',
      location: { type: 'Point', coordinates: [77.7066, 13.1986] },
      images: ['/assets/images/lot_airport_hub_1795103236832.jpg'],
      amenities: ['EV Fast Charging', 'Covered Canopy', '24/7 Attendant', 'Luggage Trolleys', 'QR Express Gate'],
      hourlyRate: 120,
      operatingHours: { open: '00:00', close: '23:59', is24x7: true },
      owner: lotAdmin._id,
      attendants: [attendant2._id],
      status: LOT_STATUS.ACTIVE,
    },
    {
      name: 'CyberPark West Underground',
      address: '108 Outer Ring Road, Bellandur Tech Corridor',
      city: 'Bengaluru',
      description:
        'Bright linear-lit subterranean corporate parking with overhead bay occupancy sensors, compact commuter zones, and wheelchair-accessible bays.',
      location: { type: 'Point', coordinates: [77.6746, 12.9279] },
      images: ['/assets/images/lot_tech_district_1795103237238.jpg'],
      amenities: ['Overhead Sensors', 'Underground Climate Control', 'EV Charging', '24/7 Security', 'Wheelchair Access'],
      hourlyRate: 65,
      operatingHours: { open: '05:00', close: '23:30', is24x7: false },
      owner: lotAdmin._id,
      attendants: [attendant1._id],
      status: LOT_STATUS.ACTIVE,
    },
  ]);

  // Assign lots to attendants
  await User.findByIdAndUpdate(attendant1._id, { assignedLot: centralPlaza._id });
  await User.findByIdAndUpdate(attendant2._id, { assignedLot: airportHub._id });

  // 3. Seed Parking Slots across all 3 lots
  const centralSlotsSpec = [
    { slotNumber: 'A-01', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.EV, hourlyRateOverride: 100 },
    { slotNumber: 'A-02', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.EV, hourlyRateOverride: 100 },
    { slotNumber: 'A-03', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'A-04', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'A-05', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'A-06', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.COMPACT },
    { slotNumber: 'A-07', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.COMPACT },
    { slotNumber: 'A-08', floor: 'BASEMENT-1', zone: 'Zone A', slotType: SLOT_TYPES.ACCESSIBLE },
    { slotNumber: 'B-01', floor: 'Level ', zone: 'Zone B', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'B-02', floor: 'BASEMENT-2', zone: 'Zone B', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'B-03', floor: 'BASEMENT-2', zone: 'Zone B', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'B-04', floor: 'BASEMENT-2', zone: 'Zone B', slotType: SLOT_TYPES.EV, hourlyRateOverride: 100 },
    { slotNumber: 'B-05', floor: 'BASEMENT-2', zone: 'Zone B', slotType: SLOT_TYPES.COMPACT },
    { slotNumber: 'B-06', floor: 'BASEMENT-2', zone: 'Zone B', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'B-07', floor: 'BASEMENT-2', zone: 'Zone B', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'B-08', floor: 'BASEMENT-2', zone: 'Zone B', slotType: SLOT_TYPES.STANDARD, status: SLOT_STATUS.MAINTENANCE },
  ];

  const airportSlotsSpec = [
    { slotNumber: 'T-01', floor: 'Ground', zone: 'EV Row', slotType: SLOT_TYPES.EV, hourlyRateOverride: 150 },
    { slotNumber: 'T-02', floor: 'Ground', zone: 'EV Row', slotType: SLOT_TYPES.EV, hourlyRateOverride: 150 },
    { slotNumber: 'T-03', floor: 'Ground', zone: 'EV Row', slotType: SLOT_TYPES.EV, hourlyRateOverride: 150 },
    { slotNumber: 'T-04', floor: 'Ground', zone: 'EV Row', slotType: SLOT_TYPES.ACCESSIBLE },
    { slotNumber: 'T-05', floor: 'BASEMENT-1', zone: 'North', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'T-06', floor: 'BASEMENT-1', zone: 'North', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'T-07', floor: 'BASEMENT-1', zone: 'North', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'T-08', floor: 'BASEMENT-1', zone: 'North', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'T-09', floor: 'BASEMENT-2', zone: 'South', slotType: SLOT_TYPES.COMPACT },
    { slotNumber: 'T-10', floor: 'BASEMENT-2', zone: 'South', slotType: SLOT_TYPES.COMPACT },
    { slotNumber: 'T-11', floor: 'BASEMENT-2', zone: 'South', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'T-12', floor: 'BASEMENT-2', zone: 'South', slotType: SLOT_TYPES.STANDARD },
  ];

  const cyberSlotsSpec = [
    { slotNumber: 'C-01', floor: 'B21', zone: 'East', slotType: SLOT_TYPES.EV, hourlyRateOverride: 85 },
    { slotNumber: 'C-02', floor: 'B1', zone: 'East', slotType: SLOT_TYPES.EV, hourlyRateOverride: 85 },
    { slotNumber: 'C-03', floor: 'B1', zone: 'East', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'C-04', floor: 'B1', zone: 'East', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'C-05', floor: 'B1', zone: 'East', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'C-06', floor: 'B1', zone: 'East', slotType: SLOT_TYPES.ACCESSIBLE },
    { slotNumber: 'C-07', floor: 'B2', zone: 'West', slotType: SLOT_TYPES.COMPACT },
    { slotNumber: 'C-08', floor: 'B2', zone: 'West', slotType: SLOT_TYPES.COMPACT },
    { slotNumber: 'C-09', floor: 'B2', zone: 'West', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'C-10', floor: 'B2', zone: 'West', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'C-11', floor: 'B2', zone: 'West', slotType: SLOT_TYPES.STANDARD },
    { slotNumber: 'C-12', floor: 'B2', zone: 'West', slotType: SLOT_TYPES.STANDARD },
  ];

  const centralSlots = await ParkingSlot.create(
    centralSlotsSpec.map((s) => ({ ...s, parkingLot: centralPlaza._id }))
  );
  const airportSlots = await ParkingSlot.create(
    airportSlotsSpec.map((s) => ({ ...s, parkingLot: airportHub._id }))
  );
  const cyberSlots = await ParkingSlot.create(
    cyberSlotsSpec.map((s) => ({ ...s, parkingLot: cyberPark._id }))
  );

  // 4. Seed realistic bookings with genuine QR passes
  const now = new Date();
  const qr1 = await generateBookingQRPass(baseOrigin);
  const qr2 = await generateBookingQRPass(baseOrigin);
  const qr3 = await generateBookingQRPass(baseOrigin);
  const qr4 = await generateBookingQRPass(baseOrigin);
  const qr5 = await generateBookingQRPass(baseOrigin);

  // Booking 1: CONFIRMED right now at Central Plaza A-01 (ready for Attendant ENTRY scan!)
  const b1 = await Booking.create({
    bookingCode: 'PG-84A21C',
    driver: driver1._id,
    parkingLot: centralPlaza._id,
    parkingSlot: centralSlots[0]._id,
    vehicleNumber: driver1.vehicleNumber,
    startTime: new Date(now.getTime() - 10 * 60 * 1000),
    endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    durationHours: 3,
    hourlyRateApplied: 100,
    platformFee: 15,
    totalAmount: 315,
    status: BOOKING_STATUS.CONFIRMED,
    payment: {
      gateway: 'CASHFREE_SANDBOX',
      orderId: 'ORDER_PG-84A21C_SEED',
      paymentSessionId: 'session_cf_seed_84a21c',
      transactionId: 'CF_TXN_84A21C99',
      amount: 315,
      currency: 'INR',
      status: PAYMENT_STATUS.PAID,
      method: 'UPI',
      paidAt: new Date(now.getTime() - 25 * 60 * 1000),
    },
    qrToken: qr1.qrToken,
    qrUrl: qr1.qrUrl,
    qrDataUrl: qr1.qrDataUrl,
  });

  await ParkingSlot.findByIdAndUpdate(centralSlots[0]._id, {
    status: SLOT_STATUS.RESERVED,
    currentBooking: b1._id,
  });

  // Booking 2: ACTIVE right now at Central Plaza A-03 (ready for Attendant EXIT scan!)
  const b2 = await Booking.create({
    bookingCode: 'PG-91F04D',
    driver: driver2._id,
    parkingLot: centralPlaza._id,
    parkingSlot: centralSlots[2]._id,
    vehicleNumber: driver2.vehicleNumber,
    startTime: new Date(now.getTime() - 90 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    durationHours: 3,
    hourlyRateApplied: 80,
    platformFee: 12,
    totalAmount: 252,
    status: BOOKING_STATUS.ACTIVE,
    payment: {
      gateway: 'CASHFREE_SANDBOX',
      orderId: 'ORDER_PG-91F04D_SEED',
      paymentSessionId: 'session_cf_seed_91f04d',
      transactionId: 'CF_TXN_91F04D77',
      amount: 252,
      currency: 'INR',
      status: PAYMENT_STATUS.PAID,
      method: 'CARD',
      paidAt: new Date(now.getTime() - 105 * 60 * 1000),
    },
    qrToken: qr2.qrToken,
    qrUrl: qr2.qrUrl,
    qrDataUrl: qr2.qrDataUrl,
    entryTime: new Date(now.getTime() - 85 * 60 * 1000),
    entryVerifiedBy: attendant1._id,
  });

  await ParkingSlot.findByIdAndUpdate(centralSlots[2]._id, {
    status: SLOT_STATUS.OCCUPIED,
    currentBooking: b2._id,
  });

  // Historical completed bookings across past days for rich analytics
  const dayMs = 24 * 60 * 60 * 1000;
  await Booking.create([
    {
      bookingCode: 'PG-72B10E',
      driver: driver1._id,
      parkingLot: airportHub._id,
      parkingSlot: airportSlots[0]._id,
      vehicleNumber: driver1.vehicleNumber,
      startTime: new Date(now.getTime() - 2 * dayMs),
      endTime: new Date(now.getTime() - 2 * dayMs + 5 * 3600 * 1000),
      durationHours: 5,
      hourlyRateApplied: 150,
      platformFee: 37.5,
      totalAmount: 787.5,
      status: BOOKING_STATUS.COMPLETED,
      payment: {
        gateway: 'CASHFREE_SANDBOX',
        orderId: 'ORDER_PG-72B10E_SEED',
        transactionId: 'CF_TXN_72B10E11',
        amount: 787.5,
        currency: 'INR',
        status: PAYMENT_STATUS.PAID,
        method: 'UPI',
        paidAt: new Date(now.getTime() - 2 * dayMs - 1800 * 1000),
      },
      qrToken: qr3.qrToken,
      qrUrl: qr3.qrUrl,
      qrDataUrl: qr3.qrDataUrl,
      entryTime: new Date(now.getTime() - 2 * dayMs + 5 * 60 * 1000),
      exitTime: new Date(now.getTime() - 2 * dayMs + 4.8 * 3600 * 1000),
      entryVerifiedBy: attendant2._id,
      exitVerifiedBy: attendant2._id,
      createdAt: new Date(now.getTime() - 2 * dayMs),
    },
    {
      bookingCode: 'PG-65C88A',
      driver: driver2._id,
      parkingLot: cyberPark._id,
      parkingSlot: cyberSlots[2]._id,
      vehicleNumber: driver2.vehicleNumber,
      startTime: new Date(now.getTime() - 1 * dayMs),
      endTime: new Date(now.getTime() - 1 * dayMs + 6 * 3600 * 1000),
      durationHours: 6,
      hourlyRateApplied: 65,
      platformFee: 19.5,
      totalAmount: 409.5,
      status: BOOKING_STATUS.COMPLETED,
      payment: {
        gateway: 'CASHFREE_SANDBOX',
        orderId: 'ORDER_PG-65C88A_SEED',
        transactionId: 'CF_TXN_65C88A22',
        amount: 409.5,
        currency: 'INR',
        status: PAYMENT_STATUS.PAID,
        method: 'NETBANKING',
        paidAt: new Date(now.getTime() - 1 * dayMs - 900 * 1000),
      },
      qrToken: qr4.qrToken,
      qrUrl: qr4.qrUrl,
      qrDataUrl: qr4.qrDataUrl,
      entryTime: new Date(now.getTime() - 1 * dayMs + 4 * 60 * 1000),
      exitTime: new Date(now.getTime() - 1 * dayMs + 5.7 * 3600 * 1000),
      entryVerifiedBy: attendant1._id,
      exitVerifiedBy: attendant1._id,
      createdAt: new Date(now.getTime() - 1 * dayMs),
    },
    {
      bookingCode: 'PG-59D44F',
      driver: driver1._id,
      parkingLot: centralPlaza._id,
      parkingSlot: centralSlots[4]._id,
      vehicleNumber: driver1.vehicleNumber,
      startTime: new Date(now.getTime() - 4 * dayMs),
      endTime: new Date(now.getTime() - 4 * dayMs + 4 * 3600 * 1000),
      durationHours: 4,
      hourlyRateApplied: 80,
      platformFee: 16,
      totalAmount: 336,
      status: BOOKING_STATUS.COMPLETED,
      payment: {
        gateway: 'CASHFREE_SANDBOX',
        orderId: 'ORDER_PG-59D44F_SEED',
        transactionId: 'CF_TXN_59D44F33',
        amount: 336,
        currency: 'INR',
        status: PAYMENT_STATUS.PAID,
        method: 'CARD',
        paidAt: new Date(now.getTime() - 4 * dayMs - 1200 * 1000),
      },
      qrToken: qr5.qrToken,
      qrUrl: qr5.qrUrl,
      qrDataUrl: qr5.qrDataUrl,
      entryTime: new Date(now.getTime() - 4 * dayMs + 3 * 60 * 1000),
      exitTime: new Date(now.getTime() - 4 * dayMs + 3.9 * 3600 * 1000),
      entryVerifiedBy: attendant1._id,
      exitVerifiedBy: attendant1._id,
      createdAt: new Date(now.getTime() - 4 * dayMs),
    },
    {
      bookingCode: 'PG-41E22B',
      driver: driver1._id,
      parkingLot: cyberPark._id,
      parkingSlot: cyberSlots[0]._id,
      vehicleNumber: driver1.vehicleNumber,
      startTime: new Date(now.getTime() - 3 * dayMs),
      endTime: new Date(now.getTime() - 3 * dayMs + 2 * 3600 * 1000),
      durationHours: 2,
      hourlyRateApplied: 85,
      platformFee: 8.5,
      totalAmount: 178.5,
      status: BOOKING_STATUS.CANCELLED,
      payment: {
        gateway: 'CASHFREE_SANDBOX',
        orderId: 'ORDER_PG-41E22B_SEED',
        transactionId: 'CF_TXN_41E22B44',
        amount: 178.5,
        currency: 'INR',
        status: PAYMENT_STATUS.REFUNDED,
        method: 'UPI',
        paidAt: new Date(now.getTime() - 3 * dayMs - 7200 * 1000),
        refundedAt: new Date(now.getTime() - 3 * dayMs - 5400 * 1000),
        refundAmount: 178.5,
        refundId: 'CF_REF_41E22B',
      },
      cancelledAt: new Date(now.getTime() - 3 * dayMs - 5400 * 1000),
      cancellationReason: 'Meeting rescheduled',
      createdAt: new Date(now.getTime() - 3 * dayMs),
    },
  ]);

  // Sync lot slot counts accurately
  for (const lot of [centralPlaza, airportHub, cyberPark]) {
    const [total, available] = await Promise.all([
      ParkingSlot.countDocuments({ parkingLot: lot._id }),
      ParkingSlot.countDocuments({ parkingLot: lot._id, status: SLOT_STATUS.AVAILABLE }),
    ]);
    await ParkingLot.findByIdAndUpdate(lot._id, {
      totalSlots: total,
      availableSlots: available,
    });
  }

  console.log('[Seed] ParkGrid demo data seeded successfully (4 roles, 3 lots, 40 slots).');
}
