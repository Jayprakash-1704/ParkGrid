import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { connectDatabase, getDbConnectionMode } from './config/db.js';
import { initSocketServer } from './config/socket.js';
import { seedInitialData } from './services/seedService.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import parkingLotRoutes from './routes/parkingLotRoutes.js';
import parkingSlotRoutes from './routes/parkingSlotRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import {
  adminRouter,
  analyticsRouter,
  attendantsRouter,
  contactRouter,
  usersRouter,
} from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SERVE_FRONTEND = process.env.SERVE_FRONTEND === 'true';
const PORT = Number(process.env.PORT) || (SERVE_FRONTEND ? 3000 : 5000);
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  await connectDatabase();
  const appUrl =
    process.env.APP_URL ||
    (SERVE_FRONTEND ? `http://localhost:${PORT}` : process.env.CLIENT_URL || 'http://localhost:5173');
  await seedInitialData(appUrl);

  const app = express();
  const httpServer = http.createServer(app);

  // Initialize real-time Socket.IO engine on the same port
  initSocketServer(httpServer);

  app.set('trust proxy', 1);

  // Security headers (CSP relaxed for Vite dev module loading & QR data URLs)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (!IS_PROD) {
    app.use(morgan('dev'));
  }

  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please slow down and try again shortly.',
    },
  });
  app.use('/api', apiLimiter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      service: 'ParkGrid API',
      databaseMode: getDbConnectionMode(),
      timestamp: new Date().toISOString(),
    });
  });

  // RESTful API Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRouter);
  app.use('/api/parking-lots', parkingLotRoutes);
  app.use('/api/parking-slots', parkingSlotRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/attendants', attendantsRouter);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/contact', contactRouter);

  // API 404 before SPA middleware
  app.use('/api', notFoundHandler);

  // When launched from root workspace (SERVE_FRONTEND=true), serve React Vite frontend on the same port.
  // When launched standalone from backend/ (npm run dev), run purely as the REST + Socket.IO API server.
  if (SERVE_FRONTEND) {
    if (!IS_PROD) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        root: ROOT_DIR,
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distDir = path.join(ROOT_DIR, 'dist');
      app.use(express.static(distDir));
      app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  } else {
    app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'ParkGrid Backend API is running. Start the frontend app on http://localhost:5173.',
      });
    });
  }

  app.use(errorHandler);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[ParkGrid] ${SERVE_FRONTEND ? 'Full-stack' : 'Backend API'} server running on http://localhost:${PORT} (${IS_PROD ? 'production' : 'development'})`
    );
  });
}

startServer().catch((err) => {
  console.error('[ParkGrid] Fatal startup error:', err);
  process.exit(1);
});
