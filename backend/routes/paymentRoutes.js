import express from 'express';
import {
  getPaymentHistory,
  simulateCashfreeSandbox,
  verifyPayment,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/history', getPaymentHistory);
router.post('/cashfree/sandbox-pay', simulateCashfreeSandbox);
router.post('/verify', verifyPayment);

export default router;
