import { Router } from 'express';
import * as dmController from '../controllers/dmController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/search', dmController.searchUsers);

export default router;
