import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body as { username: string; email: string; password: string };

  if (!username || !email || !password) {
    res.status(400).json({ error: 'MISSING_FIELDS', message: 'username, email, and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const user = await authService.registerUser(username, email, password);
    const token = authService.signToken(user);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.status(201).json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    if (message === 'EMAIL_TAKEN') {
      res.status(409).json({ error: 'EMAIL_TAKEN', message: 'Email already in use' });
    } else if (message === 'USERNAME_TAKEN') {
      res.status(409).json({ error: 'USERNAME_TAKEN', message: 'Username already taken' });
    } else {
      throw err;
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'MISSING_FIELDS', message: 'email and password are required' });
    return;
  }

  try {
    const user = await authService.loginUser(email, password);
    const token = authService.signToken(user);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    if (message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    } else {
      throw err;
    }
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'strict', secure: env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
