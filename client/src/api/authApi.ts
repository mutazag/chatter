import axios from 'axios';
import type { User } from '../types';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export async function register(username: string, email: string, password: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/register', { username, email, password });
  return data.user;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/login', { email, password });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}
