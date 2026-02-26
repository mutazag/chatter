import { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useChatStore } from '../../store/chatStore';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { MessageSkeleton } from './MessageSkeleton';
import { Spinner } from '../shared/Spinner';

interface ChatWindowProps {
  roomId: string;
  roomName: string;
}

export function ChatWindow({ roomId, roomName }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, isLoading, loadMore, sendMessage, sendTyping } = useMessages(roomId);
  const roomTyping = useChatStore((s) => s.roomTyping[roomId]);
  const typingUsers = roomTyping ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const initialScrollDone = useRef(false);

  // Scroll to bottom instantly after initial load completes (skeleton → messages).
  // Fires when isLoading transitions to false so messages are already in the DOM.
  useEffect(() => {
    if (isLoading || initialScrollDone.current || messages.length === 0) return;
    initialScrollDone.current = true;
    lastMessageIdRef.current = messages[messages.length - 1].id;
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth scroll when a new real-time message is appended.
  useEffect(() => {
    if (!initialScrollDone.current || messages.length === 0) return;
    const lastId = messages[messages.length - 1].id;
    if (lastId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastId;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop < 100) {
      loadMore();
    }
  };

  if (!user) return <div className="chat-loading"><Spinner /></div>;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className="chat-room-name"># {roomName}</span>
      </div>
      <div className="chat-messages" ref={containerRef} onScroll={handleScroll}>
        {isLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <p className="chat-empty">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} currentUserId={user.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <TypingIndicator usernames={typingUsers.map((u) => u.username)} />
      <div className="chat-input-area">
        <MessageInput onSend={sendMessage} onTyping={sendTyping} placeholder={`Message #${roomName}`} />
      </div>
    </div>
  );
}
