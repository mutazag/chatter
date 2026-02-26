import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import { useChatStore } from '../store/chatStore';
import * as roomsApi from '../api/roomsApi';
import type { Message } from '../types';

export function useMessages(roomId: string | null) {
  const { socket } = useSocket();
  const { roomMessages, setRoomMessages, addRoomMessage, prependRoomMessages, setRoomTyping } =
    useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingMore = useRef(false);

  const messages = roomId ? (roomMessages[roomId] ?? []) : [];

  // Load initial history
  useEffect(() => {
    if (!roomId) return;
    setIsLoading(true);
    if (roomMessages[roomId]) {
      setIsLoading(false);
      return;
    }

    roomsApi
      .getRoomMessages(roomId)
      .then((msgs) => setRoomMessages(roomId, msgs))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!roomId || messages.length === 0 || isLoadingMore.current) return;
    isLoadingMore.current = true;
    const oldest = messages[0];
    const older = await roomsApi.getRoomMessages(roomId, oldest.createdAt);
    prependRoomMessages(roomId, older);
    isLoadingMore.current = false;
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

  return { messages, isLoading, loadMore, sendMessage, sendTyping };
}
