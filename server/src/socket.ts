import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { socketAuth, type AuthenticatedSocket } from './socket/socketAuth.js';
import { registerRoomHandlers } from './socket/handlers/roomHandlers.js';
import { registerDMHandlers } from './socket/handlers/dmHandlers.js';

export function initSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    console.log(`[Socket] Connected: ${authedSocket.user.username} (${socket.id})`);

    registerRoomHandlers(io, authedSocket);
    registerDMHandlers(io, authedSocket);

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${authedSocket.user.username} (${socket.id})`);
    });
  });

  return io;
}
