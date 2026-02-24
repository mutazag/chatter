import axios from 'axios';
import type { Room, Message } from '../types';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export async function listRooms(): Promise<Room[]> {
  const { data } = await api.get<{ rooms: Room[] }>('/rooms');
  return data.rooms;
}

export async function createRoom(
  name: string,
  description?: string,
  isPrivate?: boolean,
): Promise<Room> {
  const { data } = await api.post<{ room: Room }>('/rooms', { name, description, isPrivate });
  return data.room;
}

export async function joinRoom(roomId: string): Promise<void> {
  await api.post(`/rooms/${roomId}/join`);
}

export async function leaveRoom(roomId: string): Promise<void> {
  await api.delete(`/rooms/${roomId}/leave`);
}

export async function getRoomMessages(
  roomId: string,
  before?: string,
  limit = 50,
): Promise<Message[]> {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  params.set('limit', String(limit));
  const { data } = await api.get<{ messages: Message[] }>(`/rooms/${roomId}/messages?${params}`);
  return data.messages;
}
