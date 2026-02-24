import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MESSAGE_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  editedAt: true,
  author: { select: { id: true, username: true, avatarUrl: true } },
  roomId: true,
};

export async function createMessage(authorId: string, roomId: string, content: string) {
  return prisma.message.create({
    data: { authorId, roomId, content },
    select: MESSAGE_SELECT,
  });
}

export async function getRoomMessages(
  roomId: string,
  before?: string,
  limit = 50,
) {
  const messages = await prisma.message.findMany({
    where: {
      roomId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    select: MESSAGE_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.reverse();
}
