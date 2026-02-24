import type { Request, Response } from 'express';
import * as roomService from '../services/roomService.js';
import * as messageService from '../services/messageService.js';

export async function listRooms(req: Request, res: Response): Promise<void> {
  const rooms = await roomService.listPublicRooms(req.user!.id);
  res.json({ rooms });
}

export async function listMyRooms(req: Request, res: Response): Promise<void> {
  const rooms = await roomService.listUserRooms(req.user!.id);
  res.json({ rooms });
}

export async function createRoom(req: Request, res: Response): Promise<void> {
  const { name, description, isPrivate } = req.body as {
    name: string;
    description?: string;
    isPrivate?: boolean;
  };

  if (!name) {
    res.status(400).json({ error: 'MISSING_FIELDS', message: 'name is required' });
    return;
  }

  try {
    const room = await roomService.createRoom(name, description, isPrivate ?? false, req.user!.id);
    res.status(201).json({ room });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'ROOM_NAME_TAKEN') {
      res.status(409).json({ error: 'ROOM_NAME_TAKEN', message: 'Room name already taken' });
    } else {
      throw err;
    }
  }
}

export async function joinRoom(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string;
  try {
    await roomService.joinRoom(req.user!.id, id);
    res.json({ message: 'Joined room' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'ROOM_NOT_FOUND') {
      res.status(404).json({ error: 'ROOM_NOT_FOUND', message: 'Room not found' });
    } else if (message === 'ROOM_PRIVATE') {
      res.status(403).json({ error: 'ROOM_PRIVATE', message: 'Cannot join a private room' });
    } else {
      throw err;
    }
  }
}

export async function leaveRoom(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string;
  await roomService.leaveRoom(req.user!.id, id);
  res.json({ message: 'Left room' });
}

export async function getRoomMessages(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string;
  const { before, limit } = req.query;

  const isMember = await roomService.isRoomMember(req.user!.id, id);
  if (!isMember) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'You are not a member of this room' });
    return;
  }

  const messages = await messageService.getRoomMessages(
    id,
    before as string | undefined,
    limit ? parseInt(limit as string, 10) : 50,
  );
  res.json({ messages });
}
