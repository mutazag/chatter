import { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useChatStore } from '../../store/chatStore';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { Spinner } from '../shared/Spinner';

interface ChatWindowProps {
  roomId: string;
  roomName: string;
}

export function ChatWindow({ roomId, roomName }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loadMore, sendMessage, sendTyping } = useMessages(roomId);
  const roomTyping = useChatStore((s) => s.roomTyping[roomId]);
  const typingUsers = roomTyping ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={user.id} />
        ))}
        <div ref={bottomRef} />
      </div>
      <TypingIndicator usernames={typingUsers.map((u) => u.username)} />
      <div className="chat-input-area">
        <MessageInput onSend={sendMessage} onTyping={sendTyping} placeholder={`Message #${roomName}`} />
      </div>
    </div>
  );
}
