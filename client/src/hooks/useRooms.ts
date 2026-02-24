import { useEffect } from 'react';
import * as roomsApi from '../api/roomsApi';
import { useChatStore } from '../store/chatStore';

export function useRooms() {
  const { rooms, setRooms, addRoom, updateRoomMembership } = useChatStore();

  useEffect(() => {
    Promise.all([roomsApi.listRooms(), roomsApi.listMyRooms()])
      .then(([publicRooms, myRooms]) => {
        const merged = new Map<string, typeof publicRooms[number]>();
        for (const room of publicRooms) merged.set(room.id, room);
        for (const room of myRooms) {
          merged.set(room.id, { ...room, isMember: true });
        }
        setRooms(Array.from(merged.values()));
      })
      .catch(console.error);
  }, [setRooms]);

  const joinRoom = async (roomId: string) => {
    await roomsApi.joinRoom(roomId);
    updateRoomMembership(roomId, true);
  };

  const leaveRoom = async (roomId: string) => {
    await roomsApi.leaveRoom(roomId);
    updateRoomMembership(roomId, false);
  };

  const createRoom = async (name: string, description?: string, isPrivate?: boolean) => {
    const room = await roomsApi.createRoom(name, description, isPrivate);
    addRoom({ ...room, isMember: true, memberCount: 1 });
    return room;
  };

  return { rooms, joinRoom, leaveRoom, createRoom };
}
