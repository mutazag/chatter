import { Router } from 'express';
import * as roomController from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', roomController.listRooms);
router.get('/mine', roomController.listMyRooms);
router.post('/', roomController.createRoom);
router.post('/:id/join', roomController.joinRoom);
router.delete('/:id/leave', roomController.leaveRoom);
router.get('/:id/messages', roomController.getRoomMessages);

export default router;
