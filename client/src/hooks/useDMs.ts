import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { useChatStore } from '../store/chatStore';
import * as dmApi from '../api/dmApi';
import type { DirectMessage } from '../types';

export function useDMs(partnerId: string | null) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const {
    conversations,
    setConversations,
    dmMessages,
    setDMMessages,
    addDMMessage,
    prependDMMessages,
    setDMTyping,
    setConversationsLoading,
  } = useChatStore();

  const messages = partnerId ? (dmMessages[partnerId] ?? []) : [];
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingMore = useRef(false);

  // Load conversations list
  useEffect(() => {
    dmApi
      .listConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setConversationsLoading(false));
  }, [setConversations, setConversationsLoading]);

  // Load DM history when partner changes
  useEffect(() => {
    if (!partnerId) return;
    setIsLoading(true);
    if (dmMessages[partnerId]) {
      setIsLoading(false);
      return;
    }

    dmApi
      .getDMHistory(partnerId)
      .then((msgs) => setDMMessages(partnerId, msgs))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [partnerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket listeners for incoming DMs and typing — only when a conversation is open
  useEffect(() => {
    if (!socket || !partnerId) return;

    const onDMMessage = ({ message }: { message: DirectMessage }) => {
      // Always store under the partner's id (not the current user's id)
      const key = message.sender.id === user?.id ? message.receiver.id : message.sender.id;
      addDMMessage(key, message);
    };

    const onDMTyping = ({
      senderId,
      isTyping,
    }: {
      senderId: string;
      isTyping: boolean;
    }) => {
      setDMTyping(senderId, isTyping);
    };

    socket.on('dm:message', onDMMessage);
    socket.on('dm:typing', onDMTyping);

    return () => {
      socket.off('dm:message', onDMMessage);
      socket.off('dm:typing', onDMTyping);
    };
  }, [socket, partnerId, user, addDMMessage, setDMTyping]);

  const loadMore = useCallback(async () => {
    if (!partnerId || messages.length === 0 || isLoadingMore.current) return;
    isLoadingMore.current = true;
    const oldest = messages[0];
    const older = await dmApi.getDMHistory(partnerId, oldest.createdAt);
    prependDMMessages(partnerId, older);
    isLoadingMore.current = false;
  }, [partnerId, messages, prependDMMessages]);

  const sendDM = useCallback(
    (content: string) => {
      if (!socket || !partnerId) return;
      socket.emit('dm:send', { receiverId: partnerId, content });
    },
    [socket, partnerId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !partnerId) return;
      socket.emit('dm:typing', { receiverId: partnerId, isTyping });
    },
    [socket, partnerId],
  );

  return { conversations, messages, isLoading, loadMore, sendDM, sendTyping };
}
