import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import type { JwtPayload, AuthenticatedUser } from '../types/index.js';

const prisma = new PrismaClient();

export async function registerUser(username: string, email: string, password: string): Promise<AuthenticatedUser> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    if (existing.email === email) throw new Error('EMAIL_TAKEN');
    throw new Error('USERNAME_TAKEN');
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
    select: { id: true, username: true, email: true, avatarUrl: true },
  });

  return user;
}

export async function loginUser(email: string, password: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  return { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl };
}

export function signToken(user: AuthenticatedUser): string {
  const payload: JwtPayload = { userId: user.id, username: user.username, email: user.email };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, avatarUrl: true },
  });
  return user;
}
