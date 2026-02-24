import 'dotenv/config';
import http from 'http';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { initSocketIO } from './socket.js';

const app = createApp();
const httpServer = http.createServer(app);

initSocketIO(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[Server] Listening on http://localhost:${env.PORT}`);
  console.log(`[Server] Environment: ${env.NODE_ENV}`);
});
