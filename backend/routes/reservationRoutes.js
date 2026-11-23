import express from 'express';
import { z } from 'zod';
import {
  cancelReservationHandler,
  createReservation,
  getReservationById,
  getReservations,
  verifyAndConfirmReservation,
} from '../controllers/reservationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

const initiateSchema = z.object({
  parkingLotId: z.string().min(1, 'Parking lot ID is required'),
  parkingSlotId: z.string().min(1, 'Parking slot ID is required'),
  vehicleNumber: z.string().min(3, 'Vehicle plate number is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

router.use(authenticate);

router.get('/', getReservations);
router.post(
  '/initiate',
  authorize(ROLES.DRIVER, ROLES.SUPER_ADMIN),
  validateBody(initiateSchema),
  createReservation
);
router.post('/confirm', verifyAndConfirmReservation);
router.get('/:id', getReservationById);
router.post('/:id/cancel', cancelReservationHandler);

export default router;
