import type { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err);

  if (res.headersSent) return;

  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: 'INTERNAL_ERROR', message });
}
