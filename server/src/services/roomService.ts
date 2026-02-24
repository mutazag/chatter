import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listPublicRooms(userId: string) {
  const rooms = await prisma.room.findMany({
    where: { isPrivate: false },
    include: {
      _count: { select: { memberships: true } },
      memberships: { where: { userId }, select: { userId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return rooms.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isPrivate: r.isPrivate,
    memberCount: r._count.memberships,
    isMember: r.memberships.length > 0,
  }));
}

export async function createRoom(
  name: string,
  description: string | undefined,
  isPrivate: boolean,
  creatorId: string,
) {
  const existing = await prisma.room.findUnique({ where: { name } });
  if (existing) throw new Error('ROOM_NAME_TAKEN');

  const room = await prisma.room.create({
    data: {
      name,
      description,
      isPrivate,
      creatorId,
      memberships: { create: { userId: creatorId } },
    },
    select: { id: true, name: true, description: true, isPrivate: true, createdAt: true },
  });

  return room;
}

export async function joinRoom(userId: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('ROOM_NOT_FOUND');
  if (room.isPrivate) throw new Error('ROOM_PRIVATE');

  await prisma.roomMembership.upsert({
    where: { userId_roomId: { userId, roomId } },
    update: {},
    create: { userId, roomId },
  });
}

export async function leaveRoom(userId: string, roomId: string) {
  await prisma.roomMembership.deleteMany({ where: { userId, roomId } });
}

export async function getUserRooms(userId: string) {
  const memberships = await prisma.roomMembership.findMany({
    where: { userId },
    include: { room: { select: { id: true, name: true, description: true, isPrivate: true } } },
  });

  return memberships.map((m) => m.room);
}

export async function isRoomMember(userId: string, roomId: string): Promise<boolean> {
  const m = await prisma.roomMembership.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  return m !== null;
}
