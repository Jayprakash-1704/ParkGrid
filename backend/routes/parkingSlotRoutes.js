import express from 'express';
import {
  createSlot,
  deleteSlot,
  getSlotsByLot,
  updateSlot,
} from '../controllers/parkingSlotController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.get('/', getSlotsByLot);
router.post(
  '/',
  authenticate,
  authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN),
  createSlot
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN, ROLES.ATTENDANT),
  updateSlot
);
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN),
  deleteSlot
);

export default router;
