import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../socketAuth.js';
import * as messageService from '../../services/messageService.js';
import * as roomService from '../../services/roomService.js';

export function registerRoomHandlers(io: Server, socket: AuthenticatedSocket): void {
  const { user } = socket;

  socket.on('room:join', async (roomId: string) => {
    try {
      const isMember = await roomService.isRoomMember(user.id, roomId);
      if (!isMember) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Not a room member' });
        return;
      }
      await socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user_joined', {
        roomId,
        userId: user.id,
        username: user.username,
      });
    } catch {
      socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join room' });
    }
  });

  socket.on('room:leave', async (roomId: string) => {
    await socket.leave(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit('room:user_left', {
      roomId,
      userId: user.id,
      username: user.username,
    });
  });

  socket.on('room:message', async ({ roomId, content }: { roomId: string; content: string }) => {
    try {
      if (!content?.trim()) return;

      const isMember = await roomService.isRoomMember(user.id, roomId);
      if (!isMember) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Not a room member' });
        return;
      }

      const message = await messageService.createMessage(user.id, roomId, content.trim());
      io.to(`room:${roomId}`).emit('room:message', { message });
    } catch {
      socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send message' });
    }
  });

  socket.on(
    'room:typing',
    ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
      socket.to(`room:${roomId}`).emit('room:typing', {
        roomId,
        userId: user.id,
        username: user.username,
        isTyping,
      });
    },
  );
}
