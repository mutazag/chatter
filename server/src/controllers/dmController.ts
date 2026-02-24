import type { Request, Response } from 'express';
import * as dmService from '../services/dmService.js';

export async function listConversations(req: Request, res: Response): Promise<void> {
  const conversations = await dmService.getDMConversations(req.user!.id);
  res.json({ conversations });
}

export async function getDMHistory(req: Request, res: Response): Promise<void> {
  const userId = req.params['userId'] as string;
  const { before, limit } = req.query;

  const messages = await dmService.getDMHistory(
    req.user!.id,
    userId,
    before as string | undefined,
    limit ? parseInt(limit as string, 10) : 50,
  );
  res.json({ messages });
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'MISSING_QUERY', message: 'q parameter is required' });
    return;
  }

  const users = await dmService.searchUsers(q, req.user!.id);
  res.json({ users });
}
