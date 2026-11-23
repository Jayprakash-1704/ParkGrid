export const ROLES = Object.freeze({
  DRIVER: 'DRIVER',
  ATTENDANT: 'ATTENDANT',
  LOT_ADMIN: 'LOT_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
});

export const LOT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
});

export const SLOT_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
});

export const SLOT_TYPES = Object.freeze({
  CAR: 'CAR',
  EV: 'EV',
  BIKE:'BIKE'
});

export const BOOKING_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

export const SOCKET_EVENTS = Object.freeze({
  SLOT_UPDATED: 'slot:updated',
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_UPDATED: 'reservation:updated',
  VEHICLE_ENTERED: 'vehicle:entered',
  VEHICLE_EXITED: 'vehicle:exited',
  OCCUPANCY_UPDATED: 'occupancy:updated',
});
