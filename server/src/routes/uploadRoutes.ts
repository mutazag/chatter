import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadRouter = Router();

// POST /api/upload — store image in database, return URL
uploadRouter.post('/', requireAuth, (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'File must be under 5 MB' });
      return;
    }
    if (err) {
      res.status(400).json({ error: 'UPLOAD_ERROR', message: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'NO_FILE', message: 'No file provided' });
      return;
    }
    try {
      const image = await prisma.image.create({
        data: {
          data: req.file.buffer,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadedById: req.user!.id,
        },
        select: { id: true },
      });
      res.json({ url: `/api/images/${image.id}` });
    } catch {
      res.status(500).json({ error: 'DB_ERROR', message: 'Failed to save image' });
    }
  });
});

export const imageRouter = Router();

// GET /api/images/:id — serve image from database
imageRouter.get('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    const image = await prisma.image.findUnique({
      where: { id },
      select: { data: true, mimeType: true },
    });
    if (!image) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Image not found' });
      return;
    }
    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(image.data);
  } catch {
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve image' });
  }
});
