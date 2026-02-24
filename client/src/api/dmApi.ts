import axios from 'axios';
import type { DirectMessage, DMConversation, User } from '../types';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export async function listConversations(): Promise<DMConversation[]> {
  const { data } = await api.get<{ conversations: DMConversation[] }>('/dms');
  return data.conversations;
}

export async function getDMHistory(
  userId: string,
  before?: string,
  limit = 50,
): Promise<DirectMessage[]> {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  params.set('limit', String(limit));
  const { data } = await api.get<{ messages: DirectMessage[] }>(
    `/dms/${userId}/messages?${params}`,
  );
  return data.messages;
}

export async function searchUsers(q: string): Promise<User[]> {
  const { data } = await api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`);
  return data.users;
}
