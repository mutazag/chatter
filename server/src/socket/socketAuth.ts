import type { Socket } from 'socket.io';
import { parse } from 'cookie';
import { verifyToken, getUserById } from '../services/authService.js';
import type { AuthenticatedUser } from '../types/index.js';

export interface AuthenticatedSocket extends Socket {
  user: AuthenticatedUser;
}

export async function socketAuth(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const cookieHeader = socket.handshake.headers.cookie ?? '';
    const cookies = parse(cookieHeader);
    const token = cookies['token'];

    if (!token) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);

    if (!user) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    (socket as AuthenticatedSocket).user = user;
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
}
