import express from 'express';
import {
  createParkingLot,
  deleteParkingLot,
  getParkingLotById,
  getParkingLots,
  updateParkingLot,
} from '../controllers/parkingLotController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../config/cloudinary.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

// Public discovery and lot details (optional auth for ?mine=true)
router.get('/', (req, res, next) => {
  if (req.query.mine === 'true') {
    return authenticate(req, res, () => getParkingLots(req, res, next));
  }
  return getParkingLots(req, res, next);
});
router.get('/:id', getParkingLotById);

// Lot Admin & Super Admin management
router.post(
  '/',
  authenticate,
  authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN),
  uploadMiddleware.single('image'),
  createParkingLot
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN),
  uploadMiddleware.single('image'),
  updateParkingLot
);
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN),
  deleteParkingLot
);

export default router;
