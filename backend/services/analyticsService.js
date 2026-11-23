import { Booking } from '../models/Booking.js';
import { ParkingLot } from '../models/ParkingLot.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { User } from '../models/User.js';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ROLES,
  SLOT_STATUS,
} from '../utils/constants.js';

export async function getLotAdminAnalytics(ownerId, isSuperAdmin = false) {
  const lotFilter = isSuperAdmin ? {} : { owner: ownerId };
  const lots = await ParkingLot.find(lotFilter).lean();
  const lotIds = lots.map((l) => l._id);

  const [slots, bookings] = await Promise.all([
    ParkingSlot.find({ parkingLot: { $in: lotIds } }).lean(),
    Booking.find({ parkingLot: { $in: lotIds } })
      .populate('parkingLot', 'name city')
      .populate('parkingSlot', 'slotNumber slotType')
      .populate('driver', 'name email vehicleNumber')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const paidBookings = bookings.filter((b) => b.payment?.status === PAYMENT_STATUS.PAID);
  const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const activeReservations = bookings.filter((b) =>
    [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE].includes(b.status)
  ).length;
  const completedReservations = bookings.filter(
    (b) => b.status === BOOKING_STATUS.COMPLETED
  ).length;

  const slotBreakdown = {
    total: slots.length,
    available: slots.filter((s) => s.status === SLOT_STATUS.AVAILABLE).length,
    reserved: slots.filter((s) => s.status === SLOT_STATUS.RESERVED).length,
    occupied: slots.filter((s) => s.status === SLOT_STATUS.OCCUPIED).length,
    maintenance: slots.filter((s) => s.status === SLOT_STATUS.MAINTENANCE).length,
  };

  const occupancyRate =
    slotBreakdown.total > 0
      ? Math.round(
          ((slotBreakdown.occupied + slotBreakdown.reserved) / slotBreakdown.total) * 100
        )
      : 0;

  // 7-day revenue trend
  const dailyMap = new Map();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, {
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      revenue: 0,
      bookings: 0,
    });
  }

  for (const b of bookings) {
    const key = new Date(b.createdAt).toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      const entry = dailyMap.get(key);
      entry.bookings += 1;
      if (b.payment?.status === PAYMENT_STATUS.PAID) {
        entry.revenue = Number((entry.revenue + (b.totalAmount || 0)).toFixed(2));
      }
    }
  }

  // Revenue by parking lot
  const revenueByLot = lots.map((lot) => {
    const lotBookings = bookings.filter(
      (b) => b.parkingLot?._id?.toString() === lot._id.toString()
    );
    const lotPaid = lotBookings.filter((b) => b.payment?.status === PAYMENT_STATUS.PAID);
    const revenue = lotPaid.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const lotSlots = slots.filter((s) => s.parkingLot.toString() === lot._id.toString());
    const used = lotSlots.filter(
      (s) => s.status === SLOT_STATUS.OCCUPIED || s.status === SLOT_STATUS.RESERVED
    ).length;

    return {
      lotId: lot._id,
      name: lot.name,
      city: lot.city,
      totalSlots: lotSlots.length,
      occupiedOrReserved: used,
      occupancyPercent: lotSlots.length ? Math.round((used / lotSlots.length) * 100) : 0,
      bookingsCount: lotBookings.length,
      revenue: Number(revenue.toFixed(2)),
    };
  });

  return {
    summary: {
      totalLots: lots.length,
      totalSlots: slotBreakdown.total,
      availableSlots: slotBreakdown.available,
      occupancyRate,
      totalBookings: bookings.length,
      activeReservations,
      completedReservations,
      totalRevenue: Number(totalRevenue.toFixed(2)),
    },
    slotBreakdown,
    dailyTrend: Array.from(dailyMap.values()),
    revenueByLot,
    recentBookings: bookings.slice(0, 10),
  };
}

export async function getSuperAdminAnalytics() {
  const [lotMetrics, users, allLots] = await Promise.all([
    getLotAdminAnalytics(null, true),
    User.find().lean(),
    ParkingLot.find().populate('owner', 'name email').lean(),
  ]);

  const roleCounts = {
    drivers: users.filter((u) => u.role === ROLES.DRIVER).length,
    attendants: users.filter((u) => u.role === ROLES.ATTENDANT).length,
    lotAdmins: users.filter((u) => u.role === ROLES.LOT_ADMIN).length,
    superAdmins: users.filter((u) => u.role === ROLES.SUPER_ADMIN).length,
    suspended: users.filter((u) => u.status === 'SUSPENDED').length,
  };

  return {
    ...lotMetrics,
    usersSummary: {
      totalUsers: users.length,
      ...roleCounts,
    },
    lotsOverview: allLots.map((l) => ({
      _id: l._id,
      name: l.name,
      city: l.city,
      status: l.status,
      hourlyRate: l.hourlyRate,
      totalSlots: l.totalSlots,
      availableSlots: l.availableSlots,
      ownerName: l.owner?.name || 'Unassigned',
    })),
  };
}
