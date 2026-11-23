import express from 'express';
import { z } from 'zod';
import {
  assignAttendantToLot,
  createAttendant,
  createLotAdmin,
  getAnalytics,
  getAttendants,
  getSettings,
  getUsers,
  submitContactMessage,
  updateSettings,
  updateUserStatusOrRole,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { ROLES } from '../utils/constants.js';

export const usersRouter = express.Router();
usersRouter.use(authenticate, authorize(ROLES.SUPER_ADMIN));
usersRouter.get('/', getUsers);
usersRouter.patch('/:id', updateUserStatusOrRole);

export const attendantsRouter = express.Router();
attendantsRouter.use(authenticate, authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN));
attendantsRouter.get('/', getAttendants);
attendantsRouter.post('/', createAttendant);
attendantsRouter.patch('/:id/assign', assignAttendantToLot);

export const adminRouter = express.Router();
adminRouter.get('/settings', getSettings);
adminRouter.patch(
  '/settings',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateSettings
);
adminRouter.post(
  '/lot-admins',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  createLotAdmin
);

export const analyticsRouter = express.Router();
analyticsRouter.use(authenticate, authorize(ROLES.LOT_ADMIN, ROLES.SUPER_ADMIN));
analyticsRouter.get('/', getAnalytics);

export const contactRouter = express.Router();
const contactSchema = z.object({
  name: z.string().min(2, 'Please provide your name'),
  email: z.string().email('Please provide a valid email address'),
  subject: z.string().min(3, 'Please provide a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});
contactRouter.post('/', validateBody(contactSchema), submitContactMessage);
