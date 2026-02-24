import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DM_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  readAt: true,
  sender: { select: { id: true, username: true, avatarUrl: true } },
  receiver: { select: { id: true, username: true, avatarUrl: true } },
};

export async function sendDM(senderId: string, receiverId: string, content: string) {
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new Error('USER_NOT_FOUND');

  return prisma.directMessage.create({
    data: { senderId, receiverId, content },
    select: DM_SELECT,
  });
}

export async function getDMHistory(
  userAId: string,
  userBId: string,
  before?: string,
  limit = 50,
) {
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    select: DM_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.reverse();
}

export async function getDMConversations(userId: string) {
  // Find distinct conversation partners
  const sent = await prisma.directMessage.findMany({
    where: { senderId: userId },
    select: { receiver: { select: { id: true, username: true, avatarUrl: true } }, createdAt: true },
    orderBy: { createdAt: 'desc' },
    distinct: ['receiverId'],
  });

  const received = await prisma.directMessage.findMany({
    where: { receiverId: userId },
    select: { sender: { select: { id: true, username: true, avatarUrl: true } }, createdAt: true },
    orderBy: { createdAt: 'desc' },
    distinct: ['senderId'],
  });

  // Merge and deduplicate by user id
  const seen = new Set<string>();
  const conversations: { id: string; username: string; avatarUrl: string | null; lastAt: Date }[] = [];

  const all = [
    ...sent.map((m) => ({ user: m.receiver, lastAt: m.createdAt })),
    ...received.map((m) => ({ user: m.sender, lastAt: m.createdAt })),
  ].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  for (const entry of all) {
    if (!seen.has(entry.user.id)) {
      seen.add(entry.user.id);
      conversations.push({ ...entry.user, lastAt: entry.lastAt });
    }
  }

  return conversations;
}

export async function searchUsers(query: string, excludeId: string) {
  return prisma.user.findMany({
    where: {
      username: { contains: query, mode: 'insensitive' },
      id: { not: excludeId },
    },
    select: { id: true, username: true, avatarUrl: true },
    take: 20,
  });
}
