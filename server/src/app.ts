import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import dmRoutes from './routes/dmRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { uploadRouter, imageRouter } from './routes/uploadRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use('/api/upload', uploadRouter);
  app.use('/api/images', imageRouter);
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/dms', dmRoutes);
  app.use('/api/users', userRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorMiddleware);

  return app;
}
