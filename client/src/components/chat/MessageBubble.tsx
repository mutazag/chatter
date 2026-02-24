import { useState } from 'react';
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

function MessageImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="msg-image-wrap">
      {!loaded && <div className="skeleton msg-image-skeleton" />}
      <img
        className={`msg-image ${loaded ? 'msg-image-loaded' : 'msg-image-loading'}`}
        src={src}
        alt="image"
        onLoad={() => setLoaded(true)}
        onClick={() => window.open(src, '_blank')}
      />
    </div>
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
                {imageUrl && <MessageImage src={imageUrl} />}
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
