import { useEffect, useRef } from 'react';
import { useDMs } from '../../hooks/useDMs';
import { useChatStore } from '../../store/chatStore';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from '../chat/MessageBubble';
import { MessageInput } from '../chat/MessageInput';
import { TypingIndicator } from '../chat/TypingIndicator';
import { MessageSkeleton } from '../chat/MessageSkeleton';
import { Spinner } from '../shared/Spinner';
import { Avatar } from '../shared/Avatar';

interface DMWindowProps {
  partnerId: string;
  partnerUsername: string;
  partnerAvatarUrl?: string | null;
}

export function DMWindow({ partnerId, partnerUsername, partnerAvatarUrl }: DMWindowProps) {
  const { user } = useAuth();
  const { messages, isLoading, loadMore, sendDM, sendTyping } = useDMs(partnerId);
  const isTyping = useChatStore((s) => s.dmTyping[partnerId] ?? false);
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
    if (containerRef.current.scrollTop < 100) loadMore();
  };

  if (!user) return <div className="chat-loading"><Spinner /></div>;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <Avatar username={partnerUsername} avatarUrl={partnerAvatarUrl} size={28} />
        <span className="chat-room-name">{partnerUsername}</span>
      </div>
      <div className="chat-messages" ref={containerRef} onScroll={handleScroll}>
        {isLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <p className="chat-empty">Start a conversation with {partnerUsername}</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} currentUserId={user.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <TypingIndicator usernames={isTyping ? [partnerUsername] : []} />
      <div className="chat-input-area">
        <MessageInput
          onSend={sendDM}
          onTyping={sendTyping}
          placeholder={`Message ${partnerUsername}`}
        />
      </div>
    </div>
  );
}
