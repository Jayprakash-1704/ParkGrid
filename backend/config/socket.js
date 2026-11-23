import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../utils/constants.js';

let ioInstance = null;

export function initSocketServer(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    socket.on('lot:join', (lotId) => {
      if (lotId) {
        socket.join(`lot:${lotId}`);
      }
    });

    socket.on('lot:leave', (lotId) => {
      if (lotId) {
        socket.leave(`lot:${lotId}`);
      }
    });

    socket.on('role:join', ({ role, userId, lotId }) => {
      if (userId) socket.join(`user:${userId}`);
      if (role === 'SUPER_ADMIN' || role === 'LOT_ADMIN') {
        socket.join('admin:live');
      }
      if (lotId) {
        socket.join(`lot:${lotId}`);
      }
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export function emitSlotUpdated(lotId, payload) {
  if (!ioInstance) return;
  const lotKey = lotId?.toString();
  ioInstance.to(`lot:${lotKey}`).emit(SOCKET_EVENTS.SLOT_UPDATED, payload);
  ioInstance.to('admin:live').emit(SOCKET_EVENTS.SLOT_UPDATED, payload);
  ioInstance.emit(SOCKET_EVENTS.OCCUPANCY_UPDATED, {
    parkingLotId: lotKey,
    availableSlots: payload.availableSlots,
    totalSlots: payload.totalSlots,
    updatedAt: new Date().toISOString(),
  });
}

export function emitReservationEvent(eventName, { lotId, driverId, payload }) {
  if (!ioInstance) return;
  if (lotId) ioInstance.to(`lot:${lotId.toString()}`).emit(eventName, payload);
  if (driverId) ioInstance.to(`user:${driverId.toString()}`).emit(eventName, payload);
  ioInstance.to('admin:live').emit(eventName, payload);
}
