import { useState, useEffect } from 'react';
import { Avatar } from '../shared/Avatar';
import type { Message, DirectMessage } from '../../types';

type AnyMessage = Message | DirectMessage;

function isRoomMessage(m: AnyMessage): m is Message {
  return 'roomId' in m;
}

function parseContent(content: string): { imageUrl: string | null; text: string | null } {
  if (content.startsWith('[img]')) {
    const rest = content.slice('[img]'.length);
    const newline = rest.indexOf('\n');
    if (newline === -1) return { imageUrl: rest, text: null };
    return { imageUrl: rest.slice(0, newline), text: rest.slice(newline + 1) || null };
  }
  return { imageUrl: null, text: content };
}

interface MessageBubbleProps {
  message: AnyMessage;
  currentUserId: string;
}

function MessageImage({ src, caption }: { src: string; caption?: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <div className="msg-image-wrap">
        {!loaded && <div className="skeleton msg-image-skeleton" />}
        <img
          className={`msg-image ${loaded ? 'msg-image-loaded' : 'msg-image-loading'}`}
          src={src}
          alt="image"
          onLoad={() => setLoaded(true)}
          onClick={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="lightbox-overlay" onClick={() => setOpen(false)}>
          <button className="lightbox-close" onClick={() => setOpen(false)} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img className="lightbox-img" src={src} alt="Full size" />
            {caption && <p className="lightbox-caption">{caption}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const author = isRoomMessage(message) ? message.author : message.sender;
  const isOwn = author.id === currentUserId;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`message ${isOwn ? 'message-own' : ''}`}>
      {!isOwn && <Avatar username={author.username} avatarUrl={author.avatarUrl} size={32} />}
      <div className="message-content">
        {!isOwn && <span className="message-author">{author.username}</span>}
        <div className="message-bubble">
          {(() => {
            const { imageUrl, text } = parseContent(message.content);
            return (
              <>
                {imageUrl && <MessageImage src={imageUrl} caption={text} />}
                {text && <span className="message-text">{text}</span>}
              </>
            );
          })()}
          <span className="message-time">{time}</span>
        </div>
      </div>
      {isOwn && <Avatar username={author.username} avatarUrl={author.avatarUrl} size={32} />}
    </div>
  );
}
