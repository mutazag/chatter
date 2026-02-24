import { useEffect } from 'react';
import * as roomsApi from '../api/roomsApi';
import { useChatStore } from '../store/chatStore';

export function useRooms() {
  const { rooms, setRooms, addRoom, updateRoomMembership } = useChatStore();

  useEffect(() => {
    roomsApi.listRooms().then(setRooms).catch(console.error);
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
