import { useEffect, useRef, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useRooms } from '../../hooks/useRooms';
import { useChatStore } from '../../store/chatStore';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { MessageSkeleton } from './MessageSkeleton';
import { Spinner } from '../shared/Spinner';
import { Button } from '../shared/Button';
import { RoomMembersModal } from '../rooms/RoomMembersModal';

interface ChatWindowProps {
  roomId: string;
  roomName: string;
  onLeave?: () => void;
}

export function ChatWindow({ roomId, roomName, onLeave }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, isLoading, loadMore, sendMessage, sendTyping } = useMessages(roomId);
  const { leaveRoom } = useRooms();
  const roomTyping = useChatStore((s) => s.roomTyping[roomId]);
  const typingUsers = roomTyping ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const initialScrollDone = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

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

  // Close overflow dropdown when clicking outside
  useEffect(() => {
    if (!showOverflow) return;
    const handler = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showOverflow]);

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveRoom(roomId);
      onLeave?.();
    } finally {
      setIsLeaving(false);
    }
  };

  if (!user) return <div className="chat-loading"><Spinner /></div>;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className="chat-room-name"># {roomName}</span>
        <div className="chat-header-actions">
          <Button variant="ghost" className="chat-header-btn" onClick={() => setShowMembers(true)}>
            Members
          </Button>
          <Button variant="danger" className="chat-header-btn" isLoading={isLeaving} onClick={handleLeave}>
            Leave
          </Button>
          <div className="chat-header-overflow" ref={overflowRef}>
            <button
              className="chat-header-overflow-trigger"
              onClick={() => setShowOverflow((v) => !v)}
              aria-label="More options"
            >
              <svg width="14" height="14" viewBox="0 0 16 4" fill="currentColor">
                <circle cx="2" cy="2" r="1.5"/>
                <circle cx="8" cy="2" r="1.5"/>
                <circle cx="14" cy="2" r="1.5"/>
              </svg>
            </button>
            {showOverflow && (
              <div className="chat-header-overflow-dropdown">
                <button onClick={() => { setShowMembers(true); setShowOverflow(false); }}>
                  Members
                </button>
                <button
                  className="danger"
                  onClick={() => { setShowOverflow(false); handleLeave(); }}
                  disabled={isLeaving}
                >
                  Leave room
                </button>
              </div>
            )}
          </div>
        </div>
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
      {showMembers && (
        <RoomMembersModal roomId={roomId} roomName={roomName} onClose={() => setShowMembers(false)} />
      )}
    </div>
  );
}
