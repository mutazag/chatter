import { useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useChatStore } from '../store/chatStore';
import * as roomsApi from '../api/roomsApi';
import type { Message } from '../types';

export function useMessages(roomId: string | null) {
  const { socket } = useSocket();
  const { roomMessages, setRoomMessages, addRoomMessage, prependRoomMessages, setRoomTyping } =
    useChatStore();

  const messages = roomId ? (roomMessages[roomId] ?? []) : [];

  // Load initial history
  useEffect(() => {
    if (!roomId) return;
    if (roomMessages[roomId]) return; // already loaded

    roomsApi
      .getRoomMessages(roomId)
      .then((msgs) => setRoomMessages(roomId, msgs))
      .catch(console.error);
  }, [roomId, roomMessages, setRoomMessages]);

  // Socket subscription
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('room:join', roomId);

    const onMessage = ({ message }: { message: Message }) => {
      addRoomMessage(roomId, message);
    };

    const onTyping = ({
      roomId: rid,
      userId,
      username,
      isTyping,
    }: {
      roomId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    }) => {
      setRoomTyping(rid, userId, username, isTyping);
    };

    socket.on('room:message', onMessage);
    socket.on('room:typing', onTyping);

    return () => {
      socket.emit('room:leave', roomId);
      socket.off('room:message', onMessage);
      socket.off('room:typing', onTyping);
    };
  }, [socket, roomId, addRoomMessage, setRoomTyping]);

  const loadMore = useCallback(async () => {
    if (!roomId || messages.length === 0) return;
    const oldest = messages[0];
    const older = await roomsApi.getRoomMessages(roomId, oldest.createdAt);
    prependRoomMessages(roomId, older);
  }, [roomId, messages, prependRoomMessages]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !roomId) return;
      socket.emit('room:message', { roomId, content });
    },
    [socket, roomId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !roomId) return;
      socket.emit('room:typing', { roomId, isTyping });
    },
    [socket, roomId],
  );

  return { messages, loadMore, sendMessage, sendTyping };
}
