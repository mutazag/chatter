import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../socketAuth.js';
import * as dmService from '../../services/dmService.js';

function getDMRoom(idA: string, idB: string): string {
  const [min, max] = [idA, idB].sort();
  return `dm:${min}-${max}`;
}

export function registerDMHandlers(io: Server, socket: AuthenticatedSocket): void {
  const { user } = socket;

  // Auto-join the user's personal DM notification room
  socket.join(`user:${user.id}`);

  socket.on(
    'dm:send',
    async ({ receiverId, content }: { receiverId: string; content: string }) => {
      try {
        if (!content?.trim()) return;

        const message = await dmService.sendDM(user.id, receiverId, content.trim());

        const dmRoom = getDMRoom(user.id, receiverId);

        // Emit to both participants
        io.to(`user:${user.id}`).to(`user:${receiverId}`).emit('dm:message', { message });

        // Also join both to the dm room if they're online (for typing indicators)
        socket.join(dmRoom);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'SERVER_ERROR';
        if (errMsg === 'USER_NOT_FOUND') {
          socket.emit('error', { code: 'USER_NOT_FOUND', message: 'Recipient not found' });
        } else {
          socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send message' });
        }
      }
    },
  );

  socket.on(
    'dm:typing',
    ({ receiverId, isTyping }: { receiverId: string; isTyping: boolean }) => {
      io.to(`user:${receiverId}`).emit('dm:typing', {
        senderId: user.id,
        isTyping,
      });
    },
  );
}
