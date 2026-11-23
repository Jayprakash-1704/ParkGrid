import express from 'express';
import {
  getEntryExitHistory,
  recordVehicleEntry,
  recordVehicleExit,
  verifyQr,
} from '../controllers/qrController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(
  authenticate,
  authorize(ROLES.ATTENDANT, ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN)
);

router.post('/verify', verifyQr);
router.get('/verify/:token', verifyQr);
router.post('/entry', recordVehicleEntry);
router.post('/exit', recordVehicleExit);
router.get('/history', getEntryExitHistory);

export default router;
